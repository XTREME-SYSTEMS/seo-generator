import React, { useState } from 'react';
import { Radar, Target, Rocket, ChevronDown, Info } from 'lucide-react';

const STEPS = [
  {
    icon: Radar,
    label: 'Monitor',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/30',
    title: 'The system watches your rankings',
    body: 'We track your target search queries across all 50 states. Every 6 hours, AI scans the web for new SEO strategies and stores them automatically.',
  },
  {
    icon: Target,
    label: 'Plan',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    title: 'Opportunities are scored and prioritized',
    body: 'Each query passes through two gates: Gate 1 checks if it\u2019s worth ranking for (volume, intent, difficulty). Gate 2 checks if it\u2019s safe to pursue. The router then decides: fastpath, experiment, or hold.',
  },
  {
    icon: Rocket,
    label: 'Execute',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    title: 'Approved actions are deployed and measured',
    body: 'Sprint plans are created automatically. Results are tracked with proof levels \u2014 0 means theory only, 7 means confirmed across multiple live deployments.',
  },
];

const PROVENANCE_LABELS = [
  { label: 'MEASURED', tone: 'text-emerald-400', desc: 'Real, verified data from direct observation' },
  { label: 'PROVIDER', tone: 'text-sky-400', desc: 'Data from Google or another external source' },
  { label: 'INFERRED', tone: 'text-amber-400', desc: 'Calculated from other data points' },
  { label: 'MODELED', tone: 'text-zinc-400', desc: 'Estimated or predicted, not yet verified' },
];

export default function SystemGuide() {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <Info className="h-4 w-4 text-primary" />
          <span className="font-heading text-sm font-semibold text-foreground">How to read and operate this system</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-border px-5 py-5">
          {/* 3-step flow */}
          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.label} className="relative">
                <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border ${step.bg}`}>
                  <step.icon className={`h-5 w-5 ${step.color}`} />
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Step {i + 1}</span>
                  <span className="font-heading text-sm font-semibold text-foreground">{step.label}</span>
                </div>
                <p className="text-xs font-medium text-foreground">{step.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
                {i < STEPS.length - 1 && (
                  <div className="absolute -right-2 top-4 hidden text-muted-foreground/40 md:block">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Provenance legend */}
          <div className="mt-6 rounded-lg border border-border bg-background/50 p-4">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Provenance — what the colored labels mean</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PROVENANCE_LABELS.map((p) => (
                <div key={p.label} className="flex items-start gap-2">
                  <span className={`mt-0.5 font-mono text-[10px] font-bold ${p.tone}`}>{p.label}</span>
                  <span className="text-xs leading-relaxed text-muted-foreground">{p.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Proof level + gates */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Proof levels (0\u20137)</p>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <div
                    key={n}
                    className="flex h-6 w-7 items-center justify-center rounded text-[10px] font-bold"
                    style={{
                      backgroundColor: `hsl(43, ${20 + n * 8}%, ${15 + n * 5}%)`,
                      color: n >= 4 ? '#1a1a1a' : '#e0e0e0',
                    }}
                  >
                    {n}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">0</span> = theory only &middot; <span className="font-medium text-foreground">7</span> = confirmed across multiple live deployments
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Gate system</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-12 items-center justify-center rounded border border-amber-500/30 bg-amber-500/10 text-[10px] font-bold text-amber-400">Gate 1</span>
                  <span className="text-xs text-muted-foreground">Is this query worth ranking for?</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-12 items-center justify-center rounded border border-emerald-500/30 bg-emerald-500/10 text-[10px] font-bold text-emerald-400">Gate 2</span>
                  <span className="text-xs text-muted-foreground">Is it safe to execute?</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}