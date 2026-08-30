import React, { useState } from 'react';
import { Lightbulb, X, Check, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTenant } from '@/lib/TenantContext';
import { useTenantData } from '@/lib/useTenantData';
import { Button } from '@/components/ui/button';

// Inline lightbulb suggestion layer — mirrors the Base44 suggestion pattern.
export default function SuggestionLightbulb({ surface = 'sheet' }) {
  const { clientId } = useTenant();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { rows, loading, reload } = useTenantData('Suggestion', { status: 'new' }, '-priority_score');

  const generate = async () => {
    if (!clientId) return;
    setBusy(true);
    try {
      await base44.functions.invoke('AreSuggest', { client_id: clientId, surface });
      reload();
    } finally { setBusy(false); }
  };

  const act = async (s, status) => {
    await base44.entities.Suggestion.update(s.id, { status });
    if (status === 'adopted' && s.url) {
      const matches = await base44.entities.AreSheetRow.filter({ client_id: clientId, url: s.url, query: s.query });
      if (matches[0]) {
        await base44.entities.AreSheetRow.update(matches[0].id, {
          status: 'queued',
          recommended_treatment: s.treatment,
          evidence_tier: s.evidence_tier,
          priority_score: s.priority_score,
        });
      }
    }
    reload();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-card text-primary shadow-lg transition-transform duration-300 hover:scale-105"
        aria-label="Suggestions"
      >
        <Lightbulb className="h-5 w-5" />
        {rows.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-semibold text-primary-foreground">
            {rows.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-foreground/20 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <aside
            className="flex h-full w-full max-w-md flex-col border-l border-border bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <h2 className="font-heading text-sm font-medium">Suggestions</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="border-b border-border px-5 py-3">
              <Button size="sm" variant="outline" className="w-full" onClick={generate} disabled={busy || !clientId}>
                {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-2 h-3.5 w-3.5" />}
                Scan for enhancements & gaps
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
              {!loading && !rows.length && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  No open suggestions. Run a scan — every suggestion is anchored to a Google-confirmed factor or a measured experiment.
                </p>
              )}
              <ul className="space-y-3">
                {rows.map((s) => (
                  <li key={s.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-heading text-[13px] font-medium leading-snug text-foreground">{s.title}</p>
                      <span className="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        {s.gap_type}
                      </span>
                    </div>
                    {s.rationale && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.rationale}</p>}
                    {s.treatment && (
                      <p className="mt-2 rounded border border-border bg-muted/40 px-2.5 py-2 font-mono text-[11px] leading-relaxed text-foreground">
                        {s.treatment}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
                      <span>{s.evidence_tier}</span>
                      <span>p_cross {s.p_cross}</span>
                      <span>+{s.delta_traffic}/mo</span>
                      <span>{s.hours_estimate}h</span>
                      <span className="text-primary">score {s.priority_score}</span>
                    </div>
                    {s.url && <p className="mt-2 truncate font-mono text-[10px] text-muted-foreground">{s.url}{s.query ? ` · ${s.query}` : ''}</p>}
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" className="h-7 flex-1 text-xs" onClick={() => act(s, 'adopted')}>
                        <Check className="mr-1 h-3 w-3" /> Adopt
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => act(s, 'dismissed')}>
                        Dismiss
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}