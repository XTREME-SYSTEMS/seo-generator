import React, { useState, useMemo } from 'react';
import { Zap, Loader2, Filter, ExternalLink, Flame, Clock, ShieldAlert } from 'lucide-react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Provenance from '@/components/kit/Provenance';
import EmptyState from '@/components/kit/EmptyState';
import Loading from '@/components/kit/Loading';
import { useGlobalData } from '@/lib/useTenantData';
import { base44 } from '@/api/base44Client';

const SPEED_TONE = { instant: 'good', fast: 'good', medium: 'info', slow: 'idle' };
const RISK_TONE = { safe: 'good', moderate: 'info', aggressive: 'warn', black_hat: 'bad' };
const CATEGORIES = ['technical', 'content', 'authority', 'ai_search', 'local', 'programmatic', 'ux', 'link_building', 'brand', 'social', 'measurement'];

export default function SEOGenerator() {
  const { rows, loading, reload } = useGlobalData('RankingMethod', '-discovered_at');
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [filterCat, setFilterCat] = useState('all');
  const [filterSpeed, setFilterSpeed] = useState('all');

  const filtered = useMemo(() => rows.filter((m) =>
    (filterCat === 'all' || m.category === filterCat) &&
    (filterSpeed === 'all' || m.speed_tier === filterSpeed)
  ), [rows, filterCat, filterSpeed]);

  async function runGenerator() {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await base44.functions.invoke('GenerateRankingMethods', { industry: 'any' });
      setRunResult(res.data);
      reload();
    } catch (e) {
      setRunResult({ error: e.message });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Autonomous SEO Generator"
        title="Fastest SEO method discovery engine"
        description="A background generator that persistently mines the live web — Google's blog, the leaked NavBoost docs, Reddit, LinkedIn, X, and YouTube — for the absolute fastest ranking methods, tricks, and hacks for any business or industry. It runs autonomously every 6 hours and stores every novel discovery here."
        actions={
          <button
            onClick={runGenerator}
            disabled={running}
            className="inline-flex items-center gap-2 rounded bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            {running ? 'Researching live web…' : 'Run generator now'}
          </button>
        }
      />

      {runResult && (
        <div className={`mb-4 rounded border px-4 py-3 text-xs ${runResult.error ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-primary/40 bg-primary/10 text-foreground'}`}>
          {runResult.error ? `Error: ${runResult.error}` : `Run ${runResult.run_id} complete — ${runResult.created} new method${runResult.created === 1 ? '' : 's'} discovered and stored.`}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-muted-foreground"><Filter className="h-3.5 w-3.5" /><span className="font-mono text-[10px] uppercase tracking-wider">Filters</span></div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded border border-input bg-background px-2 py-1 text-xs">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterSpeed} onChange={(e) => setFilterSpeed(e.target.value)} className="rounded border border-input bg-background px-2 py-1 text-xs">
          <option value="all">All speeds</option>
          <option value="instant">Instant</option>
          <option value="fast">Fast</option>
          <option value="medium">Medium</option>
          <option value="slow">Slow</option>
        </select>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">{filtered.length} methods</span>
      </div>

      {loading ? <Loading label="Loading discovered methods" /> : filtered.length === 0 ? (
        <EmptyState icon={Zap} title="No methods yet" description="Run the generator to mine the live web for the fastest SEO ranking methods." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((m) => (
            <Panel key={m.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-foreground">{m.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <StatusPill tone={SPEED_TONE[m.speed_tier]}><Clock className="mr-1 h-2.5 w-2.5" />{m.speed_tier}</StatusPill>
                    <StatusPill tone="info">{m.category}</StatusPill>
                    <StatusPill tone={RISK_TONE[m.risk_level]}><ShieldAlert className="mr-1 h-2.5 w-2.5" />{m.risk_level}</StatusPill>
                  </div>
                </div>
              </div>
              {m.mechanism && (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground"><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">Mechanism </span>{m.mechanism}</p>
              )}
              {m.implementation_steps && m.implementation_steps.length > 0 && (
                <ol className="mt-3 space-y-1.5">
                  {m.implementation_steps.map((s, i) => (
                    <li key={i} className="flex gap-2 text-xs text-foreground/90"><span className="font-mono text-[10px] text-primary">{String(i + 1).padStart(2, '0')}</span><span className="leading-relaxed">{s}</span></li>
                  ))}
                </ol>
              )}
              {m.expected_impact && <p className="mt-3 text-xs text-muted-foreground"><Flame className="mr-1 inline h-3 w-3 text-primary" />{m.expected_impact}</p>}
              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5">
                <div className="flex items-center gap-2"><Provenance value={m.provenance || 'INFERRED'} /><span className="font-mono text-[10px] text-muted-foreground">{m.source}</span></div>
                {m.source_url && <a href={m.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">source <ExternalLink className="h-2.5 w-2.5" /></a>}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}