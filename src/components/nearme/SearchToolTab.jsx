import React, { useState, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Loader2, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';

export default function SearchToolTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const loadResults = useCallback(async () => {
    try {
      const data = await base44.entities.NearMeCandidate.filter(
        { demand_score: { $gt: 0 } }, '-demand_score', 100
      );
      setResults(data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadResults(); }, [loadResults]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke('ResearchSearchDemand', {
        domain: query.trim(),
      });
      setToast({ type: 'success', msg: `Researched: ${query}` });
      await loadResults();
    } catch (e) {
      setToast({ type: 'error', msg: `Research failed: ${e.message}` });
    }
    setLoading(false);
  };

  const handleDiscoverPhrases = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('DiscoverUltraHighSearchPhrases', { count: 50 });
      setToast({ type: 'success', msg: `Discovered ${res.data?.created || res.created || 0} phrases` });
      await loadResults();
    } catch (e) {
      setToast({ type: 'error', msg: `Discovery failed: ${e.message}` });
    }
    setLoading(false);
  };

  const filtered = query
    ? results.filter(r =>
        r.domain?.toLowerCase().includes(query.toLowerCase()) ||
        r.niche?.toLowerCase().includes(query.toLowerCase()) ||
        (r.top_search_terms || []).some(t => t.toLowerCase().includes(query.toLowerCase()))
      )
    : results;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Search Demand Intelligence</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px] relative">
            <label className="block text-xs text-muted-foreground mb-1.5">Search domain or keyword</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. plumbingnearme.com or roofing"
                className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
              />
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            {loading ? 'Researching...' : 'Research Demand'}
          </button>
          <button
            onClick={handleDiscoverPhrases}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-primary/10 text-primary border border-primary/20 text-sm font-medium hover:bg-primary/20 disabled:opacity-50 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Discover Phrases
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Results List */}
        <div className="lg:col-span-1 space-y-2">
          <div className="text-xs text-muted-foreground px-1">{filtered.length} results</div>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {filtered.map(r => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`w-full text-left p-3 rounded-md border transition-colors ${
                  selected?.id === r.id
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-card border-border hover:border-primary/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium text-foreground truncate">{r.domain}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <DemandPill score={r.demand_score || 0} />
                  {r.commercial_intent && (
                    <span className="text-[10px] text-muted-foreground capitalize">{r.commercial_intent} intent</span>
                  )}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No results. Run research to populate demand data.
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-heading text-base font-semibold text-foreground">{selected.domain}</h3>
                  <p className="text-xs text-muted-foreground">{selected.niche} · {selected.naics_sector || 'N/A'}</p>
                </div>
                <DemandPill score={selected.demand_score || 0} large />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Metric label="Search Volume" value={selected.search_volume_estimate ? selected.search_volume_estimate.toLocaleString() : '—'} />
                <Metric label="CPC" value={selected.cpc_estimate ? `$${selected.cpc_estimate.toFixed(2)}` : '—'} />
                <Metric label="Commercial Intent" value={selected.commercial_intent || '—'} />
              </div>

              {selected.ai_trend_summary && (
                <div>
                  <div className="text-xs font-medium text-foreground mb-1.5">AI Trend Summary</div>
                  <p className="text-xs leading-relaxed text-muted-foreground bg-muted/30 rounded-md p-3">{selected.ai_trend_summary}</p>
                </div>
              )}

              {selected.top_search_terms?.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-foreground mb-1.5">Top Search Terms</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.top_search_terms.map((t, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-primary/5 border border-primary/20 text-xs text-foreground">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {selected.autocomplete_suggestions?.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-foreground mb-1.5">Google Autocomplete Suggestions</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.autocomplete_suggestions.map((t, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-muted text-xs text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">Select a domain to view detailed search demand intelligence.</p>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg border text-sm z-50 cursor-pointer ${
            toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}
          onClick={() => setToast(null)}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function DemandPill({ score, large }) {
  const tone = score > 70 ? 'bg-green-100 text-green-700' : score > 40 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground';
  return (
    <span className={`inline-flex items-center gap-1 rounded font-medium ${tone} ${large ? 'px-3 py-1 text-sm' : 'px-1.5 py-0.5 text-[10px]'}`}>
      <TrendingUp className={large ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'} />
      {score} demand
    </span>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-muted/30 rounded-md p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-heading text-sm font-semibold text-foreground tabular">{value}</div>
    </div>
  );
}