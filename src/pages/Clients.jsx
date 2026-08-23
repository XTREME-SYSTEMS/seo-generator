import React from 'react';
import { Building2 } from 'lucide-react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import Provenance from '@/components/kit/Provenance';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useTenant } from '@/lib/TenantContext';

const STATUS_TONE = { non_production_pilot: 'sim', shadow: 'warn', production: 'good' };

export default function Clients() {
  const { clients, loading, clientId, setClientId } = useTenant();
  return (
    <div>
      <PageHeader eyebrow="Clients" title="Tenant register"
        description="Each client is an isolated tenant. Pilot accounts remain non-production: no paid campaign is connected or mutated, and unverified finance stays labelled." />
      {loading ? <Loading /> : clients.length === 0 ? (
        <Panel><EmptyState icon={Building2} title="No tenants" /></Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {clients.map((c) => (
            <Panel key={c.id} title={c.name} subtitle={c.domain}
              right={<StatusPill tone={STATUS_TONE[c.status]}>{(c.status || '').replace(/_/g, ' ')}</StatusPill>}>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Monthly paid spend</dt>
                  <dd className="mt-1.5 flex items-center gap-2">
                    <span className="tabular text-sm text-foreground">{c.monthly_paid_spend ? `$${c.monthly_paid_spend.toLocaleString()}` : 'UNKNOWN'}</span>
                    <Provenance value={c.spend_provenance} />
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Revenue</dt>
                  <dd className="mt-1.5 flex items-center gap-2"><span className="text-sm text-muted-foreground">UNKNOWN</span><Provenance value={c.revenue_provenance} /></dd>
                </div>
              </dl>
              {c.notes && <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{c.notes}</p>}
              <button onClick={() => setClientId(c.id)} disabled={clientId === c.id}
                className="mt-5 rounded border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-40">
                {clientId === c.id ? 'Active tenant' : 'Switch to tenant'}
              </button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}