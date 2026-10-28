import React from 'react';
import StatusSelect from '@/components/compliance/StatusSelect';

const OPTIONS = ['NOT_RUN', 'IN_PROGRESS', 'PASS', 'FAIL', 'BLOCKED'];

export default function TaskPanel({ items, onUpdate }) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No tasks yet.</p>;
  }
  const stages = [...new Set(items.map((t) => t.stage))];

  return (
    <div className="space-y-5">
      {stages.map((stage) => {
        const rows = items.filter((t) => t.stage === stage);
        const done = rows.filter((r) => r.status === 'PASS').length;
        return (
          <div key={stage}>
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-foreground">{stage}</h3>
              <span className="text-[10px] text-muted-foreground">{done}/{rows.length} passed</span>
            </div>
            <div className="divide-y divide-border border-t border-border">
              {rows.map((t) => (
                <div key={t.id} className="py-2.5 flex items-start gap-3">
                  <span className="font-mono text-[11px] font-bold text-muted-foreground w-10 shrink-0 pt-1">{t.task_id}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{t.task}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5"><span className="font-semibold">Evidence:</span> {t.acceptance_evidence}</p>
                  </div>
                  <StatusSelect value={t.status} options={OPTIONS} onChange={(s) => onUpdate(t.id, s)} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}