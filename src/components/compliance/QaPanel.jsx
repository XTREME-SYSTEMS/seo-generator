import React from 'react';
import StatusSelect from './StatusSelect';

const OPTIONS = ['NOT_RUN', 'PASS', 'FAIL', 'BLOCKED'];

const SEV = {
  P0: 'bg-red-50 text-red-700 border-red-200',
  P1: 'bg-amber-50 text-amber-700 border-amber-200',
  P2: 'bg-slate-50 text-slate-600 border-slate-200',
};

export default function QaPanel({ items, onUpdate }) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No tests match this filter.</p>;
  }
  return (
    <div className="divide-y divide-border">
      {items.map((t) => (
        <div key={t.id} className="py-3 flex items-start gap-3">
          <span className="font-mono text-[11px] font-bold text-muted-foreground w-12 shrink-0 pt-1">{t.test_id}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground">{t.test}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${SEV[t.severity] || SEV.P1}`}>{t.severity}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              <span className="font-semibold">{t.suite}</span> · {t.runner}
            </p>
            <p className="text-[11px] text-muted-foreground/80 mt-1"><span className="font-semibold">Expected:</span> {t.expected_result}</p>
          </div>
          <StatusSelect value={t.status} options={OPTIONS} onChange={(s) => onUpdate(t.id, s)} />
        </div>
      ))}
    </div>
  );
}