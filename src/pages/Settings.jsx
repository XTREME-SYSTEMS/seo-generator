import React from 'react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useGlobalData } from '@/lib/useTenantData';
import { useTenant } from '@/lib/TenantContext';

const TONE = { authorized: 'good', authorization_required: 'warn', degraded: 'warn', disabled: 'bad' };

export default function Settings() {
  const { rows: connectors, loading } = useGlobalData('ConnectorStatus');
  const { client } = useTenant();

  return (
    <div>
      <PageHeader eyebrow="Settings" title="Workspace + tenant settings"
        description="Connector authorization state and the active tenant profile. Authorizing a connector flips its data from UNKNOWN to MEASURED/PROVIDER across the OS." />
      <Panel title="Active tenant">
        {client ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="font-mono text-[10px] uppercase text-muted-foreground">Name</dt><dd className="mt-1 text-sm text-foreground">{client.name}</dd></div>
            <div><dt className="font-mono text-[10px] uppercase text-muted-foreground">Domain</dt><dd className="mt-1 text-sm text-foreground">{client.domain}</dd></div>
            <div><dt className="font-mono text-[10px] uppercase text-muted-foreground">Status</dt><dd className="mt-1"><StatusPill tone="sim">{(client.status || '').replace(/_/g, ' ')}</StatusPill></dd></div>
            <div><dt className="font-mono text-[10px] uppercase text-muted-foreground">Spend provenance</dt><dd className="mt-1 text-sm text-foreground">{client.spend_provenance}</dd></div>
          </dl>
        ) : <EmptyState title="No tenant selected" />}
      </Panel>
      <Panel className="mt-4" title="Connector state" subtitle="Authorization required to unlock data">
        {loading ? <Loading /> : connectors.length === 0 ? <EmptyState title="No connectors" /> : (
          <ul className="space-y-2">
            {connectors.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded border border-border/60 px-3 py-2"><span className="truncate text-xs text-foreground">{c.service}</span><StatusPill tone={TONE[c.state]}>{(c.state || '').replace(/_/g, ' ')}</StatusPill></li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}