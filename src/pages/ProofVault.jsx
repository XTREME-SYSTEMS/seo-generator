import React from 'react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import Provenance from '@/components/kit/Provenance';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useTenantData } from '@/lib/useTenantData';

export default function ProofVault() {
  const { rows: receipts, loading: lr } = useTenantData('Receipt', {}, '-occurred_at');
  const { rows: predictions, loading: lp } = useTenantData('Prediction');
  const { rows: evidence, loading: le } = useTenantData('RankingEvidence');

  return (
    <div>
      <PageHeader
        eyebrow="Proof Vault"
        title="Immutable evidence trail"
        description="Every measurement, gate decision, approval and validation produces a receipt. Predictions are locked before measurement and never rewritten. This is the audit spine."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Receipts" subtitle="Append-only evidence">
          {lr ? <Loading /> : receipts.length === 0 ? <EmptyState title="No receipts" /> : (
            <ul className="space-y-3">
              {receipts.map((r) => (
                <li key={r.id} className="border-l-2 border-primary/40 pl-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{r.kind}</span>
                    <Provenance value={r.provenance} />
                  </div>
                  <div className="mt-1 text-sm text-foreground">{r.summary}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{r.detail}</div>
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground/70">{r.source} · {r.hash}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <div className="space-y-4">
          <Panel title="Locked predictions" subtitle="Immutable after lock">
            {lp ? <Loading /> : predictions.length === 0 ? <EmptyState title="No predictions" /> : (
              <ul className="space-y-3">
                {predictions.map((p) => (
                  <li key={p.id} className="rounded border border-border/70 p-3">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm text-foreground">{p.query}</span>
                      <StatusPill tone={p.resolution === 'confirmed' ? 'good' : p.resolution === 'missed' ? 'bad' : 'idle'}>{p.resolution}</StatusPill>
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-muted-foreground">predicted rank {p.predicted_rank ?? '—'} · {p.model}</div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Ranking evidence" subtitle="Per-query proof records">
            {le ? <Loading /> : evidence.length === 0 ? <EmptyState title="No evidence records" /> : (
              <ul className="space-y-3">
                {evidence.map((e) => (
                  <li key={e.id} className="rounded border border-border/70 p-3">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm text-foreground">{e.query}</span>
                      <span className="font-mono text-[11px] text-primary">L{e.proof_level}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Provenance value={e.provenance} />
                      <span className="text-xs text-muted-foreground">{e.evidence_type}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}