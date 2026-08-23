import React from 'react';
import { Lock } from 'lucide-react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import Provenance from '@/components/kit/Provenance';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useTenantData } from '@/lib/useTenantData';
import { money } from '@/lib/format';

const TONE = { identified: 'idle', quoted: 'info', approval_requested: 'warn', approved: 'good', purchased: 'good', rejected: 'bad' };

export default function Domains() {
  const { rows, loading } = useTenantData('DomainCandidate');

  return (
    <div>
      <PageHeader eyebrow="Domains" title="Domain candidates"
        description="Domain intelligence searches and prices candidates. Purchase is always gated — no domain is bought without an explicit approval, even outside shadow mode." />
      <Panel title="Candidates" subtitle={`${rows.length} identified`}>
        {loading ? <Loading /> : rows.length === 0 ? (
          <EmptyState icon={Lock} title="No domain candidates" description="Run the Domain Intelligence Agent to identify candidates." />
        ) : (
          <ul className="space-y-3">
            {rows.map((d) => (
              <li key={d.id} className="rounded border border-border/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm text-foreground">{d.domain}</span>
                  <div className="flex items-center gap-2">
                    {d.purchase_gated && <Lock className="h-3 w-3 text-amber-400" />}
                    <StatusPill tone={TONE[d.status]}>{(d.status || '').replace(/_/g, ' ')}</StatusPill>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-2"><span className="tabular text-xs text-muted-foreground">{d.estimated_price ? money(d.estimated_price) : 'UNKNOWN'}</span><Provenance value={d.price_provenance} /></div>
                {d.relevance && <div className="mt-1 text-xs text-muted-foreground">{d.relevance}</div>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}