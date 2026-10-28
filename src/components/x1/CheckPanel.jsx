import React from 'react';
import StatusSelect from '@/components/compliance/StatusSelect';

const OPTIONS = ['NOT_RUN', 'PASS', 'FAIL', 'BLOCKED'];

export default function CheckPanel({ items, onUpdate }) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No checks yet.</p>;
  }
  return (
    <div className="divide-y divide-border">
      {items.map((c) => (
        <div key={c.id} className="py-2.5 flex items-start gap-3">
          <span className="font-mono text-[11px] font-bold text-muted-foreground w-10 shrink-0 pt-1">{c.check_id}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground">{c.check}</p>
            {c.evidence && <p className="text-[11px] text-muted-foreground mt-0.5"><span className="font-semibold">Evidence:</span> {c.evidence}</p>}
            {c.next_action && <p className="text-[11px] text-amber-700 mt-0.5"><span className="font-semibold">Next:</span> {c.next_action}</p>}
          </div>
          <StatusSelect value={c.status} options={OPTIONS} onChange={(s) => onUpdate(c.id, s)} />
        </div>
      ))}
    </div>
  );
}