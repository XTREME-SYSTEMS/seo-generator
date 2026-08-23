import React from 'react';

const STYLES = {
  MEASURED: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  PROVIDER: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  FIRST_PARTY: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
  INFERRED: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  MODELED: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  OPERATOR_ESTIMATE: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  UNKNOWN: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
  UNAUTHORIZED_UNKNOWN: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
  SIMULATION: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  REALITY: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
};

export default function Provenance({ value, className = '' }) {
  const key = (value || 'UNKNOWN').toUpperCase();
  const label = key === 'UNAUTHORIZED_UNKNOWN' ? 'UNAUTHORIZED' : key.replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${STYLES[key] || STYLES.UNKNOWN} ${className}`}>
      {label}
    </span>
  );
}