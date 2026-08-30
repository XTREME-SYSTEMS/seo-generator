import React from 'react';

const LADDER = [
  { key: 'first_index_at', label: 'Indexed' },
  { key: 'first_impression_at', label: 'First impression' },
  { key: 'top100_at', label: 'Top 100' },
  { key: 'top50_at', label: 'Top 50' },
  { key: 'top30_at', label: 'Top 30' },
  { key: 'striking_distance_at', label: '#11–20' },
  { key: 'page_one_at', label: 'Page one' },
  { key: 'top5_at', label: 'Top 5' },
  { key: 'top3_at', label: 'Top 3' }
];

function elapsed(fromIso, toIso) {
  if (!fromIso) return null;
  const hrs = (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 3600000;
  if (hrs < 1) return '<1h';
  if (hrs < 48) return `${Math.round(hrs)}h`;
  return `${Math.round(hrs / 24)}d`;
}

export default function MilestoneClock({ target }) {
  const start = target.clock_started_at || target.created_date;
  return (
    <div className="flex flex-wrap gap-1.5">
      {LADDER.map((m) => {
        const reached = target[m.key];
        const t = reached ? elapsed(start, reached) : null;
        return (
          <span
            key={m.key}
            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium ${
              reached
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border bg-muted/40 text-muted-foreground'
            }`}
          >
            {m.label}
            {reached ? <span className="font-mono tabular">{t}</span> : <span className="font-mono">—</span>}
          </span>
        );
      })}
    </div>
  );
}