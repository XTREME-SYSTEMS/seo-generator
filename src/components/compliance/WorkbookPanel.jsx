import React, { useMemo, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WorkbookPanel({ records }) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState(null);

  const sheets = useMemo(() => {
    const map = {};
    for (const r of records) {
      const key = r.sheet_name;
      if (!map[key]) map[key] = { group: r.sheet_group, columns: r.columns || [], rows: [] };
      map[key].rows.push(r);
    }
    for (const k of Object.keys(map)) map[k].rows.sort((a, b) => a.row_index - b.row_index);
    return map;
  }, [records]);

  const names = Object.keys(sheets).sort();
  const activeName = picked && sheets[picked] ? picked : names[0];
  const active = sheets[activeName];

  const rows = useMemo(() => {
    if (!active) return [];
    const q = query.trim().toLowerCase();
    if (!q) return active.rows;
    return active.rows.filter((r) => (r.row_data || '').toLowerCase().includes(q));
  }, [active, query]);

  if (!names.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No reference sheets loaded yet.</p>;
  }

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-4">
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="px-3 py-2 border-b border-border flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{names.length} sheets</span>
        </div>
        <div className="max-h-[560px] overflow-y-auto">
          {names.map((n) => (
            <button
              key={n}
              onClick={() => setPicked(n)}
              className={cn(
                'w-full text-left px-3 py-2 text-xs border-b border-border/60 transition-colors',
                n === activeName ? 'bg-primary/10 font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted/60'
              )}
            >
              <span className="block truncate">{n}</span>
              <span className="block text-[10px] text-muted-foreground/70">{sheets[n].rows.length} rows</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search this sheet..."
              className="input pl-8 py-1.5 text-xs"
            />
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">{active?.group}</span>
        </div>
        <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
          {rows.map((r) => {
            let data = {};
            try { data = JSON.parse(r.row_data || '{}'); } catch { data = {}; }
            return (
              <div key={r.id} className="border border-border rounded-lg bg-card p-3">
                <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                  {Object.entries(data).filter(([, v]) => v != null && String(v).trim() !== '').map(([k, v]) => (
                    <div key={k} className="text-[11px] leading-snug">
                      <span className="text-muted-foreground">{k}: </span>
                      <span className="text-foreground break-words">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {!rows.length && <p className="text-sm text-muted-foreground py-6 text-center">No rows match your search.</p>}
        </div>
      </div>
    </div>
  );
}