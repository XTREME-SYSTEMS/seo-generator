import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useGlobalData } from '@/lib/useTenantData';
import { CheckCircle2, Play, Loader2, Search, Sparkles, ArrowDownWideNarrow } from 'lucide-react';

const STATUS_TONE = { implemented: 'good', available: 'info', requires_credentials: 'warn', roadmap: 'idle' };
const SPEED_TONE = { instant: 'good', fast: 'info', medium: 'idle', slow: 'warn' };
const DELIVERY_TONE = { automated: 'good', ai_assisted: 'info', google_sync: 'sim', manual: 'idle' };
const DELIVERY_LABEL = { automated: 'Autonomous', ai_assisted: 'AI-Assisted', google_sync: 'Google Sync', manual: 'Manual' };

const CATEGORY_LABEL = {
  measurement: 'Measurement & Telemetry', seo_technical: 'Technical SEO', seo_content: 'Content SEO',
  aeo: 'Answer Engine (AEO)', ai_search: 'AI Search Visibility', authority: 'Authority & Links',
  cloud_browser: 'Cloud Browser Automation', autonomous: 'Autonomous Engine', local: 'Local SEO', ecosystem: 'Ecosystem API',
};
const CATEGORIES = Object.keys(CATEGORY_LABEL);

export default function Capabilities() {
  const { rows, loading, reload } = useGlobalData('Capability', '-impact_score');
  const [busy, setBusy] = useState(null);
  const [discovering, setDiscovering] = useState(false);
  const [filter, setFilter] = useState('');
  const [cat, setCat] = useState('all');
  const [delivery, setDelivery] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('impact');

  const filtered = useMemo(() => {
    let r = rows;
    if (cat !== 'all') r = r.filter((x) => x.category === cat);
    if (delivery !== 'all') r = r.filter((x) => x.delivery === delivery);
    if (status !== 'all') r = r.filter((x) => x.status === status);
    if (filter) r = r.filter((x) => (x.name + x.description).toLowerCase().includes(filter.toLowerCase()));
    const speedW = { instant: 4, fast: 3, medium: 2, slow: 1 };
    if (sort === 'impact') r = [...r].sort((a, b) => (b.impact_score || 0) - (a.impact_score || 0));
    else if (sort === 'speed') r = [...r].sort((a, b) => (speedW[b.speed_tier] || 2) - (speedW[a.speed_tier] || 2));
    else if (sort === 'priority') r = [...r].sort((a, b) => ((b.impact_score || 0) * (speedW[b.speed_tier] || 2)) - ((a.impact_score || 0) * (speedW[a.speed_tier] || 2)));
    else r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    return r;
  }, [rows, cat, delivery, status, filter, sort]);

  const grouped = useMemo(() => {
    const m = {};
    for (const r of filtered) (m[r.category] ||= []).push(r);
    return m;
  }, [filtered]);

  const counts = useMemo(() => {
    const c = { implemented: 0, available: 0, requires_credentials: 0, roadmap: 0 };
    for (const r of rows) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [rows]);

  async function implement(cap) {
    setBusy(cap.id);
    try {
      if (cap.implement_function) await base44.functions.invoke(cap.implement_function, {});
      await base44.entities.Capability.update(cap.id, { status: 'implemented', last_implemented_at: new Date().toISOString() });
      reload();
    } catch (e) { console.error(e); } finally { setBusy(null); }
  }

  async function discover() {
    setDiscovering(true);
    try {
      await base44.functions.invoke('DiscoverCapabilities', {});
      reload();
    } catch (e) { console.error(e); } finally { setDiscovering(false); }
  }

  if (loading) return <Loading label="Loading capability registry" />;

  return (
    <div>
      <PageHeader
        eyebrow="Capability Registry"
        title="Every Capability — Scored & Filterable"
        description="The full technological map of SEO, AEO, AI-search, cloud-browser, and autonomous capabilities. Sorted by fastest-greatest impact. Filter by what can be automated, what AI does, and what syncs directly to Google."
        actions={
          <button onClick={discover} disabled={discovering} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {discovering ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Discover New (Web Research)
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Implemented" value={counts.implemented || 0} tone="good" />
        <StatTile label="Available" value={counts.available || 0} tone="info" />
        <StatTile label="Needs Credentials" value={counts.requires_credentials || 0} tone="warn" />
        <StatTile label="Roadmap" value={counts.roadmap || 0} tone="idle" />
      </div>

      <Panel title="Filters & Sorting" className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input className="input pl-9" placeholder="Search capabilities..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <Select label="Category" value={cat} onChange={setCat} options={[['all', 'All Categories'], ...CATEGORIES.map((c) => [c, CATEGORY_LABEL[c]])]} />
          <Select label="Delivery" value={delivery} onChange={setDelivery} options={[['all', 'All Delivery'], ['automated', 'Autonomous'], ['ai_assisted', 'AI-Assisted'], ['google_sync', 'Google Sync'], ['manual', 'Manual']]} />
          <Select label="Status" value={status} onChange={setStatus} options={[['all', 'All Status'], ['implemented', 'Implemented'], ['available', 'Available'], ['requires_credentials', 'Needs Credentials'], ['roadmap', 'Roadmap']]} />
          <Select label="Sort" value={sort} onChange={setSort} options={[['priority', 'Fastest + Greatest'], ['impact', 'Highest Impact'], ['speed', 'Fastest'], ['name', 'A-Z']]} />
        </div>
      </Panel>

      {filtered.length === 0 ? (
        <EmptyState title="No capabilities match" description="Adjust filters or run discovery to find new capabilities." />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <Panel key={category} title={CATEGORY_LABEL[category]} subtitle={`${items.length} capabilities`}>
              <div className="divide-y divide-border">
                {items.map((cap) => (
                  <div key={cap.id} className="flex items-start justify-between gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-sm font-medium text-foreground">{cap.name}</span>
                        <StatusPill tone={STATUS_TONE[cap.status]}>{cap.status.replace('_', ' ')}</StatusPill>
                        <StatusPill tone={SPEED_TONE[cap.speed_tier]}>{cap.speed_tier}</StatusPill>
                        <StatusPill tone={DELIVERY_TONE[cap.delivery]}>{DELIVERY_LABEL[cap.delivery]}</StatusPill>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{cap.description}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <ImpactBar score={cap.impact_score || 0} />
                      {cap.status === 'implemented' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Active</span>
                      ) : (
                        <button onClick={() => implement(cap)} disabled={busy === cap.id} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50">
                          {busy === cap.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                          Implement
                        </button>
                      )}
                    </div>
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

function Select({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input min-w-[140px] py-1.5 text-xs">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function ImpactBar({ score }) {
  const tone = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-blue-500' : score >= 40 ? 'bg-amber-500' : 'bg-rose-400';
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
      <span className="font-mono text-[10px] font-medium text-muted-foreground">{Math.round(score)}</span>
    </div>
  );
}

function StatTile({ label, value, tone }) {
  const colors = { good: 'text-emerald-600', info: 'text-blue-600', warn: 'text-amber-600', idle: 'text-muted-foreground' };
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className={`font-heading text-2xl font-semibold ${colors[tone]}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}