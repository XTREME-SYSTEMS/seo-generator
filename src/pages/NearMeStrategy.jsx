import React, { useState } from 'react';
import { Zap, Search, BarChart3, Crown, Target, TrendingUp, Globe, MapPin, DollarSign } from 'lucide-react';
import UrlGeneratorTab from '@/components/nearme/UrlGeneratorTab';
import SearchToolTab from '@/components/nearme/SearchToolTab';
import SimulationGeneratorTab from '@/components/nearme/SimulationGeneratorTab';

const TABS = [
  { id: 'strategy', label: 'Strategy Overview', icon: Crown },
  { id: 'url-generator', label: 'URL Generator', icon: Zap },
  { id: 'search-tool', label: 'Search Tool', icon: Search },
  { id: 'simulation', label: 'Simulation Generator', icon: BarChart3 },
];

const DOMINANCE_PILLARS = [
  { icon: Globe, title: 'Programmatic Scale', desc: 'Generate 450+ city × service pages per niche using dynamic routing. Every city gets a unique, SEO-optimized landing page with local schema, FAQs, and conversion-optimized copy.' },
  { icon: Target, title: 'Exact-Match Domains', desc: 'Acquire nearme.com pattern domains (plumbingnearme.com, roofingnearme.com) for instant keyword relevance and authority signaling in local search.' },
  { icon: TrendingUp, title: 'Demand Intelligence', desc: 'AI-powered search demand analysis with Google autocomplete integration. Score every domain by commercial intent, CPC, and search volume before building.' },
  { icon: MapPin, title: 'Local SEO Domination', desc: 'LocalBusiness schema, Google Business Profile sync, city-level landing pages, and proximity-based ranking signals for map pack dominance.' },
  { icon: DollarSign, title: 'Lead Monetization', desc: 'Lead capture forms on every page, instant quote estimators, and lead routing to maximize conversion. $50-$500 per lead depending on niche.' },
  { icon: BarChart3, title: 'Simulation Modeling', desc: 'Project traffic, leads, revenue, and profit across 1-month to 3-year timeframes. Model keyword growth, backlink accumulation, and domain authority curves.' },
];

export default function NearMeStrategy() {
  const [tab, setTab] = useState('strategy');

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Crown className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">NearMe.com Strategy & Digital Dominance</h1>
            <p className="text-sm text-muted-foreground">Programmatic SEO engine for exact-match domain acquisition, demand intelligence, and market simulation</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 border-b border-border">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {tab === 'strategy' && <StrategyOverview onNavigate={setTab} />}
        {tab === 'url-generator' && <UrlGeneratorTab />}
        {tab === 'search-tool' && <SearchToolTab />}
        {tab === 'simulation' && <SimulationGeneratorTab />}
      </div>
    </div>
  );
}

function StrategyOverview({ onNavigate }) {
  return (
    <div className="space-y-6">
      {/* Strategy Summary */}
      <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-lg p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-3">The NearMe.com Playbook</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-4">
          The NearMe strategy acquires exact-match <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">[niche]nearme.com</code> domains
          and builds programmatic SEO sites with hundreds of city-level landing pages. Each domain captures high-commercial-intent local search traffic,
          converts visitors into leads via quote forms, and monetizes through lead sales to local service businesses.
        </p>
        <div className="grid gap-3 sm:grid-cols-4">
          <PipelineStep step="1" label="Discover" desc="Find available nearme domains via NAICS-based generation" />
          <PipelineStep step="2" label="Validate" desc="Score demand, CPC, and commercial intent with AI" />
          <PipelineStep step="3" label="Build" desc="Generate 450+ city pages with dynamic routing" />
          <PipelineStep step="4" label="Dominate" desc="Rank, capture leads, and monetize" />
        </div>
      </div>

      {/* Dominance Pillars */}
      <div>
        <h3 className="font-heading text-base font-semibold text-foreground mb-4">Six Pillars of Digital Dominance</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {DOMINANCE_PILLARS.map((p, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-5 hover:border-primary/20 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <p.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-semibold text-foreground mb-1">{p.title}</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Model */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-heading text-base font-semibold text-foreground mb-4">Revenue Model</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RevenueCard label="Per Lead" value="$50-$500" desc="Sold to local service businesses" />
          <RevenueCard label="Per Domain" value="$5K-$50K/mo" desc="At scale with 450+ ranking pages" />
          <RevenueCard label="Portfolio" value="$500K+/yr" desc="10-20 domains at full scale" />
          <RevenueCard label="Exit Value" value="3-5x ARR" desc="Domain portfolio asset sale" />
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onNavigate('url-generator')}
          className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
        >
          <Zap className="w-4 h-4" /> Start Generating URLs
        </button>
        <button
          onClick={() => onNavigate('search-tool')}
          className="px-5 py-2.5 rounded-md bg-card border border-border text-sm font-medium hover:border-primary/30 flex items-center gap-2"
        >
          <Search className="w-4 h-4" /> Research Search Demand
        </button>
        <button
          onClick={() => onNavigate('simulation')}
          className="px-5 py-2.5 rounded-md bg-card border border-border text-sm font-medium hover:border-primary/30 flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" /> Run a Simulation
        </button>
      </div>
    </div>
  );
}

function PipelineStep({ step, label, desc }) {
  return (
    <div className="bg-background border border-border rounded-md p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono text-xs font-bold">{step}</span>
        <span className="font-heading text-sm font-semibold text-foreground">{label}</span>
      </div>
      <p className="text-xs text-muted-foreground pl-8">{desc}</p>
    </div>
  );
}

function RevenueCard({ label, value, desc }) {
  return (
    <div className="bg-muted/30 rounded-md p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-heading text-lg font-semibold text-primary tabular">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>
    </div>
  );
}