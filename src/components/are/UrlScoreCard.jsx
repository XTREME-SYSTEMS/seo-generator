import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Trophy } from 'lucide-react';
import ScoreRing from './ScoreRing';
import WeeklyScoreChart from './WeeklyScoreChart';
import Provenance from '@/components/kit/Provenance';

function Metric({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate font-heading text-sm font-medium tabular text-foreground">{value}</div>
    </div>
  );
}

export default function UrlScoreCard({ url, snapshots, latest }) {
  const series = snapshots.map((s) => ({ label: s.week_start.slice(5), score: s.score || 0 }));
  const growth = latest?.growth_pct || 0;
  const Trend = growth > 0 ? TrendingUp : growth < 0 ? TrendingDown : Minus;
  const trendTone = growth > 0 ? 'text-emerald-600 dark:text-emerald-400' : growth < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground';
  const goalMet = (latest?.best_rank || 99) <= 3;

  return (
    <section className="rounded-lg border border-border bg-card hairline">
      <header className="flex items-start gap-4 border-b border-border p-5">
        <ScoreRing score={latest?.score || 0} label="score" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-medium text-foreground">{url}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className={`inline-flex items-center gap-1 font-mono text-[11px] tabular ${trendTone}`}>
              <Trend className="h-3 w-3" />{growth > 0 ? '+' : ''}{growth}% wk
            </span>
            {latest?.provenance && <Provenance value={latest.provenance} />}
            {goalMet && (
              <span className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">
                <Trophy className="h-2.5 w-2.5" /> top 3
              </span>
            )}
            {latest?.blocked_count > 0 && (
              <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-2.5 w-2.5" /> {latest.blocked_count} blocked
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-4 border-b border-border p-5 sm:grid-cols-6">
        <Metric label="Best rank" value={latest?.best_rank ? `#${latest.best_rank}` : '—'} />
        <Metric label="Avg rank" value={latest?.avg_rank ? `#${latest.avg_rank}` : '—'} />
        <Metric label="Top 3" value={`${latest?.queries_top3 || 0}/${latest?.queries_tracked || 0}`} />
        <Metric label="Page one" value={`${latest?.queries_page_one || 0}/${latest?.queries_tracked || 0}`} />
        <Metric label="Impressions" value={(latest?.impressions || 0).toLocaleString()} />
        <Metric label="Est. traffic" value={(latest?.traffic_estimate || 0).toLocaleString()} />
      </div>

      <div className="p-5 pt-3">
        <WeeklyScoreChart series={series} height={180} />
      </div>
    </section>
  );
}