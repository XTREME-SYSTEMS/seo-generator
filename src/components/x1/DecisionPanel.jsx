import React from 'react';
import StatusSelect from '@/components/compliance/StatusSelect';

const OPTIONS = ['ADOPTED', 'PROPOSED', 'REJECTED', 'SUPERSEDED'];

export default function DecisionPanel({ items, onUpdate }) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No decisions recorded.</p>;
  }
  return (
    <div className="divide-y divide-border">
      {items.map((d) => (
        <div key={d.id} className="py-2.5 flex items-start gap-3">
          <span className="font-mono text-[11px] font-bold text-muted-foreground w-10 shrink-0 pt-1">{d.decision_id}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{d.decision}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{d.reason}</p>
          </div>
          <StatusSelect value={d.status} options={OPTIONS} onChange={(s) => onUpdate(d.id, s)} />
        </div>
      ))}
    </div>
  );
}