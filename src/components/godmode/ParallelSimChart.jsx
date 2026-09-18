import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell,
} from 'recharts';

const COLORS = [
  '#FFD700', '#FFC107', '#FFB300', '#FFA000', '#FF8F00',
  '#FF6F00', '#FF5722', '#E65100', '#BF360C', '#311B92',
];

export default function ParallelSimChart({ simulations }) {
  if (!simulations || simulations.length === 0) return null;

  const data = simulations.map((s) => ({
    name: s.strategy_name.length > 18 ? s.strategy_name.slice(0, 16) + '…' : s.strategy_name,
    fullName: s.strategy_name,
    medianROI: s.median_roi,
    p10: s.p10_roi,
    p90: s.p90_roi,
    successRate: s.success_rate,
  }));

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-foreground">Parallel Strategy Simulation</h3>
          <p className="text-xs text-muted-foreground">100 Monte Carlo iterations × 10 strategies — median ROI with P10–P90 confidence bands</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-bold">1,000 SIMULATIONS</span>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            angle={-35}
            textAnchor="end"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            interval={0}
          />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-xs">
                  <p className="font-bold text-foreground mb-1">{d.fullName}</p>
                  <p className="text-yellow-600">Median ROI: {d.medianROI?.toLocaleString()}%</p>
                  <p className="text-red-500">P10 (worst): {d.p10?.toLocaleString()}%</p>
                  <p className="text-green-600">P90 (best): {d.p90?.toLocaleString()}%</p>
                  <p className="text-muted-foreground">Success Rate: {d.successRate}%</p>
                </div>
              );
            }}
          />
          <Bar dataKey="medianROI" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}