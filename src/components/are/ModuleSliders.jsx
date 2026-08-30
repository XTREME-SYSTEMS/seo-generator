import React from 'react';
import { Slider } from '@/components/ui/slider';
import { MODULES } from '@/lib/projection';

export default function ModuleSliders({ values, onChange }) {
  return (
    <div className="space-y-4">
      {MODULES.map((m) => (
        <div key={m.key}>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="truncate text-xs font-medium text-foreground">{m.label}</span>
            <span className="flex shrink-0 items-center gap-2">
              <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                m.tier === 'proven'
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300'
              }`}
              >
                {m.tier}
              </span>
              <span className="w-8 text-right font-mono text-[11px] tabular text-muted-foreground">
                {values[m.key] ?? m.default}
              </span>
            </span>
          </div>
          <Slider
            value={[values[m.key] ?? m.default]}
            min={0}
            max={100}
            step={5}
            onValueChange={([v]) => onChange({ ...values, [m.key]: v })}
          />
        </div>
      ))}
    </div>
  );
}