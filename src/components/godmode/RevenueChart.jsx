import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function RevenueChart({ projectedMonthly }) {
  if (!projectedMonthly || projectedMonthly.length === 0) return null;

  const data = projectedMonthly.map((m) => ({
    month: `M${m.month}`,
    capital: m.capital,
    revenue: m.revenue,
  }));

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-bold text-foreground mb-1">Winner — Projected Growth Trajectory</h3>
      <p className="text-xs text-muted-foreground mb-4">Best-case Monte Carlo projection — capital and revenue over 36 months</p>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFD700" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#FFD700" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={2} />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-popover border border-border rounded-lg p-2 shadow-lg text-xs">
                  <p className="font-bold text-foreground">{label}</p>
                  {payload.map((p) => (
                    <p key={p.dataKey} className={p.dataKey === 'capital' ? 'text-yellow-600' : 'text-green-600'}>
                      {p.dataKey === 'capital' ? 'Capital' : 'Revenue'}: ${p.value.toLocaleString()}
                    </p>
                  ))}
                </div>
              );
            }}
          />
          <Area type="monotone" dataKey="capital" stroke="#FFD700" strokeWidth={2} fill="url(#capGrad)" />
          <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} fill="url(#revGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}