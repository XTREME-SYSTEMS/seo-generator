import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

function Card({ label, value, total, tone }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="border border-border rounded-lg bg-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="font-heading text-2xl font-bold text-foreground">{value}</span>
        <span className="text-sm text-muted-foreground">/ {total}</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ReadinessOverview({ counts, verdict, blockers }) {
  return (
    <div className="space-y-4">
      <div className={`rounded-lg border p-3 flex items-start gap-2.5 ${verdict.released ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
        {verdict.released ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        )}
        <div>
          <p className={`text-sm font-bold ${verdict.released ? 'text-emerald-800' : 'text-red-800'}`}>Release status: {verdict.released ? 'CLEARED' : 'BLOCKED'}</p>
          <p className={`text-[11px] mt-0.5 ${verdict.released ? 'text-emerald-700' : 'text-red-700'}`}>{verdict.reason}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <Card label="Tasks passed" value={counts.tasksDone} total={counts.tasksTotal} tone="bg-primary" />
        <Card label="Checks passed" value={counts.checksDone} total={counts.checksTotal} tone="bg-emerald-500" />
        <Card label="Risks still open" value={counts.risksOpen} total={counts.risksTotal} tone="bg-red-500" />
        <Card label="Decisions adopted" value={counts.decisionsAdopted} total={counts.decisionsTotal} tone="bg-primary" />
      </div>

      {blockers.length > 0 && (
        <div className="border border-border rounded-lg bg-card p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">What is holding release</h3>
          </div>
          <ul className="space-y-1">
            {blockers.map((b) => (
              <li key={b} className="text-[11px] text-foreground">· {b}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="border border-border rounded-lg bg-card p-4">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Snapshot provenance</h3>
        <p className="text-[11px] text-foreground leading-relaxed">
          987 source files, 41 of 48 node tests passing on the raw snapshot, live Git SHA unknown, live cloud verification not run.
          No production mutations were made. Everything here reflects the uploaded snapshot only — a PASS must be re-proved against the live deployment.
        </p>
      </div>
    </div>
  );
}