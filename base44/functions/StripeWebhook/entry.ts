import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const PLAN_MAP = {
  price_1UDBxyCX3kMA1WDRw3U1Z0sW: { plan: 'starter', url_limit: 5 },
  price_1UDBxyCX3kMA1WDRcfVXLJ6x: { plan: 'professional', url_limit: 25 },
  price_1UDBxzCX3kMA1WDRFclC6Crw: { plan: 'elite', url_limit: 100 },
  price_1UDBxzCX3kMA1WDR4kz56LxF: { plan: 'enterprise', url_limit: 9999 },
};

const UPGRADE_MAP = {
  price_1UDBy0CX3kMA1WDRuL1WDVpq: 'competitor_intelligence',
  price_1UDBy0CX3kMA1WDRFunvSa9I: 'ai_search_visibility',
  price_1UDBy1CX3kMA1WDRkabYvsya: 'content_generator_pro',
  price_1UDBy1CX3kMA1WDRugySfyg5: 'backlink_tracker',
  price_1UDBy2CX3kMA1WDRtpW9tARk: 'core_web_vitals',
  price_1UDBy2CX3kMA1WDRmqI7yjYE: 'vision_cortex_link',
};

const TOLERANCE_SECONDS = 300;

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifySignature(rawBody, header, secret) {
  if (!secret) return { ok: false, reason: 'STRIPE_WEBHOOK_SECRET is not configured — refusing all events' };
  if (!header) return { ok: false, reason: 'Missing stripe-signature header' };

  const parts = {};
  for (const chunk of header.split(',')) {
    const idx = chunk.indexOf('=');
    if (idx > 0) parts[chunk.slice(0, idx).trim()] = chunk.slice(idx + 1).trim();
  }
  const timestamp = Number(parts.t);
  const provided = parts.v1;
  if (!timestamp || !provided) return { ok: false, reason: 'Malformed signature header' };

  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > TOLERANCE_SECONDS) {
    return { ok: false, reason: 'Signature timestamp outside tolerance (replay rejected)' };
  }

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${rawBody}`));
  const expected = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return timingSafeEqual(expected, provided) ? { ok: true } : { ok: false, reason: 'Signature mismatch' };
}

async function stripeGet(path) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${secrets.get('STRIPE_SECRET_KEY')}`,
      'Stripe-Version': '2025-10-29.clover',
    },
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Stripe GET ${path} failed`);
  return data;
}

function planInfoFromSubscription(sub) {
  const priceId = sub.items?.data?.[0]?.price?.id;
  return {
    priceId,
    planInfo: PLAN_MAP[priceId] || { plan: 'starter', url_limit: 5 },
    upgrades: (sub.items?.data || []).map((i) => UPGRADE_MAP[i.price?.id]).filter(Boolean),
  };
}

async function resolveUserId(base44, session) {
  const metaId = session.metadata?.user_id;
  if (metaId) return metaId;
  const email = session.customer_details?.email || session.customer_email;
  if (!email) return null;
  const users = await base44.asServiceRole.entities.User.filter({ email }, { limit: 1 });
  return users?.[0]?.id || null;
}

async function grantAccess(base44, { userId, email, subscriptionId, priceId, planInfo, upgrades, paid, eventId, sessionId }) {
  if (!userId) {
    console.error('StripeWebhook: paid session with no resolvable user', sessionId);
    return;
  }
  const sub = await stripeGet(`/subscriptions/${subscriptionId}`);
  const fromSub = planInfoFromSubscription(sub);
  const resolvedPrice = priceId || fromSub.priceId;
  const resolved = PLAN_MAP[resolvedPrice] || fromSub.planInfo || planInfo;
  const status = paid && ['active', 'trialing'].includes(sub.status) ? 'active' : 'past_due';
  const evidence = `event:${eventId} paid:${String(paid)} sub_status:${sub.status}`;

  const existing = await base44.asServiceRole.entities.Entitlement.filter({ stripe_subscription_id: subscriptionId }, { limit: 1 });
  const payload = {
    user_id: userId,
    user_email: email || undefined,
    plan: resolved.plan,
    kind: 'subscription',
    status,
    price_id: resolvedPrice,
    amount_cents: sub.items?.data?.[0]?.price?.unit_amount ?? undefined,
    currency: sub.currency || 'usd',
    stripe_customer_id: sub.customer,
    stripe_subscription_id: subscriptionId,
    checkout_session_id: sessionId,
    current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
    granted_by: 'stripe_webhook',
    evidence,
  };

  if (existing?.length) await base44.asServiceRole.entities.Entitlement.update(existing[0].id, payload);
  else await base44.asServiceRole.entities.Entitlement.create(payload);

  const legacy = await base44.asServiceRole.entities.Subscription.filter({ stripe_subscription_id: subscriptionId }, { limit: 1 });
  const legacyPayload = {
    user_id: userId,
    customer_email: email || undefined,
    stripe_customer_id: sub.customer,
    stripe_subscription_id: subscriptionId,
    plan: resolved.plan,
    status: sub.status,
    url_limit: resolved.url_limit,
    upgrades,
    current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : undefined,
    current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
  };
  if (legacy?.length) await base44.asServiceRole.entities.Subscription.update(legacy[0].id, legacyPayload);
  else await base44.asServiceRole.entities.Subscription.create({ ...legacyPayload, urls_used: 0, onboarding_completed: false });
}

async function handleEvent(base44, event) {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object;
      if (session.metadata?.base44_test_checkout === 'true') return;

      if (!session.subscription) {
        console.error('StripeWebhook: session without subscription', session.id);
        return;
      }
      const paid = session.payment_status === 'paid';
      if (event.type === 'checkout.session.completed' && !paid) {
        const sub = await stripeGet(`/subscriptions/${session.subscription}`);
        if (!['active', 'trialing'].includes(sub.status)) {
          console.error('StripeWebhook: completed but unpaid — not granting', session.id);
          return;
        }
      }

      const userId = await resolveUserId(base44, session);
      const email = session.customer_details?.email || session.customer_email || '';
      const priceId = session.metadata?.price_id;
      const planInfo = PLAN_MAP[priceId] || { plan: 'starter', url_limit: 5 };
      await grantAccess(base44, {
        userId,
        email,
        subscriptionId: session.subscription,
        priceId,
        planInfo,
        upgrades: [],
        paid: true,
        eventId: event.id,
        sessionId: session.id,
      });
      return;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const status = event.type === 'customer.subscription.deleted' ? 'canceled' : sub.status;
      const patch = {
        status,
        current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
        evidence: `event:${event.id} sub_status:${sub.status}`,
      };
      const ents = await base44.asServiceRole.entities.Entitlement.filter({ stripe_subscription_id: sub.id }, { limit: 1 });
      if (ents?.length) await base44.asServiceRole.entities.Entitlement.update(ents[0].id, patch);
      const legacy = await base44.asServiceRole.entities.Subscription.filter({ stripe_subscription_id: sub.id }, { limit: 1 });
      if (legacy?.length) {
        await base44.asServiceRole.entities.Subscription.update(legacy[0].id, {
          status: sub.status,
          canceled_at: event.type === 'customer.subscription.deleted' ? new Date().toISOString() : undefined,
        });
      }
      return;
    }

    default:
      return;
  }
}

export default async function (req) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const rawBody = await req.text();

    const verification = await verifySignature(rawBody, req.headers.get('stripe-signature'), secrets.get('STRIPE_WEBHOOK_SECRET'));
    if (!verification.ok) {
      console.error('StripeWebhook rejected:', verification.reason);
      return Response.json({ error: verification.reason }, { status: 400 });
    }

    let event;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    await handleEvent(base44, event);
    return Response.json({ received: true });
  } catch (error) {
    console.error('StripeWebhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}