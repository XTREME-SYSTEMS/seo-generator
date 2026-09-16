import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Play, RefreshCw, Zap, CheckCircle2, XCircle, Gauge, TrendingUp, Database, Brain, FileCheck, Award } from 'lucide-react';

const PIPELINE_STEPS = [
  { key: 'research', label: 'Research', icon: TrendingUp, desc: 'Web search + market data via Gemini 3 Flash' },
  { key: 'generate', label: 'Generate', icon: Brain, desc: 'SEO content via GPT-5 Mini with fixed JSON schema' },
  { key: 'persist', label: 'Persist', icon: Database, desc: 'Store to GeneratedAsset entity' },
  { key: 'validate', label: 'Validate', icon: FileCheck, desc: '10 Google SEO principle checks (deterministic)' },
  { key: 'score', label: 'Score', icon: Award, desc: 'Computed 0–100 score (not LLM-judged)' },
];

export default function AutonomousPipeline() {
  const [niche, setNiche] = useState('');
  const [url, setUrl] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const loadHistory = useCallback(async () => {
    try {
      const rows = await base44.entities.GeneratedAsset.filter({ generator_type: 'programmatic_site' }, '-created_date', 10);
      setHistory(rows || []);
    } catch { /* non-critical */ }
  }, []);

  React.useEffect(() => { loadHistory(); }, [loadHistory]);

  const run = async () => {
    if (!niche.trim()) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke('AutonomousPipeline', { niche, url });
      const data = res.data || res;
      if (data.error) throw new Error(data.error);
      setResult(data);
      loadHistory();
    } catch (e) { setError(e.message || 'Pipeline failed'); }
    setRunning(false);
  };

  const score = result?.score || 0;
  const scoreColor = score >= 80 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">Autonomous Pipeline — Deterministic E2E</h1>
            <p className="text-xs text-muted-foreground">Research → Generate → Persist → Validate → Score. Deterministic, Google-compliant, with measurable results.</p>
          </div>
        </div>

        {/* Input */}
        <div className="bg-card border border-border rounded-lg p-5 mb-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-muted-foreground mb-1.5">Niche / Industry</label>
              <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. emergency plumbing, epoxy flooring, roofing" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-muted-foreground mb-1.5">Target URL (optional)</label>
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="e.g. https://plumbernearme.com" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40" />
            </div>
            <button onClick={run} disabled={running || !niche.trim()} className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {running ? 'Running Pipeline...' : 'Run Pipeline'}
            </button>
          </div>
        </div>

        {error && <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm text-destructive mb-6">{error}</div>}

        {/* Pipeline Steps Visualization */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {PIPELINE_STEPS.map((s, i) => {
            const stepResult = result?.steps?.find(x => x.step === s.key);
            const isActive = running && !result?.steps?.find(x => x.step === s.key);
            const isDone = stepResult?.status === 'success';
            const Icon = s.icon;
            return (
              <div key={s.key} className={`bg-card border rounded-lg p-4 ${isDone ? 'border-green-200' : isActive ? 'border-primary animate-pulse' : 'border-border'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-md ${isDone ? 'bg-green-50 text-green-600' : 'bg-primary/10 text-primary'}`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">Step {i + 1}</span>
                </div>
                <div className="text-xs font-semibold text-foreground">{s.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</div>
                {stepResult?.duration_ms && <div className="text-[10px] text-muted-foreground mt-1 font-mono">{stepResult.duration_ms}ms</div>}
              </div>
            );
          })}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Score */}
            <div className="flex items-center gap-6 bg-card border border-border rounded-lg p-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke={score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="10" strokeLinecap="round" strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 - (score / 100) * 2 * Math.PI * 52} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold tabular ${scoreColor}`}>{score}</span>
                  <span className="text-[10px] text-muted-foreground">/ 100</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-sm font-semibold text-foreground mb-1">Pipeline Score</h3>
                <p className="text-xs text-muted-foreground mb-3">{result.validation.passed}/{result.validation.total} Google SEO checks passed · {result.total_duration_ms}ms total</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(result.validation.checks).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-xs">
                      {v ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                      <span className={v ? 'text-foreground' : 'text-muted-foreground line-through'}>{k.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Research Data */}
            {result.research && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Research Output</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-3">
                  <Metric label="Search Volume" value={(result.research.search_volume_estimate || 0).toLocaleString()} />
                  <Metric label="Avg CPC" value={`$${(result.research.avg_cpc || 0).toFixed(2)}`} />
                  <Metric label="Commercial Intent" value={result.research.commercial_intent || '—'} />
                  <Metric label="Local Relevance" value={`${result.research.local_search_relevance || 0}/100`} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(result.research.top_keywords || []).map((k, i) => <span key={i} className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium border border-primary/20">{k}</span>)}
                </div>
              </div>
            )}

            {/* Generated Content */}
            {result.content && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Brain className="w-4 h-4 text-primary" /> Generated Content</h3>
                <div className="space-y-2">
                  <div><span className="text-xs text-muted-foreground font-medium">Title:</span> <span className="text-sm text-foreground">{result.content.page_title}</span></div>
                  <div><span className="text-xs text-muted-foreground font-medium">Meta:</span> <span className="text-sm text-foreground">{result.content.meta_description}</span></div>
                  <div><span className="text-xs text-muted-foreground font-medium">H1:</span> <span className="text-sm text-foreground">{result.content.h1}</span></div>
                  <div className="text-sm text-foreground mt-2">{result.content.intro_paragraph}</div>
                  {result.content.faqs && result.content.faqs.length > 0 && (
                    <div className="mt-3">
                      <span className="text-xs text-muted-foreground font-medium">FAQs:</span>
                      <div className="space-y-1.5 mt-1">
                        {result.content.faqs.map((f, i) => (
                          <div key={i} className="text-xs"><span className="font-medium text-foreground">Q: {f.question}</span><br /><span className="text-muted-foreground">A: {f.answer}</span></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {!result && !running && history.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Recent Pipeline Runs</h3>
            <div className="space-y-1.5">
              {history.map(h => (
                <div key={h.id} className="flex items-center gap-3 text-xs border-b border-border/50 py-1.5">
                  <Gauge className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-foreground truncate flex-1">{h.title}</span>
                  <span className="text-muted-foreground">{h.compliance_score || 0}/100</span>
                  <span className="text-[10px] text-muted-foreground">{(h.created_date || '').slice(0, 10)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="bg-muted/30 rounded-md p-3"><div className="text-[10px] text-muted-foreground">{label}</div><div className="mt-0.5 font-heading text-sm font-semibold text-foreground tabular">{value}</div></div>;
}