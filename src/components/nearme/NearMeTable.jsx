import React, { useState } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, Search, ArrowRight } from 'lucide-react';

export default function NearMeTable({ candidates, onConvert, sortBy, onSort }) {
  const [expanded, setExpanded] = useState(null);

  const sortIcon = (col) => sortBy === col ? <ChevronDown className="w-3 h-3 inline ml-1" /> : null;

  return (
    <div className="bg-nearme-card border border-nearme-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-nearme-border text-nearme-muted text-xs">
              <th className="text-left px-4 py-3 font-medium w-8"></th>
              <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-nearme-text" onClick={() => onSort('domain')}>
                Domain {sortIcon('domain')}
              </th>
              <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-nearme-text" onClick={() => onSort('availability_status')}>
                Status {sortIcon('availability_status')}
              </th>
              <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-nearme-text" onClick={() => onSort('demand_score')}>
                Demand {sortIcon('demand_score')}
              </th>
              <th className="text-right px-4 py-3 font-medium cursor-pointer hover:text-nearme-text" onClick={() => onSort('search_volume_estimate')}>
                Volume {sortIcon('search_volume_estimate')}
              </th>
              <th className="text-right px-4 py-3 font-medium cursor-pointer hover:text-nearme-text" onClick={() => onSort('cpc_estimate')}>
                CPC {sortIcon('cpc_estimate')}
              </th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Top Terms</th>
              <th className="text-left px-4 py-3 font-medium">Sector</th>
              <th className="text-center px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-16 text-nearme-muted">
                  <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No candidates yet. Run generation to discover domains.</p>
                </td>
              </tr>
            ) : (
              candidates.map((c) => (
                <React.Fragment key={c.id}>
                  <tr
                    className="border-b border-nearme-border hover:bg-nearme-bg/50 cursor-pointer transition-colors"
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  >
                    <td className="px-4 py-3 text-nearme-muted">
                      {expanded === c.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-nearme-text">{c.domain}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.availability_status} price={c.registration_price} />
                    </td>
                    <td className="px-4 py-3">
                      <DemandGauge score={c.demand_score || 0} />
                    </td>
                    <td className="px-4 py-3 text-right text-nearme-text tabular">
                      {(c.search_volume_estimate || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-nearme-text tabular">
                      ${(c.cpc_estimate || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(c.top_search_terms || []).slice(0, 3).map((t, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-nearme-border/50 text-nearme-muted truncate max-w-[120px]">
                            {t}
                          </span>
                        ))}
                        {(c.top_search_terms || []).length > 3 && (
                          <span className="text-[10px] text-nearme-muted">+{c.top_search_terms.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-nearme-gold/10 text-nearme-gold border border-nearme-gold/20">
                        {c.naics_sector || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); onConvert(c); }}
                        className="text-[11px] px-2 py-1 rounded bg-nearme-gold/10 text-nearme-gold hover:bg-nearme-gold/20 border border-nearme-gold/20 transition-colors inline-flex items-center gap-1"
                      >
                        Convert <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                  {expanded === c.id && (
                    <tr className="bg-nearme-bg">
                      <td colSpan={9} className="px-8 py-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-semibold text-nearme-gold mb-2 flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5" /> AI Trend Summary
                            </h4>
                            <p className="text-xs text-nearme-text leading-relaxed">
                              {c.ai_trend_summary || 'No AI research data yet. Run demand research to populate.'}
                            </p>
                            <div className="mt-3">
                              <h5 className="text-[11px] font-semibold text-nearme-muted mb-1">Top Search Terms</h5>
                              <div className="flex flex-wrap gap-1">
                                {(c.top_search_terms || []).map((t, i) => (
                                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-nearme-border/50 text-nearme-text">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-nearme-gold mb-2 flex items-center gap-1">
                              <Search className="w-3.5 h-3.5" /> Google Autocomplete (Live)
                            </h4>
                            <div className="space-y-1">
                              {(c.autocomplete_suggestions || []).length === 0 ? (
                                <p className="text-xs text-nearme-muted">No autocomplete data yet.</p>
                              ) : (
                                c.autocomplete_suggestions.map((s, i) => (
                                  <div key={i} className="text-xs text-nearme-text px-2 py-1 rounded bg-nearme-card border border-nearme-border">
                                    {s}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status, price }) {
  const styles = {
    available: 'bg-nearme-green/10 text-nearme-green border-nearme-green/20',
    unavailable: 'bg-red-500/10 text-red-400 border-red-500/20',
    premium: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    unchecked: 'bg-nearme-border/30 text-nearme-muted border-nearme-border',
    error: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[10px] px-2 py-0.5 rounded border ${styles[status] || styles.unchecked}`}>
        {status}
      </span>
      {price > 0 && (
        <span className="text-[10px] text-nearme-muted">${price.toFixed(2)}</span>
      )}
    </div>
  );
}

function DemandGauge({ score }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-nearme-border overflow-hidden">
        <div
          className="h-full rounded-full bg-nearme-gold transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-nearme-text tabular w-8">{Math.round(pct)}</span>
    </div>
  );
}