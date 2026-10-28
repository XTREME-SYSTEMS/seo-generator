import React from 'react';
import StatusSelect from './StatusSelect';

const OPTIONS = ['NOT_RUN', 'PASS', 'FAIL', 'BLOCKED', 'N/A'];

export default function GatePanel({ items, onUpdate }) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No gates match this filter.</p>;
  }
  return (
    <div className="divide-y divide-border">
      {items.map((g) => (
        <div key={g.id} className="py-3 flex items-start gap-3">
          <span className="font-mono text-[11px] font-bold text-muted-foreground w-14 shrink-0 pt-1">{g.gate_id}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground">{g.validation_area}</p>
              {g.criticality === 'BLOCK' && (
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">Block</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{g.release_requirement}</p>
            <p className="text-[11px] text-muted-foreground/80 mt-1"><span className="font-semibold">Evidence:</span> {g.acceptance_evidence}</p>
            {g.prohibited_shortcut && (
              <p className="text-[11px] text-amber-700 mt-0.5"><span className="font-semibold">Never:</span> {g.prohibited_shortcut}</p>
            )}
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1">
            <StatusSelect value={g.status} options={OPTIONS} onChange={(s) => onUpdate(g.id, s)} />
            {g.policy_reference && (
              <a href={g.policy_reference} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-foreground">
                Policy ↗
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}