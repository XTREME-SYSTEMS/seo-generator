import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Play, TrendingUp, DollarSign, FileText, BarChart3 } from 'lucide-react';

const TIMEFRAMES = [
  { id: '1_month', label: '1 Month' },
  { id: '3_month', label: '3 Months' },
  { id: '6_month', label: '6 Months' },
  { id: '12_month', label: '12 Months' },
  { id: '2_year', label: '2 Years' },
  { id: '3_year', label: '3 Years' },
];

const NICHES = ['plumbing', 'roofing', 'locksmith', 'water damage', 'electrician', 'hvac', 'pest control', 'landscaping', 'concrete polishing', 'epoxy flooring', 'garage door', 'tree service'];

export default function SimulationGeneratorTab() {
  const [niche, setNiche] = useState('');
  const [urlPattern, setUrlPattern] = useState('');
  const [timeframe, setTimeframe] = useState('12_month');
  const [startingPages, setStartingPages] = useState(0);
  const [targetCities, setTargetCities] = useState(450);
  const [leadValue, setLeadValue] = useState(50);
  const [conversionRate, setConversionRate] = useState(4);
  const [generating, setGenerating] = useState(false);
  const [simulations, setSimulations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const loadSims = useCallback(async () => {
    try {
      const data = await base44.entities.MarketSimulation.list('-created_date', 50);
      setSimulations(data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadSims(); }, [loadSims]);

  const handleGenerate = async () => {
    if (!niche.trim()) return;
    setGenerating(true);
    try {
      const pattern = urlPattern.trim() || `${niche.trim().replace(/\s+/g, '')}nearme.com`;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a comprehensive market simulation for a programmatic SEO business.
Niche: ${niche}
URL Pattern: ${pattern}
Timeframe: ${timeframe}
Starting pages: ${startingPages}
Target city pages: ${targetCities}
Lead value: $${leadValue}
Conversion rate: ${conversionRate}%

Calculate projected growth across the timeframe. Consider:
- Programmatic page generation (city + service pages)
- Organic traffic growth curve (slow start, hockey stick around month 4-6)
- Lead generation from traffic (conversion rate applied to traffic)
- Revenue from leads (lead value × leads)
- Costs (domain, hosting, content generation, tools)
- Profit trajectory
- Keyword count growth, backlink growth, domain authority growth
- Key milestones, risks, and mitigation strategies

Return a detailed JSON object with all projection metrics.`,
        response_json_schema: {
          type: 'object',
          properties: {
            projected_pages: { type: 'number' },
            projected_traffic: { type: 'number' },
            projected_leads: { type: 'number' },
            projected_revenue: { type: 'number' },
            projected_cost: { type: 'number' },
            projected_profit: { type: 'number' },
            projected_keyword_count: { type: 'number' },
            projected_backlinks: { type: 'number' },
            projected_domain_authority: { type: 'number' },
            projected_ranking_keywords: { type: 'number' },
            growth_assumptions: { type: 'string' },
            milestones: { type: 'array', items: { type: 'string' } },
            risks: { type: 'array', items: { type: 'string' } },
            mitigation_strategies: { type: 'array', items: { type: 'string' } },
            confidence_level: { type: 'string' },
            key_metrics: { type: 'string' },
          },
        },
      });

      const sim = await base44.entities.MarketSimulation.create({
        niche: niche.trim(),
        url_pattern: pattern,
        timeframe,
        starting_pages: Number(startingPages),
        projected_pages: res.projected_pages || targetCities * 3,
        starting_traffic: 0,
        projected_traffic: res.projected_traffic || 0,
        starting_leads: 0,
        projected_leads: res.projected_leads || 0,
        starting_revenue: 0,
        projected_revenue: res.projected_revenue || 0,
        starting_cost: 0,
        projected_cost: res.projected_cost || 0,
        projected_profit: res.projected_profit || 0,
        projected_keyword_count: res.projected_keyword_count || 0,
        projected_backlinks: res.projected_backlinks || 0,
        projected_domain_authority: res.projected_domain_authority || 0,
        projected_ranking_keywords: res.projected_ranking_keywords || 0,
        growth_assumptions: res.growth_assumptions || '',
        milestones: res.milestones || [],
        risks: res.risks || [],
        mitigation_strategies: res.mitigation_strategies || [],
        confidence_level: res.confidence_level || 'medium',
        key_metrics: res.key_metrics || '',
      });

      setSelected(sim);
      setToast({ type: 'success', msg: 'Simulation generated and saved' });
      await loadSims();
    } catch (e) {
      setToast({ type: 'error', msg: `Simulation failed: ${e.message}` });
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Simulation Parameters</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Niche">
            <input
              list="niche-options"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. plumbing"
              className="input"
            />
            <datalist id="niche-options">
              {NICHES.map(n => <option key={n} value={n} />)}
            </datalist>
          </Field>
          <Field label="URL Pattern (optional)">
            <input
              value={urlPattern}
              onChange={(e) => setUrlPattern(e.target.value)}
              placeholder="plumbingnearme.com"
              className="input"
            />
          </Field>
          <Field label="Timeframe">
            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="input">
              {TIMEFRAMES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Starting Pages">
            <input type="number" value={startingPages} onChange={(e) => setStartingPages(Number(e.target.value))} className="input" />
          </Field>
          <Field label="Target City Pages">
            <input type="number" value={targetCities} onChange={(e) => setTargetCities(Number(e.target.value))} className="input" />
          </Field>
          <Field label="Lead Value ($)">
            <input type="number" value={leadValue} onChange={(e) => setLeadValue(Number(e.target.value))} className="input" />
          </Field>
          <Field label="Conversion Rate (%)">
            <input type="number" value={conversionRate} onChange={(e) => setConversionRate(Number(e.target.value))} className="input" />
          </Field>
        </div>
        <div className="mt-4">
          <button
            onClick={handleGenerate}
            disabled={generating || !niche.trim()}
            className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {generating ? 'Generating Simulation...' : 'Generate Simulation'}
          </button>
        </div>
      </div>

      {/* Saved Simulations */}
      {simulations.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-2">Saved Simulations</div>
          <div className="flex flex-wrap gap-2">
            {simulations.map(s => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
                  selected?.id === s.id
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-background border-border text-foreground hover:border-primary/20'
                }`}
              >
                {s.niche} · {s.timeframe.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {selected && (
        <div className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatCard icon={FileText} label="Pages" value={selected.projected_pages?.toLocaleString() || 0} />
            <StatCard icon={TrendingUp} label="Traffic" value={selected.projected_traffic?.toLocaleString() || 0} />
            <StatCard icon={BarChart3} label="Leads" value={selected.projected_leads?.toLocaleString() || 0} />
            <StatCard icon={DollarSign} label="Revenue" value={`$${(selected.projected_revenue || 0).toLocaleString()}`} highlight />
            <StatCard icon={DollarSign} label="Cost" value={`$${(selected.projected_cost || 0).toLocaleString()}`} />
            <StatCard icon={DollarSign} label="Profit" value={`$${(selected.projected_profit || 0).toLocaleString()}`} highlight />
          </div>

          {/* SEO Projections */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MiniStat label="Keywords" value={selected.projected_keyword_count?.toLocaleString() || 0} />
            <MiniStat label="Backlinks" value={selected.projected_backlinks?.toLocaleString() || 0} />
            <MiniStat label="Domain Authority" value={selected.projected_domain_authority || 0} />
            <MiniStat label="Ranking Keywords" value={selected.projected_ranking_keywords?.toLocaleString() || 0} />
          </div>

          {/* Growth Assumptions */}
          {selected.growth_assumptions && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h4 className="font-heading text-sm font-semibold text-foreground mb-2">Growth Assumptions</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">{selected.growth_assumptions}</p>
            </div>
          )}

          {/* Milestones & Risks */}
          <div className="grid gap-4 lg:grid-cols-2">
            {selected.milestones?.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Milestones</h4>
                <ul className="space-y-2">
                  {selected.milestones.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-mono text-[10px] font-bold">{i + 1}</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selected.risks?.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Risks & Mitigation</h4>
                <ul className="space-y-2">
                  {selected.risks.map((r, i) => (
                    <li key={i} className="text-xs text-muted-foreground">
                      <span className="text-rose-600 font-medium">⚠</span> {r}
                      {selected.mitigation_strategies?.[i] && (
                        <span className="block ml-4 mt-0.5 text-emerald-600">→ {selected.mitigation_strategies[i]}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {selected.key_metrics && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h4 className="font-heading text-sm font-semibold text-foreground mb-1">Key Summary</h4>
              <p className="text-xs leading-relaxed text-foreground">{selected.key_metrics}</p>
            </div>
          )}
        </div>
      )}

      {!selected && !generating && (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">Set parameters above and generate a simulation to see projected growth, revenue, and dominance metrics.</p>
        </div>
      )}

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

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, highlight }) {
  return (
    <div className={`bg-card border rounded-lg p-4 ${highlight ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`w-4 h-4 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <p className={`text-xl font-semibold tabular ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-muted/30 rounded-md p-3 text-center">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-heading text-base font-semibold tabular text-foreground">{value}</div>
    </div>
  );
}