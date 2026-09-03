import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useGlobalData } from '@/lib/useTenantData';
import { Copy, Check, Play, Loader2, Search, Sparkles } from 'lucide-react';

const CATEGORY_LABEL = {
  audit: 'Audit & Diagnose',
  implement: 'Implement Every Technology',
  automate: 'Automate Everything',
  autonomy: 'Full Autonomy',
  validate: 'Validate & Prove',
  monitor: 'Monitor & Report',
  demonstrate: 'Demonstrate Power',
  fast_rank: 'Fastest Path to Page One',
  research: 'Research & Discover',
  ecosystem: 'Ecosystem & Sharing',
};
const CATEGORIES = Object.keys(CATEGORY_LABEL);
const IMPACT_TONE = { critical: 'bad', high: 'warn', medium: 'info', low: 'idle' };

export default function PromptLibrary() {
  const { rows, loading, reload } = useGlobalData('PromptLibrary', 'category');
  const [filter, setFilter] = useState('');
  const [cat, setCat] = useState('all');
  const [copied, setCopied] = useState(null);
  const [running, setRunning] = useState(null);

  const filtered = useMemo(() => {
    let r = rows;
    if (cat !== 'all') r = r.filter((x) => x.category === cat);
    if (filter) r = r.filter((x) => (x.title + x.prompt + x.intent).toLowerCase().includes(filter.toLowerCase()));
    return r;
  }, [rows, cat, filter]);

  const grouped = useMemo(() => {
    const m = {};
    for (const r of filtered) (m[r.category] ||= []).push(r);
    return m;
  }, [filtered]);

  async function copy(p, id) {
    await navigator.clipboard.writeText(p.prompt);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function run(p) {
    setRunning(p.id);
    try {
      if (p.invoke_function) {
        await base44.functions.invoke(p.invoke_function, {});
        await base44.entities.PromptLibrary.update(p.id, { status: 'run', last_run_at: new Date().toISOString() });
        reload();
      } else {
        await copy(p, p.id);
      }
    } catch (e) { console.error(e); } finally { setRunning(null); }
  }

  if (loading) return <Loading label="Loading prompt library" />;

  return (
    <div>
      <PageHeader
        eyebrow="Prompt Library"
        title="Invocation Prompts — Audit, Implement, Automate, Prove"
        description="A curated library of powerful prompts designed to invoke the agent to audit this system, implement every technology in existence, automate everything, make it fully autonomous, validate and prove outcomes, and demonstrate its power. Copy any prompt into chat, or run the ones wired to a backend function."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input className="input pl-9" placeholder="Search prompts..." value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Category</label>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="input min-w-[180px] py-1.5 text-xs">
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No prompts" description="Run the seed to populate the library." />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <Panel key={category} title={CATEGORY_LABEL[category]} subtitle={`${items.length} prompts`}>
              <div className="divide-y divide-border">
                {items.map((p) => (
                  <div key={p.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-heading text-sm font-medium text-foreground">{p.title}</span>
                          <StatusPill tone={IMPACT_TONE[p.impact]}>{p.impact}</StatusPill>
                          {p.invoke_function && <StatusPill tone="info">auto-run</StatusPill>}
                          {p.status === 'run' && <StatusPill tone="good">run</StatusPill>}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{p.intent}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button onClick={() => copy(p, p.id)} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent">
                          {copied === p.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied === p.id ? 'Copied' : 'Copy'}
                        </button>
                        <button onClick={() => run(p)} disabled={running === p.id} className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                          {running === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : p.invoke_function ? <Play className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                          {p.invoke_function ? 'Run' : 'Use'}
                        </button>
                      </div>
                    </div>
                    <pre className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted/40 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">{p.prompt}</pre>
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}