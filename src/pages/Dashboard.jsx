import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldAlert } from 'lucide-react';
import PageHeader from '@/components/kit/PageHeader';
import StatCard from '@/components/kit/StatCard';
import Panel from '@/components/kit/Panel';
import Provenance from '@/components/kit/Provenance';
import StatusPill from '@/components/kit/StatusPill';
import EmptyState from '@/components/kit/EmptyState';
import Loading from '@/components/kit/Loading';
import { Table, Row, Cell } from '@/components/kit/Table';
import { useTenantData, useGlobalData } from '@/lib/useTenantData';
import { useTenant } from '@/lib/TenantContext';

export default function Dashboard() {
  const { client } = useTenant();
  const { rows: opportunities, loading } = useTenantData('Opportunity');
  const { rows: receipts } = useTenantData('Receipt', {}, '-occurred_at');
  const { rows: tests } = useGlobalData('ValidationTest');

  const measured = opportunities.filter((o) => o.rank_provenance === 'MEASURED');
  const pageOne = measured.filter((o) => o.measured_rank && o.measured_rank <= 10);
  const top3 = measured.filter((o) => o.measured_rank && o.measured_rank <= 3);
  const paidEquivalent = opportunities
    .filter((o) => o.cpc_provenance === 'PROVIDER' || o.cpc_provenance === 'MEASURED')
    .reduce((s, o) => s + (o.paid_equivalent_value || 0), 0);
  const passing = tests.filter((t) => t.status === 'pass').length;

  return (
    <div>
      <PageHeader
        eyebrow="Executive Dashboard"
        title={client ? client.name : 'No tenant selected'}
        description="Proof-first view. Every figure carries provenance; nothing synthetic is reported as measured, and no paid-media or production action executes without an explicit approval."
        actions={<StatusPill tone="warn"><ShieldAlert className="mr-1.5 h-3 w-3" /> Shadow mode</StatusPill>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Measured queries" value={measured.length} provenance="MEASURED" hint="independent SERP checks" />
        <StatCard label="Stable page-one" value={pageOne.length} provenance="MEASURED" hint={`${top3.length} in top 3`} />
        <StatCard label="Paid-equivalent value" value={paidEquivalent ? `$${paidEquivalent.toLocaleString()}` : null} provenance={paidEquivalent ? 'PROVIDER' : 'UNKNOWN'} hint="from provider CPC only" />
        <StatCard label="Confirmed spend replacement" value={null} provenance="UNKNOWN" hint="requires Google Ads authorization" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Ranking router queue" subtitle="Two-gate decisions across the active tenant"
          right={<Link to="/money-map" className="flex items-center gap-1 text-xs text-primary hover:underline">Money map <ArrowUpRight className="h-3 w-3" /></Link>}>
          {loading ? <Loading /> : opportunities.length === 0 ? (
            <EmptyState title="No opportunities compiled" description="Compile a RankingBrief to generate opportunities for this tenant." />
          ) : (
            <Table columns={['Query', 'Measured rank', 'Gate 1', 'Gate 2', 'Router']}>
              {opportunities.slice(0, 8).map((o) => (
                <Row key={o.id}>
                  <Cell className="max-w-[240px] truncate text-foreground">{o.query}</Cell>
                  <Cell><span className="mr-2 tabular">{o.measured_rank ?? '—'}</span><Provenance value={o.rank_provenance} /></Cell>
                  <Cell>{o.gate_one_passed ? <StatusPill tone="good">pass</StatusPill> : <StatusPill>hold</StatusPill>}</Cell>
                  <Cell>{o.gate_two_passed ? <StatusPill tone="good">pass</StatusPill> : <StatusPill>hold</StatusPill>}</Cell>
                  <Cell className="font-mono text-[11px] uppercase text-muted-foreground">{o.router_decision}</Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>
        <div className="space-y-4">
          <Panel title="Validation" subtitle={`${passing} of ${tests.length} checks passing`}>
            <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: tests.length ? `${(passing / tests.length) * 100}%` : '0%' }} />
            </div>
            <Link to="/system-health" className="text-xs text-primary hover:underline">Open System Health</Link>
          </Panel>
          <Panel title="Latest receipts" subtitle="Immutable evidence trail">
            {receipts.length === 0 ? <p className="text-xs text-muted-foreground">No receipts recorded yet.</p> : (
              <ul className="space-y-3">
                {receipts.slice(0, 5).map((r) => (
                  <li key={r.id} className="border-l border-border pl-3">
                    <div className="text-xs text-foreground">{r.summary}</div>
                    <div className="mt-1 flex items-center gap-2"><Provenance value={r.provenance} /><span className="font-mono text-[10px] text-muted-foreground">{r.source}</span></div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}