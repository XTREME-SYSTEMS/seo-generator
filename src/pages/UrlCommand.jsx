import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { Wrench, Loader2, ChevronRight, RefreshCw, AlertTriangle, CheckSquare, Square, Zap, X } from 'lucide-react';

export default function UrlCommand() {
  const [targets, setTargets] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [asymmetries, setAsymmetries] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [fixing, setFixing] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  async function loadAll() {
    setLoading(true);
    const [t, s, a, att] = await Promise.all([
      base44.entities.UrlTarget.list('-created_date', 500),
      base44.entities.AreSheetRow.list('-priority_score', 500),
      base44.entities.Asymmetry.list('-detected_at', 500),
      base44.entities.FixAttempt.list('-created_at', 200),
    ]);
    setTargets(t); setSheets(s); setAsymmetries(a); setAttempts(att);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  const merged = useMemo(() => {
    const sheetBy = new Map();
    for (const s of sheets) if (s.url) sheetBy.set(s.url, s);
    const asyBy = new Map();
    for (const a of asymmetries) {
      if (!a.url) continue;
      const list = asyBy.get(a.url) || [];
      list.push(a);
      asyBy.set(a.url, list);
    }
    const attBy = new Map();
    for (const at of attempts) {
      if (!at.url) continue;
      const list = attBy.get(at.url) || [];
      list.push(at);
      attBy.set(at.url, list);
    }
    return targets.map((t) => ({
      ...t,
      sheet: sheetBy.get(t.url) || null,
      score: sheetBy.get(t.url)?.score ?? null,
      gap_type: sheetBy.get(t.url)?.gap_type ?? null,
      row_status: sheetBy.get(t.url)?.status ?? null,
      gaps: asyBy.get(t.url) || [],
      attempts: attBy.get(t.url) || [],
    }));
  }, [targets, sheets, asymmetries, attempts]);

  const sorted = useMemo(() => {
    return [...merged].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  }, [merged]);

  async function fixGap(url, gap) {
    setFixing(gap?.id || url);
    try {
      await base44.functions.invoke('FixEngine', {
        url,
        gap_id: gap?.id,
        gap_type: gap?.asymmetry_class || gap?.bottleneck_system || 'SEO',
        max_attempts: 3,
      });
      await loadAll();
    } catch (e) {
      console.error(e);
    } finally {
      setFixing(null);
    }
  }

  async function syncAll() {
    setSyncing(true);
    try {
      await base44.functions.invoke('SyncSearchConsole', { action: 'sync', limit: 100 });
      await loadAll();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  }

  function toggleUrl(url) {
    const next = new Set(selectedUrls);
    if (next.has(url)) next.delete(url);
    else next.add(url);
    setSelectedUrls(next);
  }

  function toggleAll() {
    if (selectedUrls.size === sorted.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(sorted.map((u) => u.url)));
    }
  }

  async function runBulkCycle() {
    if (selectedUrls.size === 0) return;
    setBulkRunning(true);
    setBulkResult(null);
    try {
      const res = await base44.functions.invoke('BulkProcess', {
        urls: [...selectedUrls],
        phases: ['detect', 'suggest', 'implement', 'fix', 'validate'],
      });
      setBulkResult(res);
      await loadAll();
    } catch (e) {
      console.error(e);
      setBulkResult({ error: e.message });
    } finally {
      setBulkRunning(false);
    }
  }

  function clearSelection() {
    setSelectedUrls(new Set());
    setBulkResult(null);
  }

  if (loading) return <Loading label="Loading all URLs" />;

  return (
    <div>
      <PageHeader
        eyebrow="URL Command Center"
        title="All URLs — Score, Gaps & AI Fixes"
        description="Every URL in the system with its live rank-progress score, detected gaps, and one-click AI-assisted fixes with retry-until-resolved. Select multiple URLs to run the full autonomous cycle in bulk."
        actions={
          <button
            onClick={syncAll}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Sync GSC
          </button>
        }
      />

      {/* Bulk Action Bar */}
      {selectedUrls.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium text-foreground">
            {selectedUrls.size} URL{selectedUrls.size !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={runBulkCycle}
            disabled={bulkRunning}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {bulkRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Run Autonomous Cycle on Selected
          </button>
          <button
            onClick={clearSelection}
            disabled={bulkRunning}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
          {bulkResult && (
            <span className={`text-xs ${bulkResult.error ? 'text-red-500' : 'text-emerald-600'}`}>
              {bulkResult.error ? `Error: ${bulkResult.error}` : `✓ Processed ${bulkResult.processed} URLs — detect → suggest → implement → fix → validate`}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Panel title="URL Inventory" subtitle={`${sorted.length} URLs · ${selectedUrls.size} selected`} right={
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              {selectedUrls.size === sorted.length && sorted.length > 0 ? (
                <CheckSquare className="h-3.5 w-3.5 text-primary" onClick={toggleAll} />
              ) : (
                <Square className="h-3.5 w-3.5" onClick={toggleAll} />
              )}
              Select All
            </label>
          }>
            {sorted.length === 0 ? (
              <EmptyState title="No URLs" description="Sync Google Search Console to load URLs." />
            ) : (
              <div className="max-h-[70vh] overflow-y-auto divide-y divide-border">
                {sorted.map((u) => (
                  <div
                    key={u.id}
                    className={`flex w-full items-center gap-2 px-1 py-2.5 text-left hover:bg-accent/50 ${selected?.id === u.id ? 'bg-accent/70' : ''}`}
                  >
                    <button
                      onClick={() => toggleUrl(u.url)}
                      className="shrink-0 p-1"
                      title="Select for bulk processing"
                    >
                      {selectedUrls.has(u.url) ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => setSelected(u)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <ScoreBadge score={u.score} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium text-foreground">{u.url}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{u.index_state || 'UNOBSERVED'}</span>
                          <span>·</span>
                          <span>{u.url_state || 'NEW'}</span>
                          {u.gaps.length > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-amber-600">{u.gaps.length} gap(s)</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <Panel title="URL Detail & Fixes" subtitle={selected.url}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <ScoreBadge score={selected.score} large />
                  <div>
                    <div className="text-xs text-muted-foreground">Rank-progress to TOP 3</div>
                    <div className="font-heading text-sm font-medium text-foreground">
                      {selected.score != null ? `${selected.score}/100` : 'Unscored'}
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
                  <Row k="Index state" v={selected.index_state || 'UNOBSERVED'} />
                  <Row k="URL state" v={selected.url_state || 'NEW_NO_HISTORY'} />
                  <Row k="Canonical agrees" v={selected.canonical_agrees ? 'Yes' : 'No'} />
                  <Row k="GSC property" v={selected.gsc_property || '—'} />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detected Gaps</h3>
                    {selected.gaps.length > 0 && (
                      <button
                        onClick={() => fixGap(selected.url, selected.gaps[0])}
                        disabled={fixing === selected.gaps[0]?.id || fixing === selected.url}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        {fixing === selected.gaps[0]?.id || fixing === selected.url ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wrench className="h-3 w-3" />}
                        AI Fix All
                      </button>
                    )}
                  </div>
                  {selected.gaps.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No open gaps detected. Run asymmetry detection to scan.</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.gaps.map((g) => (
                        <div key={g.id} className="rounded-md border border-border p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] font-medium text-amber-600">{g.asymmetry_class}</span>
                            <button
                              onClick={() => fixGap(selected.url, g)}
                              disabled={fixing === g.id}
                              className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] font-medium hover:bg-accent disabled:opacity-50"
                            >
                              {fixing === g.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wrench className="h-3 w-3" />}
                              Fix
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-foreground">{g.signal}</p>
                          {g.recommended_treatment && (
                            <p className="mt-1 text-[11px] text-muted-foreground">→ {g.recommended_treatment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selected.attempts.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fix Attempts (retry log)</h3>
                    <div className="space-y-1.5">
                      {selected.attempts.slice(0, 10).map((at) => (
                        <div key={at.id} className="rounded-md border border-border p-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">#{at.attempt} — {at.approach}</span>
                            <StatusPill tone={at.status === 'applied' ? 'info' : at.status === 'validated' ? 'good' : at.status === 'exhausted' ? 'bad' : 'idle'}>
                              {at.status}
                            </StatusPill>
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">{at.treatment || at.diagnosis}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          ) : (
            <Panel title="URL Detail">
              <EmptyState icon={AlertTriangle} title="Select a URL" description="Choose a URL from the list to view its score, gaps, and AI-assisted fixes." />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreBadge({ score, large }) {
  const s = score ?? 0;
  const tone = s >= 70 ? 'bg-emerald-500' : s >= 40 ? 'bg-amber-500' : s > 0 ? 'bg-rose-500' : 'bg-muted-foreground/30';
  return (
    <div className={`flex ${large ? 'h-12 w-12' : 'h-9 w-9'} shrink-0 items-center justify-center rounded-full ${tone} text-white`}>
      <span className={`font-heading font-semibold ${large ? 'text-base' : 'text-xs'}`}>{s > 0 ? Math.round(s) : '—'}</span>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-foreground">{String(v)}</span>
    </div>
  );
}