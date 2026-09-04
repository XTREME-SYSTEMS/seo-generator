import React, { useMemo, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useGlobalData } from '@/lib/useTenantData';
import { TrendingUp, TrendingDown, Minus, Trophy, FlaskConical, CheckCircle2, Activity, Target, Zap, RefreshCw } from 'lucide-react';

export default function DailyResults() {
  const { rows: snapshots, loading, reload } = useGlobalData('UrlScoreSnapshot', '-captured_at');
  const [experiments, setExperiments] = useState([]);
  const [methods, setMethods] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [exps, ms, tel] = await Promise.all([
          base44.entities.Experiment.list('-started_at', 20),
          base44.entities.RankingMethod.filter({ status: 'validated' }, '-proof_level', 20),
          base44.entities.RunTelemetry.list('-started_at', 15),
        ]);
        setExperiments(exps || []);
        setMethods(ms || []);
        setTelemetry(tel || []);
      } catch (e) { console.error(e); }
    })();
  }, [snapshots]);

  async function refresh() {
    setRefreshing(true);
    try {
      await base44.functions.invoke('AreReflect', {});
      await base44.functions.invoke('MethodAttribution', {});
      reload();
    } catch (e) { console.error(e); } finally { setRefreshing(false); }
  }

  const today = new Date().toISOString().slice(0, 10);
  const todaySnapshots = useMemo(() => (snapshots || []).filter((s) => (s.captured_at || '').slice(0, 10) === today), [snapshots]);

  const stats = useMemo(() => {
    const total = todaySnapshots.length;
    const growing = todaySnapshots.filter((s) => s.growth_pct > 0).length;
    const declining = todaySnapshots.filter((s) => s.growth_pct < 0).length;
    const flat = total - growing - declining;
    const top3 = todaySnapshots.filter((s) => s.queries_top3 > 0).length;
    const pageOne = todaySnapshots.filter((s) => s.queries_page_one > 0).length;
    const avgScore = total ? todaySnapshots.reduce((a, s) => a + (s.score || 0), 0) / total : 0;
    const totalClicks = todaySnapshots.reduce((a, s) => a + (s.clicks || 0), 0);
    const totalImpressions = todaySnapshots.reduce((a, s) => a + (s.impressions || 0), 0);
    return { total, growing, declining, flat, top3, pageOne, avgScore, totalClicks, totalImpressions };
  }, [todaySnapshots]);

  const topMovers = useMemo(() => {
    return [...(snapshots || [])]
      .filter((s) => Math.abs(s.growth_pct || 0) >= 1)
      .sort((a, b) => Math.abs(b.growth_pct || 0) - Math.abs(a.growth_pct || 0))
      .slice(0, 15);
  }, [snapshots]);

  const todayTelemetry = useMemo(() => (telemetry || []).filter((t) => (t.started_at || '').slice(0, 10) === today), [telemetry, today]);

  if (loading) return <Loading label="Loading daily results" />;

  return (
    <div>
      <PageHeader
        eyebrow="Daily Results"
        title="Today's Ranking Performance"
        description="A daily snapshot of what the autonomous loop achieved — scores, movers, experiments, and validated methods. Watch this every day to see the system working."
        actions={
          <button onClick={refresh} disabled={refreshing} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {refreshing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Run Loop Now
          </button>
        }
      />

      {/* Today's KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KPITile icon={Target} label="URLs Tracked" value={stats.total} tone="info" />
        <KPITile icon={TrendingUp} label="Growing" value={stats.growing} tone="good" />
        <KPITile icon={TrendingDown} label="Declining" value={stats.declining} tone="bad" />
        <KPITile icon={Trophy} label="Top 3" value={stats.top3} tone="good" />
        <KPITile icon={CheckCircle2} label="Page One" value={stats.pageOne} tone="info" />
        <KPITile icon={Activity} label="Avg Score" value={Math.round(stats.avgScore)} tone="warn" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Movers */}
        <Panel title="Top Movers" subtitle="URLs with the biggest score changes">
          {topMovers.length === 0 ? (
            <EmptyState title="No movers yet" description="Run the loop to generate score movements." icon={TrendingUp} />
          ) : (
            <div className="divide-y divide-border">
              {topMovers.map((s) => {
                const pct = s.growth_pct || 0;
                const Icon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus;
                const tone = pct > 0 ? 'text-emerald-600' : pct < 0 ? 'text-rose-600' : 'text-muted-foreground';
                return (
                  <div key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-heading text-xs font-medium text-foreground">{s.url}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>Score: {Math.round(s.score || 0)}</span>
                        <span>·</span>
                        <span>Imp: {s.impressions || 0}</span>
                        <span>·</span>
                        <span>Clicks: {s.clicks || 0}</span>
                      </div>
                    </div>
                    <div className={`flex shrink-0 items-center gap-1 ${tone}`}>
                      <Icon className="h-3.5 w-3.5" />
                      <span className="font-mono text-xs font-semibold">{pct > 0 ? '+' : ''}{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        {/* Today's Loop Activity */}
        <Panel title="Today's Loop Activity" subtitle="What the autonomous engine ran today">
          {todayTelemetry.length === 0 ? (
            <EmptyState title="No loop runs today" description="The scheduled workflows haven't fired yet today." icon={Activity} />
          ) : (
            <div className="divide-y divide-border">
              {todayTelemetry.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-xs font-medium text-foreground">{t.run_type || t.subsystem || 'unknown'}</span>
                      <StatusPill tone={t.status === 'ok' ? 'good' : 'bad'}>{t.status}</StatusPill>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{t.message || ''}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-[10px] text-muted-foreground">{(t.started_at || '').slice(11, 16)}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{t.records_written || 0} recs</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Validated Methods */}
        <Panel title="Validated Ranking Methods" subtitle={`${methods.length} methods proven by measured GSC outcomes`}>
          {methods.length === 0 ? (
            <EmptyState title="No validated methods yet" description="The attribution loop needs time to promote methods." icon={Zap} />
          ) : (
            <div className="divide-y divide-border">
              {methods.map((m) => (
                <div key={m.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-xs font-medium text-foreground">{m.name}</span>
                      <StatusPill tone="good">proof {m.proof_level}/7</StatusPill>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{m.mechanism || m.category}</p>
                  </div>
                  <StatusPill tone="info">{m.speed_tier}</StatusPill>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Recent Experiments */}
        <Panel title="Recent Experiments" subtitle="Treatments deployed and their measured outcomes">
          {experiments.length === 0 ? (
            <EmptyState title="No experiments yet" description="Experiments are written when GSC scores move after a treatment." icon={FlaskConical} />
          ) : (
            <div className="divide-y divide-border">
              {experiments.slice(0, 10).map((e) => (
                <div key={e.id} className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-heading text-xs font-medium text-foreground">{e.name}</span>
                    <StatusPill tone={e.status === 'concluded' ? 'info' : 'idle'}>{e.status}</StatusPill>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{e.result_summary || e.hypothesis}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function KPITile({ icon: Icon, label, value, tone }) {
  const colors = { good: 'text-emerald-600', info: 'text-blue-600', warn: 'text-amber-600', bad: 'text-rose-600', idle: 'text-muted-foreground' };
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="mb-1 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${colors[tone]}`} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className={`font-heading text-2xl font-semibold ${colors[tone]}`}>{value}</div>
    </div>
  );
}