import React from 'react';
import Panel from '@/components/kit/Panel';
import EmptyState from '@/components/kit/EmptyState';
import StatusPill from '@/components/kit/StatusPill';

const SYSTEM_TONE = {
  RETRIEVAL: 'bad',
  CANDIDATE_SELECTION: 'warn',
  RE_RANKING: 'info',
  PRESENTATION: 'sim'
};

export default function AsymmetryQueue({ items }) {
  const sorted = [...items].sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));

  return (
    <Panel
      title="Asymmetry queue"
      subtitle="Ranked by (probability of crossing a boundary × traffic value) ÷ hours of work"
      right={<span className="font-mono text-[10px] text-muted-foreground">{sorted.length} OPEN</span>}
    >
      {sorted.length === 0 ? (
        <EmptyState
          title="No asymmetries detected yet"
          description="Register URLs, run a Search Console sync, then scan. The queue fills from measured evidence only."
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((a) => (
            <div key={a.id} className="rounded border border-border bg-muted/20 p-3">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <StatusPill tone={SYSTEM_TONE[a.targeted_system] || 'idle'}>{a.targeted_system.replace(/_/g, ' ')}</StatusPill>
                <span className="font-mono text-[10px] text-muted-foreground">{a.asymmetry_class}</span>
                <span className="font-mono text-[10px] text-muted-foreground">→ {a.boundary_target.replace(/_/g, ' ')}</span>
                <span className="ml-auto font-mono text-xs font-semibold tabular text-primary">{a.priority_score}</span>
              </div>
              <p className="text-sm leading-snug text-foreground">{a.signal}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{a.recommended_treatment}</p>
              <div className="mt-2 flex flex-wrap gap-3 font-mono text-[10px] text-muted-foreground">
                <span>P {Math.round((a.p_cross || 0) * 100)}%</span>
                <span>{a.hours_estimate}h</span>
                <span>{a.latency_class}</span>
                {a.query && <span className="truncate">“{a.query}”</span>}
              </div>
              <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground/70">{a.url}</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}