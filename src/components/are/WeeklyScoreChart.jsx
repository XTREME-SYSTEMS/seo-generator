import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';

// Week-by-week composite score movement. Score = rank progress toward top 3.
export default function WeeklyScoreChart({ series = [], height = 220 }) {
  if (!series.length) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
        No weekly snapshots yet — the engine writes one per URL each week.
      </div>
    );
  }
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <ReferenceLine y={100} stroke="hsl(var(--chart-1))" strokeDasharray="3 3" label={{ value: 'Top 3', fontSize: 9, fill: 'hsl(var(--chart-1))', position: 'insideTopRight' }} />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))',
              borderRadius: 6, fontSize: 11, color: 'hsl(var(--popover-foreground))',
            }}
          />
          <Line
            type="monotone" dataKey="score" name="Score"
            stroke="hsl(var(--primary))" strokeWidth={2}
            dot={{ r: 2.5, fill: 'hsl(var(--primary))' }} activeDot={{ r: 4 }}
            animationDuration={900} animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}