import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { RefreshCw, Loader2, CheckCircle2, Clock, Circle, ExternalLink, TrendingUp, DollarSign, Search, Target } from 'lucide-react';

const NICHES = [
  'plumbing', 'water damage restoration', 'locksmith', 'towing', 'roofing',
  'HVAC', 'electrical', 'pest control', 'tree service', 'junk removal',
  'concrete polishing', 'epoxy flooring', 'garage door repair', 'fence installation',
  'landscaping', 'solar installation', 'waterproofing', 'mold remediation',
  'emergency dentist', 'emergency vet', 'emergency plumber', 'fire damage restoration',
  'carpet cleaning', 'air duct cleaning', 'chimney sweep', 'gutter cleaning',
  'window replacement', 'siding contractor', 'deck builder', 'paver installation',
];

const STEPS = [
  { id: 'discover_urls', label: 'URLs' },
  { id: 'benchmark_competitors', label: 'Comps' },
  { id: 'financial_intelligence', label: 'Fin' },
  { id: 'market_simulation', label: 'Sim' },
  { id: 'digital_dominance', label: 'Dom' },
  { id: 'brand_system', label: 'Brand' },
  { id: 'pwa_template', label: 'PWA' },
  { id: 'funnel_discovery', label: 'Funnel' },
];

// Default brand colors per niche — used when no PwaTemplate/brand data exists yet
const NICHE_COLORS = {
  plumbing: ['#2563eb', '#1e40af'], 'water damage restoration': ['#0891b2', '#155e75'], locksmith: ['#7c3aed', '#5b21b6'],
  towing: ['#dc2626', '#991b1b'], roofing: ['#ea580c', '#c2410c'], HVAC: ['#0ea5e9', '#0369a1'],
  electrical: ['#eab308', '#a16207'], 'pest control': ['#16a34a', '#15803d'], 'tree service': ['#15803d', '#166534'],
  'junk removal': ['#84cc16', '#4d7c0f'], 'concrete polishing': ['#64748b', '#475569'], 'epoxy flooring': ['#8b5cf6', '#6d28d9'],
  'garage door repair': ['#f59e0b', '#d97706'], 'fence installation': ['#a16207', '#78350f'], landscaping: ['#22c55e', '#16a34a'],
  'solar installation': ['#facc15', '#ca8a04'], waterproofing: ['#0284c7', '#0369a1'], 'mold remediation': ['#10b981', '#047857'],
  'emergency dentist': ['#ec4899', '#be185d'], 'emergency vet': ['#f43f5e', '#be123c'], 'emergency plumber': ['#3b82f6', '#1d4ed8'],
  'fire damage restoration': ['#ef4444', '#b91c1c'], 'carpet cleaning': ['#06b6d4', '#0891b2'], 'air duct cleaning': ['#14b8a6', '#0d9488'],
  'chimney sweep': ['#451a03', '#78350f'], 'gutter cleaning': ['#65a30d', '#4d7c0f'], 'window replacement': ['#60a5fa', '#3b82f6'],
  'siding contractor': ['#94a3b8', '#64748b'], 'deck builder': ['#92400e', '#78350f'], 'paver installation': ['#78716c', '#57534e'],
};

export default function PortfolioGallery() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const [urls, comps, fins, templates, funnels, receipts] = await Promise.all([
        base44.entities.StrategicUrl.list('-created_date', 500).catch(() => []),
        base44.entities.CompetitorBenchmark.list('-created_date', 500).catch(() => []),
        base44.entities.FinancialIntelligence.list('-created_date', 500).catch(() => []),
        base44.entities.PwaTemplate.list('-created_date', 500).catch(() => []),
        base44.entities.FunnelDiscovery.list('-created_date', 500).catch(() => []),
        base44.entities.Receipt.filter({ source: 'EndToEndGenerator' }, '-created_date', 500).catch(() => []),
      ]);

      // Extract brand data from receipts
      const brandData = {};
      for (const r of receipts) {
        if (r.detail && r.summary && r.summary.includes('brand_system')) {
          try {
            const bd = JSON.parse(r.detail);
            if (bd.niche) brandData[bd.niche] = bd;
          } catch {}
        }
      }

      const niches = {};
      for (const niche of NICHES) {
        const nicheUrls = urls.filter(u => u.niche === niche);
        const nicheComps = comps.filter(c => c.niche === niche);
        const nicheFin = fins.find(f => f.niche === niche);
        const nicheTemplate = templates.find(t => t.industry === niche);
        const nicheFunnel = funnels.find(f => f.niche === niche);
        const nicheBrand = brandData[niche];

        const steps = {
          discover_urls: nicheUrls.length > 0,
          benchmark_competitors: nicheComps.length > 0,
          financial_intelligence: !!nicheFin,
          market_simulation: false, // checked separately below
          digital_dominance: false,
          brand_system: !!nicheBrand,
          pwa_template: !!nicheTemplate,
          funnel_discovery: !!nicheFunnel,
        };

        niches[niche] = {
          niche,
          urls: nicheUrls,
          competitors: nicheComps,
          financial: nicheFin,
          template: nicheTemplate,
          funnel: nicheFunnel,
          brand: nicheBrand,
          steps,
          stepCount: Object.values(steps).filter(Boolean).length,
        };
      }

      // Load simulations and dominance plans separately (they're numerous)
      const sims = await base44.entities.MarketSimulation.list('-created_date', 500).catch(() => []);
      const doms = await base44.entities.DigitalDominancePlan.list('-created_date', 500).catch(() => []);
      for (const niche of NICHES) {
        if (sims.some(s => s.niche === niche)) niches[niche].steps.market_simulation = true;
        if (doms.some(d => d.niche === niche)) niches[niche].steps.digital_dominance = true;
        niches[niche].stepCount = Object.values(niches[niche].steps).filter(Boolean).length;
      }

      setData(niches);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredNiches = useMemo(() => {
    if (filter === 'all') return NICHES;
    if (filter === 'done') return NICHES.filter(n => data[n]?.stepCount === 8);
    if (filter === 'partial') return NICHES.filter(n => data[n] && data[n].stepCount > 0 && data[n].stepCount < 8);
    if (filter === 'pending') return NICHES.filter(n => !data[n] || data[n].stepCount === 0);
    return NICHES;
  }, [filter, data]);

  const stats = useMemo(() => {
    const done = NICHES.filter(n => data[n]?.stepCount === 8).length;
    const partial = NICHES.filter(n => data[n] && data[n].stepCount > 0 && data[n].stepCount < 8).length;
    const pending = NICHES.length - done - partial;
    return { done, partial, pending };
  }, [data]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-gray-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Portfolio Gallery</h1>
            <p className="text-sm text-muted-foreground">Visual thumbnails of all 30 niche websites being generated by the autonomous pipeline</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/end-to-end" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ExternalLink className="w-4 h-4" /> Pipeline
          </Link>
          <button onClick={load} disabled={loading} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatBox label="Fully Processed" value={stats.done} tone="green" />
        <StatBox label="In Progress" value={stats.partial} tone="yellow" />
        <StatBox label="Not Started" value={stats.pending} tone="muted" />
        <StatBox label="Total Niches" value={NICHES.length} tone="blue" />
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'all', label: 'All' },
          { id: 'done', label: 'Fully Processed' },
          { id: 'partial', label: 'In Progress' },
          { id: 'pending', label: 'Not Started' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium ${filter === f.id ? 'bg-yellow-400 text-gray-900' : 'bg-card border border-border text-foreground hover:border-yellow-400/50'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredNiches.map(niche => (
            <NicheCard key={niche} niche={niche} data={data[niche]} />
          ))}
        </div>
      )}
    </div>
  );
}

function NicheCard({ niche, data }) {
  const colors = NICHE_COLORS[niche] || ['#64748b', '#475569'];
  const primaryColor = data?.brand?.primary_color || data?.template?.primary_color || colors[0];
  const accentColor = data?.brand?.accent_color || data?.template?.accent_color || colors[1];
  const brandName = data?.brand?.brand_name || niche.charAt(0).toUpperCase() + niche.slice(1);
  const tagline = data?.brand?.tagline || `Professional ${niche} services near you`;
  const logoUrl = data?.brand?.logo_url;
  const stepCount = data?.stepCount || 0;
  const isDone = stepCount === 8;
  const isPartial = stepCount > 0 && stepCount < 8;
  const oppScore = data?.financial?.opportunity_score;
  const monthlyRev = data?.financial?.estimated_monthly_revenue;
  const topUrl = data?.urls?.[0];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-yellow-400/50 transition-all group">
      {/* Browser Chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/50 border-b border-border">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <div className="flex-1 ml-2 text-[10px] text-muted-foreground truncate font-mono">
          {topUrl?.url || `${niche.replace(/\s+/g, '')}nearme.com`}
        </div>
        {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
        {isPartial && <Clock className="w-3.5 h-3.5 text-yellow-500" />}
        {!stepCount && <Circle className="w-3.5 h-3.5 text-muted-foreground" />}
      </div>

      {/* Website Preview */}
      <div className="relative h-44 overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}>
        {/* Simulated website hero */}
        <div className="absolute inset-0 p-4 flex flex-col">
          {/* Nav bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              {logoUrl ? (
                <img src={logoUrl} alt={brandName} className="w-6 h-6 rounded object-contain bg-white/90 p-0.5" />
              ) : (
                <div className="w-6 h-6 rounded bg-white/90 flex items-center justify-center text-[10px] font-bold" style={{ color: primaryColor }}>
                  {brandName.charAt(0)}
                </div>
              )}
              <span className="text-white text-[11px] font-semibold truncate max-w-[100px]">{brandName}</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-6 h-1 rounded-full bg-white/40" />
              <div className="w-6 h-1 rounded-full bg-white/40" />
              <div className="w-6 h-1 rounded-full bg-white/40" />
            </div>
          </div>

          {/* Hero text */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="h-3 w-3/4 rounded bg-white/80 mb-1.5" />
            <div className="h-3 w-1/2 rounded bg-white/60 mb-2" />
            <div className="h-1.5 w-2/3 rounded bg-white/30 mb-1" />
            <div className="h-1.5 w-1/2 rounded bg-white/30" />
          </div>

          {/* CTA button */}
          <div className="flex gap-1.5">
            <div className="h-6 w-20 rounded-md bg-white/90" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            <div className="h-6 w-16 rounded-md border border-white/50" />
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            isDone ? 'bg-green-500 text-white' : isPartial ? 'bg-yellow-500 text-gray-900' : 'bg-gray-500 text-white'
          }`}>
            {isDone ? 'COMPLETE' : isPartial ? `${stepCount}/8` : 'PENDING'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div>
          <h3 className="font-semibold text-sm text-foreground capitalize">{niche}</h3>
          <p className="text-xs text-muted-foreground truncate">{tagline}</p>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-3 text-xs">
          {oppScore != null && (
            <span className="flex items-center gap-1 text-foreground">
              <Target className="w-3 h-3 text-yellow-500" />
              <span className="font-medium">{oppScore}/100</span>
            </span>
          )}
          {monthlyRev != null && (
            <span className="flex items-center gap-1 text-foreground">
              <DollarSign className="w-3 h-3 text-green-500" />
              <span className="font-medium">${(monthlyRev / 1000).toFixed(0)}K/mo</span>
            </span>
          )}
          {topUrl && (
            <span className="flex items-center gap-1 text-muted-foreground ml-auto">
              <Search className="w-3 h-3" />
              <span className="text-[10px]">{data.urls.length} URLs</span>
            </span>
          )}
        </div>

        {/* Step progress bar */}
        <div className="flex gap-0.5">
          {STEPS.map(s => (
            <div key={s.id}
              className={`h-1.5 flex-1 rounded ${data?.steps?.[s.id] ? 'bg-green-500' : 'bg-muted'}`}
              title={`${s.label}: ${data?.steps?.[s.id] ? 'done' : 'pending'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, tone }) {
  const colors = {
    green: 'text-green-600', yellow: 'text-yellow-600', muted: 'text-muted-foreground', blue: 'text-blue-600',
  };
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className={`text-2xl font-bold ${colors[tone]}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}