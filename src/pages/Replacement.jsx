import React from 'react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatCard from '@/components/kit/StatCard';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useTenant } from '@/lib/TenantContext';
import { useTenantData } from '@/lib/useTenantData';
import { PROOF_LABELS, proofTone } from '@/lib/proof';
import { money } from '@/lib/format';

const TONE = { confirmed: 'good', strong: 'info', progress: 'warn', modeled: 'idle' };

export default function Replacement() {
  const { client } = useTenant();
  const { rows, loading } = useTenantData('ReplacementOpportunity');
  const spend = client?.monthly_paid_spend ?? null;
  const modeled = rows.reduce((s, r) => s + (r.replacement_value || 0), 0);
  const ready = rows.filter((r) => r.proof_level >= 5).reduce((s, r) => s + (r.replacement_value || 0), 0);
  const confirmed = rows.filter((r) => r.confirmed_displaced).reduce((s, r) => s + (r.replacement_value || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Spend Replacement"
        title="Paid-search replacement proof"
        description="The financial differentiator. Replacement is only confirmed at proof level 7 — a controlled budget reduction that held performance. Below level 5, value is modeled, not demonstrated."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Spend under analysis" value={spend ? money(spend) : null} provenance={client?.spend_provenance || 'UNKNOWN'} />
        <StatCard label="Modeled replacement" value={modeled ? money(modeled) : null} provenance="MODELED" />
        <StatCard label="Replacement-ready" value={ready ? money(ready) : null} provenance={ready ? 'MEASURED' : 'MODELED'} hint="proof ≥ 5" />
        <StatCard label="Confirmed displaced" value={confirmed ? money(confirmed) : null} provenance={confirmed ? 'MEASURED' : 'UNKNOWN'} hint="proof = 7" />
      </div>
      <Panel className="mt-4" title="Proof ladder" subtitle="0 = modeled · 7 = confirmed replacement">
        <ol className="space-y-2">
          {Object.entries(PROOF_LABELS).map(([lvl, label]) => (
            <li key={lvl} className="flex items-center gap-3 rounded border border-border/60 px-3 py-2">
              <span className="font-mono text-xs text-primary">L{lvl}</span>
              <span className="text-sm text-foreground">{label}</span>
              <span className={`ml-auto rounded border px-2 py-0.5 text-[11px] ${TONE[proofTone(Number(lvl))] === 'good' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : TONE[proofTone(Number(lvl))] === 'info' ? 'border-sky-500/30 bg-sky-500/10 text-sky-300' : TONE[proofTone(Number(lvl))] === 'warn' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400'}`}>
                {proofTone(Number(lvl))}
              </span>
            </li>
          ))}
        </ol>
      </Panel>
      <Panel className="mt-4" title="Clusters">
        {loading ? <Loading /> : rows.length === 0 ? <EmptyState title="No clusters" /> : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.id} className="rounded border border-border/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm text-foreground">{r.cluster}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">L{r.proof_level}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{r.recommended_action}</div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}