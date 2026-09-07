import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Brain, Radar, Bot, Globe, Zap, TrendingUp, Shield, Target, FileCheck, BarChart3, MessageSquare, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingLayout from '@/components/marketing/MarketingLayout';

const LOGO_URL = 'https://media.base44.com/images/public/6a8aaecf2642e595c591a5dc/f3a5caad5_LOGO.png';

const SERVICES = [
  { icon: Search, title: 'Autonomous SEO', desc: 'Full on-page, technical, and content SEO automation. Meta tags, schema markup, internal linking, sitemaps, and IndexNow pinging — all automated.', price: 'Included in all plans' },
  { icon: Brain, title: 'AEO — AI Search Optimization', desc: 'Optimize for ChatGPT, Perplexity, Gemini, Copilot, and Claude. Track your visibility in AI answers and improve citation rates.', price: 'From $149/mo' },
  { icon: Radar, title: 'Competitor Intelligence', desc: 'Deep forensic scraping of competitor pages. Discover their strategies, content gaps, backlink sources, and build counter-strategies.', price: 'From $199/mo' },
  { icon: Bot, title: 'AI Copilot Assistant', desc: 'A headful AI assistant that lives on the right side of your screen. Scrape the web, make changes, discover intelligence, and operate your system.', price: 'Pro plan and above' },
  { icon: Target, title: 'Custom Agent Builder', desc: 'Build AI agents through onboarding that are designed to achieve your specific goals — more traffic, more leads, more conversions.', price: 'Pro plan and above' },
  { icon: TrendingUp, title: 'Daily Ranking Dashboard', desc: 'See every URL, its ranking progress, what changed today, what the agents did, and how your visibility is growing.', price: 'Included in all plans' },
  { icon: Globe, title: 'Google Search Console Sync', desc: 'User-friendly GSC connection with automatic data sync. Plus multi-platform tracking for Facebook, Instagram, TikTok, YouTube.', price: 'Included in all plans' },
  { icon: Shield, title: 'Vision Cortex Brain Link', desc: 'Connect your Vision Cortex brain for full autonomous orchestration. The brain manages, operates, fixes, heals, and syncs your entire system.', price: 'From $299/mo' },
  { icon: FileCheck, title: 'Technical SEO Audit', desc: 'Deep technical audits covering Core Web Vitals, schema validation, crawlability, indexation, canonical issues, and security headers.', price: 'Included in all plans' },
  { icon: BarChart3, title: 'Backlink Tracker & Outreach', desc: 'Monitor backlink velocity, detect new and lost links, and automate outreach email drafting for link building campaigns.', price: 'From $79/mo' },
  { icon: Zap, title: 'Content Generator Pro', desc: 'AI-powered content generation for meta tags, schema markup, FAQs, full blog posts, and landing page copy — optimized for SEO and AEO.', price: 'From $99/mo' },
  { icon: MessageSquare, title: 'Multi-Platform Social Sync', desc: 'Auto-generate and sync content across Facebook, Instagram, TikTok, YouTube, and Google Business Profile for omnichannel visibility.', price: 'Elite plan and above' },
];

function Services() {
  return (
    <MarketingLayout>
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <img src={LOGO_URL} alt="Xtreme SEO" className="mx-auto mb-6 h-16 w-auto" />
            <h1 className="font-heading text-4xl font-bold text-foreground sm:text-5xl">Services & Tools</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Every tool you need to dominate search — bundled in plans or available as individual upgrades.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <div key={s.title} className="group rounded-xl border border-border bg-slate-50/50 p-6 transition-all hover:border-[#FFD700]/40 hover:bg-[#FFD700]/[0.05]">
                <div className="mb-4 inline-flex rounded-lg bg-[#FFD700]/15 p-3">
                  <s.icon className="h-6 w-6 text-[#B8860B]" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#B8860B]">{s.price}</span>
                  <Link to="/pricing">
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-[#B8860B]">
                      Get <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

export default Services;