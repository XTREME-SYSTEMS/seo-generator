import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Zap, Loader2, CheckCircle2, XCircle, Search, Download } from 'lucide-react';

const PATTERNS = [
  { id: 'nearme', label: 'nearme.com', template: '{niche}nearme.com' },
  { id: 'near', label: 'near.com', template: '{niche}near.com' },
  { id: 'nearyou', label: 'nearyou.com', template: '{niche}nearyou.com' },
  { id: 'phrase', label: 'phrase.com', template: '{phrase}.com' },
];

export default function UrlGeneratorTab() {
  const [niche, setNiche] = useState('');
  const [patterns, setPatterns] = useState(['nearme', 'near', 'nearyou']);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState(null);

  const loadCandidates = useCallback(async () => {
    try {
      const data = await base44.entities.NearMeCandidate.list('-created_date', 200);
      setCandidates(data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadCandidates(); }, [loadCandidates]);

  const handleGenerate = async () => {
    if (!niche.trim()) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke('GenerateNearMeCandidates', {
        niche: niche.trim(),
        patterns,
      });
      setToast({ type: 'success', msg: `Generated ${res.data?.created || res.created || 0} candidates` });
      await loadCandidates();
    } catch (e) {
      setToast({ type: 'error', msg: `Generation failed: ${e.message}` });
    }
    setLoading(false);
  };

  const handleCheckAvailability = async () => {
    setChecking(true);
    try {
      const res = await base44.functions.invoke('CheckDomainAvailability', { limit: 100 });
      setToast({ type: 'success', msg: `Checked ${res.data?.checked || res.checked || 0} domains` });
      await loadCandidates();
    } catch (e) {
      setToast({ type: 'error', msg: `Check failed: ${e.message}` });
    }
    setChecking(false);
  };

  const handleExport = () => {
    const rows = candidates.map(c => ({
      domain: c.domain, niche: c.niche, pattern: c.pattern_type,
      availability: c.availability_status, price: c.registration_price,
      demand: c.demand_score, search_volume: c.search_volume_estimate, cpc: c.cpc_estimate,
    }));
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `nearme-urls-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const togglePattern = (id) => {
    setPatterns(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      {/* Generator Controls */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Generate NearMe Domain Candidates</h3>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-muted-foreground mb-1.5">Niche / Industry</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. plumbing, roofing, locksmith"
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !niche.trim() || !patterns.length}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {loading ? 'Generating...' : 'Generate URLs'}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Patterns:</span>
          {PATTERNS.map(p => (
            <button
              key={p.id}
              onClick={() => togglePattern(p.id)}
              className={`px-3 py-1 rounded-md text-xs font-mono border transition-colors ${
                patterns.includes(p.id)
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-background border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCheckAvailability}
          disabled={checking || !candidates.length}
          className="px-4 py-2 rounded-md bg-primary/10 text-primary border border-primary/20 text-sm font-medium hover:bg-primary/20 disabled:opacity-50 flex items-center gap-2"
        >
          {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {checking ? 'Checking...' : 'Check Availability'}
        </button>
        <button
          onClick={handleExport}
          disabled={!candidates.length}
          className="px-4 py-2 rounded-md bg-card border border-border text-sm text-foreground hover:border-primary/30 disabled:opacity-50 flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
        <span className="text-xs text-muted-foreground ml-auto">{candidates.length} candidates</span>
      </div>

      {/* Results Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Domain</th>
                <th className="px-4 py-2.5 font-medium">Pattern</th>
                <th className="px-4 py-2.5 font-medium">Availability</th>
                <th className="px-4 py-2.5 font-medium">Price</th>
                <th className="px-4 py-2.5 font-medium">Demand</th>
                <th className="px-4 py-2.5 font-medium">Search Vol</th>
                <th className="px-4 py-2.5 font-medium">CPC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {candidates.slice(0, 50).map(c => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground">{c.domain}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{c.pattern_type}</td>
                  <td className="px-4 py-2.5">
                    <AvailabilityBadge status={c.availability_status} />
                  </td>
                  <td className="px-4 py-2.5 text-xs tabular text-foreground">
                    {c.registration_price ? `$${c.registration_price}` : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <DemandBar score={c.demand_score || 0} />
                  </td>
                  <td className="px-4 py-2.5 text-xs tabular text-muted-foreground">
                    {c.search_volume_estimate ? c.search_volume_estimate.toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs tabular text-muted-foreground">
                    {c.cpc_estimate ? `$${c.cpc_estimate.toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {candidates.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No candidates yet. Generate URLs above to get started.
          </div>
        )}
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

function AvailabilityBadge({ status }) {
  const styles = {
    available: 'bg-green-100 text-green-700 border-green-200',
    unavailable: 'bg-red-100 text-red-700 border-red-200',
    premium: 'bg-amber-100 text-amber-700 border-amber-200',
    unchecked: 'bg-muted text-muted-foreground border-border',
    error: 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${styles[status] || styles.unchecked}`}>
      {status === 'available' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'unavailable' && <XCircle className="w-3 h-3" />}
      {status || 'unchecked'}
    </span>
  );
}

function DemandBar({ score }) {
  const pct = Math.min(score, 100);
  const color = pct > 70 ? 'bg-green-500' : pct > 40 ? 'bg-amber-500' : 'bg-muted-foreground';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular text-muted-foreground">{pct}</span>
    </div>
  );
}