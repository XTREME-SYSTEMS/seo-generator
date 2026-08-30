import React from 'react';
import StatusPill from '@/components/kit/StatusPill';

const STATUS_OPTS = ['not_started', 'in_progress', 'optimized', 'needs_review'];
const STATUS_TONE = { not_started: 'idle', in_progress: 'info', optimized: 'good', needs_review: 'warn' };

function StatusSelect({ value, onChange }) {
  return (
    <select
      value={value || 'not_started'}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-input bg-background px-1.5 py-0.5 text-[11px] text-foreground"
    >
      {STATUS_OPTS.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
    </select>
  );
}

export default function WorkbookTable({ rows, onStatusChange }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-left text-xs">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
            {['URL', 'Type', 'Cluster', 'Funnel', 'Intent', 'Sub-industry', 'SEO', 'AEO', 'AI Search', 'Clicks', 'Impr.', 'Avg Pos', 'Top Query', 'Access'].map((h) => (
              <th key={h} className="px-3 py-2 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border/60 hover:bg-accent/40">
              <td className="max-w-[280px] truncate px-3 py-2 font-mono text-[11px]" title={r.url}>
                <a href={r.url} target="_blank" rel="noreferrer" className="hover:underline">{r.url.replace(/^https?:\/\//, '')}</a>
              </td>
              <td className="px-3 py-2"><StatusPill tone="idle">{(r.page_type || 'other').replace(/_/g, ' ')}</StatusPill></td>
              <td className="px-3 py-2 capitalize">{r.topic_cluster || '—'}</td>
              <td className="px-3 py-2 uppercase">{r.funnel_stage || '—'}</td>
              <td className="px-3 py-2 capitalize">{r.search_intent || '—'}</td>
              <td className="px-3 py-2">{r.sub_industry || '—'}</td>
              <td className="px-3 py-2"><StatusSelect value={r.seo_status} onChange={(v) => onStatusChange(r, 'seo_status', v)} /></td>
              <td className="px-3 py-2"><StatusSelect value={r.aeo_status} onChange={(v) => onStatusChange(r, 'aeo_status', v)} /></td>
              <td className="px-3 py-2"><StatusSelect value={r.ai_search_status} onChange={(v) => onStatusChange(r, 'ai_search_status', v)} /></td>
              <td className="px-3 py-2 tabular">{(r.clicks_28d || 0).toLocaleString()}</td>
              <td className="px-3 py-2 tabular">{(r.impressions_28d || 0).toLocaleString()}</td>
              <td className="px-3 py-2 tabular">{r.avg_position_28d != null ? r.avg_position_28d : '—'}</td>
              <td className="max-w-[180px] truncate px-3 py-2" title={r.top_query}>{r.top_query || '—'}</td>
              <td className="px-3 py-2">
                <StatusPill tone={r.ownership === 'owned' ? 'good' : 'sim'}>
                  {r.ownership === 'owned' ? 'owned' : 'analysis only'}
                </StatusPill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}