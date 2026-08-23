import React from 'react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import Provenance from '@/components/kit/Provenance';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useTenantData } from '@/lib/useTenantData';

export default function Research() {
  const { rows: findings, loading } = useTenantData('ResearchFinding', {}, '-observed_at');

  return (
    <div>
      <PageHeader
        eyebrow="Research Lab"
        title="Research findings"
        description="Current evidence, challengers, drift and methods. Findings are scored for value, readiness, risk and competitive advantage, then routed to the Technology Radar as work packets."
      />
      <Panel title="Findings" subtitle={`${findings.length} records`}>
        {loading ? <Loading /> : findings.length === 0 ? <EmptyState title="No findings" /> : (
          <ul className="space-y-4">
            {findings.map((f) => (
              <li key={f.id} className="rounded border border-border/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium text-foreground">{f.topic}</span>
                  <Provenance value={f.provenance} />
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.finding}</p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[['Value', f.value_score, 'bg-emerald-500/70'], ['Readiness', f.readiness_score, 'bg-sky-500/70'], ['Risk', f.risk_score, 'bg-amber-500/70'], ['Advantage', f.competitive_advantage, 'bg-violet-500/70']].map(([label, score, color]) => (
                    <div key={label}>
                      <div className="font-mono text-[10px] uppercase text-muted-foreground">{label}</div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-muted"><div className={`h-full rounded-full ${color}`} style={{ width: `${(score || 0) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 font-mono text-[10px] text-muted-foreground/70">{f.source}</div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}