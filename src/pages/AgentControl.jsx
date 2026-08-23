import React from 'react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useGlobalData, useTenantData } from '@/lib/useTenantData';

const TONE = { idle: 'idle', running: 'good', blocked_awaiting_approval: 'warn', disabled: 'bad' };

export default function AgentControl() {
  const { rows: agents, loading } = useGlobalData('Agent');
  const { rows: jobs } = useTenantData('AgentJob');
  const { rows: approvals } = useTenantData('Approval', { status: 'pending' });

  return (
    <div>
      <PageHeader eyebrow="Agent Control" title="Specialist agent registry"
        description="20 governed specialist agents. All are non-production by default: they may research, analyze, draft and create receipts, but may not self-authorize production deployment, paid spend, domain purchase or destructive mutations." />
      <Panel title="Agents" subtitle={`${agents.length} registered`}>
        {loading ? <Loading /> : agents.length === 0 ? <EmptyState title="No agents" /> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {agents.map((a) => (
              <div key={a.id} className="rounded border border-border/70 p-3">
                <div className="flex items-center justify-between"><span className="truncate text-sm text-foreground">{a.name}</span><StatusPill tone={TONE[a.status]}>{(a.status || '').replace(/_/g, ' ')}</StatusPill></div>
                <div className="mt-1 text-xs text-muted-foreground">{a.specialty}</div>
                <div className="mt-1.5 font-mono text-[10px] text-muted-foreground/70">{a.discipline}{a.requires_approval ? ' · approval required' : ''}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Pending approvals" subtitle="Protected-action gate">
          {approvals.length === 0 ? <EmptyState title="No pending approvals" description="Shadow mode: no protected actions requested." /> : (
            <ul className="space-y-2">{approvals.map((a) => <li key={a.id} className="rounded border border-border/60 px-3 py-2 text-xs text-foreground">{a.description}</li>)}</ul>
          )}
        </Panel>
        <Panel title="Agent jobs" subtitle="Queue">
          {jobs.length === 0 ? <EmptyState title="No jobs queued" /> : (
            <ul className="space-y-2">{jobs.map((j) => <li key={j.id} className="flex items-center justify-between rounded border border-border/60 px-3 py-2"><span className="truncate text-xs text-foreground">{j.kind}</span><StatusPill tone={TONE[j.status]}>{(j.status || '').replace(/_/g, ' ')}</StatusPill></li>)}</ul>
          )}
        </Panel>
      </div>
    </div>
  );
}