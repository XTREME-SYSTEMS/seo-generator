import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@base44/sdk@latest";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const appId = Deno.env.get("BASE44_APP_ID");
const APP_URL = "https://seo-generator.base44.app";

const PRICE_MAP = {
  'price_1UDBxyCX3kMA1WDRw3U1Z0sW': { plan: 'starter', url_limit: 5 },
  'price_1UDBxyCX3kMA1WDRcfVXLJ6x': { plan: 'professional', url_limit: 25 },
  'price_1UDBxzCX3kMA1WDRFclC6Crw': { plan: 'elite', url_limit: 100 },
  'price_1UDBxzCX3kMA1WDR4kz56LxF': { plan: 'enterprise', url_limit: 9999 },
};

async function createCheckoutSession(body) {
  const { priceId, userId, userEmail, promoCode, upgrades = [] } = body;

  if (!priceId) throw new Error("priceId is required");

  const lineItems = [{ price: priceId, quantity: 1 }];
  for (const upgradePriceId of upgrades) {
    lineItems.push({ price: upgradePriceId, quantity: 1 });
  }

  const params = new URLSearchParams();
  params.append('mode', 'subscription');
  params.append('line_items[0][price]', priceId);
  params.append('line_items[0][quantity]', '1');
  upgrades.forEach((up, i) => {
    params.append(`line_items[${i + 1}][price]`, up);
    params.append(`line_items[${i + 1}][quantity]`, '1');
  });
  params.append('success_url', `${APP_URL}/portal?status=success`);
  params.append('cancel_url', `${APP_URL}/pricing?status=canceled`);
  params.append('metadata[base44_app_id]', appId);
  params.append('metadata[user_id]', userId || '');
  params.append('metadata[user_email]', userEmail || '');
  params.append('subscription_data[metadata][base44_app_id]', appId);
  if (userEmail) params.append('customer_email', userEmail);
  if (promoCode) params.append('promotion_code', promoCode);

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
      'Stripe-Version': '2025-10-29.clover',
      'Idempotency-Key': crypto.randomUUID(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to create checkout session');
  return { url: data.url, sessionId: data.id };
}

async function createPromoCode(body) {
  const { code, percentOff, duration = 'repeating', durationMonths = 1, maxRedemptions } = body;

  const couponParams = new URLSearchParams();
  couponParams.append('percent_off', String(percentOff));
  couponParams.append('duration', duration);
  if (duration === 'repeating') couponParams.append('duration_in_months', String(durationMonths));
  couponParams.append('metadata[base44_app_id]', appId);

  const couponRes = await fetch('https://api.stripe.com/v1/coupons', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
      'Stripe-Version': '2025-10-29.clover',
      'Idempotency-Key': crypto.randomUUID(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: couponParams,
  });
  const coupon = await couponRes.json();
  if (!couponRes.ok) throw new Error(coupon.error?.message || 'Failed to create coupon');

  const promoParams = new URLSearchParams();
  promoParams.append('coupon', coupon.id);
  promoParams.append('code', code.toUpperCase());
  if (maxRedemptions) promoParams.append('max_redemptions', String(maxRedemptions));
  promoParams.append('metadata[base44_app_id]', appId);

  const promoRes = await fetch('https://api.stripe.com/v1/promotion_codes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
      'Stripe-Version': '2025-10-29.clover',
      'Idempotency-Key': crypto.randomUUID(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: promoParams,
  });
  const promo = await promoRes.json();
  if (!promoRes.ok) throw new Error(promo.error?.message || 'Failed to create promo code');

  return { couponId: coupon.id, promoCodeId: promo.id, code: promo.code };
}

async function listPromoCodes() {
  const res = await fetch('https://api.stripe.com/v1/promotion_codes?limit=100', {
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
      'Stripe-Version': '2025-10-29.clover',
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to list promo codes');
  return data.data.map(p => ({
    id: p.id,
    code: p.code,
    active: p.active,
    percentOff: p.coupon?.percent_off,
    duration: p.coupon?.duration,
    durationMonths: p.coupon?.duration_in_months,
    maxRedemptions: p.max_redemptions,
    timesRedeemed: p.times_redeemed,
    expiresAt: p.expires_at,
  }));
}

async function validatePromoCode(code) {
  const res = await fetch(`https://api.stripe.com/v1/promotion_codes?code=${encodeURIComponent(code.toUpperCase())}&active=true`, {
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
      'Stripe-Version': '2025-10-29.clover',
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to validate promo code');
  if (!data.data || data.data.length === 0) throw new Error('Invalid promo code');
  const promo = data.data[0];
  return {
    valid: true,
    promoCodeId: promo.id,
    code: promo.code,
    percentOff: promo.coupon?.percent_off,
    duration: promo.coupon?.duration,
  };
}

async function cancelSubscription(subscriptionId) {
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
      'Stripe-Version': '2025-10-29.clover',
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to cancel subscription');
  return { canceled: true, id: data.id, status: data.status };
}

serve(async (req) => {
  let body = {};
  try {
    body = await req.json();
  } catch (e) { /* GET requests have no body */ }

  const action = body.action || body.path || new URL(req.url).pathname.split('/').pop();

  try {
    let result;
    switch (action) {
      case 'create-checkout':
        result = await createCheckoutSession(body);
        break;
      case 'create-promo':
        result = await createPromoCode(body);
        break;
      case 'list-promos':
        result = await listPromoCodes();
        break;
      case 'validate-promo':
        result = await validatePromoCode(body.code);
        break;
      case 'cancel':
        result = await cancelSubscription(body.subscriptionId);
        break;
      default:
        return new Response(JSON.stringify({ error: 'Unknown action: ' + action }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ success: true, ...result }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('StripeCheckout error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
});