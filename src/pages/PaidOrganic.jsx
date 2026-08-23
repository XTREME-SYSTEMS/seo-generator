import React from 'react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import Provenance from '@/components/kit/Provenance';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { Table, Row, Cell } from '@/components/kit/Table';
import { useTenantData } from '@/lib/useTenantData';
import { useGlobalData } from '@/lib/useTenantData';
import { money } from '@/lib/format';

export default function PaidOrganic() {
  const { rows: opportunities, loading } = useTenantData('Opportunity');
  const { rows: connectors } = useGlobalData('ConnectorStatus');
  const gsc = connectors.find((c) => c.service === 'Google Search Console');
  const ads = connectors.find((c) => c.service === 'Google Ads');

  return (
    <div>
      <PageHeader
        eyebrow="Paid + Organic"
        title="Paid and organic surface"
        description="Side-by-side paid and organic signals. Paid economics stay UNKNOWN until Google Ads is authorized; organic ranks carry their proof class, never inflated to measured."
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Panel title="Google Search Console" subtitle="Organic aggregate source">
          <div className="flex items-center gap-2">
            <StatusPill tone={gsc?.state === 'authorized' ? 'good' : 'warn'}>{gsc?.state || '—'}</StatusPill>
            <span className="text-xs text-muted-foreground">{gsc?.note}</span>
          </div>
        </Panel>
        <Panel title="Google Ads" subtitle="Paid economics source">
          <div className="flex items-center gap-2">
            <StatusPill tone={ads?.state === 'authorized' ? 'good' : 'warn'}>{ads?.state || '—'}</StatusPill>
            <span className="text-xs text-muted-foreground">{ads?.note}</span>
          </div>
        </Panel>
      </div>
      <Panel title="Query surface" subtitle="Organic rank + paid cost per query">
        {loading ? (
          <Loading />
        ) : opportunities.length === 0 ? (
          <EmptyState title="No queries" />
        ) : (
          <Table columns={['Query', 'Organic rank', 'Rank proof', 'Paid CPC', 'CPC proof', 'Paid monthly']}>
            {opportunities.map((o) => (
              <Row key={o.id}>
                <Cell className="max-w-[220px] truncate text-foreground">{o.query}</Cell>
                <Cell className="tabular">{o.measured_rank ?? '—'}</Cell>
                <Cell><Provenance value={o.rank_provenance} /></Cell>
                <Cell className="tabular">{o.cpc ? money(o.cpc) : 'UNKNOWN'}</Cell>
                <Cell><Provenance value={o.cpc_provenance} /></Cell>
                <Cell className="tabular">{o.paid_equivalent_value ? money(o.paid_equivalent_value) : '—'}</Cell>
              </Row>
            ))}
          </Table>
        )}
      </Panel>
    </div>
  );
}