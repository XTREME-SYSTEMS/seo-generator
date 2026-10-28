import React from 'react';
import StatusSelect from './StatusSelect';

const OPTIONS = ['NOT_RUN', 'IN_PROGRESS', 'FIXED', 'VERIFIED', 'BLOCKED'];

const SEV = {
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
  MEDIUM: 'bg-slate-50 text-slate-600 border-slate-200',
  LOW: 'bg-slate-50 text-slate-600 border-slate-200',
};

export default function RepairPanel({ items, onUpdate }) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No repairs match this filter.</p>;
  }
  return (
    <div className="divide-y divide-border">
      {items.map((r) => (
        <div key={r.id} className="py-3 flex items-start gap-3">
          <span className="font-mono text-[11px] font-bold text-muted-foreground w-14 shrink-0 pt-1">{r.repair_id}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground">{r.area}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${SEV[r.severity] || SEV.HIGH}`}>{r.severity}</span>
            </div>
            {r.module && <p className="font-mono text-[11px] text-muted-foreground mt-0.5 break-all">{r.module}</p>}
            <p className="text-[11px] text-slate-600 mt-1"><span className="font-semibold">Observed:</span> {r.observation}</p>
            <p className="text-[11px] text-foreground mt-0.5"><span className="font-semibold">Repair:</span> {r.required_repair}</p>
            <p className="text-[11px] text-muted-foreground/80 mt-0.5"><span className="font-semibold">Proves fixed:</span> {r.acceptance_test}</p>
          </div>
          <StatusSelect value={r.status} options={OPTIONS} onChange={(s) => onUpdate(r.id, s)} />
        </div>
      ))}
    </div>
  );
}