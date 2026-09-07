import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Brain, Radar, Bot, Globe, TrendingUp, Shield, Target, Sparkles, Search, BarChart3, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import PWAInstallButton from '@/components/PWAInstallButton';
import { PLAN_FEATURES } from '@/lib/stripeConfig';

const LOGO_URL = 'https://media.base44.com/images/public/6a8aaecf2642e595c591a5dc/f3a5caad5_LOGO.png';

const FEATURES = [
  { icon: Brain, title: 'Autonomous AI Agents', desc: 'Persistent AI agents that audit, optimize, and heal your SEO 24/7 — no human input required.' },
  { icon: Search, title: 'Full SEO + AEO + SAO', desc: 'Optimize for Google, AI search engines (ChatGPT, Perplexity, Gemini), and voice search simultaneously.' },
  { icon: Radar, title: 'Competitor Intelligence', desc: 'Deep competitor scraping, discovery, and counter-strategy generation that keeps you ahead.' },
  { icon: Bot, title: 'AI Copilot', desc: 'A headful AI assistant on the right side of your screen that can scrape the web, make changes, and operate your system.' },
  { icon: Target, title: 'Agent Builder', desc: 'Build custom AI agents through onboarding that operate in the backend to achieve your specific goals.' },
  { icon: TrendingUp, title: 'Daily Ranking Progress', desc: 'See exactly what changed every day, what the agents did, and how your rankings are climbing.' },
  { icon: Globe, title: 'Google Search Console', desc: 'User-friendly GSC connection plus multi-platform sync for Facebook, Instagram, TikTok, YouTube.' },
  { icon: Shield, title: 'Vision Cortex Integration', desc: 'Connect your Vision Cortex brain for full autonomous orchestration, healing, and system management.' },
];

const STATS = [
  { value: '24/7', label: 'Autonomous Operation' },
  { value: '97%', label: 'First-Page Success Rate' },
  { value: '50M+', label: 'Keywords Tracked' },
  { value: '500+', label: 'URLs Optimized' },
];

const STEPS = [
  { num: '01', title: 'Connect Your URLs', desc: 'Enter your URLs during onboarding. The system learns your industry, competitors, and goals.' },
  { num: '02', title: 'AI Agents Go to Work', desc: 'Autonomous agents audit, research, optimize, and deploy changes — continuously, 24/7.' },
  { num: '03', title: 'Watch Rankings Climb', desc: 'Daily dashboard shows ranking progress, what agents did, and increasing visibility.' },
];

function Landing() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFD700]/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#FFD700]/15 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6">
          <div className="mb-8 flex justify-center">
            <img src={LOGO_URL} alt="Xtreme SEO Optimizer" className="h-24 w-auto sm:h-28" />
          </div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FFD700]/40 bg-[#FFD700]/10 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#B8860B]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#B8860B]">Intelligence for Growth</span>
          </div>
          <h1 className="mx-auto max-w-4xl font-heading text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
            Autonomous AI SEO That Gets You to the <span className="text-[#B8860B]">First Page of Google</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            The only platform that combines autonomous AI agents, competitor intelligence, and full SEO + AEO + AI search optimization
            to drive your URLs to the top — while you sleep.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/pricing">
              <Button size="lg" className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold text-base px-8 h-12">
                Start Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/services">
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-muted text-base px-8 h-12">
                Explore Services
              </Button>
            </Link>
            <PWAInstallButton />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-heading text-3xl font-bold text-[#B8860B] sm:text-4xl">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Everything You Need to Dominate Search</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              One platform. Full autonomous SEO, AEO, AI search optimization, competitor intelligence, and persistent AI agents.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-xl border border-border bg-slate-50/50 p-6 transition-all hover:border-[#FFD700]/40 hover:bg-[#FFD700]/[0.05]">
                <div className="mb-4 inline-flex rounded-lg bg-[#FFD700]/15 p-3">
                  <f.icon className="h-6 w-6 text-[#B8860B]" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-border bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">How It Works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">Three steps to autonomous SEO dominance.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.num} className="relative">
                <div className="mb-4 font-mono text-5xl font-bold text-[#FFD700]/30">{s.num}</div>
                <h3 className="mb-2 font-heading text-xl font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">Choose your plan. Cancel anytime. Start dominating search today.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-4">
            {Object.entries(PLAN_FEATURES).map(([key, plan]) => (
              <div key={key} className={`rounded-xl border p-6 ${key === 'professional' ? 'border-[#FFD700] bg-[#FFD700]/[0.05]' : 'border-border bg-slate-50/50'}`}>
                {key === 'professional' && (
                  <div className="mb-3 inline-block rounded-full bg-[#FFD700] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">Most Popular</div>
                )}
                <h3 className="font-heading text-lg font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-heading text-3xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{plan.url_limit >= 9999 ? 'Unlimited URLs' : `${plan.url_limit} URLs`}</p>
                <Link to="/pricing" className="mt-4 block">
                  <Button className={`w-full ${key === 'professional' ? 'bg-[#FFD700] text-black hover:bg-[#FFD700]/90' : 'bg-foreground text-background hover:bg-foreground/90'}`} size="sm">
                    Choose {plan.name}
                  </Button>
                </Link>
                <ul className="mt-5 space-y-2">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B8860B]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-t from-[#FFD700]/15 to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <img src={LOGO_URL} alt="Xtreme SEO" className="mx-auto mb-8 h-20 w-auto" />
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-5xl">Ready to Dominate Search?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Join the ranks of businesses using autonomous AI to reach the first page of Google.
          </p>
          <Link to="/pricing" className="mt-8 inline-block">
            <Button size="lg" className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold text-base px-8 h-12">
              Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}

export default Landing;