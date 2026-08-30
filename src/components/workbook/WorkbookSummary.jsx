import React from 'react';

export default function WorkbookSummary({ rows }) {
  const total = rows.length;
  const optimized = (k) => rows.filter((r) => r[k] === 'optimized').length;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  const tiles = [
    { label: 'URLs Tracked', value: total },
    { label: 'SEO Optimized', value: `${optimized('seo_status')} (${pct(optimized('seo_status'))}%)` },
    { label: 'AEO Optimized', value: `${optimized('aeo_status')} (${pct(optimized('aeo_status'))}%)` },
    { label: 'AI Search Ready', value: `${optimized('ai_search_status')} (${pct(optimized('ai_search_status'))}%)` },
    { label: 'Clicks (28d)', value: rows.reduce((a, r) => a + (r.clicks_28d || 0), 0).toLocaleString() },
    { label: 'Impressions (28d)', value: rows.reduce((a, r) => a + (r.impressions_28d || 0), 0).toLocaleString() },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t.label}</p>
          <p className="mt-1 font-heading text-lg font-medium tabular">{t.value}</p>
        </div>
      ))}
    </div>
  );
}