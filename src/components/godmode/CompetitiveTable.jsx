import React from 'react';
import { CheckCircle2, XCircle, Crown } from 'lucide-react';

export default function CompetitiveTable({ competitors }) {
  if (!competitors || competitors.length === 0) return null;

  // Add "us" as the benchmark row
  const usRow = {
    name: 'SEO Generator (Us)',
    url: '#',
    max_autonomy: 100,
    max_simulation: 100,
    max_browser: 100,
    max_generation: 100,
    max_audit: 100,
    one_button: true,
    price: 'All-inclusive',
    our_advantage: 'We are the benchmark — everything else falls short',
    is_us: true,
  };

  const rows = [usRow, ...competitors];

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Crown className="w-5 h-5 text-yellow-500" />
        <h3 className="font-bold text-foreground">Competitive Benchmark — Us vs. Everyone Online</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 px-2 font-semibold text-foreground">Platform</th>
              <th className="py-2 px-2 font-semibold text-center text-foreground">Autonomy</th>
              <th className="py-2 px-2 font-semibold text-center text-foreground">Simulation</th>
              <th className="py-2 px-2 font-semibold text-center text-foreground">Browser</th>
              <th className="py-2 px-2 font-semibold text-center text-foreground">Generation</th>
              <th className="py-2 px-2 font-semibold text-center text-foreground">Audit</th>
              <th className="py-2 px-2 font-semibold text-center text-foreground">1-Button</th>
              <th className="py-2 px-2 font-semibold text-foreground">Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => (
              <tr key={i} className={`border-b border-border/50 ${c.is_us ? 'bg-yellow-50 font-bold' : ''}`}>
                <td className="py-2 px-2">
                  <span className={c.is_us ? 'text-yellow-700' : 'text-foreground'}>{c.name}</span>
                </td>
                <td className="py-2 px-2 text-center">
                  <ScoreBar value={c.max_autonomy} />
                </td>
                <td className="py-2 px-2 text-center">
                  <ScoreBar value={c.max_simulation} />
                </td>
                <td className="py-2 px-2 text-center">
                  <ScoreBar value={c.max_browser} />
                </td>
                <td className="py-2 px-2 text-center">
                  <ScoreBar value={c.max_generation} />
                </td>
                <td className="py-2 px-2 text-center">
                  <ScoreBar value={c.max_audit} />
                </td>
                <td className="py-2 px-2 text-center">
                  {c.one_button ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 inline" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 inline" />
                  )}
                </td>
                <td className="py-2 px-2 text-xs text-muted-foreground">{c.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {competitors.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-foreground">Our Unfair Advantages:</p>
          {competitors.slice(0, 5).map((c, i) => (
            <div key={i} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-yellow-500 font-bold shrink-0">vs {c.name}:</span>
              <span>{c.our_advantage}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ value }) {
  const v = value || 0;
  const color = v >= 90 ? 'bg-green-500' : v >= 70 ? 'bg-yellow-400' : v >= 40 ? 'bg-orange-400' : 'bg-red-400';
  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${v}%` }} />
      </div>
      <span className="text-xs tabular text-foreground">{v}</span>
    </div>
  );
}