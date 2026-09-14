import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Rocket, Radar, Bot, Briefcase, DollarSign, Globe, Target,
  Activity, Zap, ArrowRight, RefreshCw, Play, TrendingUp,
  CheckCircle2, Clock, AlertTriangle, Eye, Cpu, Network,
  Layers, Search, Users, FileText, Gauge, Shield, Brain,
  Wrench, Sparkles, ChevronRight, Building2,
} from 'lucide-react';

const PIPELINE_PHASES = [
  { id: 'discover', name: 'Discover', icon: Search, desc: 'Find high-value URLs & niches', entity: 'StrategicUrl' },
  { id: 'queue', name: 'Queue', icon: Rocket, desc: 'Add to mass production', entity: 'MassProductionQueue' },
  { id: 'build', name: 'Build', icon: Wrench, desc: 'Generate 450+ city pages', entity: 'MassProductionQueue' },
  { id: 'deploy', name: 'Deploy', icon: Globe, desc: 'Launch to Vercel + DNS', entity: 'MassProductionQueue' },
  { id: 'swarm', name: 'Swarm', icon: Bot, desc: 'AGI agents take over', entity: 'AgentJob' },
  { id: 'monitor', name: 'Monitor', icon: Eye, desc: 'Track rankings 24/7', entity: 'RunTelemetry' },
  { id: 'evolve', name: 'Evolve', icon: Sparkles, desc: 'Self-heal & optimize', entity: 'RunTelemetry' },
];

const SWARM_AGENTS = [
  { name: 'Commander', icon: Brain, role: 'Strategic orchestration' },
  { name: 'Scout', icon: Radar, role: 'Discovery & research' },
  { name: 'Builder', icon: Wrench, role: 'Site generation' },
  { name: 'Healer', icon: Shield, role: 'Auto-healing' },
  { name: 'Optimizer', icon: Gauge, role: 'SEO/AEO tuning' },
  { name: 'Watcher', icon: Eye, role: 'Persistent monitoring' },
];

const STRATEGY_PILLARS = [
  { name: 'CloudBrowser', icon: Globe, desc: 'Autonomous web scraping at scale', link: '/cloud-browser' },
  { name: 'HiddenPropertyIntel', icon: Building2, desc: 'Owner & heir intelligence', link: '/strategic-urls' },
  { name: 'FaultLine', icon: Radar, desc: 'System audit & gap detection', link: '/core-strategy' },
];

export default function MissionControl() {
  const [loading, setLoading] = useState(true);
  const [strategicUrls, setStrategicUrls] = useState([]);
  const [massQueue, setMassQueue] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [agentJobs, setAgentJobs] = useState([]);
  const [activePhase, setActivePhase] = useState('discover');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [urls, queue, tel, jobs] = await Promise.all([
        base44.entities.StrategicUrl.list('-estimated_site_value', 50).catch(() => []),
        base44.entities.MassProductionQueue.list('-created_date', 50).catch(() => []),
        base44.entities.RunTelemetry.list('-created_date', 10).catch(() => []),
        base44.entities.AgentJob.list('-created_date', 10).catch(() => []),
      ]);
      setStrategicUrls(urls || []);
      setMassQueue(queue || []);
      setTelemetry(tel || []);
      setAgentJobs(jobs || []);
    } catch (e) {
      console.error('MissionControl load error:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Aggregate metrics
  const portfolioValue = strategicUrls.reduce((s, u) => s + (u.estimated_site_value || 0), 0);
  const estMonthlyRev = massQueue.reduce((s, q) => s + (q.estimated_monthly_revenue || 0), 0);
  const totalCityPages = massQueue.reduce((s, q) => s + (q.target_cities_count || 0), 0);
  const queuedSites = massQueue.filter(q => q.status === 'queued').length;
  const liveSites = massQueue.filter(q => q.status === 'live').length;
  const swarmActive = massQueue.filter(q => q.autonomous_swarm_active).length;
  const totalLeads = massQueue.reduce((s, q) => s + (q.estimator_usage_today || 0), 0);

  return (
    <div className="min-h-full bg-background">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold tracking-wider mb-3">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>MISSION CONTROL — AUTONOMOUS DIGITAL ASSET FACTORY</span>
          </div>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                Strategic URL → Mass Production → Swarm
              </h1>
              <p className="text-gray-400 mt-2 max-w-2xl">
                The #1 command center. Discover high-value URLs, mass-produce 450+ city pages per niche,
                deploy to Vercel, and let the AGI swarm manage, heal, and evolve every site 24/7.
              </p>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium border border-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {/* Executive KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
            <KpiCard icon={DollarSign} label="Portfolio Value" value={`$${(portfolioValue / 1000000).toFixed(1)}M`} />
            <KpiCard icon={TrendingUp} label="Est. Monthly Rev" value={`$${(estMonthlyRev / 1000).toFixed(0)}k`} />
            <KpiCard icon={Globe} label="City Pages Target" value={totalCityPages.toLocaleString()} />
            <KpiCard icon={Rocket} label="Queued Sites" value={queuedSites} />
            <KpiCard icon={CheckCircle2} label="Live Sites" value={liveSites} />
            <KpiCard icon={Bot} label="Swarm Active" value={swarmActive} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Unified Pipeline */}
        <section>
          <SectionTitle number="01" title="The Unified Pipeline" icon={Zap} />
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            Every site flows through these 7 phases — from discovery to self-evolving asset. Click a phase to jump to its section.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {PIPELINE_PHASES.map((phase, i) => (
              <div key={phase.id} className="flex items-center gap-2">
                <button
                  onClick={() => setActivePhase(phase.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                    activePhase === phase.id
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    activePhase === phase.id ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <phase.icon className="w-4 h-4" /> {phase.name}
                    </p>
                    <p className="text-xs text-muted-foreground hidden md:block">{phase.desc}</p>
                  </div>
                </button>
                {i < PIPELINE_PHASES.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </section>

        {/* Phase 1: Strategic URL Discovery */}
        <section id="discover">
          <SectionTitle number="02" title="Strategic URL Discovery" icon={Search} />
          <p className="text-sm text-muted-foreground mt-2 mb-4">
            High-value URLs identified, scored, and ready for development. Each URL is evaluated by search volume,
            lead-gen potential, CPC, and estimated site value to a buyer.
          </p>
          {loading ? (
            <LoadingSpinner />
          ) : strategicUrls.length === 0 ? (
            <EmptyState icon={Search} title="No strategic URLs discovered yet" desc="Run the Strategic URL Finder to identify high-value domains for development and sale." cta={{ label: 'Open URL Finder', to: '/strategic-urls' }} />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {strategicUrls.slice(0, 6).map(url => (
                <UrlCard key={url.id} url={url} />
              ))}
            </div>
          )}
          <div className="mt-4">
            <Link to="/strategic-urls" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              View all strategic URLs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Phase 2: Mass Production Queue */}
        <section id="queue">
          <SectionTitle number="03" title="Mass Production Queue" icon={Rocket} />
          <p className="text-sm text-muted-foreground mt-2 mb-4">
            Each queued niche generates 450+ programmatic city pages, deploys to Vercel, and hands off to the AGI swarm.
            Revenue is estimated from lead value × expected monthly leads.
          </p>
          {loading ? (
            <LoadingSpinner />
          ) : massQueue.length === 0 ? (
            <EmptyState icon={Rocket} title="No sites in production queue" desc="Add high-value niches to the mass production queue to begin generating city pages." cta={{ label: 'Open Mass Production', to: '/mass-production' }} />
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-accent border-b border-border">
                    <tr>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Niche</th>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Domain</th>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Status</th>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Priority</th>
                      <th className="text-right p-3 font-semibold text-muted-foreground">Cities</th>
                      <th className="text-right p-3 font-semibold text-muted-foreground">Est. Rev/mo</th>
                      <th className="text-center p-3 font-semibold text-muted-foreground">Swarm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {massQueue.map(item => (
                      <tr key={item.id} className="border-b border-border hover:bg-accent/50">
                        <td className="p-3 font-medium text-foreground">{item.niche}</td>
                        <td className="p-3 text-primary font-mono text-xs">{item.url_pattern}</td>
                        <td className="p-3"><StatusPill status={item.status} /></td>
                        <td className="p-3"><PriorityPill priority={item.priority} /></td>
                        <td className="p-3 text-right text-muted-foreground">{item.target_cities_count || 0}</td>
                        <td className="p-3 text-right font-semibold text-foreground">${(item.estimated_monthly_revenue || 0).toLocaleString()}</td>
                        <td className="p-3 text-center">
                          {item.autonomous_swarm_active ? (
                            <Bot className="w-4 h-4 text-green-500 mx-auto" />
                          ) : (
                            <Clock className="w-4 h-4 text-muted-foreground mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="mt-4">
            <Link to="/mass-production" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              Manage mass production queue <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Phase 3: Core Strategy */}
        <section id="strategy">
          <SectionTitle number="04" title="Core Strategy — Three Pillars" icon={Briefcase} />
          <p className="text-sm text-muted-foreground mt-2 mb-4">
            The proprietary technology foundation: CloudBrowser for autonomous scraping, HiddenPropertyIntel for
            owner/heir intelligence, and FaultLine for system auditing and gap detection.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {STRATEGY_PILLARS.map(pillar => (
              <Link
                key={pillar.name}
                to={pillar.link}
                className="group bg-card rounded-xl border border-border p-6 hover:border-primary transition-all"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <pillar.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-1">{pillar.name}</h3>
                <p className="text-sm text-muted-foreground">{pillar.desc}</p>
                <div className="mt-3 flex items-center gap-1 text-sm text-primary font-medium">
                  Explore <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4">
            <Link to="/core-strategy" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              View full core strategy briefing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Phase 4: AGI Swarm */}
        <section id="swarm">
          <SectionTitle number="05" title="AGI Swarm Command" icon={Bot} />
          <p className="text-sm text-muted-foreground mt-2 mb-4">
            Six specialist agents manage every live site 24/7 — monitoring rankings, fixing errors, healing pages,
            hardening security, optimizing content, and evolving the system toward 100%.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {SWARM_AGENTS.map(agent => (
              <div key={agent.name} className="bg-card border border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                  <agent.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-semibold text-foreground text-sm">{agent.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{agent.role}</p>
                <div className="mt-2 flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link to="/agi-swarm" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              Open full swarm command center <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Phase 5: Live Activity */}
        <section id="monitor">
          <SectionTitle number="06" title="Live Swarm Activity" icon={Activity} />
          <p className="text-sm text-muted-foreground mt-2 mb-4">
            Real-time telemetry from autonomous workflows. The swarm never sleeps — every loop runs on a schedule
            and reports back here.
          </p>
          <div className="bg-card rounded-xl border border-border p-6">
            {loading ? (
              <LoadingSpinner />
            ) : telemetry.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No telemetry yet. Swarm workflows will populate this as they execute on schedule.
              </p>
            ) : (
              <div className="space-y-2">
                {telemetry.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm border-b border-border pb-2 last:border-0">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="font-medium text-foreground">{t.function_name || t.run_id || 'Loop'}</span>
                    <span className="text-muted-foreground">{t.status || 'completed'}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {t.created_date ? new Date(t.created_date).toLocaleString() : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <SectionTitle number="07" title="Quick Actions" icon={Zap} />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickAction to="/strategic-urls" icon={Search} label="Discover URLs" desc="Find high-value domains" />
            <QuickAction to="/mass-production" icon={Rocket} label="Queue Sites" desc="Add niches to production" />
            <QuickAction to="/agi-swarm" icon={Bot} label="Swarm Control" desc="Manage autonomous agents" />
            <QuickAction to="/core-strategy" icon={Briefcase} label="Core Strategy" desc="View technology pillars" />
          </div>
        </section>
      </div>
    </div>
  );
}

// --- Components ---

function KpiCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/10">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-yellow-400" />
        <span className="text-xs text-gray-400 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function SectionTitle({ number, title, icon: Icon }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-3xl font-bold text-primary/30 font-mono">{number}</span>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-primary" />}
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
    </div>
  );
}

function UrlCard({ url }) {
  const score = url.seo_score || 0;
  return (
    <div className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0">
          <p className="font-mono text-sm text-primary truncate">{url.url}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{url.niche}</p>
        </div>
        <StatusPill status={url.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
        <Metric label="Site Value" value={`$${(url.estimated_site_value || 0).toLocaleString()}`} />
        <Metric label="Monthly Rev" value={`$${(url.estimated_monthly_revenue || 0).toLocaleString()}`} />
        <Metric label="Lead Value" value={`$${url.estimated_lead_value || 0}`} />
        <Metric label="Pages" value={url.landing_pages_generated || 0} />
      </div>
      {url.rationale && (
        <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{url.rationale}</p>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}

function StatusPill({ status }) {
  const colors = {
    discovered: 'bg-gray-100 text-gray-600',
    evaluated: 'bg-blue-100 text-blue-700',
    generating: 'bg-yellow-100 text-yellow-700',
    live: 'bg-green-100 text-green-700',
    for_sale: 'bg-purple-100 text-purple-700',
    sold: 'bg-indigo-100 text-indigo-700',
    queued: 'bg-gray-100 text-gray-600',
    deploying: 'bg-blue-100 text-blue-700',
    monitoring: 'bg-indigo-100 text-indigo-700',
    optimizing: 'bg-purple-100 text-purple-700',
    paused: 'bg-red-100 text-red-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status] || colors.queued}`}>{status || 'queued'}</span>;
}

function PriorityPill({ priority }) {
  const colors = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-blue-100 text-blue-700',
    low: 'bg-gray-100 text-gray-500',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colors[priority] || colors.medium}`}>{priority}</span>;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, cta }) {
  return (
    <div className="bg-card rounded-xl border border-border p-12 text-center">
      <Icon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
      <p className="font-medium text-foreground mb-1">{title}</p>
      <p className="text-sm text-muted-foreground mb-4">{desc}</p>
      {cta && (
        <Link to={cta.to} className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2 rounded-lg hover:opacity-90 text-sm">
          {cta.label} <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, desc }) {
  return (
    <Link to={to} className="group bg-card rounded-xl border border-border p-5 hover:border-primary transition-all">
      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary/20">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <p className="font-bold text-foreground text-sm">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </Link>
  );
}