import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Rocket, Shield, CheckCircle2, XCircle, Brain, Image, Layers, Wrench, Target, AlertCircle, Sparkles, Globe, TrendingUp, DollarSign, Building2 } from 'lucide-react';
import SiteRenderer from '@/components/builder/SiteRenderer';

const TEMPLATES = [
  { id: 'epoxy', label: 'Epoxy & Concrete Flooring' },
  { id: 'general_contractor', label: 'General Contractor' },
  { id: 'cleaning', label: 'Cleaning Services' },
  { id: 'roofing', label: 'Roofing' },
  { id: 'hvac', label: 'HVAC' },
  { id: 'landscaping', label: 'Landscaping & Hardscaping' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'pest_control', label: 'Pest Control' },
  { id: 'restaurant', label: 'Restaurant / Hospitality' },
];

const STAGE_ICONS = {
  'Brand Intelligence': Brain,
  'SEO/AEO Content Generation': Sparkles,
  'Image Generation': Image,
  'Section Assembly': Layers,
  'QA Gate (Google Compliance)': Shield,
  'Self-Healing': Wrench,
};

export default function DeepArchitecture() {
  const [businessName, setBusinessName] = useState('');
  const [templateId, setTemplateId] = useState('epoxy');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [pageType, setPageType] = useState('landing');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState('pipeline');

  async function runPipeline() {
    if (!businessName.trim()) { setError('Business name is required'); return; }
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const res = await base44.functions.invoke('DeepArchitecturePipeline', {
        business_name: businessName,
        template_id: templateId,
        city,
        phone,
        page_type: pageType,
      });
      setResult(res.data || res);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  const qaScore = result?.qa_score || 0;
  const qaColor = qaScore >= 80 ? 'text-green-600 bg-green-100' : qaScore >= 50 ? 'text-yellow-700 bg-yellow-100' : 'text-red-600 bg-red-100';

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center">
          <Rocket className="w-6 h-6 text-gray-900" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Deep Architecture Pipeline</h1>
          <p className="text-sm text-muted-foreground">Deterministic, autonomous, end-to-end site generation — 6-stage pipeline with self-healing</p>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-yellow-500" /> Pipeline Input</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Business Name *</label>
            <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Acme Epoxy Floors" className="input" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Industry Template</label>
            <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="input">
              {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">City / Service Area</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="Dallas, TX" className="input" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" className="input" />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button onClick={() => setPageType('landing')} className={`px-4 py-2 text-sm ${pageType === 'landing' ? 'bg-yellow-400 text-gray-900 font-bold' : 'bg-card text-foreground'}`}>Landing Page</button>
            <button onClick={() => setPageType('funnel')} className={`px-4 py-2 text-sm ${pageType === 'funnel' ? 'bg-yellow-400 text-gray-900 font-bold' : 'bg-card text-foreground'}`}>Lead Funnel</button>
          </div>
          <button
            onClick={runPipeline}
            disabled={running || !businessName.trim()}
            className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-bold px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            {running ? <><Loader2 className="w-4 h-4 animate-spin" /> Running Pipeline...</> : <><Rocket className="w-4 h-4" /> Run Deep Architecture Pipeline</>}
          </button>
        </div>
        {error && <div className="mt-3 text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {error}</div>}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Overall Status + QA Score */}
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1">Overall Status</div>
              <div className={`text-xl font-bold flex items-center gap-2 ${result.overall_status === 'success' ? 'text-green-600' : result.overall_status === 'partial' ? 'text-yellow-600' : 'text-red-600'}`}>
                {result.overall_status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : result.overall_status === 'partial' ? <AlertCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {result.overall_status.toUpperCase()}
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1">QA Compliance Score</div>
              <div className={`text-xl font-bold inline-block px-3 py-1 rounded-full ${qaColor}`}>{qaScore}/100</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1">Sections Generated</div>
              <div className="text-xl font-bold text-foreground">{result.generated_site?.sections?.length || 0}</div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden mb-6 w-fit">
            <button onClick={() => setView('pipeline')} className={`px-4 py-2 text-sm ${view === 'pipeline' ? 'bg-yellow-400 text-gray-900 font-bold' : 'bg-card text-foreground'}`}>Pipeline Stages</button>
            <button onClick={() => setView('preview')} className={`px-4 py-2 text-sm ${view === 'preview' ? 'bg-yellow-400 text-gray-900 font-bold' : 'bg-card text-foreground'}`}>Site Preview</button>
            <button onClick={() => setView('intel')} className={`px-4 py-2 text-sm ${view === 'intel' ? 'bg-yellow-400 text-gray-900 font-bold' : 'bg-card text-foreground'}`}>Brand Intelligence</button>
            <button onClick={() => setView('qa')} className={`px-4 py-2 text-sm ${view === 'qa' ? 'bg-yellow-400 text-gray-900 font-bold' : 'bg-card text-foreground'}`}>QA Checks</button>
          </div>

          {/* Pipeline Stages */}
          {view === 'pipeline' && (
            <div className="space-y-3 mb-6">
              {result.stages.map((stage, i) => {
                const Icon = STAGE_ICONS[stage.name] || Layers;
                return (
                  <div key={i} className={`border rounded-lg p-4 bg-card ${stage.status === 'completed' ? 'border-green-300' : stage.status === 'failed' ? 'border-red-300' : stage.status === 'running' ? 'border-yellow-400' : 'border-border'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${stage.status === 'completed' ? 'bg-green-100' : stage.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                        <Icon className={`w-5 h-5 ${stage.status === 'completed' ? 'text-green-600' : stage.status === 'failed' ? 'text-red-600' : 'text-yellow-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">Stage {i + 1}</span>
                          <h3 className="font-semibold text-sm text-foreground">{stage.name}</h3>
                        </div>
                        {stage.result && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {Object.entries(stage.result).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.length : v}`).join(' • ')}
                          </p>
                        )}
                        {stage.error && <p className="text-xs text-red-600 mt-0.5">{stage.error}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {stage.duration_ms && <span className="text-xs text-muted-foreground">{(stage.duration_ms / 1000).toFixed(1)}s</span>}
                        {stage.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        {stage.status === 'failed' && <XCircle className="w-5 h-5 text-red-600" />}
                        {stage.status === 'running' && <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Site Preview */}
          {view === 'preview' && result.generated_site && (
            <div className="border border-border rounded-lg overflow-hidden mb-6">
              <div className="bg-slate-100 px-4 py-2 border-b border-border flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{businessName} — Live Preview</span>
              </div>
              <div className="max-h-[700px] overflow-y-auto">
                <SiteRenderer
                  sections={result.generated_site.sections}
                  images={result.generated_site.images}
                  phone={result.generated_site.phone}
                />
              </div>
            </div>
          )}

          {/* Brand Intelligence */}
          {view === 'intel' && result.brand_intelligence && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <IntelCard icon={Brain} title="Industry Intelligence" data={result.brand_intelligence.industry} fields={['summary', 'trends', 'opportunities', 'keyServices']} />
              <IntelCard icon={Building2} title="Competitor Analysis" data={result.brand_intelligence.competitors} fields={['competitors']} />
              <IntelCard icon={DollarSign} title="Financial Intelligence" data={result.brand_intelligence.financial} fields={['averageLeadValue', 'averageCpc', 'averageMonthlyRevenue', 'profitMargins', 'topRevenueStreams']} />
              <IntelCard icon={Globe} title="Domain Discovery" data={result.brand_intelligence.domains} fields={['domains']} />
              <IntelCard icon={Sparkles} title="Business Names" data={result.brand_intelligence.names} fields={['names']} />
              <IntelCard icon={TrendingUp} title="Top Sites to Clone" data={result.brand_intelligence.competitors} fields={['topSitesToClone']} />
            </div>
          )}

          {/* QA Checks */}
          {view === 'qa' && (
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-green-600" /> Google Compliance Checks</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {Object.entries(result.qa_checks || {}).map(([check, val]) => (
                  <div key={check} className={`flex items-center gap-2 p-2 rounded border ${val.pass ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    {val.pass ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> : <XCircle className="w-4 h-4 text-red-600 shrink-0" />}
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-foreground">{check}</div>
                      <div className="text-xs text-muted-foreground">{val.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
              {result.recommendations?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <h4 className="text-xs font-bold text-foreground mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-yellow-600 shrink-0 mt-0.5" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function IntelCard({ icon: Icon, title, data, fields }) {
  if (!data) return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2"><Icon className="w-4 h-4 text-muted-foreground" /><h3 className="text-sm font-bold text-foreground">{title}</h3></div>
      <p className="text-xs text-muted-foreground">Not available</p>
    </div>
  );
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3"><Icon className="w-4 h-4 text-yellow-500" /><h3 className="text-sm font-bold text-foreground">{title}</h3></div>
      <div className="space-y-2">
        {fields.map(field => {
          const val = data[field];
          if (!val) return null;
          if (typeof val === 'string') return <div key={field}><span className="text-xs font-medium text-foreground">{field}:</span> <span className="text-xs text-muted-foreground">{val}</span></div>;
          if (Array.isArray(val)) return (
            <div key={field}>
              <span className="text-xs font-medium text-foreground">{field} ({val.length}):</span>
              <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                {val.slice(0, 5).map((item, i) => <li key={i} className="flex items-start gap-1">• {typeof item === 'object' ? JSON.stringify(item).slice(0, 100) : String(item).slice(0, 100)}</li>)}
              </ul>
            </div>
          );
          if (typeof val === 'number') return <div key={field}><span className="text-xs font-medium text-foreground">{field}:</span> <span className="text-xs text-muted-foreground">{val}</span></div>;
          return null;
        })}
      </div>
    </div>
  );
}