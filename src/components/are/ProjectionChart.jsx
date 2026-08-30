import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';

export default function ProjectionChart({ curve = [], targetRank = 3, height = 240 }) {
  const max = Math.max(...curve.map((p) => p.rank), targetRank + 5);
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={curve} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="projFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <YAxis reversed domain={[1, Math.ceil(max)]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <ReferenceLine y={targetRank} stroke="hsl(var(--chart-1))" strokeDasharray="3 3" label={{ value: `Target #${targetRank}`, fontSize: 9, fill: 'hsl(var(--chart-1))', position: 'insideTopRight' }} />
          <Tooltip
            formatter={(v) => [`#${v}`, 'Projected rank']}
            contentStyle={{
              background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))',
              borderRadius: 6, fontSize: 11, color: 'hsl(var(--popover-foreground))',
            }}
          />
          <Area type="monotone" dataKey="rank" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#projFill)" animationDuration={500} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}