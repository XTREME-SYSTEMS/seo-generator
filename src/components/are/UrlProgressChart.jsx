import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';

// Per-URL rank-progress timeline with automated-improvement deployments overlaid
// as markers. Score = rank progress toward top 3 (100 = primary query holds top 3).

function mondayISO(d) {
  const dt = new Date(d);
  const day = (dt.getUTCDay() + 6) % 7; // Mon = 0
  dt.setUTCDate(dt.getUTCDate() - day);
  return dt.toISOString().slice(0, 10);
}

const STATUS_TONE = {
  pass: 'text-emerald-400',
  fail: 'text-red-400',
  pending: 'text-amber-400',
  not_applicable: 'text-muted-foreground',
};

function ProgressTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded border border-border bg-popover p-2.5 text-xs shadow" style={{ maxWidth: 280 }}>
      <div className="font-mono text-[10px] text-muted-foreground">Week of {d.week}</div>
      <div className="mt-1 text-foreground">
        Score <span className="font-semibold tabular">{d.score}</span>
        <span className="mx-1 text-muted-foreground">·</span>
        Best rank <span className="font-semibold tabular">#{d.bestRank ?? '—'}</span>
      </div>
      <div className="text-muted-foreground">Treatments deployed: {d.treatments}</div>
      {d.events.length > 0 && (
        <div className="mt-1.5 space-y-1.5 border-t border-border pt-1.5">
          {d.events.map((e, i) => (
            <div key={i}>
              <div className="text-foreground">{(e.deployed || 'Automated treatment').slice(0, 90)}</div>
              <div className={STATUS_TONE[e.validation_status] || 'text-muted-foreground'}>
                {e.validation_status} · expected {e.expected_score ?? '—'} → measured {e.measured_score ?? '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UrlProgressChart({ snapshots = [], reflections = [], height = 240 }) {
  if (!snapshots.length) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
        No weekly snapshots yet — run a reflect pass to start the timeline.
      </div>
    );
  }
  const byWeek = {};
  reflections.forEach((r) => {
    if (!r.occurred_at) return;
    const wk = mondayISO(r.occurred_at);
    (byWeek[wk] = byWeek[wk] || []).push(r);
  });
  const data = snapshots.map((s) => {
    const wk = s.week_start;
    const events = byWeek[wk] || [];
    return {
      label: wk.slice(5),
      week: wk,
      score: s.score || 0,
      bestRank: s.best_rank ?? null,
      treatments: s.treatments_deployed || 0,
      events,
    };
  });
  const deployWeeks = data.filter((d) => d.events.length > 0);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 10, left: -22, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <Tooltip content={<ProgressTooltip />} />
          <ReferenceLine y={100} stroke="hsl(var(--chart-1))" strokeDasharray="3 3" label={{ value: 'Top 3', fontSize: 9, fill: 'hsl(var(--chart-1))', position: 'insideTopRight' }} />
          {deployWeeks.map((d) => (
            <ReferenceLine
              key={d.week}
              x={d.label}
              stroke="hsl(var(--primary))"
              strokeDasharray="4 2"
              label={{ value: `▲${d.events.length}`, fontSize: 9, fill: 'hsl(var(--primary))', position: 'top' }}
            />
          ))}
          <Line
            type="monotone"
            dataKey="score"
            name="Score"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 2.5, fill: 'hsl(var(--primary))' }}
            activeDot={{ r: 4 }}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}