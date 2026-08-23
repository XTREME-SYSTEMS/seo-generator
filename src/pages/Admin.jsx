import React from 'react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useGlobalData, useTenantData } from '@/lib/useTenantData';

export default function Admin() {
  const { rows: clients, loading } = useGlobalData('Client');
  const { rows: agents } = useGlobalData('Agent');
  const { rows: approvals } = useTenantData('Approval');

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Tenancy + governance"
        description="Admin-only view of tenants, agents and the approval gate. Global method and champion registries are admin-only; client-owned records are tenant-isolated." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Tenants" subtitle={`${clients.length} clients`}>
          {loading ? <Loading /> : clients.length === 0 ? <EmptyState title="No tenants" /> : (
            <ul className="space-y-2">{clients.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded border border-border/60 px-3 py-2"><span className="truncate text-xs text-foreground">{c.name}</span><StatusPill tone="sim">{(c.status || '').replace(/_/g, ' ')}</StatusPill></li>
            ))}</ul>
          )}
        </Panel>
        <Panel title="Agents" subtitle={`${agents.length} registered`}>
          {agents.length === 0 ? <EmptyState title="No agents" /> : (
            <ul className="space-y-2">{agents.slice(0, 10).map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded border border-border/60 px-3 py-2"><span className="truncate text-xs text-foreground">{a.name}</span><span className="font-mono text-[10px] text-muted-foreground">{a.discipline}</span></li>
            ))}</ul>
          )}
        </Panel>
        <Panel title="Approvals" subtitle={`${approvals.length} pending`}>
          {approvals.length === 0 ? <EmptyState title="No pending approvals" /> : (
            <ul className="space-y-2">{approvals.map((a) => <li key={a.id} className="rounded border border-border/60 px-3 py-2 text-xs text-foreground">{a.description}</li>)}</ul>
          )}
        </Panel>
      </div>
    </div>
  );
}