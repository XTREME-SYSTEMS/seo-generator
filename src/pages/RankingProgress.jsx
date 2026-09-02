import React, { useMemo, useState } from 'react';
import { Loader2, RefreshCw, LineChart as LineChartIcon, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatCard from '@/components/kit/StatCard';
import EmptyState from '@/components/kit/EmptyState';
import Loading from '@/components/kit/Loading';
import UrlProgressChart from '@/components/are/UrlProgressChart';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/lib/useTenantData';
import { useTenant } from '@/lib/TenantContext';
import { base44 } from '@/api/base44Client';

export default function RankingProgress() {
  const { clientId } = useTenant();
  const { rows: snaps, loading } = useTenantData('UrlScoreSnapshot', {}, 'week_start');
  const { rows: reflections, reload } = useTenantData('ReflectionRecord', {}, '-occurred_at');
  const [busy, setBusy] = useState(false);

  const byUrl = useMemo(() => {
    const map = new Map();
    snaps.forEach((s) => {
      if (!map.has(s.url)) map.set(s.url, []);
      map.get(s.url).push(s);
    });
    return [...map.entries()]
      .map(([url, list]) => {
        const sorted = [...list].sort((a, b) => (a.week_start > b.week_start ? 1 : -1));
        return { url, snapshots: sorted, latest: sorted[sorted.length - 1], first: sorted[0] };
      })
      .sort((a, b) => (b.latest?.score || 0) - (a.latest?.score || 0));
  }, [snaps]);

  const reflByUrl = useMemo(() => {
    const map = new Map();
    reflections.forEach((r) => {
      if (!r.url) return;
      if (!map.has(r.url)) map.set(r.url, []);
      map.get(r.url).push(r);
    });
    return map;
  }, [reflections]);

  const totals = useMemo(() => {
    const latest = byUrl.map((u) => u.latest).filter(Boolean);
    const avgScore = latest.length ? latest.reduce((a, s) => a + (s.score || 0), 0) / latest.length : 0;
    const top3 = latest.reduce((a, s) => a + (s.queries_top3 || 0), 0);
    const tracked = latest.reduce((a, s) => a + (s.queries_tracked || 0), 0);
    const deployed = reflections.filter((r) => r.deployed).length;
    const passed = reflections.filter((r) => r.deployed && r.validation_status === 'pass').length;
    return { avgScore, top3, tracked, deployed, passRate: deployed ? Math.round((passed / deployed) * 100) : 0 };
  }, [byUrl, reflections]);

  const syncNow = async () => {
    setBusy(true);
    try {
      await base44.functions.invoke('AreReflect', { client_id: clientId });
      reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Ranking Engine"
        title="Ranking Progress"
        description="Rank progress toward top 3 for every managed URL, with each automated improvement overlaid on the timeline so you can see its measured impact."
        actions={[
          <Button key="s" variant="outline" size="sm" onClick={syncNow} disabled={busy || !clientId}>
            {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
            Sync Search Console
          </Button>,
        ]}
      />

      <div className="mb-4 flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        Google Search Console connected (webmasters.readonly). Performance data auto-imports every hour via the ARE loop; the button above pulls a fresh pass now.
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Portfolio score" value={Math.round(totals.avgScore * 10) / 10} provenance="MEASURED" hint="rank progress to top 3" />
        <StatCard label="Queries in top 3" value={`${totals.top3}/${totals.tracked}`} provenance="MEASURED" hint="goal state" />
        <StatCard label="Treatments deployed" value={totals.deployed} provenance="MEASURED" hint="automated improvements" />
        <StatCard label="Validation pass rate" value={`${totals.passRate}%`} provenance="MEASURED" hint="measured impact" />
      </div>

      {loading && <Loading label="Loading ranking progress" />}
      {!loading && !byUrl.length && (
        <EmptyState
          icon={LineChartIcon}
          title="No ranking history yet"
          description="Register URL assets and run a reflect pass — weekly score snapshots and treatment events populate this timeline."
        />
      )}

      <div className="space-y-5">
        {byUrl.map((u) => {
          const refs = (reflByUrl.get(u.url) || []).filter((r) => r.deployed);
          const lift = (u.latest?.score || 0) - (u.first?.score || 0);
          return (
            <Panel
              key={u.url}
              title={u.url}
              subtitle={`${refs.length} automated improvements · ${u.snapshots.length} weeks tracked`}
              right={
                <span className={`font-mono text-xs tabular ${lift >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {lift >= 0 ? '+' : ''}{lift} pts
                </span>
              }
            >
              <UrlProgressChart snapshots={u.snapshots} reflections={refs} height={220} />
            </Panel>
          );
        })}
      </div>
    </div>
  );
}