import React from 'react';
import { Loader2, CheckCircle2, Circle, XCircle } from 'lucide-react';

export default function StageProgress({ stages }) {
  if (!stages) return null;

  const stageLabels = {
    parallel_simulation: 'Parallel Simulation (100×10)',
    winner_identified: 'Winner Identified',
    golden_eggs_discovered: 'Golden Eggs Discovered',
    competitive_benchmark: 'Competitive Benchmark',
    valuation_calculated: 'Valuation Calculated',
    autonomous_audit: 'Autonomous Audit',
    site_generated: 'Programmatic Site Generated',
  };

  const stageOrder = [
    'parallel_simulation',
    'winner_identified',
    'golden_eggs_discovered',
    'competitive_benchmark',
    'valuation_calculated',
    'autonomous_audit',
    'site_generated',
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-bold text-foreground mb-4">Pipeline Stages</h3>
      <div className="space-y-2">
        {stageOrder.map((stage) => {
          const s = stages[stage];
          if (!s) return null;
          const isOk = s.status === 'ok';
          const isSkipped = s.status === 'skipped';
          const isDegraded = s.status === 'degraded';
          const Icon = isOk ? CheckCircle2 : isSkipped ? Circle : isDegraded ? XCircle : Loader2;
          const color = isOk ? 'text-green-500' : isSkipped ? 'text-muted-foreground' : isDegraded ? 'text-orange-500' : 'text-yellow-500 animate-spin';

          return (
            <div key={stage} className="flex items-center gap-3">
              <Icon className={`w-4 h-4 ${color} shrink-0`} />
              <div className="flex-1">
                <span className={`text-sm ${isOk ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {stageLabels[stage] || stage}
                </span>
              </div>
              {s.strategy && <span className="text-xs text-yellow-600 font-bold">{s.strategy}</span>}
              {s.value && <span className="text-xs text-green-600 font-bold">${(s.value / 1000000).toFixed(1)}M</span>}
              {s.count !== undefined && <span className="text-xs text-muted-foreground">{s.count} found</span>}
              {s.median_roi !== undefined && <span className="text-xs text-yellow-600 font-bold">{s.median_roi}% ROI</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}