import React, { useMemo, useState } from 'react';
import { Rows3, Loader2, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import EmptyState from '@/components/kit/EmptyState';
import Loading from '@/components/kit/Loading';
import StatusPill from '@/components/kit/StatusPill';
import Provenance from '@/components/kit/Provenance';
import FilterChips from '@/components/are/FilterChips';
import SuggestionLightbulb from '@/components/are/SuggestionLightbulb';
import { Table, Row, Cell } from '@/components/kit/Table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/lib/useTenantData';
import { useTenant } from '@/lib/TenantContext';
import { base44 } from '@/api/base44Client';

const STATUS_TONE = {
  goal_met: 'good', validated: 'good', deployed: 'info',
  queued: 'info', open: 'idle', blocked: 'warn', rolled_back: 'bad',
};

const COLUMNS = [
  'URL', 'Query', 'Index', 'Canon', 'Rank', 'Avg pos', 'Impr', 'Clicks', 'CTR', 'Score', 'Δ7d',
  'Gap', 'Asymmetry', 'System', 'Competitor', 'Treatment', 'Tier', 'Priority', 'Status', 'Constraint', 'Reflected',
];

export default function AreSheet() {
  const { clientId } = useTenant();
  const { rows, loading, reload } = useTenantData('AreSheetRow', {}, '-priority_score');
  const [gap, setGap] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  const visible = useMemo(() => rows.filter((r) => {
    if (gap && r.gap_type !== gap) return false;
    if (status && r.status !== status) return false;
    if (q) {
      const t = `${r.url} ${r.query} ${r.recommended_treatment || ''}`.toLowerCase();
      if (!t.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [rows, gap, status, q]);

  const run = async () => {
    setBusy(true);
    try {
      await base44.functions.invoke('AreReflect', { client_id: clientId });
      reload();
    } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader
        eyebrow="A–Z metric sheet"
        title="Ranking Sheet"
        description="Every URL × query × metric the engine tracks, line by line. Provenance is labeled on every measured field; modeled values are never shown as measured."
        actions={(
          <Button variant="outline" size="sm" onClick={run} disabled={busy || !clientId}>
            {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
            Refresh rows
          </Button>
        )}
      />

      <div className="mb-4 space-y-3">
        <Input placeholder="Filter by URL, query or treatment…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
        <FilterChips
          value={gap}
          onChange={setGap}
          allLabel="All gaps"
          options={['TECHNICAL', 'CONTENT', 'AUTHORITY', 'SEO', 'SURFACE', 'AEO', 'SAO', 'INTENT', 'NONE']}
        />
        <FilterChips
          value={status}
          onChange={setStatus}
          allLabel="All statuses"
          options={['open', 'queued', 'deployed', 'validated', 'goal_met', 'blocked', 'rolled_back']}
        />
      </div>

      <Panel title={`${visible.length} rows`} subtitle="Sorted by priority score = (p_cross × Δtraffic) ÷ hours">
        {loading && <Loading label="Loading sheet" />}
        {!loading && !visible.length && (
          <EmptyState
            icon={Rows3}
            title="No rows match"
            description="Register URL assets with target queries, then run a reflect pass to populate the sheet."
          />
        )}
        {!loading && visible.length > 0 && (
          <Table columns={COLUMNS}>
            {visible.map((r) => (
              <Row key={r.id}>
                <Cell className="max-w-[180px] truncate font-mono text-[11px]">{r.url}</Cell>
                <Cell className="max-w-[160px] truncate text-xs">{r.query}</Cell>
                <Cell className="font-mono text-[10px] text-muted-foreground">{r.index_state}</Cell>
                <Cell className="font-mono text-[11px]">{r.canonical_agrees ? 'ok' : '—'}</Cell>
                <Cell className="font-mono text-xs tabular">{r.rank ? `#${r.rank}` : '—'}</Cell>
                <Cell className="font-mono text-xs tabular text-muted-foreground">{r.avg_position ?? '—'}</Cell>
                <Cell className="font-mono text-xs tabular">{(r.impressions || 0).toLocaleString()}</Cell>
                <Cell className="font-mono text-xs tabular">{r.clicks || 0}</Cell>
                <Cell className="font-mono text-xs tabular">{r.ctr ? `${(r.ctr * 100).toFixed(1)}%` : '—'}</Cell>
                <Cell className="font-mono text-xs font-semibold tabular text-primary">{r.score ?? 0}</Cell>
                <Cell className={`font-mono text-xs tabular ${(r.score_delta_7d || 0) > 0 ? 'text-emerald-600' : (r.score_delta_7d || 0) < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {(r.score_delta_7d || 0) > 0 ? '+' : ''}{r.score_delta_7d || 0}
                </Cell>
                <Cell className="font-mono text-[10px]">{r.gap_type}</Cell>
                <Cell className="font-mono text-[10px] text-muted-foreground">{r.asymmetry_class || '—'}</Cell>
                <Cell className="font-mono text-[10px] text-muted-foreground">{r.targeted_system}</Cell>
                <Cell className="max-w-[140px] truncate font-mono text-[10px] text-muted-foreground">{r.top_competitor || '—'}</Cell>
                <Cell className="max-w-[280px] text-xs leading-relaxed text-muted-foreground">{r.recommended_treatment}</Cell>
                <Cell><Provenance value={r.evidence_tier} /></Cell>
                <Cell className="font-mono text-xs tabular">{r.priority_score ?? 0}</Cell>
                <Cell><StatusPill tone={STATUS_TONE[r.status] || 'idle'}>{r.status}</StatusPill></Cell>
                <Cell className="max-w-[220px] text-xs text-amber-600 dark:text-amber-400">{r.binding_constraint || '—'}</Cell>
                <Cell className="font-mono text-[10px] text-muted-foreground">
                  {r.last_reflected_at ? new Date(r.last_reflected_at).toLocaleString() : '—'}
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </Panel>

      <SuggestionLightbulb surface="sheet" />
    </div>
  );
}