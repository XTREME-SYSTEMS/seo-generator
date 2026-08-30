import React from 'react';

export default function ScoreRing({ score = 0, size = 56, label }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Number(score) || 0));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="4" strokeLinecap="round"
          stroke={pct >= 90 ? 'hsl(var(--chart-1))' : pct >= 50 ? 'hsl(var(--chart-3))' : 'hsl(var(--muted-foreground))'}
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-[13px] font-semibold tabular leading-none text-foreground">{Math.round(pct)}</span>
        {label && <span className="mt-0.5 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}