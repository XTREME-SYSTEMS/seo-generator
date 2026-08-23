import React from 'react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatCard from '@/components/kit/StatCard';
import Provenance from '@/components/kit/Provenance';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useTenant } from '@/lib/TenantContext';
import { useTenantData } from '@/lib/useTenantData';
import { money } from '@/lib/format';

export default function Financial() {
  const { client } = useTenant();
  const { rows: replacements, loading } = useTenantData('ReplacementOpportunity');
  const spend = client?.monthly_paid_spend ?? null;
  const spendProvenance = client?.spend_provenance ?? 'UNKNOWN';
  const modeledReplacement = replacements.reduce((s, r) => s + (r.replacement_value || 0), 0);
  const replacementReady = replacements.filter((r) => r.proof_level >= 5).reduce((s, r) => s + (r.replacement_value || 0), 0);
  const confirmedDisplaced = replacements.filter((r) => r.confirmed_displaced).reduce((s, r) => s + (r.replacement_value || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Financial Intelligence"
        title="CAC · CPA · ROAS · replacement economics"
        description="Financial figures carry provenance. Spend is INFERRED (operator estimate) until Google Ads verifies it; revenue is UNKNOWN until GA4/CRM attribution is authorized."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Monthly paid spend" value={spend ? money(spend) : null} provenance={spendProvenance} hint={client?.name} />
        <StatCard label="Paid revenue" value={null} provenance="UNKNOWN" hint="GA4/CRM required" />
        <StatCard label="Organic revenue" value={null} provenance="UNKNOWN" hint="attribution required" />
        <StatCard label="Modeled replacement value" value={modeledReplacement ? money(modeledReplacement) : null} provenance="MODELED" hint="annualized ×12" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <StatCard label="Replacement-ready (proof ≥5)" value={replacementReady ? money(replacementReady) : null} provenance={replacementReady ? 'MEASURED' : 'MODELED'} />
        <StatCard label="Confirmed displaced (proof =7)" value={confirmedDisplaced ? money(confirmedDisplaced) : null} provenance={confirmedDisplaced ? 'MEASURED' : 'UNKNOWN'} />
        <StatCard label="Annualized modeled" value={modeledReplacement ? money(modeledReplacement * 12) : null} provenance="MODELED" />
      </div>
      <Panel className="mt-4" title="Replacement clusters" subtitle="Per-cluster economics">
        {loading ? (
          <Loading />
        ) : replacements.length === 0 ? (
          <EmptyState title="No clusters" />
        ) : (
          <ul className="space-y-3">
            {replacements.map((r) => (
              <li key={r.id} className="rounded border border-border/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-foreground">{r.cluster}</span>
                  <Provenance value={r.confirmed_displaced ? 'MEASURED' : 'MODELED'} />
                </div>
                <div className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                  p(replace) {((r.replacement_probability || 0) * 100).toFixed(0)}% · ~{r.time_to_replacement_days}d · value {money(r.replacement_value)}
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