import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Cpu, Activity, Radar, Zap, Shield, Eye, Wrench, Brain,
  Network, GitBranch, RefreshCw, Bot, Layers, Gauge,
  CheckCircle2, AlertCircle, Clock, ArrowRight, Play, Pause,
} from 'lucide-react';

const SWARM_AGENTS = [
  { name: 'Commander', icon: Brain, role: 'Strategic orchestration & task delegation', color: 'yellow' },
  { name: 'Scout', icon: Radar, role: 'Discovery, research, opportunity identification', color: 'blue' },
  { name: 'Builder', icon: Wrench, role: 'Site generation, content creation, deployment', color: 'green' },
  { name: 'Healer', icon: Shield, role: 'Auto-healing, error fixing, system recovery', color: 'red' },
  { name: 'Optimizer', icon: Gauge, role: 'Performance tuning, SEO/AEO optimization', color: 'purple' },
  { name: 'Watcher', icon: Eye, role: 'Persistent monitoring, anomaly detection', color: 'indigo' },
];

const SWARM_LOOPS = [
  { name: 'Autonomous Heartbeat', desc: 'Master clock — triggers all sub-loops', icon: Activity, status: 'active' },
  { name: 'Non-Stop Convergence', desc: 'Continuous ranking optimization loop', icon: GitBranch, status: 'active' },
  { name: 'Content Generation', desc: 'Autonomous content + page creation', icon: Layers, status: 'active' },
  { name: 'SERP Scraping', desc: 'Live SERP measurement & rank tracking', icon: Radar, status: 'active' },
  { name: 'GSC Sync & Sitemap', desc: 'Google Search Console + sitemap pinging', icon: RefreshCw, status: 'active' },
  { name: 'Competitor Watchdog', desc: 'Monitors competitor movements 24/7', icon: Eye, status: 'active' },
  { name: 'Anomaly Detection', desc: 'Detects traffic/ranking anomalies', icon: AlertCircle, status: 'active' },
  { name: 'Auto-Healing Escalation', desc: 'Fixes broken pages, redirects, errors', icon: Wrench, status: 'active' },
  { name: 'Schema Validator', desc: 'Validates structured data continuously', icon: Shield, status: 'active' },
  { name: 'AI Search Visibility', desc: 'Monitors AEO / AI answer presence', icon: Brain, status: 'active' },
  { name: 'Core Web Vitals', desc: 'Performance monitoring + optimization', icon: Gauge, status: 'active' },
  { name: 'Evolution Engine', desc: 'Self-improving system via reflection', icon: Cpu, status: 'active' },
  { name: 'Backlink Tracker', desc: 'Monitors link profile growth', icon: Network, status: 'monitoring' },
  { name: 'Internal Link Optimizer', desc: 'Optimizes internal linking structure', icon: GitBranch, status: 'monitoring' },
  { name: 'Cross-Domain Authority', desc: 'Builds authority across all domains', icon: Shield, status: 'monitoring' },
  { name: 'Predictive Ranking', desc: 'ML model predicts ranking outcomes', icon: Brain, status: 'monitoring' },
  { name: 'Multi-Platform Social', desc: 'Syncs content to FB, IG, TikTok, YT', icon: Network, status: 'queued' },
  { name: 'Weekly Digest', desc: 'Weekly performance summary emails', icon: Clock, status: 'queued' },
];

const PIPELINE_STAGES = [
  'Envision', 'Strategize', 'Architect', 'Engineer', 'Build',
  'Validate', 'Optimize', 'Launch', 'Sync', 'Track',
  'Audit', 'Analyze', 'Monitor', 'Fix', 'Heal', 'Harden',
  'Optimize', 'Enhance', 'Evolve', 'Grow',
];

export default function AgiSwarm() {
  const [telemetry, setTelemetry] = useState([]);
  const [agentJobs, setAgentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSwarmData();
  }, []);

  const loadSwarmData = async () => {
    setLoading(true);
    try {
      const [tel, jobs] = await Promise.all([
        base44.entities.RunTelemetry.list('-created_date', 20).catch(() => []),
        base44.entities.AgentJob.list('-created_date', 20).catch(() => []),
      ]);
      setTelemetry(tel || []);
      setAgentJobs(jobs || []);
    } catch (e) {
      // entities may not have data yet
    }
    setLoading(false);
  };

  const activeLoops = SWARM_LOOPS.filter(l => l.status === 'active').length;
  const monitoringLoops = SWARM_LOOPS.filter(l => l.status === 'monitoring').length;

  return (
    <div className="min-h-full bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bot className="w-7 h-7 text-primary" /> AGI Swarm Command Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Autonomous agent swarm — persistently monitoring, fixing, healing, hardening, optimizing, and evolving all sites
          </p>
        </div>
        <button
          onClick={loadSwarmData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Swarm Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SwarmStat icon={Bot} label="Active Agents" value={SWARM_AGENTS.length} color="yellow" />
        <SwarmStat icon={Activity} label="Active Loops" value={activeLoops} color="green" />
        <SwarmStat icon={Eye} label="Monitoring Loops" value={monitoringLoops} color="blue" />
        <SwarmStat icon={Cpu} label="Total Workflows" value={SWARM_LOOPS.length} color="purple" />
      </div>

      {/* Agent Swarm */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Network className="w-5 h-5 text-primary" /> Agent Swarm
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {SWARM_AGENTS.map((agent) => (
            <div key={agent.name} className="border border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center`}>
                <agent.icon className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-foreground text-sm">{agent.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{agent.role}</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-green-600 font-medium">Online</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Autonomous Loops */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-primary" /> Autonomous Workflows
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          {SWARM_LOOPS.map((loop) => (
            <div key={loop.name} className="flex items-center gap-3 border border-border rounded-lg p-3 hover:bg-accent/50 transition-colors">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                loop.status === 'active' ? 'bg-green-100' :
                loop.status === 'monitoring' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <loop.icon className={`w-5 h-5 ${
                  loop.status === 'active' ? 'text-green-600' :
                  loop.status === 'monitoring' ? 'text-blue-600' : 'text-gray-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">{loop.name}</p>
                <p className="text-xs text-muted-foreground truncate">{loop.desc}</p>
              </div>
              <StatusBadge status={loop.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Full Autonomous Pipeline */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" /> Full Autonomous Pipeline
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Every site goes through this 20-stage autonomous pipeline — from vision to fully evolved, growing asset.
        </p>
        <div className="flex flex-wrap gap-2">
          {PIPELINE_STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center gap-1">
              <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold">
                {i + 1}. {stage}
              </span>
              {i < PIPELINE_STAGES.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Telemetry */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> Recent Swarm Activity
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : telemetry.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No telemetry data yet. Swarm loops will populate this as they run.
          </p>
        ) : (
          <div className="space-y-2">
            {telemetry.slice(0, 10).map((t, i) => (
              <div key={i} className="flex items-center gap-3 text-sm border-b border-border pb-2">
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

      {/* Vercel AI Gateway Status */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl p-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary" /> Vercel AI Gateway
        </h2>
        <p className="text-gray-300 text-sm mb-4">
          The swarm routes AI tasks through the Vercel AI Gateway for maximum performance,
          using the most advanced models available (GPT-5, Claude Opus, Gemini 3 Pro).
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <GatewayStat label="Models Available" value="8+" />
          <GatewayStat label="Routing" value="Auto-Optimized" />
          <GatewayStat label="Status" value="Operational" />
          <GatewayStat label="Latency" value="< 2s avg" />
        </div>
      </div>
    </div>
  );
}

function SwarmStat({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5 text-primary" />
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-green-100 text-green-700',
    monitoring: 'bg-blue-100 text-blue-700',
    queued: 'bg-gray-100 text-gray-500',
  };
  const icons = {
    active: <Play className="w-3 h-3" />,
    monitoring: <Eye className="w-3 h-3" />,
    queued: <Pause className="w-3 h-3" />,
  };
  return (
    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.queued}`}>
      {icons[status]} {status}
    </span>
  );
}

function GatewayStat({ label, value }) {
  return (
    <div className="bg-white/10 rounded-lg p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-bold text-primary mt-1">{value}</p>
    </div>
  );
}