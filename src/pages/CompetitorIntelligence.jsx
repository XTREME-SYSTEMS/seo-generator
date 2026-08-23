import React from 'react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import Provenance from '@/components/kit/Provenance';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useTenantData } from '@/lib/useTenantData';

export default function CompetitorIntelligence() {
  const { rows: competitors, loading } = useTenantData('Competitor');
  const { rows: twins } = useTenantData('CompetitorDigitalTwin');

  return (
    <div>
      <PageHeader
        eyebrow="Competitor Intelligence"
        title="Competitor digital twins"
        description="Competitor signals come from public-source intelligence via CloudBrowser. Until a live crawl runs, twins are INFERRED — never presented as measured wins or losses."
      />
      <Panel title="Competitor register">
        {loading ? <Loading /> : competitors.length === 0 ? <EmptyState title="No competitors discovered" description="Run a CloudBrowser research job against the pilot domain." /> : (
          <ul className="space-y-4">
            {competitors.map((c) => (
              <li key={c.id} className="rounded border border-border/70 p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm text-foreground">{c.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{c.domain}</div>
                  </div>
                  <Provenance value={c.twin_provenance} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div><div className="font-mono text-[10px] uppercase text-muted-foreground">Wins</div><div className="tabular text-sm">{c.measured_wins ?? 0}</div></div>
                  <div><div className="font-mono text-[10px] uppercase text-muted-foreground">Losses</div><div className="tabular text-sm">{c.measured_losses ?? 0}</div></div>
                  <div><div className="font-mono text-[10px] uppercase text-muted-foreground">Authority</div><div className="flex items-center gap-1.5"><span className="tabular text-sm">{c.authority_signal ?? '—'}</span><Provenance value={c.authority_provenance} /></div></div>
                  <div><div className="font-mono text-[10px] uppercase text-muted-foreground">Velocity</div><div className="tabular text-sm">{c.content_velocity ?? '—'}</div></div>
                </div>
                {c.last_observed_at && <div className="mt-3 font-mono text-[10px] text-muted-foreground/70">observed {c.last_observed_at}</div>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel className="mt-4" title="Digital twins" subtitle="Resistance · weakness · displacement">
        {twins.length === 0 ? <EmptyState title="No twins built" /> : (
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
                <div className="mt-1.5 font-mono text-[11px] text-muted-foreground">resistance {t.resistance_score ?? '—'} · displacement {t.displacement_score ?? '—'}</div>
                {t.weakness && <div className="mt-1 text-xs text-muted-foreground">{t.weakness}</div>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}