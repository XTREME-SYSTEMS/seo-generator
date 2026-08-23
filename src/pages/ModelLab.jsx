import React from 'react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import Provenance from '@/components/kit/Provenance';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useTenantData, useGlobalData } from '@/lib/useTenantData';

export const CHAMPION_NAME = 'Two-Gate Retrieval to Re-Ranking Causal Survival Router';
export const CHAMPION_STATUS = 'CANDIDATE_CHAMPION';

export default function ModelLab() {
  const { rows: predictions, loading } = useTenantData('Prediction');
  const { rows: agents } = useGlobalData('Agent');

  return (
    <div>
      <PageHeader eyebrow="Model Lab" title="Model router + champions"
        description="The two-gate router is the candidate champion. Model routing produces receipts; protected actions (model promotion, production deploy) pass through the explicit protected-action gate." />
      <Panel title="Champion" subtitle={CHAMPION_STATUS}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">{CHAMPION_NAME}</span>
          <StatusPill tone="info">{CHAMPION_STATUS}</StatusPill>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Gate 1: retrieval eligibility + reranking competitiveness. Gate 2: SERP resistance + dominant deficit.
          A query only routes to FastPath when both gates pass; otherwise it holds or routes to experiment.
        </p>
      </Panel>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Predictions" subtitle="Locked, immutable">
          {loading ? <Loading /> : predictions.length === 0 ? <EmptyState title="No predictions" /> : (
            <ul className="space-y-3">
              {predictions.map((p) => (
                <li key={p.id} className="rounded border border-border/70 p-3">
                  <div className="flex items-center justify-between"><span className="truncate text-xs text-foreground">{p.query}</span><StatusPill tone={p.resolution === 'confirmed' ? 'good' : 'idle'}>{p.resolution}</StatusPill></div>
                  <div className="mt-1.5 flex items-center gap-2 font-mono text-[10px] text-muted-foreground"><span>rank {p.predicted_rank ?? '—'}</span><span>·</span><span>{p.model}</span>{p.immutable && <Provenance value="MEASURED" />}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Agent disciplines" subtitle="Model routing owners">
          {agents.length === 0 ? <EmptyState title="No agents" /> : (
            <ul className="space-y-2">
              {agents.filter((a) => a.discipline === 'measurement' || a.discipline === 'ai_search').map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded border border-border/60 px-3 py-2">
                  <span className="truncate text-xs text-foreground">{a.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{a.discipline}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}