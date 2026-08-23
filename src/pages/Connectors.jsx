import React from 'react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useGlobalData } from '@/lib/useTenantData';

const TONE = { authorized: 'good', authorization_required: 'warn', degraded: 'warn', disabled: 'bad' };

export default function Connectors() {
  const { rows, loading } = useGlobalData('ConnectorStatus');

  return (
    <div>
      <PageHeader eyebrow="Connectors" title="Data source authorization"
        description="Google Search Console, Google Analytics, and Vercel are connected. Google Ads and the AI Visibility Provider remain authorization-required — their data stays UNKNOWN, never fabricated." />
      <Panel title="Connectors" subtitle={`${rows.length} services`}>
        {loading ? <Loading /> : rows.length === 0 ? <EmptyState title="No connectors" /> : (
          <ul className="space-y-3">
            {rows.map((c) => (
              <li key={c.id} className="rounded border border-border/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0"><div className="truncate text-sm text-foreground">{c.service}</div><div className="truncate text-xs text-muted-foreground">{c.purpose}</div></div>
                  <div className="flex shrink-0 items-center gap-2">
                    {c.write_allowed && <span className="font-mono text-[10px] text-muted-foreground">WRITE</span>}
                    <StatusPill tone={TONE[c.state]}>{(c.state || '').replace(/_/g, ' ')}</StatusPill>
                  </div>
                </div>
                {c.note && <div className="mt-2 text-xs text-muted-foreground">{c.note}</div>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}