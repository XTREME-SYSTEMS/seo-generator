import { serve } from "https://deno.land/std/http/server.ts";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const appId = Deno.env.get("BASE44_APP_ID");

// Import base44 SDK for entity writes
async function getBase44Client() {
  const { createClient } = await import("https://esm.sh/@base44/sdk@latest");
  return createClient({ appId });
}

async function verifySignature(payload, signature, secret) {
  if (!secret) return true; // Skip verification if no secret set (dev mode)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const parts = signature.split(',');
  const sigMap = {};
  for (const part of parts) {
    const [k, v] = part.split('=');
    sigMap[k] = v;
  }
  const signedPayload = sigMap['t'] + '.' + payload;
  const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const expectedHex = Array.from(new Uint8Array(expectedSig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return expectedHex === sigMap['v1'];
}

const PLAN_MAP = {
  'price_1UDBxyCX3kMA1WDRw3U1Z0sW': { plan: 'starter', url_limit: 5 },
  'price_1UDBxyCX3kMA1WDRcfVXLJ6x': { plan: 'professional', url_limit: 25 },
  'price_1UDBxzCX3kMA1WDRFclC6Crw': { plan: 'elite', url_limit: 100 },
  'price_1UDBxzCX3kMA1WDR4kz56LxF': { plan: 'enterprise', url_limit: 9999 },
};

const UPGRADE_MAP = {
  'price_1UDBy0CX3kMA1WDRuL1WDVpq': 'competitor_intelligence',
  'price_1UDBy0CX3kMA1WDRFunvSa9I': 'ai_search_visibility',
  'price_1UDBy1CX3kMA1WDRkabYvsya': 'content_generator_pro',
  'price_1UDBy1CX3kMA1WDRugySfyg5': 'backlink_tracker',
  'price_1UDBy2CX3kMA1WDRtpW9tARk': 'core_web_vitals',
  'price_1UDBy2CX3kMA1WDRmqI7yjYE': 'vision_cortex_link',
};

async function handleEvent(event) {
  const b44 = await getBase44Client();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.user_id || '';
      const userEmail = session.customer_email || session.customer_details?.email || '';
      const subscriptionId = session.subscription;

      // Get subscription details from Stripe
      const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        headers: { 'Authorization': `Bearer ${stripeSecretKey}`, 'Stripe-Version': '2025-10-29.clover' },
      });
      const sub = await subRes.json();

      const planInfo = PLAN_MAP[sub.items?.data[0]?.price?.id] || { plan: 'starter', url_limit: 5 };
      const upgrades = sub.items?.data
        ?.map(item => UPGRADE_MAP[item.price?.id])
        .filter(Boolean) || [];

      // Create or update subscription record
      const existing = await b44.entities.Subscription.filter({ stripe_subscription_id: subscriptionId });
      if (existing && existing.length > 0) {
        await b44.entities.Subscription.update(existing[0].id, {
          status: 'active',
          plan: planInfo.plan,
          url_limit: planInfo.url_limit,
          upgrades,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        });
      } else {
        await b44.entities.Subscription.create({
          user_id: userId,
          customer_email: userEmail,
          stripe_customer_id: sub.customer,
          stripe_subscription_id: subscriptionId,
          plan: planInfo.plan,
          status: 'active',
          url_limit: planInfo.url_limit,
          urls_used: 0,
          upgrades,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          onboarding_completed: false,
        });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const planInfo = PLAN_MAP[sub.items?.data[0]?.price?.id] || { plan: 'starter', url_limit: 5 };
      const upgrades = sub.items?.data
        ?.map(item => UPGRADE_MAP[item.price?.id])
        .filter(Boolean) || [];

      const existing = await b44.entities.Subscription.filter({ stripe_subscription_id: sub.id });
      if (existing && existing.length > 0) {
        await b44.entities.Subscription.update(existing[0].id, {
          status: sub.status,
          plan: planInfo.plan,
          url_limit: planInfo.url_limit,
          upgrades,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const existing = await b44.entities.Subscription.filter({ stripe_subscription_id: sub.id });
      if (existing && existing.length > 0) {
        await b44.entities.Subscription.update(existing[0].id, {
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        });
      }
      break;
    }
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const payload = await req.text();
  const signature = req.headers.get('stripe-signature') || '';

  const verified = await verifySignature(payload, signature, webhookSecret);
  if (!verified) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  let event;
  try {
    event = JSON.parse(payload);
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    await handleEvent(event);
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('StripeWebhook error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});