import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw, Zap, CheckCircle2, Clock, Circle } from 'lucide-react';

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

export default function AutonomousLoopStatus() {
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [urls, comps, fins, sims, doms, templates, funnels, receipts] = await Promise.all([
        base44.entities.StrategicUrl.list('-created_date', 500).catch(() => []),
        base44.entities.CompetitorBenchmark.list('-created_date', 500).catch(() => []),
        base44.entities.FinancialIntelligence.list('-created_date', 500).catch(() => []),
        base44.entities.MarketSimulation.list('-created_date', 500).catch(() => []),
        base44.entities.DigitalDominancePlan.list('-created_date', 500).catch(() => []),
        base44.entities.PwaTemplate.list('-created_date', 500).catch(() => []),
        base44.entities.FunnelDiscovery.list('-created_date', 500).catch(() => []),
        base44.entities.Receipt.filter({ source: 'EndToEndGenerator' }, '-created_date', 500).catch(() => []),
      ]);

      const p = {};
      for (const niche of NICHES) {
        p[niche] = {
          discover_urls: urls.some(u => u.niche === niche),
          benchmark_competitors: comps.some(c => c.niche === niche),
          financial_intelligence: fins.some(f => f.niche === niche),
          market_simulation: sims.some(s => s.niche === niche),
          digital_dominance: doms.some(d => d.niche === niche),
          brand_system: receipts.some(r => r.summary && r.summary.includes('brand_system') && r.summary.includes(niche)),
          pwa_template: templates.some(t => t.industry === niche),
          funnel_discovery: funnels.some(f => f.niche === niche),
        };
      }
      setProgress(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const fullyProcessed = Object.values(progress).filter(p => p && STEPS.every(s => p[s.id])).length;
  const partiallyProcessed = Object.values(progress).filter(p => p && STEPS.some(s => p[s.id]) && !STEPS.every(s => p[s.id])).length;
  const notStarted = NICHES.length - fullyProcessed - partiallyProcessed;
  const totalSteps = NICHES.length * STEPS.length;
  const completedSteps = Object.values(progress).reduce((acc, p) => acc + (p ? STEPS.filter(s => p[s.id]).length : 0), 0);

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-transparent border-2 border-yellow-400 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          <h3 className="font-bold text-foreground">Autonomous Loop Active</h3>
          <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Running
          </span>
        </div>
        <button onClick={load} disabled={loading} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Refresh
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{fullyProcessed}</p>
          <p className="text-xs text-muted-foreground">Fully Processed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">{partiallyProcessed}</p>
          <p className="text-xs text-muted-foreground">In Progress</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-muted-foreground">{notStarted}</p>
          <p className="text-xs text-muted-foreground">Not Started</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{completedSteps}/{totalSteps}</p>
          <p className="text-xs text-muted-foreground">Steps Done</p>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mb-3">
        Loop runs every 5 minutes — three steps per cycle. Processes all {NICHES.length} niches x {STEPS.length} steps = {totalSteps} total steps autonomously.
      </div>

      <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
        {NICHES.map(niche => {
          const p = progress[niche];
          if (!p) return null;
          const done = STEPS.filter(s => p[s.id]).length;
          const isFull = done === STEPS.length;
          return (
            <div key={niche} className="flex items-center gap-2">
              <span className={`text-xs w-36 truncate ${isFull ? 'text-green-600 font-medium' : 'text-foreground'}`}>{niche}</span>
              <div className="flex gap-0.5 flex-1">
                {STEPS.map(s => (
                  <div key={s.id} className={`h-2.5 flex-1 rounded ${p[s.id] ? 'bg-green-500' : 'bg-muted'}`} title={`${s.label}: ${p[s.id] ? 'done' : 'pending'}`} />
                ))}
              </div>
              <span className={`text-xs w-8 text-right ${isFull ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>{done}/{STEPS.length}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}