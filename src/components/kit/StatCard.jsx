import React from 'react';
import Provenance from './Provenance';

export default function StatCard({ label, value, provenance, hint }) {
  const unknown = !provenance || provenance === 'UNKNOWN' || provenance === 'UNAUTHORIZED_UNKNOWN';
  return (
    <div className="rounded-lg border border-border bg-card p-5 hairline transition-colors duration-300 hover:border-primary/30">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className={`mt-3 font-heading text-2xl font-semibold tabular ${unknown ? 'text-muted-foreground' : 'text-foreground'}`}>
        {unknown && (value === null || value === undefined || value === '') ? 'UNKNOWN' : value}
      </div>
      <div className="mt-3 flex items-center gap-2">
        {provenance && <Provenance value={provenance} />}
        {hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}