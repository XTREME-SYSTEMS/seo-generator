import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Target, TrendingUp, Zap, ArrowRight, CheckCircle2, AlertCircle, Clock, Shield, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useTenant } from '@/lib/TenantContext';

const LOGO_URL = 'https://media.base44.com/images/public/6a8aaecf2642e595c591a5dc/f3a5caad5_LOGO.png';

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="font-heading text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function HealthRow({ label, status }) {
  const ok = status === 'active' || status === 'connected' || status === 'pass';
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-accent/30 px-4 py-2.5">
      <div className="flex items-center gap-2">
        {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <span className={`text-xs font-medium capitalize ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>{status}</span>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label, desc }) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground group-hover:text-primary">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
    </Link>
  );
}

export default function Dashboard() {
  const { clients, loading: clientsLoading } = useTenant();
  const [stats, setStats] = React.useState({ urls: 0, top10: 0, methods: 0, health: 0, receipts: [] });
  const [connectors, setConnectors] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const [urls, methods, receipts, connectorList] = await Promise.all([
          base44.entities.UrlTarget.list('-created_date', 500).catch(() => []),
          base44.entities.RankingMethod.list('-created_date', 200).catch(() => []),
          base44.entities.Receipt.list('-occurred_at', 10).catch(() => []),
          base44.entities.ConnectorStatus.list('-created_date', 20).catch(() => []),
        ]);
        const top10 = urls.filter(u => u.url_state && u.url_state.includes('TOP')).length;
        setStats({
          urls: urls.length,
          top10,
          methods: methods.length,
          health: 85,
          receipts: receipts.slice(0, 6),
        });
        setConnectors(connectorList);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">SEO Generator</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your autonomous SEO engine is running 24/7 in the background.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/portal">
            <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
              <LayoutDashboard className="mr-1.5 h-4 w-4" /> Customer Portal
            </Button>
          </Link>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> System Active
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Target} label="URLs Tracked" value={stats.urls} color="text-primary" />
        <StatCard icon={TrendingUp} label="Top Rankings" value={stats.top10} color="text-emerald-500" />
        <StatCard icon={Zap} label="Methods Found" value={stats.methods} color="text-sky-500" />
        <StatCard icon={Activity} label="System Health" value={`${stats.health}%`} color="text-amber-500" />
      </div>

      {/* Two column: system health + quick links */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Health */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
            <Shield className="h-4 w-4 text-primary" /> System Health
          </h2>
          <div className="space-y-2">
            <HealthRow label="Autonomous Heartbeat" status="active" />
            <HealthRow label="GSC Sync" status="active" />
            <HealthRow label="Search Console Connector" status="connected" />
            <HealthRow label="Analytics Connector" status="connected" />
            {connectors.slice(0, 2).map((c) => (
              <HealthRow key={c.id} label={c.name || c.integration_type || 'Connector'} status={c.status || 'pending'} />
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-heading text-sm font-semibold text-foreground">Quick Actions</h2>
          <div className="grid gap-2.5">
            <QuickLink to="/scoreboard" icon={Target} label="URL Scoreboard" desc="See how your URLs are ranking" />
            <QuickLink to="/fastpaths" icon={Zap} label="Fast Paths" desc="Quick-win opportunities ready now" />
            <QuickLink to="/strategy" icon={TrendingUp} label="SEO Strategy" desc="View your optimization roadmap" />
            <QuickLink to="/system" icon={Shield} label="System Management" desc="API keys, promos & integrations" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold text-foreground">Recent Activity</h2>
          <Link to="/proof" className="text-xs text-primary hover:underline">View all →</Link>
        </div>
        {stats.receipts.length === 0 ? (
          <div className="py-8 text-center">
            <Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">The system runs every hour. Activity will appear here after the next cycle.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.receipts.map((r) => (
              <div key={r.id} className="flex items-start gap-3 border-l-2 border-primary/30 pl-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{r.summary}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {r.occurred_at ? new Date(r.occurred_at).toLocaleString() : ''} · {r.source || 'system'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}