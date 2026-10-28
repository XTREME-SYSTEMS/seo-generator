import React from 'react';
import StatusSelect from '@/components/compliance/StatusSelect';

const OPTIONS = ['OPEN', 'MITIGATING', 'MITIGATED', 'CLOSED'];

const SEV = {
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
  MEDIUM: 'bg-slate-50 text-slate-600 border-slate-200',
  LOW: 'bg-slate-50 text-slate-600 border-slate-200',
};

export default function RiskPanel({ items, onUpdate }) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No risks logged.</p>;
  }
  return (
    <div className="divide-y divide-border">
      {items.map((r) => (
        <div key={r.id} className="py-2.5 flex items-start gap-3">
          <span className="font-mono text-[11px] font-bold text-muted-foreground w-10 shrink-0 pt-1">{r.risk_id}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm text-foreground">{r.risk}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${SEV[r.severity] || SEV.HIGH}`}>{r.severity}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5"><span className="font-semibold">Mitigation:</span> {r.mitigation}</p>
          </div>
          <StatusSelect value={r.status} options={OPTIONS} onChange={(s) => onUpdate(r.id, s)} />
        </div>
      ))}
    </div>
  );
}