import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, ShieldAlert, MapPin, Search, Lightbulb, Activity,
  Building2, TrendingUp, Zap,
} from 'lucide-react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import Provenance from '@/components/kit/Provenance';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import SystemGuide from '@/components/dashboard/SystemGuide';
import GettingStarted from '@/components/dashboard/GettingStarted';
import { useGlobalData } from '@/lib/useTenantData';
import { useTenant } from '@/lib/TenantContext';

const US_STATES = 50;

function StatTile({ icon: Icon, label, value, sub, tone = 'default' }) {
  const tones = {
    default: 'text-foreground',
    gold: 'text-primary',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
  };
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${tone === 'gold' ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className={`font-heading text-2xl font-bold tabular ${tones[tone]}`}>{value}</div>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ClientRow({ client, oppCount, measuredCount }) {
  return (
    <Link
      to="/money-map"
      className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-4 py-3 transition-colors hover:border-primary/40"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium text-foreground">{client.name}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{client.domain || client.industry || 'No domain set'}</p>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <div className="text-right">
          <div className="text-sm font-semibold tabular text-foreground">{oppCount}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">queries</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold tabular text-emerald-400">{measuredCount}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">measured</div>
        </div>
        <StatusPill tone={client.status === 'production' ? 'good' : 'warn'}>
          {client.status === 'non_production_pilot' ? 'pilot' : client.status}
        </StatusPill>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { clients, loading: clientsLoading } = useTenant();
  const { rows: opportunities } = useGlobalData('Opportunity');
  const { rows: methods } = useGlobalData('RankingMethod');
  const { rows: tests } = useGlobalData('ValidationTest');
  const { rows: receipts } = useGlobalData('Receipt', '-occurred_at');
  const { rows: connectors } = useGlobalData('ConnectorStatus');

  const measured = opportunities.filter((o) => o.rank_provenance === 'MEASURED');
  const pageOne = measured.filter((o) => o.measured_rank && o.measured_rank <= 10);
  const passing = tests.filter((t) => t.status === 'pass').length;
  const healthPct = tests.length ? Math.round((passing / tests.length) * 100) : 0;

  const oppByClient = {};
  opportunities.forEach((o) => {
    if (o.client_id) oppByClient[o.client_id] = (oppByClient[o.client_id] || 0) + 1;
  });
  const measuredByClient = {};
  measured.forEach((o) => {
    if (o.client_id) measuredByClient[o.client_id] = (measuredByClient[o.client_id] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Command Center"
        title="Search Dominance OS"
        description="Your autonomous SEO engine — tracking rankings, discovering strategies, and planning sprints across all 50 states. Everything runs in the background; this dashboard shows you what's happening."
        actions={<StatusPill tone="warn"><ShieldAlert className="mr-1.5 h-3 w-3" /> Shadow mode</StatusPill>}
      />

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Search} label="Queries tracked" value={opportunities.length} sub={`across ${clients.length} client${clients.length !== 1 ? 's' : ''}`} tone="gold" />
        <StatTile icon={MapPin} label="States covered" value={US_STATES} sub="nationwide coverage" />
        <StatTile icon={Lightbulb} label="Ranking methods" value={methods.length} sub="AI-discovered strategies" />
        <StatTile
          icon={Activity}
          label="System health"
          value={`${healthPct}%`}
          sub={`${passing}/${tests.length} validation checks`}
          tone={healthPct >= 80 ? 'emerald' : 'amber'}
        />
      </div>

      {/* System guide */}
      <SystemGuide />

      {/* Two-column: clients + getting started */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Active clients"
            subtitle="Click any client to view their opportunity map"
            right={<Link to="/clients" className="flex items-center gap-1 text-xs text-primary hover:underline">Manage <ArrowUpRight className="h-3 w-3" /></Link>}
          >
            {clientsLoading ? (
              <Loading />
            ) : clients.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">No clients yet.</p>
                <Link to="/seo-generator" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  Onboard your first client <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {clients.map((c) => (
                  <ClientRow
                    key={c.id}
                    client={c}
                    oppCount={oppByClient[c.id] || 0}
                    measuredCount={measuredByClient[c.id] || 0}
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>
        <GettingStarted
          clientsCount={clients.length}
          methodsCount={methods.length}
          connectorStatuses={connectors}
        />
      </div>

      {/* Quick actions + recent activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-1" title="Quick actions" subtitle="Jump to what matters">
          <div className="grid gap-2.5">
            <QuickAction to="/seo-generator" icon={Zap} label="SEO Generator" desc="View discovered methods & run research" />
            <QuickAction to="/money-map" icon={TrendingUp} label="Money Map" desc="See where you rank & where the money is" />
            <QuickAction to="/fastpaths" icon={Zap} label="Fast Paths" desc="Quick-win opportunities ready to act on" />
            <QuickAction to="/system-health" icon={Activity} label="System Health" desc="Check validation & connector status" />
          </div>
        </Panel>

        <Panel
          className="lg:col-span-2"
          title="Recent activity"
          subtitle="Immutable evidence trail — what the system has done"
          right={<Link to="/proof" className="flex items-center gap-1 text-xs text-primary hover:underline">Proof vault <ArrowUpRight className="h-3 w-3" /></Link>}
        >
          {receipts.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">No activity recorded yet. The system runs every 6 hours \u2014 check back soon.</p>
          ) : (
            <ul className="space-y-3">
              {receipts.slice(0, 8).map((r) => (
                <li key={r.id} className="flex items-start gap-3 border-l border-border pl-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-foreground">{r.summary}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <Provenance value={r.provenance} />
                      <span className="font-mono text-[10px] text-muted-foreground">{r.source}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, desc }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-lg border border-border bg-background/50 px-4 py-3 transition-colors hover:border-primary/40"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground group-hover:text-primary">{label}</p>
        <p className="truncate text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
    </Link>
  );
}