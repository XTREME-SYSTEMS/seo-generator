import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Search, Target, TrendingUp, DollarSign, BarChart3, Zap, Palette, Smartphone, Filter, Rocket, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';

const PIPELINE_STEPS = [
  { id: 'discover_urls', label: 'URL Discovery', icon: Search, desc: 'Google Trends + highest-search businesses, services & products' },
  { id: 'benchmark_competitors', label: 'Competitor Benchmarking', icon: Target, desc: 'Top 3 competitors scraped, analyzed & logged' },
  { id: 'financial_intelligence', label: 'Financial Intelligence', icon: DollarSign, desc: 'Full financial report with ROI, CAC, LTV, TAM/SAM/SOM' },
  { id: 'market_simulation', label: 'Market Simulation', icon: BarChart3, desc: '1 week → 10 year growth projections' },
  { id: 'digital_dominance', label: 'Digital Dominance', icon: Zap, desc: 'Backlinks, blogs, keywords, directories, schema' },
  { id: 'brand_system', label: 'Brand System', icon: Palette, desc: 'Logo + brand identity generation' },
  { id: 'pwa_template', label: 'PWA Template', icon: Smartphone, desc: 'Multi-industry Google-guidelines-compliant template' },
  { id: 'funnel_discovery', label: 'Funnel Discovery', icon: Filter, desc: 'Top 3 converting URLs + funnel optimization' },
];

const NICHES = [
  'plumbing', 'water damage restoration', 'locksmith', 'towing', 'roofing',
  'HVAC', 'electrical', 'pest control', 'tree service', 'junk removal',
  'concrete polishing', 'epoxy flooring', 'garage door repair', 'fence installation',
  'landscaping', 'solar installation', 'waterproofing', 'mold remediation',
  'emergency dentist', 'emergency vet', 'emergency plumber', 'fire damage restoration',
  'carpet cleaning', 'air duct cleaning', 'chimney sweep', 'gutter cleaning',
  'window replacement', 'siding contractor', 'deck builder', 'paver installation',
];

export default function EndToEndGenerator() {
  const [niche, setNiche] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [stepResults, setStepResults] = useState({});
  const [error, setError] = useState('');
  const [completedSteps, setCompletedSteps] = useState([]);
  const [activeView, setActiveView] = useState('pipeline');

  // Load existing data
  const [existingData, setExistingData] = useState({});
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function loadExisting() {
      try {
        const [urls, competitors, financials, simulations, dominance, templates, funnels] = await Promise.all([
          base44.entities.StrategicUrl.list('-created_date', 20).catch(() => []),
          base44.entities.CompetitorBenchmark.list('-created_date', 20).catch(() => []),
          base44.entities.FinancialIntelligence.list('-created_date', 10).catch(() => []),
          base44.entities.MarketSimulation.list('-created_date', 50).catch(() => []),
          base44.entities.DigitalDominancePlan.list('-created_date', 10).catch(() => []),
          base44.entities.PwaTemplate.list('-created_date', 10).catch(() => []),
          base44.entities.FunnelDiscovery.list('-created_date', 10).catch(() => []),
        ]);
        setExistingData({ urls, competitors, financials, simulations, dominance, templates, funnels });
      } catch (e) { console.error(e); }
      setLoadingData(false);
    }
    loadExisting();
  }, []);

  const runPipeline = async () => {
    const finalNiche = customNiche || niche;
    if (!finalNiche) { setError('Please select or enter a niche'); return; }
    setRunning(true);
    setError('');
    setStepResults({});
    setCompletedSteps([]);

    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      const step = PIPELINE_STEPS[i];
      setCurrentStep(i);
      try {
        const res = await base44.functions.invoke('EndToEndGenerator', { niche: finalNiche, step: step.id });
        setStepResults(prev => ({ ...prev, [step.id]: res.data?.results?.[step.id] || res.data }));
        setCompletedSteps(prev => [...prev, step.id]);
      } catch (err) {
        setError(`Step ${step.label} failed: ${err.message}`);
        setRunning(false);
        setCurrentStep(-1);
        return;
      }
    }

    setRunning(false);
    setCurrentStep(-1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center">
            <Rocket className="w-6 h-6 text-gray-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">End-to-End Generator</h1>
            <p className="text-sm text-muted-foreground">Full pipeline: URL discovery → competitor benchmarking → financial intelligence → market simulation → digital dominance → brand → PWA → funnel</p>
          </div>
        </div>
      </div>

      {/* Input Controls */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Select Niche</label>
            <select value={niche} onChange={(e) => { setNiche(e.target.value); setCustomNiche(''); }} className="w-full input">
              <option value="">Select a niche...</option>
              {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Or Enter Custom Niche</label>
            <input type="text" value={customNiche} onChange={(e) => setCustomNiche(e.target.value)} placeholder="e.g. emergency roof repair" className="w-full input" />
          </div>
          <div className="flex items-end">
            <button onClick={runPipeline} disabled={running}
              className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-bold px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
              {running ? <><Loader2 className="w-4 h-4 animate-spin" /> Running Pipeline...</> : <><Rocket className="w-4 h-4" /> Run Full Pipeline</>}
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {error}</p>}
      </div>

      {/* Pipeline Steps */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {PIPELINE_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isRunning = currentStep === i;
          const isDone = completedSteps.includes(step.id);
          const result = stepResults[step.id];

          return (
            <div key={step.id} className={`border rounded-lg p-4 transition-all ${
              isRunning ? 'border-yellow-400 bg-yellow-50' : isDone ? 'border-green-300 bg-green-50' : 'border-border bg-card'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isRunning ? 'bg-yellow-400' : isDone ? 'bg-green-500' : 'bg-muted'
                }`}>
                  {isRunning ? <Loader2 className="w-4 h-4 text-gray-900 animate-spin" /> : isDone ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Icon className="w-4 h-4 text-muted-foreground" />}
                </div>
                <span className="text-xs text-muted-foreground">Step {i + 1}</span>
              </div>
              <h4 className="font-semibold text-sm text-foreground mb-1">{step.label}</h4>
              <p className="text-xs text-muted-foreground mb-2">{step.desc}</p>
              {result && <StepResult step={step.id} data={result} />}
            </div>
          );
        })}
      </div>

      {/* Existing Data Viewer */}
      {!loadingData && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <button onClick={() => setActiveView('pipeline')} className={`text-sm font-medium px-3 py-1.5 rounded ${activeView === 'pipeline' ? 'bg-yellow-100 text-yellow-700' : 'text-muted-foreground'}`}>Pipeline Results</button>
            <button onClick={() => setActiveView('urls')} className={`text-sm font-medium px-3 py-1.5 rounded ${activeView === 'urls' ? 'bg-yellow-100 text-yellow-700' : 'text-muted-foreground'}`}>Discovered URLs ({existingData.urls?.length || 0})</button>
            <button onClick={() => setActiveView('competitors')} className={`text-sm font-medium px-3 py-1.5 rounded ${activeView === 'competitors' ? 'bg-yellow-100 text-yellow-700' : 'text-muted-foreground'}`}>Competitors ({existingData.competitors?.length || 0})</button>
            <button onClick={() => setActiveView('financials')} className={`text-sm font-medium px-3 py-1.5 rounded ${activeView === 'financials' ? 'bg-yellow-100 text-yellow-700' : 'text-muted-foreground'}`}>Financials ({existingData.financials?.length || 0})</button>
            <button onClick={() => setActiveView('simulations')} className={`text-sm font-medium px-3 py-1.5 rounded ${activeView === 'simulations' ? 'bg-yellow-100 text-yellow-700' : 'text-muted-foreground'}`}>Simulations ({existingData.simulations?.length || 0})</button>
            <button onClick={() => setActiveView('dominance')} className={`text-sm font-medium px-3 py-1.5 rounded ${activeView === 'dominance' ? 'bg-yellow-100 text-yellow-700' : 'text-muted-foreground'}`}>Dominance ({existingData.dominance?.length || 0})</button>
            <button onClick={() => setActiveView('templates')} className={`text-sm font-medium px-3 py-1.5 rounded ${activeView === 'templates' ? 'bg-yellow-100 text-yellow-700' : 'text-muted-foreground'}`}>PWA Templates ({existingData.templates?.length || 0})</button>
            <button onClick={() => setActiveView('funnels')} className={`text-sm font-medium px-3 py-1.5 rounded ${activeView === 'funnels' ? 'bg-yellow-100 text-yellow-700' : 'text-muted-foreground'}`}>Funnels ({existingData.funnels?.length || 0})</button>
          </div>

          {activeView === 'urls' && <UrlsView data={existingData.urls || []} />}
          {activeView === 'competitors' && <CompetitorsView data={existingData.competitors || []} />}
          {activeView === 'financials' && <FinancialsView data={existingData.financials || []} />}
          {activeView === 'simulations' && <SimulationsView data={existingData.simulations || []} />}
          {activeView === 'dominance' && <DominanceView data={existingData.dominance || []} />}
          {activeView === 'templates' && <TemplatesView data={existingData.templates || []} />}
          {activeView === 'funnels' && <FunnelsView data={existingData.funnels || []} />}
        </div>
      )}
    </div>
  );
}

function StepResult({ step, data }) {
  if (!data) return null;
  const lines = [];
  if (step === 'discover_urls') {
    lines.push(`${data.url_count || 0} URLs discovered`);
    if (data.google_trends_summary) lines.push(`Trends: ${data.google_trends_summary.substring(0, 80)}...`);
  }
  if (step === 'benchmark_competitors') lines.push(`${data.competitor_count || 0} competitors benchmarked`);
  if (step === 'financial_intelligence') {
    lines.push(`Opportunity: ${data.opportunity_score || 0}/100`);
    lines.push(`Rev: $${(data.estimated_monthly_revenue || 0).toLocaleString()}/mo`);
  }
  if (step === 'market_simulation') lines.push(`${data.timeframe_count || 0} timeframes projected`);
  if (step === 'digital_dominance') {
    lines.push(`${data.total_target_pages || 0} pages, ${data.keyword_count || 0} keywords`);
    lines.push(`${data.backlink_target_count || 0} backlink targets`);
  }
  if (step === 'brand_system' && data.brand_name) {
    lines.push(`Brand: ${data.brand_name}`);
    lines.push(`Tagline: ${data.tagline}`);
  }
  if (step === 'pwa_template') lines.push(`Template: ${data.template_name}`);
  if (step === 'funnel_discovery') lines.push(`Conv rate: ${data.estimated_conversion_rate || 0}%`);

  return (
    <div className="space-y-0.5 mt-2 pt-2 border-t border-border">
      {lines.map((l, i) => <p key={i} className="text-xs text-green-700">{l}</p>)}
    </div>
  );
}

function UrlsView({ data }) {
  return (
    <div className="space-y-2">
      {data.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">No URLs discovered yet. Run the pipeline.</p> :
        data.map(u => (
          <div key={u.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
            <span className="font-mono text-sm text-foreground flex-1">{u.url}</span>
            <span className="text-xs text-muted-foreground">{u.niche}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">{u.keyword_category}</span>
            <span className="text-sm font-medium text-foreground">${(u.estimated_monthly_revenue || 0).toLocaleString()}/mo</span>
            <span className="text-xs text-muted-foreground">{u.status}</span>
          </div>
        ))
      }
    </div>
  );
}

function CompetitorsView({ data }) {
  return (
    <div className="space-y-3">
      {data.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">No competitors benchmarked yet.</p> :
        data.map(c => (
          <div key={c.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded font-bold ${c.rank === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-muted text-muted-foreground'}`}>#{c.rank}</span>
              <h4 className="font-semibold text-foreground">{c.competitor_name}</h4>
              <span className="text-xs text-muted-foreground">{c.competitor_url}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{c.business_model}</p>
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div><span className="text-muted-foreground">Traffic:</span> <strong>{(c.estimated_monthly_traffic || 0).toLocaleString()}/mo</strong></div>
              <div><span className="text-muted-foreground">DA:</span> <strong>{c.domain_authority || 0}</strong></div>
              <div><span className="text-muted-foreground">Backlinks:</span> <strong>{(c.backlink_count || 0).toLocaleString()}</strong></div>
              <div><span className="text-muted-foreground">Indexed:</span> <strong>{(c.pages_indexed || 0).toLocaleString()}</strong></div>
            </div>
            {c.keywords_ranked_for?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {c.keywords_ranked_for.slice(0, 10).map((k, i) => <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{k}</span>)}
              </div>
            )}
            {c.superiority_strategy && <p className="mt-2 text-xs text-green-700"><strong>Superiority:</strong> {c.superiority_strategy.substring(0, 150)}</p>}
          </div>
        ))
      }
    </div>
  );
}

function FinancialsView({ data }) {
  return (
    <div className="space-y-3">
      {data.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">No financial reports yet.</p> :
        data.map(f => (
          <div key={f.id} className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-3">{f.niche}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Metric label="Opportunity Score" value={`${f.opportunity_score || 0}/100`} />
              <Metric label="Monthly Revenue" value={`$${(f.estimated_monthly_revenue || 0).toLocaleString()}`} />
              <Metric label="Monthly Profit" value={`$${(f.estimated_monthly_profit || 0).toLocaleString()}`} />
              <Metric label="ROI" value={`${f.roi_percentage || 0}%`} />
              <Metric label="Break Even" value={`${f.break_even_months || 0} months`} />
              <Metric label="CAC" value={`$${(f.estimated_cac || 0).toLocaleString()}`} />
              <Metric label="LTV" value={`$${(f.avg_customer_ltv || 0).toLocaleString()}`} />
              <Metric label="Gross Margin" value={`${f.gross_margin_pct || 0}%`} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <div><span className="text-muted-foreground">TAM:</span> {f.market_size_tam}</div>
              <div><span className="text-muted-foreground">SAM:</span> {f.market_size_sam}</div>
              <div><span className="text-muted-foreground">SOM:</span> {f.market_size_som}</div>
            </div>
          </div>
        ))
      }
    </div>
  );
}

function SimulationsView({ data }) {
  const TIMEFRAME_LABELS = { '1_week': '1 Week', '1_month': '1 Month', '3_month': '3 Months', '6_month': '6 Months', '9_month': '9 Months', '12_month': '12 Months', '2_year': '2 Years', '3_year': '3 Years', '5_year': '5 Years', '10_year': '10 Years' };
  const byNiche = {};
  for (const s of data) { if (!byNiche[s.niche]) byNiche[s.niche] = []; byNiche[s.niche].push(s); }

  return (
    <div className="space-y-4">
      {Object.keys(byNiche).length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">No simulations yet.</p> :
        Object.entries(byNiche).map(([niche, sims]) => (
          <div key={niche} className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-3">{niche}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-2 text-muted-foreground">Timeframe</th>
                    <th className="text-right py-2 text-muted-foreground">Pages</th>
                    <th className="text-right py-2 text-muted-foreground">Traffic/mo</th>
                    <th className="text-right py-2 text-muted-foreground">Leads/mo</th>
                    <th className="text-right py-2 text-muted-foreground">Revenue/mo</th>
                    <th className="text-right py-2 text-muted-foreground">Profit/mo</th>
                    <th className="text-right py-2 text-muted-foreground">Keywords</th>
                    <th className="text-right py-2 text-muted-foreground">DA</th>
                    <th className="text-center py-2 text-muted-foreground">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {sims.map(s => (
                    <tr key={s.id} className="border-b border-border">
                      <td className="py-2 font-medium text-foreground">{TIMEFRAME_LABELS[s.timeframe] || s.timeframe}</td>
                      <td className="py-2 text-right tabular">{(s.projected_pages || 0).toLocaleString()}</td>
                      <td className="py-2 text-right tabular">{(s.projected_traffic || 0).toLocaleString()}</td>
                      <td className="py-2 text-right tabular">{(s.projected_leads || 0).toLocaleString()}</td>
                      <td className="py-2 text-right tabular font-medium">${(s.projected_revenue || 0).toLocaleString()}</td>
                      <td className="py-2 text-right tabular font-medium text-green-600">${(s.projected_profit || 0).toLocaleString()}</td>
                      <td className="py-2 text-right tabular">{(s.projected_keyword_count || 0).toLocaleString()}</td>
                      <td className="py-2 text-right tabular">{s.projected_domain_authority || 0}</td>
                      <td className="py-2 text-center"><span className={`text-xs px-1.5 py-0.5 rounded ${s.confidence_level === 'high' ? 'bg-green-100 text-green-700' : s.confidence_level === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{s.confidence_level}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      }
    </div>
  );
}

function DominanceView({ data }) {
  return (
    <div className="space-y-3">
      {data.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">No dominance plans yet.</p> :
        data.map(d => (
          <div key={d.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-foreground">{d.niche}</h4>
              <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">Dominance: {d.dominance_score || 0}/100</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
              <Metric label="Target Cities" value={(d.total_target_cities || 0).toLocaleString()} />
              <Metric label="Target Pages" value={(d.total_target_pages || 0).toLocaleString()} />
              <Metric label="Keywords" value={(d.target_keywords || []).length} />
              <Metric label="Backlink Targets" value={(d.backlink_targets || []).length} />
            </div>
            {(d.target_keywords || []).length > 0 && (
              <div className="mb-2">
                <span className="text-xs text-muted-foreground">Top keywords: </span>
                {d.target_keywords.slice(0, 15).map((k, i) => <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground mr-1">{k}</span>)}
              </div>
            )}
            {(d.backlink_targets || []).length > 0 && (
              <div className="mb-2">
                <span className="text-xs text-muted-foreground">Backlink targets: </span>
                {d.backlink_targets.slice(0, 10).map((b, i) => <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 mr-1">{b}</span>)}
              </div>
            )}
            {d.google_guidelines_compliance && <p className="text-xs text-muted-foreground mt-2"><strong>Google compliance:</strong> {d.google_guidelines_compliance.substring(0, 200)}</p>}
          </div>
        ))
      }
    </div>
  );
}

function TemplatesView({ data }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {data.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8 col-span-2">No PWA templates yet.</p> :
        data.map(t => (
          <div key={t.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-foreground">{t.template_name}</h4>
              <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">{t.status}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{t.industry} · {t.template_type}</p>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded" style={{ background: t.primary_color }} />
              <div className="w-4 h-4 rounded" style={{ background: t.accent_color }} />
              <span className="text-xs text-muted-foreground">{t.font_heading} / {t.font_body}</span>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {(t.sections || []).map((s, i) => <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s}</span>)}
            </div>
            <div className="flex flex-wrap gap-1">
              {(t.schema_types || []).map((s, i) => <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{s}</span>)}
            </div>
            <div className="mt-2 flex gap-3 text-xs">
              {t.pwa_enabled && <span className="text-green-600">✓ PWA</span>}
              {t.offline_support && <span className="text-green-600">✓ Offline</span>}
              {t.push_notifications && <span className="text-green-600">✓ Push</span>}
              {t.google_guidelines_compliant && <span className="text-green-600">✓ Google Compliant</span>}
            </div>
          </div>
        ))
      }
    </div>
  );
}

function FunnelsView({ data }) {
  return (
    <div className="space-y-3">
      {data.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">No funnels discovered yet.</p> :
        data.map(f => (
          <div key={f.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-foreground">{f.niche}</h4>
              <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{f.funnel_type}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <Metric label="Est. Conversion Rate" value={`${f.estimated_conversion_rate || 0}%`} />
              <Metric label="Benchmark Rate" value={`${f.benchmark_conversion_rate || 0}%`} />
            </div>
            {(f.top_funnel_urls || []).length > 0 && (
              <div className="mb-2">
                <span className="text-xs text-muted-foreground">Top funnel URLs:</span>
                {f.top_funnel_urls.map((u, i) => <span key={i} className="block text-xs text-foreground">{u}</span>)}
              </div>
            )}
            {(f.funnel_steps || []).length > 0 && (
              <div className="space-y-1">
                {f.funnel_steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-yellow-400 text-gray-900 flex items-center justify-center font-bold">{s.step || i + 1}</span>
                    <span className="text-foreground">{s.name}</span>
                    <span className="text-muted-foreground">— {s.action}</span>
                    <span className="text-green-600 ml-auto">{s.conversion_rate || 0}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      }
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground block">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}