import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Zap, Activity, Bot, RefreshCw, Play, Pause, CheckCircle2, AlertCircle, Cpu, Globe, Server, Shield } from 'lucide-react';

const SWARM_AGENTS = [
  { name: 'Alpha Prime', role: 'Master orchestrator — mandatory operational control', icon: Cpu, status: 'online' },
  { name: 'Commander', role: 'Strategic orchestration & task delegation', icon: Zap, status: 'online' },
  { name: 'Scout', role: 'Discovery, research, opportunity identification', icon: Globe, status: 'online' },
  { name: 'Builder', role: 'Site generation, content creation, deployment', icon: Server, status: 'online' },
  { name: 'Healer', role: 'Auto-healing, error fixing, system recovery', icon: Shield, status: 'online' },
  { name: 'Optimizer', role: 'Performance tuning, SEO/AEO optimization', icon: Activity, status: 'online' },
  { name: 'Watcher', role: 'Persistent monitoring, anomaly detection', icon: Bot, status: 'online' },
];

const AUTO_LOOPS = [
  { name: 'Analyze', fn: 'RunBenchmarkConstitution', desc: 'Full system benchmark audit', cadence: 'daily' },
  { name: 'Fix', fn: 'FixEngine', desc: 'Auto-fix detected issues', cadence: 'hourly' },
  { name: 'Heal', fn: 'AutoHealingEscalation', desc: 'Heal broken pages & redirects', cadence: 'hourly' },
  { name: 'Harden', fn: 'SecurityScan', desc: 'Security hardening scan', cadence: 'daily' },
  { name: 'Optimize', fn: 'InternalLinkOptimizer', desc: 'Optimize internal linking & SEO', cadence: 'daily' },
  { name: 'Sync', fn: 'SyncSearchConsole', desc: 'Sync GSC + sitemap data', cadence: 'hourly' },
];

export default function AlphaPrime() {
  const [jobs, setJobs] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [j, r] = await Promise.all([
        base44.entities.AgentJob.list('-created_date', 20).catch(() => []),
        base44.entities.Receipt.list('-created_date', 20).catch(() => []),
      ]);
      setJobs(j || []);
      setReceipts(r || []);
    } catch (e) { setToast({ type: 'error', msg: e.message }); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 30000); return () => clearInterval(iv); }, [load]);

  const runLoop = async (fn, label) => {
    setRunning(fn);
    try {
      await base44.functions.invoke(fn, {});
      setToast({ type: 'success', msg: `${label} loop triggered` });
      load();
    } catch (e) { setToast({ type: 'error', msg: `${label} failed: ${e.message}` }); }
    setRunning(null);
  };

  const onlineCount = SWARM_AGENTS.filter(a => a.status === 'online').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const failedJobs = jobs.filter(j => j.status === 'failed').length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold text-foreground">Alpha Prime — Autonomous Operations</h1>
              <p className="text-xs text-muted-foreground">The mandatory operational system that runs this platform every second of every day</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> {onlineCount} Agents Online
            </span>
            <button onClick={load} className="text-xs px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary/30 flex items-center gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Swarm Agents" value={`${onlineCount}/${SWARM_AGENTS.length}`} icon={Bot} highlight />
          <StatCard label="Jobs Completed" value={completedJobs} icon={CheckCircle2} />
          <StatCard label="Jobs Failed" value={failedJobs} icon={AlertCircle} warn={failedJobs > 0} />
          <StatCard label="Auto-Loops" value={AUTO_LOOPS.length} icon={Activity} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" /> Swarm Agents
            </h3>
            <div className="space-y-2">
              {SWARM_AGENTS.map(a => (
                <div key={a.name} className="flex items-center gap-3 rounded-md border border-border p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><a.icon className="w-4 h-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-foreground">{a.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{a.role}</div>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-medium text-green-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Auto-Heal / Fix / Optimize / Harden Loop
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Mandatory daily autonomous loop — runs every day on schedule. Trigger manually below.</p>
            <div className="space-y-2">
              {AUTO_LOOPS.map(l => (
                <div key={l.fn} className="flex items-center gap-3 rounded-md border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-foreground">{l.name}</div>
                    <div className="text-[11px] text-muted-foreground">{l.desc} · {l.cadence}</div>
                  </div>
                  <button onClick={() => runLoop(l.fn, l.name)} disabled={running === l.fn} className="text-[10px] px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 disabled:opacity-50 flex items-center gap-1">
                    {running === l.fn ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Run
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Recent Agent Jobs</h3>
            {loading ? <p className="text-xs text-muted-foreground py-4">Loading...</p> : jobs.length === 0 ? <p className="text-xs text-muted-foreground py-4">No jobs yet.</p> : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {jobs.map(j => (
                  <div key={j.id} className="flex items-center gap-2 text-xs border-b border-border/50 py-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${j.status === 'completed' ? 'bg-green-500' : j.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <span className="font-mono text-[10px] text-muted-foreground">{j.kind}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{j.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Live Activity Feed</h3>
            {loading ? <p className="text-xs text-muted-foreground py-4">Loading...</p> : receipts.length === 0 ? <p className="text-xs text-muted-foreground py-4">No activity yet.</p> : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {receipts.map(r => (
                  <div key={r.id} className="flex items-center gap-2 text-xs border-b border-border/50 py-1.5">
                    <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                    <span className="text-foreground truncate">{r.summary || r.kind}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground shrink-0">{(r.created_date || '').slice(11, 16)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {toast && (
          <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg border text-sm z-50 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`} onClick={() => setToast(null)}>
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, highlight, warn }) {
  return (
    <div className={`bg-card border rounded-lg p-4 ${highlight ? 'border-green-200' : warn ? 'border-red-200' : 'border-border'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`w-4 h-4 ${highlight ? 'text-green-600' : warn ? 'text-red-600' : 'text-muted-foreground'}`} />
      </div>
      <p className={`text-2xl font-semibold tabular ${highlight ? 'text-green-600' : warn ? 'text-red-600' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}