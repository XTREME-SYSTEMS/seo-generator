import React, { useState, useMemo } from 'react';
import { Zap, Loader2, Plus, Clock, ShieldAlert, ExternalLink, Flame, TrendingUp, Layers } from 'lucide-react';
import PageHeader from '@/components/kit/PageHeader';
import StatusPill from '@/components/kit/StatusPill';
import EmptyState from '@/components/kit/EmptyState';
import Loading from '@/components/kit/Loading';
import { useGlobalData } from '@/lib/useTenantData';
import { useTenant } from '@/lib/TenantContext';
import OnboardingWizard from '@/components/seo/OnboardingWizard';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SPEED_TONE = { instant: 'good', fast: 'good', medium: 'info', slow: 'idle' };
const RISK_TONE = { safe: 'good', moderate: 'info', aggressive: 'warn', black_hat: 'bad' };

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-lg border border-border bg-card hairline p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 font-heading text-2xl font-semibold text-foreground tabular">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export default function SEOGenerator() {
  const { rows, loading, reload } = useGlobalData('RankingMethod', '-discovered_at');
  const { clients, setClientId, loading: tenantLoading } = useTenant();
  const [running, setRunning] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selected, setSelected] = useState(null);

  const stats = useMemo(() => {
    const categories = new Set(rows.map((r) => r.category).filter(Boolean));
    const fast = rows.filter((r) => r.speed_tier === 'instant' || r.speed_tier === 'fast').length;
    const lastRun = rows[0]?.discovered_at;
    return { total: rows.length, categories: categories.size, fast, lastRun };
  }, [rows]);

  if (tenantLoading) return <Loading label="Loading" />;
  if (clients.length === 0 || showOnboarding) {
    return (
      <OnboardingWizard
        onDone={(res) => {
          setClientId(res.client_id);
          setShowOnboarding(false);
          reload();
          base44.functions.invoke('GenerateRankingMethods', { industry: res.industry }).catch(() => {});
          base44.functions.invoke('SprintPlanner', { client_id: res.client_id }).then(() => reload()).catch(() => {});
        }}
      />
    );
  }

  async function runGenerator() {
    setRunning(true);
    try {
      await base44.functions.invoke('GenerateRankingMethods', { industry: 'any' });
      reload();
    } catch {
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Autonomous SEO Engine"
        title="SEO Generator"
        description="Mines the live web every 6 hours for the fastest ranking methods. Runs autonomously in the background."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setShowOnboarding(true)} className="inline-flex items-center gap-2 rounded border border-border px-3.5 py-2 text-xs font-medium text-foreground transition hover:bg-accent">
              <Plus className="h-3.5 w-3.5" /> New project
            </button>
            <button onClick={runGenerator} disabled={running} className="inline-flex items-center gap-2 rounded bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              {running ? 'Researching…' : 'Run now'}
            </button>
          </div>
        }
      />

      <div className="mb-5 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <span className="text-xs font-medium text-foreground">Engine running</span>
        <span className="text-xs text-muted-foreground">· autonomous · next scan in 6h cycle</span>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Zap} label="Methods discovered" value={stats.total} />
        <StatCard icon={Layers} label="Categories" value={stats.categories} />
        <StatCard icon={TrendingUp} label="Instant / fast" value={stats.fast} sub="high-velocity methods" />
        <StatCard icon={Clock} label="Last discovery" value={stats.lastRun ? new Date(stats.lastRun).toLocaleDateString() : '—'} />
      </div>

      {loading ? <Loading label="Loading methods" /> : rows.length === 0 ? (
        <EmptyState icon={Zap} title="No methods yet" description="The engine runs every 6 hours. Click Run now to start immediately." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card hairline">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr className="text-left">
                <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Method</th>
                <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Category</th>
                <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Speed</th>
                <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Risk</th>
                <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((m) => (
                <tr key={m.id} onClick={() => setSelected(m)} className="cursor-pointer transition hover:bg-accent/50">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{m.name}</td>
                  <td className="px-4 py-3"><StatusPill tone="info">{m.category}</StatusPill></td>
                  <td className="px-4 py-3"><StatusPill tone={SPEED_TONE[m.speed_tier]}>{m.speed_tier}</StatusPill></td>
                  <td className="px-4 py-3"><StatusPill tone={RISK_TONE[m.risk_level]}>{m.risk_level}</StatusPill></td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">L{m.proof_level ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                <StatusPill tone={SPEED_TONE[selected.speed_tier]}><Clock className="mr-1 h-2.5 w-2.5" />{selected.speed_tier}</StatusPill>
                <StatusPill tone="info">{selected.category}</StatusPill>
                <StatusPill tone={RISK_TONE[selected.risk_level]}><ShieldAlert className="mr-1 h-2.5 w-2.5" />{selected.risk_level}</StatusPill>
              </div>
              {selected.mechanism && (
                <div>
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Mechanism</p>
                  <p className="text-sm leading-relaxed text-foreground/90">{selected.mechanism}</p>
                </div>
              )}
              {selected.implementation_steps?.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Implementation</p>
                  <ol className="space-y-1.5">
                    {selected.implementation_steps.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-foreground/90"><span className="font-mono text-[10px] text-primary">{String(i + 1).padStart(2, '0')}</span><span className="leading-relaxed">{s}</span></li>
                    ))}
                  </ol>
                </div>
              )}
              {selected.expected_impact && (
                <div className="flex items-start gap-1.5"><Flame className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /><p className="text-sm text-foreground/90">{selected.expected_impact}</p></div>
              )}
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="font-mono text-[10px] text-muted-foreground">Source: {selected.source} · Proof level {selected.proof_level ?? 0}</span>
                {selected.source_url && <a href={selected.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">Open source <ExternalLink className="h-3 w-3" /></a>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}