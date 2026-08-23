import React, { useState } from 'react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import Provenance from '@/components/kit/Provenance';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { Table, Row, Cell } from '@/components/kit/Table';
import { useTenantData } from '@/lib/useTenantData';

const FILTERS = ['all', 'fastpath', 'experiment', 'hold', 'pending'];

export default function SearchMoneyMap() {
  const { rows, loading } = useTenantData('Opportunity');
  const [filter, setFilter] = useState('all');
  const visible = filter === 'all' ? rows : rows.filter((o) => o.router_decision === filter);

  return (
    <div>
      <PageHeader eyebrow="Search Money Map" title="Opportunity surface"
        description="Every query with its measured rank and the provenance of each economic input. Volume, difficulty and CPC are never stored as measured unless an authorized provider supplied them."
        actions={
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${filter === f ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>{f}</button>
            ))}
          </div>
        } />
      <Panel title="Queries" subtitle={`${visible.length} of ${rows.length} records`}>
        {loading ? <Loading /> : visible.length === 0 ? (
          <EmptyState title="No opportunities" description="Nothing matches this router state for the active tenant." />
        ) : (
          <Table columns={['Query', 'Intent', 'Rank', 'Volume', 'Difficulty', 'CPC', 'Paid equivalent', 'Router']}>
            {visible.map((o) => (
              <Row key={o.id}>
                <Cell className="max-w-[220px] truncate text-foreground">{o.query}</Cell>
                <Cell className="text-xs text-muted-foreground">{o.intent}</Cell>
                <Cell><div className="flex items-center gap-2"><span className="tabular">{o.measured_rank ?? '—'}</span><Provenance value={o.rank_provenance} /></div></Cell>
                <Cell><div className="flex items-center gap-2"><span className="tabular">{o.volume ?? 'UNKNOWN'}</span><Provenance value={o.volume_provenance} /></div></Cell>
                <Cell><div className="flex items-center gap-2"><span className="tabular">{o.difficulty ?? 'UNKNOWN'}</span><Provenance value={o.difficulty_provenance} /></div></Cell>
                <Cell><div className="flex items-center gap-2"><span className="tabular">{o.cpc ? `$${o.cpc}` : 'UNKNOWN'}</span><Provenance value={o.cpc_provenance} /></div></Cell>
                <Cell className="tabular">{o.paid_equivalent_value ? `$${o.paid_equivalent_value.toLocaleString()}` : '—'}</Cell>
                <Cell><StatusPill tone={o.router_decision === 'fastpath' ? 'good' : o.router_decision === 'experiment' ? 'info' : 'idle'}>{o.router_decision}</StatusPill></Cell>
              </Row>
            ))}
          </Table>
        )}
      </Panel>
    </div>
  );
}