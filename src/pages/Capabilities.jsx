import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useGlobalData } from '@/lib/useTenantData';
import { CheckCircle2, Play, Loader2, Search } from 'lucide-react';

const STATUS_TONE = {
  implemented: 'good',
  available: 'info',
  requires_credentials: 'warn',
  roadmap: 'idle',
};

const CATEGORY_LABEL = {
  measurement: 'Measurement & Telemetry',
  seo_technical: 'Technical SEO',
  seo_content: 'Content SEO',
  aeo: 'Answer Engine Optimization (AEO)',
  ai_search: 'AI Search Visibility',
  authority: 'Authority & Links',
  cloud_browser: 'Cloud Browser Automation',
  autonomous: 'Autonomous Engine',
  local: 'Local SEO',
  ecosystem: 'Ecosystem API',
};

export default function Capabilities() {
  const { rows, loading, reload } = useGlobalData('Capability', 'category');
  const [busy, setBusy] = useState(null);
  const [filter, setFilter] = useState('');

  const grouped = useMemo(() => {
    const map = {};
    for (const r of rows) {
      (map[r.category] ||= []).push(r);
    }
    return map;
  }, [rows]);

  const counts = useMemo(() => {
    const c = { implemented: 0, available: 0, requires_credentials: 0, roadmap: 0 };
    for (const r of rows) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [rows]);

  async function implement(cap) {
    setBusy(cap.id);
    try {
      if (cap.implement_function) {
        await base44.functions.invoke(cap.implement_function, {});
      }
      await base44.entities.Capability.update(cap.id, {
        status: 'implemented',
        last_implemented_at: new Date().toISOString(),
      });
      reload();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Loading label="Loading capability registry" />;

  return (
    <div>
      <PageHeader
        eyebrow="Capability Registry"
        title="SEO Generator — Full Capability Map"
        description="Every technological SEO, AEO, AI-search, cloud-browser, and automation capability this system can accomplish. Each row is implementable on demand or already running autonomously."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Implemented" value={counts.implemented || 0} tone="good" />
        <StatTile label="Available" value={counts.available || 0} tone="info" />
        <StatTile label="Needs Credentials" value={counts.requires_credentials || 0} tone="warn" />
        <StatTile label="Roadmap" value={counts.roadmap || 0} tone="idle" />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="input pl-9"
            placeholder="Filter capabilities..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No capabilities registered" description="Run the registry seed to populate the full capability map." />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => {
            const filtered = items.filter((r) =>
              !filter || (r.name + r.description).toLowerCase().includes(filter.toLowerCase())
            );
            if (!filtered.length) return null;
            return (
              <Panel key={cat} title={CATEGORY_LABEL[cat] || cat} subtitle={`${filtered.length} capabilities`}>
                <div className="divide-y divide-border">
                  {filtered.map((cap) => (
                    <div key={cap.id} className="flex items-start justify-between gap-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-sm font-medium text-foreground">{cap.name}</span>
                          <StatusPill tone={STATUS_TONE[cap.status]}>{cap.status.replace('_', ' ')}</StatusPill>
                          {cap.automation === 'continuous' && <StatusPill tone="info">continuous</StatusPill>}
                          {cap.automation === 'scheduled' && <StatusPill tone="idle">scheduled</StatusPill>}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{cap.description}</p>
                        {cap.evidence_tier && (
                          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">{cap.evidence_tier}</p>
                        )}
                      </div>
                      <div className="shrink-0">
                        {cap.status === 'implemented' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" /> Active
                          </span>
                        ) : (
                          <button
                            onClick={() => implement(cap)}
                            disabled={busy === cap.id}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50"
                          >
                            {busy === cap.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                            Implement
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            );
          })}
        </div>
      )}
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