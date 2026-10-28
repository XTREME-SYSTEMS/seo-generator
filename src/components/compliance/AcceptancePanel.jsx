import React from 'react';
import StatusSelect from './StatusSelect';

const OPTIONS = ['NOT_RUN', 'PASS', 'FAIL', 'BLOCKED'];

export default function AcceptancePanel({ items, onUpdate }) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No checklist items match this filter.</p>;
  }
  return (
    <div className="divide-y divide-border">
      {items.map((a) => (
        <div key={a.id} className="py-3 flex items-start gap-3">
          <span className="font-mono text-[11px] font-bold text-muted-foreground w-12 shrink-0 pt-1">{a.item_id}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{a.requirement}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5"><span className="font-semibold">Evidence:</span> {a.evidence_definition}</p>
            {a.release_consequence && (
              <p className="text-[11px] text-slate-600 mt-0.5"><span className="font-semibold">If not met:</span> {a.release_consequence}</p>
            )}
            {a.receipt && <p className="font-mono text-[10px] text-muted-foreground/80 mt-1 break-all">{a.receipt}</p>}
          </div>
          <StatusSelect value={a.status} options={OPTIONS} onChange={(s) => onUpdate(a.id, s)} />
        </div>
      ))}
    </div>
  );
}