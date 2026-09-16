import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, Lightbulb, Brain, TrendingUp, Layers, Globe, History, Star } from 'lucide-react';

const FRAMEWORK_OPTIONS = [
  { key: 'first_principles', label: 'First Principles', desc: 'Strip assumptions, rebuild from fundamental truths' },
  { key: 'scamper', label: 'SCAMPER', desc: 'Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse' },
  { key: 'cross_industry', label: 'Cross-Industry', desc: 'Borrow mechanisms from unrelated industries' },
  { key: 'trend_surfing', label: 'Trend Surfing', desc: 'Ride accelerating technology & cultural trends' },
  { key: 'constraint_removal', label: 'Constraint Removal', desc: 'Remove assumed limits, find what becomes possible' },
  { key: 'analogy', label: 'Analogical', desc: 'Use nature, history, or other domains as templates' },
  { key: 'inversion', label: 'Inversion', desc: 'Invert failure modes into design principles' },
  { key: 'edge_cases', label: 'Edge Cases', desc: 'Serve extreme, underserved users obsessively' },
];

export default function IdeaGenerator() {
  const [prompt, setPrompt] = useState('');
  const [industry, setIndustry] = useState('');
  const [count, setCount] = useState(10);
  const [selectedFrameworks, setSelectedFrameworks] = useState(FRAMEWORK_OPTIONS.map(f => f.key));
  const [deepResearch, setDeepResearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const loadHistory = useCallback(async () => {
    try {
      const rows = await base44.entities.GeneratedAsset.filter({ generator_type: 'idea' }, '-created_date', 5);
      setHistory(rows || []);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const toggleFramework = (key) => {
    setSelectedFrameworks(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (selectedFrameworks.length === 0) { setError('Select at least one ideation framework'); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke('GenerateIdeas', {
        seed: prompt,
        industry,
        count,
        frameworks: selectedFrameworks,
        research: deepResearch,
      });
      const data = res.data || res;
      if (data.error) throw new Error(data.error);
      setResult(data);
      loadHistory();
    } catch (e) {
      setError(e.message || 'Generation failed — the AI service may be busy. Try again.');
    }
    setLoading(false);
  };

  // Auto-generate when a seed is provided and user presses Enter in the textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleGenerate(); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold text-foreground">Idea Generation AI</h2>
          <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium border border-primary/20">
            {deepResearch ? 'gemini-3-flash · web' : 'gpt-5-mini · fast'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          A dedicated AI that generates ideas through {FRAMEWORK_OPTIONS.length} distinct ideation frameworks.
          Each idea includes a reasoning chain, viability score, and validation next-step.
        </p>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your seed — a problem, a dream, a domain, a 'what if'..."
          rows={3}
          className="w-full bg-background border border-border rounded-md px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none"
        />

        <div className="flex flex-wrap items-end gap-3 mt-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-muted-foreground mb-1.5">Industry / Context (optional)</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. plumbing, SaaS, real estate"
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
            />
          </div>
          <div className="w-28">
            <label className="block text-xs text-muted-foreground mb-1.5">Number of ideas</label>
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 10)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer pb-2">
            <input type="checkbox" checked={deepResearch} onChange={(e) => setDeepResearch(e.target.checked)} className="accent-primary" />
            <Globe className="w-3.5 h-3.5" /> Deep Research
          </label>
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Thinking...' : 'Generate Ideas'}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Tip: press ⌘/Ctrl+Enter to generate. Deep Research uses live web search for richer, market-validated ideas.</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-primary" />
          <h3 className="font-heading text-sm font-semibold text-foreground">Ideation Frameworks</h3>
          <span className="text-xs text-muted-foreground">({selectedFrameworks.length} selected)</span>
          <button
            onClick={() => setSelectedFrameworks(selectedFrameworks.length === FRAMEWORK_OPTIONS.length ? [] : FRAMEWORK_OPTIONS.map(f => f.key))}
            className="ml-auto text-xs text-primary hover:underline"
          >
            {selectedFrameworks.length === FRAMEWORK_OPTIONS.length ? 'Clear all' : 'Select all'}
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {FRAMEWORK_OPTIONS.map(f => {
            const active = selectedFrameworks.includes(f.key);
            return (
              <button
                key={f.key}
                onClick={() => toggleFramework(f.key)}
                className={`text-left rounded-md border p-3 transition-colors ${active ? 'border-primary/40 bg-primary/5' : 'border-border bg-background hover:border-primary/20'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-3 h-3 rounded-sm border ${active ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`} />
                  <span className="font-heading text-xs font-semibold text-foreground">{f.label}</span>
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground">{f.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm text-destructive">{error}</div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{deepResearch ? 'Researching the web + applying frameworks...' : `Applying ${selectedFrameworks.length} ideation frameworks...`}</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-5">
          {result.meta && (
            <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-heading text-sm font-semibold text-foreground">AI Assessment</h3>
              </div>
              {result.meta.overall_assessment && <p className="text-xs leading-relaxed text-muted-foreground mb-3">{result.meta.overall_assessment}</p>}
              {result.meta.top_themes && result.meta.top_themes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {result.meta.top_themes.map((t, i) => (
                    <span key={i} className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium border border-primary/20">{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="space-y-3">
            {(result.ideas || []).map((idea, i) => <IdeaCard key={i} idea={idea} rank={i + 1} />)}
          </div>
        </div>
      )}

      {history.length > 0 && !result && !loading && (
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-heading text-sm font-semibold text-foreground">Recent Idea Sessions</h3>
          </div>
          <div className="space-y-2">
            {history.map((h) => (
              <button key={h.id} onClick={() => { try { setResult(JSON.parse(h.output_json)); } catch {} }} className="w-full text-left flex items-center gap-3 rounded-md border border-border p-3 hover:border-primary/20">
                <Star className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{h.title}</div>
                  <div className="text-[10px] text-muted-foreground">{h.summary}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!result && !loading && !error && history.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Lightbulb className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Enter a seed prompt and select frameworks to generate ideas</p>
        </div>
      )}
    </div>
  );
}

function IdeaCard({ idea, rank }) {
  const score = idea.viability_score || 0;
  const scoreColor = score >= 75 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : score >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-rose-600 bg-rose-50 border-rose-200';
  return (
    <div className="bg-card border border-border rounded-lg p-5 hover:border-primary/20 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono text-xs font-bold">{rank}</span>
          <div className="min-w-0">
            <h4 className="font-heading text-sm font-semibold text-foreground">{idea.title}</h4>
            {idea.one_liner && <p className="text-xs text-muted-foreground mt-0.5 italic">"{idea.one_liner}"</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {idea.framework && <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">{idea.framework}</span>}
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${scoreColor}`}>{score}</span>
        </div>
      </div>
      {idea.reasoning_chain && <div className="mb-3 pl-10 border-l-2 border-primary/20"><p className="text-[11px] leading-relaxed text-muted-foreground italic">{idea.reasoning_chain}</p></div>}
      <div className="grid gap-2 sm:grid-cols-2 text-xs pl-10">
        <Field label="Problem" value={idea.problem} />
        <Field label="Solution" value={idea.solution} />
        <Field label="Audience" value={idea.target_audience} />
        <Field label="Monetization" value={idea.monetization} />
        <Field label="Tech Stack" value={idea.tech_stack} />
        <Field label="Market Size" value={idea.market_size} />
        <Field label="Advantage" value={idea.competitive_advantage} />
        <Field label="Difficulty" value={idea.difficulty} />
      </div>
      {idea.next_step && (
        <div className="mt-3 pl-10">
          <div className="inline-flex items-center gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-1.5">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[11px] text-foreground"><span className="font-medium text-primary">Next step:</span> {idea.next_step}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return <div><span className="text-muted-foreground">{label}:</span> <span className="text-foreground">{value}</span></div>;
}