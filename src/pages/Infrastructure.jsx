import React from 'react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useTenantData } from '@/lib/useTenantData';

const STATE_TONE = { planned: 'idle', provisioning: 'info', live: 'good', degraded: 'warn', decommissioned: 'idle' };

export default function Infrastructure() {
  const { rows, loading } = useTenantData('InfrastructureProject');

  return (
    <div>
      <PageHeader eyebrow="Infrastructure" title="Non-production provisioning"
        description="Preview and non-production environments only. Production provisioning requires explicit approval and is never self-authorized by an agent." />
      <Panel title="Projects" subtitle={`${rows.length} tracked`}>
        {loading ? <Loading /> : rows.length === 0 ? (
          <EmptyState title="No infrastructure projects" />
        ) : (
          <ul className="space-y-3">
            {rows.map((p) => (
              <li key={p.id} className="rounded border border-border/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm text-foreground">{p.name}</span>
                  <div className="flex items-center gap-2">
                    {p.gated && <span className="font-mono text-[10px] text-amber-400">gated</span>}
                    <StatusPill tone={STATE_TONE[p.state]}>{p.state}</StatusPill>
                  </div>
                </div>
                <div className="mt-1.5 font-mono text-[10px] text-muted-foreground">{p.environment} · {p.provider}</div>
                {p.notes && <div className="mt-1 text-xs text-muted-foreground">{p.notes}</div>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}