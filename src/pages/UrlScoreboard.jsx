import React, { useMemo, useState } from 'react';
import { Loader2, RefreshCw, Target } from 'lucide-react';
import PageHeader from '@/components/kit/PageHeader';
import StatCard from '@/components/kit/StatCard';
import EmptyState from '@/components/kit/EmptyState';
import Loading from '@/components/kit/Loading';
import UrlScoreCard from '@/components/are/UrlScoreCard';
import WeeklyScoreChart from '@/components/are/WeeklyScoreChart';
import Panel from '@/components/kit/Panel';
import SuggestionLightbulb from '@/components/are/SuggestionLightbulb';
import FilterChips from '@/components/are/FilterChips';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/lib/useTenantData';
import { useTenant } from '@/lib/TenantContext';
import { base44 } from '@/api/base44Client';

export default function UrlScoreboard() {
  const { clientId } = useTenant();
  const { rows, loading, reload } = useTenantData('UrlScoreSnapshot', {}, 'week_start');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('');

  const byUrl = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      const list = map.get(r.url) || [];
      list.push(r);
      map.set(r.url, list);
    });
    return [...map.entries()]
      .map(([url, snaps]) => {
        const sorted = [...snaps].sort((a, b) => (a.week_start > b.week_start ? 1 : -1));
        return { url, snapshots: sorted, latest: sorted[sorted.length - 1] };
      })
      .sort((a, b) => (b.latest?.score || 0) - (a.latest?.score || 0));
  }, [rows]);

  const visible = useMemo(() => {
    if (filter === 'top3') return byUrl.filter((u) => (u.latest?.best_rank || 99) <= 3);
    if (filter === 'page_one') return byUrl.filter((u) => (u.latest?.best_rank || 99) <= 10 && (u.latest?.best_rank || 99) > 3);
    if (filter === 'climbing') return byUrl.filter((u) => (u.latest?.growth_pct || 0) > 0);
    if (filter === 'blocked') return byUrl.filter((u) => (u.latest?.blocked_count || 0) > 0);
    return byUrl;
  }, [byUrl, filter]);

  const portfolio = useMemo(() => {
    const weeks = new Map();
    rows.forEach((r) => {
      const w = weeks.get(r.week_start) || { total: 0, count: 0 };
      w.total += r.score || 0;
      w.count += 1;
      weeks.set(r.week_start, w);
    });
    return [...weeks.entries()]
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .map(([week, v]) => ({ label: week.slice(5), score: Math.round((v.total / v.count) * 10) / 10 }));
  }, [rows]);

  const latestAll = byUrl.map((u) => u.latest).filter(Boolean);
  const avgScore = latestAll.length ? Math.round((latestAll.reduce((a, s) => a + (s.score || 0), 0) / latestAll.length) * 10) / 10 : 0;
  const avgGrowth = latestAll.length ? Math.round((latestAll.reduce((a, s) => a + (s.growth_pct || 0), 0) / latestAll.length) * 10) / 10 : 0;
  const top3 = latestAll.reduce((a, s) => a + (s.queries_top3 || 0), 0);
  const tracked = latestAll.reduce((a, s) => a + (s.queries_tracked || 0), 0);

  const runCycle = async () => {
    setBusy(true);
    try {
      await base44.functions.invoke('AreReflect', { client_id: clientId });
      reload();
    } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Autonomous Ranking Engine"
        title="URL Scoreboard"
        description="Every managed URL scored on rank progress toward top 3, moving week by week. 100 means the primary query holds top 3."
        actions={(
          <Button variant="outline" size="sm" onClick={runCycle} disabled={busy || !clientId}>
            {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
            Run reflect pass
          </Button>
        )}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Portfolio score" value={avgScore} provenance="MEASURED" hint="rank progress to top 3" />
        <StatCard label="Weekly growth" value={`${avgGrowth > 0 ? '+' : ''}${avgGrowth}%`} provenance="MEASURED" hint="vs last week" />
        <StatCard label="Queries in top 3" value={`${top3}/${tracked}`} provenance="MEASURED" hint="goal state" />
        <StatCard label="URLs managed" value={byUrl.length} provenance="MEASURED" />
      </div>

      <Panel title="Portfolio score by week" subtitle="Average across every managed URL" className="mb-6">
        <WeeklyScoreChart series={portfolio} height={200} />
      </Panel>

      <div className="mb-4">
        <FilterChips
          value={filter}
          onChange={setFilter}
          allLabel="All URLs"
          options={[
            { value: 'top3', label: 'Top 3' },
            { value: 'page_one', label: 'Page one' },
            { value: 'climbing', label: 'Climbing' },
            { value: 'blocked', label: 'Blocked' },
          ]}
        />
      </div>

      {loading && <Loading label="Loading weekly snapshots" />}
      {!loading && !visible.length && (
        <EmptyState
          icon={Target}
          title="No scored URLs yet"
          description="Register URL assets and run a reflect pass — the engine writes a weekly score snapshot for every URL it manages."
        />
      )}

      <div className="space-y-5">
        {visible.map((u) => (
          <UrlScoreCard key={u.url} url={u.url} snapshots={u.snapshots} latest={u.latest} />
        ))}
      </div>

      <SuggestionLightbulb surface="scoreboard" />
    </div>
  );
}