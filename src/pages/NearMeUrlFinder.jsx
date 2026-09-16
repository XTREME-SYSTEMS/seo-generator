import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Loader2, Zap, TrendingUp, DollarSign, Download, Rocket, CheckCircle2, Sparkles } from 'lucide-react';
import NearMeTable from '@/components/nearme/NearMeTable';

const TABS = [
  { id: 'available', label: 'Available Domains', icon: CheckCircle2 },
  { id: 'demand', label: 'Search Demand Intelligence', icon: TrendingUp },
  { id: 'phrases', label: 'Ultra-High Phrases', icon: Sparkles },
];

export default function NearMeUrlFinder() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [search, setSearch] = useState('');
  const [naicsFilter, setNaicsFilter] = useState('all');
  const [availableOnly, setAvailableOnly] = useState(true);
  const [sortBy, setSortBy] = useState('demand_score');
  const [running, setRunning] = useState(null);
  const [progress, setProgress] = useState(null);
  const [toast, setToast] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.NearMeCandidate.list('-created_date', 500);
      setCandidates(data);
    } catch (e) {
      console.error('Load error:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const naicsSectors = useMemo(() => {
    const set = new Set(candidates.map(c => c.naics_sector).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [candidates]);

  const filtered = useMemo(() => {
    let result = [...candidates];

    // Tab filter
    if (activeTab === 'available') {
      result = result.filter(c => c.availability_status === 'available' || (availableOnly && c.availability_status === 'available'));
      if (availableOnly) result = result.filter(c => c.availability_status === 'available');
    } else if (activeTab === 'phrases') {
      result = result.filter(c => c.pattern_type === 'phrase');
    } else if (activeTab === 'demand') {
      result = result.filter(c => c.demand_score > 0);
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.domain.toLowerCase().includes(q) ||
        (c.niche || '').toLowerCase().includes(q) ||
        (c.naics_sector || '').toLowerCase().includes(q)
      );
    }

    // NAICS filter
    if (naicsFilter !== 'all') {
      result = result.filter(c => c.naics_sector === naicsFilter);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      if (typeof aVal === 'string') return aVal.localeCompare(bVal);
      return bVal - aVal;
    });

    return result;
  }, [candidates, activeTab, availableOnly, search, naicsFilter, sortBy]);

  const stats = useMemo(() => ({
    total: candidates.length,
    available: candidates.filter(c => c.availability_status === 'available').length,
    avgDemand: candidates.length ? Math.round(candidates.reduce((s, c) => s + (c.demand_score || 0), 0) / candidates.length) : 0,
    topCpc: candidates.length ? Math.max(...candidates.map(c => c.cpc_estimate || 0)) : 0,
  }), [candidates]);

  const runAction = async (name, label, payload = {}) => {
    setRunning(name);
    setProgress({ label, current: 0, total: 0 });
    try {
      const res = await base44.functions.invoke(name, payload);
      setToast({ type: 'success', msg: `${label} complete: ${JSON.stringify(res.data || res).slice(0, 200)}` });
      await loadData();
    } catch (e) {
      setToast({ type: 'error', msg: `${label} failed: ${e.message}` });
    }
    setRunning(null);
    setProgress(null);
  };

  const handleConvert = async (c) => {
    try {
      await base44.entities.StrategicUrl.create({
        url: c.domain,
        niche: c.niche || c.domain,
        keyword_category: c.pattern_type === 'phrase' ? 'near_me' : c.pattern_type,
        primary_keyword: c.niche || c.domain,
        search_volume_estimate: c.search_volume_estimate || 0,
        cpc_estimate: c.cpc_estimate || 0,
        estimated_monthly_leads: Math.round((c.search_volume_estimate || 0) * 0.04),
        estimated_lead_value: Math.round((c.cpc_estimate || 0) * 10),
        estimated_monthly_revenue: Math.round((c.search_volume_estimate || 0) * 0.04 * (c.cpc_estimate || 0) * 10),
        estimated_site_value: Math.round((c.search_volume_estimate || 0) * 0.04 * (c.cpc_estimate || 0) * 10 * 30),
        target_buyer_industry: c.naics_sector || '',
        programmatic_pages_potential: 450,
        google_first_page_difficulty: 50,
        rationale: c.ai_trend_summary || `NearMe candidate with demand score ${c.demand_score}`,
        status: 'discovered'
      });
      setToast({ type: 'success', msg: `${c.domain} → Strategic URL created` });
    } catch (e) {
      setToast({ type: 'error', msg: `Convert failed: ${e.message}` });
    }
  };

  const handleExport = () => {
    const rows = filtered.map(c => ({
      domain: c.domain,
      niche: c.niche,
      naics_sector: c.naics_sector,
      pattern_type: c.pattern_type,
      availability: c.availability_status,
      price: c.registration_price,
      demand_score: c.demand_score,
      search_volume: c.search_volume_estimate,
      cpc: c.cpc_estimate,
      top_terms: (c.top_search_terms || []).join('; '),
      trend_summary: c.ai_trend_summary,
      autocomplete: (c.autocomplete_suggestions || []).join('; '),
    }));
    const headers = Object.keys(rows[0] || {});
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nearme-candidates-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-nearme-bg text-nearme-text">
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-nearme-gold/10 border border-nearme-gold/20 flex items-center justify-center">
              <Search className="w-5 h-5 text-nearme-gold" />
            </div>
            <div>
              <h1 className="font-nearme text-2xl font-semibold text-nearme-text">NearMe Intelligence</h1>
              <p className="text-xs text-nearme-muted">Batch URL discovery, availability checking & search demand intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {progress && running && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-nearme-card border border-nearme-border text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-nearme-gold" />
                <span className="text-nearme-muted">{progress.label}...</span>
              </div>
            )}
            <button onClick={handleExport} disabled={!filtered.length} className="text-xs px-3 py-1.5 rounded-lg bg-nearme-card border border-nearme-border text-nearme-text hover:border-nearme-gold/30 disabled:opacity-40 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap gap-2 mb-6">
          <ActionButton onClick={() => runAction('GenerateNearMeCandidates', 'Generate Candidates')} icon={Zap} label="Run Generation" running={running === 'GenerateNearMeCandidates'} />
          <ActionButton onClick={() => runAction('CheckDomainAvailability', 'Check Availability', { limit: 100 })} icon={CheckCircle2} label="Check Availability" running={running === 'CheckDomainAvailability'} />
          <ActionButton onClick={() => runAction('ResearchSearchDemand', 'Research Demand', { limit: 50 })} icon={TrendingUp} label="Research Demand" running={running === 'ResearchSearchDemand'} />
          <ActionButton onClick={() => runAction('DiscoverUltraHighSearchPhrases', 'Discover Phrases', { count: 50 })} icon={Sparkles} label="Discover Phrases" running={running === 'DiscoverUltraHighSearchPhrases'} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Candidates" value={stats.total} icon={Search} />
          <StatCard label="Available Domains" value={stats.available} icon={CheckCircle2} highlight />
          <StatCard label="Avg Demand Score" value={stats.avgDemand} icon={TrendingUp} />
          <StatCard label="Top CPC" value={`$${stats.topCpc.toFixed(2)}`} icon={DollarSign} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-nearme-border">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id ? 'border-nearme-gold text-nearme-text' : 'border-transparent text-nearme-muted hover:text-nearme-text'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Search domains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-nearme-card border border-nearme-border rounded-lg px-3 py-1.5 text-sm text-nearme-text placeholder:text-nearme-muted focus:outline-none focus:border-nearme-gold/40 w-64"
          />
          <select
            value={naicsFilter}
            onChange={(e) => setNaicsFilter(e.target.value)}
            className="bg-nearme-card border border-nearme-border rounded-lg px-3 py-1.5 text-sm text-nearme-text focus:outline-none focus:border-nearme-gold/40"
          >
            {naicsSectors.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sectors' : s}</option>)}
          </select>
          <label className="flex items-center gap-2 text-xs text-nearme-muted cursor-pointer">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="accent-nearme-gold"
            />
            Available only
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-nearme-card border border-nearme-border rounded-lg px-3 py-1.5 text-sm text-nearme-muted focus:outline-none focus:border-nearme-gold/40 ml-auto"
          >
            <option value="demand_score">Sort: Demand Score</option>
            <option value="cpc_estimate">Sort: CPC</option>
            <option value="search_volume_estimate">Sort: Search Volume</option>
            <option value="registration_price">Sort: Price</option>
            <option value="domain">Sort: Domain (A-Z)</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-nearme-gold" />
          </div>
        ) : (
          <NearMeTable candidates={filtered} onConvert={handleConvert} sortBy={sortBy} onSort={setSortBy} />
        )}

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg border text-sm z-50 ${
            toast.type === 'success' ? 'bg-nearme-green/10 border-nearme-green/20 text-nearme-green' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`} onClick={() => setToast(null)}>
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({ onClick, icon: Icon, label, running }) {
  return (
    <button
      onClick={onClick}
      disabled={running}
      className="text-xs px-4 py-2 rounded-lg bg-nearme-gold/10 text-nearme-gold border border-nearme-gold/20 hover:bg-nearme-gold/20 disabled:opacity-50 flex items-center gap-1.5 transition-colors font-medium"
    >
      {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
      {running ? 'Running...' : label}
    </button>
  );
}

function StatCard({ label, value, icon: Icon, highlight }) {
  return (
    <div className={`bg-nearme-card border border-nearme-border rounded-lg p-4 ${highlight ? 'border-nearme-green/20' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-nearme-muted">{label}</span>
        <Icon className={`w-4 h-4 ${highlight ? 'text-nearme-green' : 'text-nearme-muted'}`} />
      </div>
      <p className={`text-2xl font-semibold tabular ${highlight ? 'text-nearme-green' : 'text-nearme-text'}`}>{value}</p>
    </div>
  );
}