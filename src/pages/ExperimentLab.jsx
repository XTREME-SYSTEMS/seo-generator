import React from 'react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import Provenance from '@/components/kit/Provenance';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useTenantData } from '@/lib/useTenantData';

const TONE = { draft: 'idle', awaiting_approval: 'warn', running: 'good', reprocessing: 'info', concluded: 'info', abandoned: 'bad' };

export default function ExperimentLab() {
  const { rows, loading } = useTenantData('Experiment');
  const { rows: predictions } = useTenantData('Prediction');

  return (
    <div>
      <PageHeader eyebrow="Experiment Lab" title="Treatments and locked predictions"
        description="Each experiment declares whether it runs in simulation or reality, and its prediction is locked immutably before measurement so outcomes cannot be rewritten after the fact." />
      {loading ? <Loading /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            {rows.length === 0 ? <Panel><EmptyState title="No experiments" /></Panel> : rows.map((e) => (
              <Panel key={e.id} title={e.name} subtitle={e.method}
                right={<div className="flex items-center gap-2"><Provenance value={e.mode === 'reality' ? 'REALITY' : 'SIMULATION'} /><StatusPill tone={TONE[e.status]}>{(e.status || '').replace(/_/g, ' ')}</StatusPill></div>}>
                <p className="text-xs leading-relaxed text-muted-foreground">{e.hypothesis}</p>
                {e.treatment && <p className="mt-3 border-l border-primary/40 pl-3 text-xs text-foreground">{e.treatment}</p>}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {(e.target_queries || []).map((q) => <span key={q} className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{q}</span>)}
                </div>
                <div className="mt-4 flex items-center gap-2"><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Lift</span><Provenance value={e.lift_provenance} /></div>
              </Panel>
            ))}
          </div>
          <Panel title="Immutable predictions" subtitle="Locked before measurement">
            {predictions.length === 0 ? <EmptyState title="No predictions locked" /> : (
              <ul className="space-y-4">
                {predictions.map((p) => (
                  <li key={p.id} className="rounded border border-border/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><div className="truncate text-xs text-foreground">{p.query}</div><div className="mt-1 text-xs text-muted-foreground">{p.predicted_outcome}</div></div>
                      <StatusPill tone={p.resolution === 'confirmed' ? 'good' : p.resolution === 'missed' ? 'bad' : 'idle'}>{p.resolution}</StatusPill>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground">
                      <span>predicted rank {p.predicted_rank ?? '—'}</span><span>·</span><span>confidence {p.confidence ?? '—'}</span><span>·</span><span>{p.model}</span>
                      {p.immutable && <Provenance value="MEASURED" className="ml-1" />}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}