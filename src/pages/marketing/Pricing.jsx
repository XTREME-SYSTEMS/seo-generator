import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Tag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { PLAN_FEATURES, UPGRADE_FEATURES, STRIPE_PRICES, STRIPE_UPGRADE_PRICES } from '@/lib/stripeConfig';
import { base44 } from '@/api/base44Client';

const LOGO_URL = 'https://media.base44.com/images/public/6a8aaecf2642e595c591a5dc/f3a5caad5_LOGO.png';

function Pricing() {
  const [promoCode, setPromoCode] = useState('');
  const [promoValid, setPromoValid] = useState(null);
  const [promoChecking, setPromoChecking] = useState(false);
  const [checkingOut, setCheckingOut] = useState(null);

  const handleCheckout = async (planKey) => {
    if (window.self !== window.top) {
      alert('Checkout works only from the published app. Please open the app in a new tab.');
      return;
    }
    setCheckingOut(planKey);
    try {
      const { data } = await base44.functions.invoke('StripeCheckout', {
        path: 'create-checkout',
        priceId: STRIPE_PRICES[planKey],
        promoCode: promoValid?.promoCodeId || undefined,
      });
      if (data.url) window.location.href = data.url;
    } catch (err) {
      alert('Checkout error: ' + err.message);
    }
    setCheckingOut(null);
  };

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoChecking(true);
    try {
      const { data } = await base44.functions.invoke('StripeCheckout', {
        path: 'validate-promo',
        code: promoCode,
      });
      setPromoValid(data);
    } catch (err) {
      setPromoValid({ valid: false, error: err.message });
    }
    setPromoChecking(false);
  };

  return (
    <MarketingLayout>
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <div className="mb-4 flex justify-center">
              <img src={LOGO_URL} alt="Xtreme SEO" className="h-16 w-auto" />
            </div>
            <h1 className="font-heading text-4xl font-bold text-foreground sm:text-5xl">Choose Your Plan</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              From starter to enterprise. Every plan includes autonomous AI agents working 24/7 to get you to the first page.
            </p>
          </div>

          {/* Promo Code */}
          <div className="mx-auto mb-12 flex max-w-md flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                type="text"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleValidatePromo}
              disabled={promoChecking || !promoCode.trim()}
              variant="outline"
              className="border-[#FFD700]/40 text-[#B8860B] hover:bg-[#FFD700]/10"
            >
              {promoChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
            </Button>
            {promoValid?.valid && (
              <div className="text-xs text-[#B8860B] sm:absolute sm:mt-12">{promoValid.percentOff}% off applied!</div>
            )}
            {promoValid?.valid === false && (
              <div className="text-xs text-red-500 sm:absolute sm:mt-12">Invalid promo code</div>
            )}
          </div>

          {/* Pricing Tiers */}
          <div className="grid gap-6 lg:grid-cols-4">
            {Object.entries(PLAN_FEATURES).map(([key, plan]) => (
              <div
                key={key}
                className={`relative flex flex-col rounded-xl border p-6 ${
                  key === 'professional' ? 'border-[#FFD700] bg-[#FFD700]/[0.05]' : 'border-border bg-slate-50/50'
                }`}
              >
                {key === 'professional' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FFD700] px-4 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                    Most Popular
                  </div>
                )}
                <h3 className="font-heading text-xl font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {plan.url_limit >= 9999 ? 'Unlimited URLs' : `${plan.url_limit} URLs under optimization`}
                </p>
                <Button
                  onClick={() => handleCheckout(key)}
                  disabled={checkingOut === key}
                  className={`mt-5 w-full ${
                    key === 'professional' ? 'bg-[#FFD700] text-black hover:bg-[#FFD700]/90' : 'bg-foreground text-background hover:bg-foreground/90'
                  }`}
                >
                  {checkingOut === key ? <Loader2 className="h-4 w-4 animate-spin" /> : `Choose ${plan.name}`}
                </Button>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B8860B]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Upgrades */}
          <div className="mt-20">
            <div className="mb-8 text-center">
              <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Individual Tool Upgrades</h2>
              <p className="mt-2 text-sm text-muted-foreground">Add powerful tools to any plan. Cancel anytime.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(UPGRADE_FEATURES).map(([key, upgrade]) => (
                <div key={key} className="flex items-center justify-between rounded-lg border border-border bg-slate-50/50 p-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{upgrade.name}</h4>
                    <p className="text-xs text-muted-foreground">${upgrade.price}/mo</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-[#FFD700]/40 text-[#B8860B] hover:bg-[#FFD700]/10">
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="mx-auto mt-20 max-w-3xl">
            <h2 className="mb-8 text-center font-heading text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: 'How does the autonomous system work?', a: 'Once you complete onboarding, AI agents continuously audit your URLs, research competitors, generate optimized content, deploy changes, and monitor rankings — 24/7, without human input.' },
                { q: 'Do I need technical knowledge?', a: 'No. The onboarding wizard asks simple questions about your business, industry, and goals. The system builds itself based on your answers.' },
                { q: 'How long until I see results?', a: 'Most clients see ranking improvements within 2-4 weeks. Significant first-page movement typically occurs within 60-90 days depending on competition.' },
                { q: 'Can I cancel anytime?', a: 'Yes. Cancel your subscription at any time from your customer portal. No long-term contracts.' },
                { q: 'What is Vision Cortex integration?', a: 'Vision Cortex is our master AI brain that orchestrates all agents, discovers new ranking methods, and evolves the system. Elite and Enterprise plans include full Vision Cortex sync.' },
              ].map((faq) => (
                <div key={faq.q} className="rounded-lg border border-border bg-slate-50/50 p-5">
                  <h3 className="mb-2 font-semibold text-[#B8860B]">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

export default Pricing;