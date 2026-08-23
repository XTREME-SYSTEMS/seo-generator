import React from 'react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useGlobalData } from '@/lib/useTenantData';

const RING_TONE = { adopt: 'good', trial: 'info', assess: 'warn', hold: 'idle' };
const STATE_TONE = { shipped: 'good', in_progress: 'info', planned: 'warn', missing: 'bad', degraded: 'warn' };
const SEVERITY_TONE = { none: 'good', low: 'good', medium: 'warn', high: 'bad', critical: 'bad' };

export default function TechnologyRadar() {
  const { rows, loading } = useGlobalData('TechnologyCapability');

  const byRing = (ring) => rows.filter((r) => r.ring === ring);

  return (
    <div>
      <PageHeader
        eyebrow="Technology Radar"
        title="Capability radar + work packets"
        description="Hourly research findings scored for value, readiness, risk and competitive advantage, converted into engineering work packets. Gaps drive the queue; shipped capabilities retire them."
      />
      {loading ? <Loading /> : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {['adopt', 'trial', 'assess', 'hold'].map((ring) => (
              <Panel key={ring} title={ring} subtitle={`${byRing(ring).length} capabilities`}>
                {byRing(ring).length === 0 ? <EmptyState title="Empty ring" /> : (
                  <ul className="space-y-2">
                    {byRing(ring).map((c) => (
                      <li key={c.id} className="rounded border border-border/60 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-foreground">{c.name}</span>
                          <StatusPill tone={STATE_TONE[c.state]}>{c.state}</StatusPill>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <StatusPill tone={SEVERITY_TONE[c.gap_severity]}>{c.gap_severity}</StatusPill>
                          <span className="truncate font-mono text-[10px] text-muted-foreground">{c.category}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            ))}
          </div>
          <Panel className="mt-4" title="Work-packet queue" subtitle="Gaps → engineering tasks">
            {rows.filter((r) => r.gap_severity !== 'none').length === 0 ? <EmptyState title="No open gaps" /> : (
              <ul className="space-y-2">
                {rows.filter((r) => r.gap_severity !== 'none').sort((a, b) => ({ high: 3, critical: 4, medium: 2, low: 1 }[b.gap_severity] || 0) - ({ high: 3, critical: 4, medium: 2, low: 1 }[a.gap_severity] || 0)).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 rounded border border-border/60 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs text-foreground">{c.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{c.work_packet}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusPill tone={SEVERITY_TONE[c.gap_severity]}>{c.gap_severity}</StatusPill>
                      <span className="font-mono text-[10px] text-muted-foreground">{c.owner_agent}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}