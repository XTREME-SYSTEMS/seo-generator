import React from 'react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import Provenance from '@/components/kit/Provenance';
import StatCard from '@/components/kit/StatCard';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useTenantData } from '@/lib/useTenantData';

const STAGES = ['queued', 'treated', 'reprocessing', 'page_one', 'top_5', 'top_3'];

export default function FastPaths() {
  const { rows, loading } = useTenantData('Opportunity');
  const inPath = rows.filter((o) => o.fastpath_stage && o.fastpath_stage !== 'none');
  const stable = (o) => o.stability_days >= 14 && o.rank_provenance === 'MEASURED';

  return (
    <div>
      <PageHeader eyebrow="Page-One FastPaths" title="Ranking pipeline"
        description="Treatment → reprocessing → stable placement. A stage only advances on independently measured SERP evidence; modeled movement never promotes a query." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="In pipeline" value={inPath.length} provenance="MEASURED" />
        <StatCard label="Stable page-one" value={inPath.filter((o) => stable(o) && o.measured_rank <= 10).length} provenance="MEASURED" hint="≥14 days" />
        <StatCard label="Stable top 3" value={inPath.filter((o) => stable(o) && o.measured_rank <= 3).length} provenance="MEASURED" hint="≥14 days" />
      </div>
      {loading ? <Loading /> : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {STAGES.map((stage) => {
            const items = inPath.filter((o) => o.fastpath_stage === stage);
            return (
              <Panel key={stage} title={stage.replace(/_/g, ' ')} subtitle={`${items.length} queries`}>
                {items.length === 0 ? <EmptyState title="Empty stage" /> : (
                  <ul className="space-y-3">
                    {items.map((o) => (
                      <li key={o.id} className="rounded border border-border/70 px-3 py-2.5">
                        <div className="truncate text-xs text-foreground">{o.query}</div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground">rank {o.measured_rank ?? '—'} · {o.stability_days || 0}d</span>
                          <Provenance value={o.rank_provenance} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}