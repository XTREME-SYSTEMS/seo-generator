import React from 'react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import Provenance from '@/components/kit/Provenance';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useTenantData } from '@/lib/useTenantData';

const BENCHMARKS = [
  { name: 'Frase', strength: 'Closed research→create→optimize→publish→monitor→fix loop', parity: 'Loop pattern adopted; treatment proof + revenue centered', tone: 'info' },
  { name: 'OtterlyAI', strength: 'Query fan-out + multi-engine AI visibility/citation monitoring', parity: 'Equivalent source contracts; live provider unconfigured', tone: 'warn' },
  { name: 'SE Ranking', strength: 'Broad historical AI visibility/source/competitor data + API access', parity: 'Historical schemas + provider abstraction; stronger paid-displacement proof', tone: 'info' },
];

export default function CompetitiveParity() {
  const { rows: twins, loading } = useTenantData('CompetitorDigitalTwin');

  return (
    <div>
      <PageHeader
        eyebrow="Competitive Parity"
        title="Clean-room parity matrix"
        description="Benchmark parity codified from the V2 forensic audit. Parity is claimed only where source contracts match; live provider access gaps are labelled, not hidden."
      />
      <Panel title="Benchmark parity" subtitle="From FORENSIC_AUDIT_V2 clean-room verdict">
        <ul className="space-y-3">
          {BENCHMARKS.map((b) => (
            <li key={b.name} className="rounded border border-border/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{b.name}</span>
                <StatusPill tone={b.tone}>{b.tone === 'warn' ? 'parity gap' : 'parity'}</StatusPill>
              </div>
              <div className="mt-1.5 text-xs text-muted-foreground">{b.strength}</div>
              <div className="mt-1 text-xs text-foreground">{b.parity}</div>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel className="mt-4" title="Displacement scoring" subtitle="Per-competitor resistance vs displacement">
        {loading ? <Loading /> : twins.length === 0 ? <EmptyState title="No twins" /> : (
          <ul className="space-y-3">
            {twins.map((t) => (
              <li key={t.id} className="rounded border border-border/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm text-foreground">{t.competitor_name}</span>
                  <div className="flex items-center gap-2">
                    <Provenance value={t.measured_provenance} />
                    <Provenance value={t.inferred_provenance} />
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase text-muted-foreground">Resistance</div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-muted"><div className="h-full rounded-full bg-amber-500/70" style={{ width: `${(t.resistance_score || 0)}%` }} /></div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase text-muted-foreground">Displacement</div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${(t.displacement_score || 0)}%` }} /></div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}