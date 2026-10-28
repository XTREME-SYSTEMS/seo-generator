import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const PLAN_BY_PRICE = {
  price_1UDBxyCX3kMA1WDRw3U1Z0sW: { plan: 'starter', amount: 29900 },
  price_1UDBxyCX3kMA1WDRcfVXLJ6x: { plan: 'professional', amount: 79900 },
  price_1UDBxzCX3kMA1WDRFclC6Crw: { plan: 'elite', amount: 199900 },
  price_1UDBxzCX3kMA1WDR4kz56LxF: { plan: 'enterprise', amount: 499900 },
};

const ADDON_BY_PRICE = {
  price_1UDBy0CX3kMA1WDRuL1WDVpq: { key: 'competitor_intelligence', amount: 19900 },
  price_1UDBy0CX3kMA1WDRFunvSa9I: { key: 'ai_search_visibility', amount: 14900 },
  price_1UDBy1CX3kMA1WDRkabYvsya: { key: 'content_generator_pro', amount: 9900 },
  price_1UDBy1CX3kMA1WDRugySfyg5: { key: 'backlink_tracker', amount: 7900 },
  price_1UDBy2CX3kMA1WDRtpW9tARk: { key: 'core_web_vitals', amount: 4900 },
  price_1UDBy2CX3kMA1WDRmqI7yjYE: { key: 'vision_cortex_link', amount: 29900 },
};

const stripeHeaders = (idempotencyKey) => ({
  Authorization: `Bearer ${secrets.get('STRIPE_SECRET_KEY')}`,
  'Stripe-Version': '2025-10-29.clover',
  'Content-Type': 'application/x-www-form-urlencoded',
  ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
});

async function stripePost(path, params, idempotencyKey) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: stripeHeaders(idempotencyKey),
    body: params,
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Stripe ${path} failed`);
  return data;
}

async function stripeSend(path, method) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: stripeHeaders(),
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Stripe ${path} failed`);
  return data;
}

function appUrl(req) {
  const base = req.headers.get('x-base44-app-url');
  if (!base) throw new Error('Missing X-Base44-App-Url header — cannot build return URLs');
  return base.replace(/\/$/, '');
}

async function createCheckoutSession(req, base44, user, body) {
  const { planPriceId, priceId, upgrades = [] } = body;
  const selectedPrice = planPriceId || priceId;

  // Only server-known prices are billable — the caller never sets an amount.
  const planMeta = PLAN_BY_PRICE[selectedPrice];
  if (!planMeta) return { error: 'Unknown or unsupported plan price', status: 400 };

  const addonPrices = (Array.isArray(upgrades) ? upgrades : []).filter((p) => ADDON_BY_PRICE[p]);
  const origin = appUrl(req);

  const params = new URLSearchParams();
  params.append('mode', 'subscription');
  params.append('line_items[0][price]', selectedPrice);
  params.append('line_items[0][quantity]', '1');
  addonPrices.forEach((price, i) => {
    params.append(`line_items[${i + 1}][price]`, price);
    params.append(`line_items[${i + 1}][quantity]`, '1');
  });

  const expectedCents = planMeta.amount + addonPrices.reduce((sum, p) => sum + ADDON_BY_PRICE[p].amount, 0);

  params.append('success_url', `${origin}/portal/onboarding?status=success&session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', `${origin}/pricing?status=canceled`);
  params.append('metadata[base44_app_id]', secrets.get('BASE44_APP_ID'));
  params.append('metadata[price_id]', selectedPrice);
  params.append('subscription_data[metadata][base44_app_id]', secrets.get('BASE44_APP_ID'));
  params.append('subscription_data[metadata][price_id]', selectedPrice);
  if (user) {
    params.append('metadata[user_id]', user.id);
    params.append('metadata[user_email]', user.email || '');
    params.append('subscription_data[metadata][user_id]', user.id);
    if (user.email) params.append('customer_email', user.email);
  }
  if (body.promoCode) params.append('promotion_code', String(body.promoCode));

  const session = await stripePost('/checkout/sessions', params, crypto.randomUUID());

  // Expected amount + buyer recorded server-side before the buyer leaves for Stripe.
  if (user) {
    await base44.asServiceRole.entities.Entitlement.create({
      user_id: user.id,
      user_email: user.email || undefined,
      plan: planMeta.plan,
      kind: 'subscription',
      status: 'pending',
      price_id: selectedPrice,
      amount_cents: expectedCents,
      currency: session.currency || 'usd',
      checkout_session_id: session.id,
      granted_by: 'checkout_initiated',
      evidence: `session:${session.id} awaiting signature-verified payment`,
    });
  }

  return { url: session.url, sessionId: session.id };
}

async function createPromoCode(base44, body) {
  const percentOff = Number(body.percentOff);
  if (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > 100) {
    return { error: 'percentOff must be an integer between 1 and 100', status: 400 };
  }
  if (!body.code) return { error: 'code is required', status: 400 };

  const couponParams = new URLSearchParams();
  couponParams.append('percent_off', String(percentOff));
  couponParams.append('duration', body.duration || 'repeating');
  if ((body.duration || 'repeating') === 'repeating') couponParams.append('duration_in_months', String(body.durationMonths || 1));
  couponParams.append('metadata[base44_app_id]', secrets.get('BASE44_APP_ID'));
  const coupon = await stripePost('/coupons', couponParams, crypto.randomUUID());

  const promoParams = new URLSearchParams();
  promoParams.append('promotion[type]', 'coupon');
  promoParams.append('promotion[coupon]', coupon.id);
  promoParams.append('code', String(body.code).toUpperCase());
  if (body.maxRedemptions) promoParams.append('max_redemptions', String(Number(body.maxRedemptions)));
  promoParams.append('metadata[base44_app_id]', secrets.get('BASE44_APP_ID'));
  const promo = await stripePost('/promotion_codes', promoParams, crypto.randomUUID());

  await base44.asServiceRole.entities.PromoCode.create({
    code: promo.code,
    stripe_coupon_id: coupon.id,
    stripe_promo_code_id: promo.id,
    discount_type: 'percent',
    discount_value: percentOff,
    duration: body.duration || 'repeating',
    duration_in_months: body.durationMonths || 1,
    max_redemptions: body.maxRedemptions || undefined,
    created_by_admin: true,
  });

  return { couponId: coupon.id, promoCodeId: promo.id, code: promo.code };
}

async function listPromoCodes() {
  const data = await stripeSend('/promotion_codes?limit=100', 'GET');
  return {
    promos: data.data.map((p) => ({
      id: p.id,
      code: p.code,
      active: p.active,
      percentOff: p.coupon?.percent_off,
      duration: p.coupon?.duration,
      durationMonths: p.coupon?.duration_in_months,
      maxRedemptions: p.max_redemptions,
      timesRedeemed: p.times_redeemed,
      expiresAt: p.expires_at,
    })),
  };
}

async function validatePromoCode(code) {
  if (!code) return { error: 'code is required', status: 400 };
  const data = await stripeSend(`/promotion_codes?code=${encodeURIComponent(String(code).toUpperCase())}&active=true`, 'GET');
  if (!data.data?.length) return { error: 'Invalid promo code', status: 400 };
  const promo = data.data[0];
  return { valid: true, promoCodeId: promo.id, code: promo.code, percentOff: promo.coupon?.percent_off, duration: promo.coupon?.duration };
}

async function togglePromoCode(promoId, active) {
  if (!promoId) return { error: 'promoId is required', status: 400 };
  const params = new URLSearchParams();
  params.append('active', String(Boolean(active)));
  const data = await stripePost(`/promotion_codes/${promoId}`, params, crypto.randomUUID());
  return { id: data.id, active: data.active };
}

async function cancelSubscription(base44, subscriptionId) {
  if (!subscriptionId) return { error: 'subscriptionId is required', status: 400 };
  const data = await stripeSend(`/subscriptions/${subscriptionId}`, 'DELETE');
  const ents = await base44.asServiceRole.entities.Entitlement.filter({ stripe_subscription_id: subscriptionId }, { limit: 1 });
  if (ents?.length) await base44.asServiceRole.entities.Entitlement.update(ents[0].id, { status: 'canceled', granted_by: 'admin', evidence: `admin cancel ${new Date().toISOString()}` });
  return { canceled: true, id: data.id, status: data.status };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));

    const body = await req.json().catch(() => ({}));
    const action = body.action;
    if (!action) return Response.json({ error: 'action is required' }, { status: 400 });

    const adminOnly = ['create-promo', 'list-promos', 'toggle-promo', 'cancel'];
    if (adminOnly.includes(action)) {
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let result;
    switch (action) {
      case 'create-checkout':
        result = await createCheckoutSession(req, base44, user, body);
        break;
      case 'create-promo':
        result = await createPromoCode(base44, body);
        break;
      case 'list-promos':
        result = await listPromoCodes();
        break;
      case 'validate-promo':
        result = await validatePromoCode(body.code);
        break;
      case 'toggle-promo':
        result = await togglePromoCode(body.promoId, body.active);
        break;
      case 'cancel':
        result = await cancelSubscription(base44, body.subscriptionId);
        break;
      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 404 });
    }

    if (result?.error) return Response.json({ error: result.error }, { status: result.status || 400 });
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error('StripeCheckout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}