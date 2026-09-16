import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, Target, Globe, MapPin, TrendingUp, DollarSign, FileText, Shield, CheckCircle2 } from 'lucide-react';

export default function StrategyGenerator({ onNavigate }) {
  const [dream, setDream] = useState('');
  const [niche, setNiche] = useState('');
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);
  const [toast, setToast] = useState(null);

  const loadPlans = useCallback(async () => {
    try {
      const data = await base44.entities.DigitalDominancePlan.list('-created_date', 20);
      setSavedPlans(data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const handleGenerate = async () => {
    if (!dream.trim() && !niche.trim()) return;
    setGenerating(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a digital dominance strategist. A user has provided their dream statement and niche. Generate a comprehensive NearMe.com digital dominance plan.

Dream Statement: "${dream}"
Niche: ${niche || 'inferred from dream'}

Create a full strategy that includes:
1. Target keywords (primary + long-tail variations with "near me" intent)
2. Competitor keywords to steal
3. Backlink targets (authority sites to get links from)
4. Blog target sites (for guest posting)
5. Directory submissions (industry-specific directories)
6. Social platforms to dominate
7. Schema.org types to implement
8. Content calendar (weekly production schedule)
9. Internal linking strategy
10. Topical authority map (topic clusters)
11. Google guidelines compliance approach
12. Indexing strategy (IndexNow, sitemaps, GSC)
13. AEO (AI Engine Optimization) strategy
14. Local SEO strategy (Google Business Profile, citations, reviews)
15. Conversion optimization strategy
16. Estimated timeline to dominance
17. Overall dominance score (0-100)

Be specific and actionable. Return as structured JSON.`,
        response_json_schema: {
          type: 'object',
          properties: {
            target_keywords: { type: 'array', items: { type: 'string' } },
            long_tail_keywords: { type: 'array', items: { type: 'string' } },
            competitor_keywords_to_steal: { type: 'array', items: { type: 'string' } },
            backlink_targets: { type: 'array', items: { type: 'string' } },
            blog_target_sites: { type: 'array', items: { type: 'string' } },
            directory_submissions: { type: 'array', items: { type: 'string' } },
            social_platforms: { type: 'array', items: { type: 'string' } },
            schema_types: { type: 'array', items: { type: 'string' } },
            content_calendar: { type: 'string' },
            internal_linking_strategy: { type: 'string' },
            topical_authority_map: { type: 'string' },
            google_guidelines_compliance: { type: 'string' },
            indexing_strategy: { type: 'string' },
            aeo_optimization: { type: 'string' },
            local_seo_strategy: { type: 'string' },
            conversion_optimization: { type: 'string' },
            estimated_timeline: { type: 'string' },
            dominance_score: { type: 'number' },
            url_pattern: { type: 'string' },
            total_target_cities: { type: 'number' },
            total_target_pages: { type: 'number' },
          },
        },
      });

      const record = await base44.entities.DigitalDominancePlan.create({
        niche: niche || dream.slice(0, 50),
        url_pattern: res.url_pattern || `${(niche || 'nearme').replace(/\s+/g, '')}nearme.com`,
        total_target_cities: res.total_target_cities || 450,
        total_target_pages: res.total_target_pages || 1350,
        target_keywords: res.target_keywords || [],
        long_tail_keywords: res.long_tail_keywords || [],
        competitor_keywords_to_steal: res.competitor_keywords_to_steal || [],
        backlink_targets: res.backlink_targets || [],
        blog_target_sites: res.blog_target_sites || [],
        directory_submissions: res.directory_submissions || [],
        social_platforms: res.social_platforms || [],
        schema_types: res.schema_types || [],
        content_calendar: res.content_calendar || '',
        internal_linking_strategy: res.internal_linking_strategy || '',
        topical_authority_map: res.topical_authority_map || '',
        google_guidelines_compliance: res.google_guidelines_compliance || '',
        indexing_strategy: res.indexing_strategy || '',
        aeo_optimization: res.aeo_optimization || '',
        local_seo_strategy: res.local_seo_strategy || '',
        conversion_optimization: res.conversion_optimization || '',
        estimated_timeline: res.estimated_timeline || '',
        dominance_score: res.dominance_score || 0,
        description: dream,
      });

      setPlan(record);
      setToast({ type: 'success', msg: 'Strategy generated and saved' });
      await loadPlans();
    } catch (e) {
      setToast({ type: 'error', msg: `Generation failed: ${e.message}` });
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Dream Statement Input */}
      <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-heading text-base font-semibold text-foreground">Start With Your Dream</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Describe your ultimate vision — what do you want to dominate? The AI strategist will build a complete plan around it.</p>
        <textarea
          value={dream}
          onChange={(e) => setDream(e.target.value)}
          placeholder="e.g. I want to own every plumbing lead in America. Every city, every search, every customer finds me first when they type 'plumber near me'. I want to capture 10,000 leads per month and sell them to local plumbers for $100 each."
          rows={4}
          className="w-full bg-background border border-border rounded-md px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none"
        />
        <div className="flex flex-wrap items-end gap-3 mt-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-muted-foreground mb-1.5">Niche (optional — auto-inferred from dream)</label>
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
            disabled={generating || (!dream.trim() && !niche.trim())}
            className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Generating Strategy...' : 'Generate Strategy'}
          </button>
        </div>
      </div>

      {/* Saved Plans */}
      {savedPlans.length > 0 && !plan && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-2">Previous Strategies</div>
          <div className="flex flex-wrap gap-2">
            {savedPlans.map(p => (
              <button
                key={p.id}
                onClick={() => setPlan(p)}
                className="px-3 py-1.5 rounded-md text-xs border border-border bg-background text-foreground hover:border-primary/30 transition-colors flex items-center gap-2"
              >
                <span className="font-medium">{p.niche}</span>
                <span className="text-primary font-mono">{p.dominance_score || 0}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generated Strategy */}
      {plan && (
        <StrategyPlan plan={plan} onNavigate={onNavigate} />
      )}

      {!plan && !generating && savedPlans.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Target className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">Write your dream statement above and generate a complete digital dominance strategy.</p>
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

function StrategyPlan({ plan, onNavigate }) {
  return (
    <div className="space-y-4">
      {/* Dominance Score Header */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">{plan.niche} — Dominance Plan</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{plan.url_pattern} · {plan.total_target_cities} cities · {plan.total_target_pages} pages</p>
          </div>
          <div className="text-right">
            <div className="font-heading text-3xl font-bold text-primary tabular">{plan.dominance_score}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Dominance Score</div>
          </div>
        </div>
        {plan.description && (
          <p className="mt-3 text-xs italic text-muted-foreground bg-background/50 rounded-md p-3 border border-border">"{plan.description}"</p>
        )}
      </div>

      {/* Timeline */}
      {plan.estimated_timeline && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
          <Target className="w-5 h-5 text-primary shrink-0" />
          <div>
            <div className="text-xs font-medium text-foreground">Estimated Timeline to Dominance</div>
            <div className="text-sm text-muted-foreground">{plan.estimated_timeline}</div>
          </div>
        </div>
      )}

      {/* Keywords */}
      <div className="grid gap-4 lg:grid-cols-2">
        <StrategySection icon={Target} title="Target Keywords" items={plan.target_keywords} tone="primary" />
        <StrategySection icon={TrendingUp} title="Long-Tail Keywords" items={plan.long_tail_keywords} tone="blue" />
      </div>

      {/* Competitor Keywords */}
      {plan.competitor_keywords_to_steal?.length > 0 && (
        <StrategySection icon={Shield} title="Competitor Keywords to Steal" items={plan.competitor_keywords_to_steal} tone="rose" />
      )}

      {/* Authority Building */}
      <div className="grid gap-4 lg:grid-cols-2">
        <StrategySection icon={Globe} title="Backlink Targets" items={plan.backlink_targets} tone="emerald" />
        <StrategySection icon={FileText} title="Guest Blog Targets" items={plan.blog_target_sites} tone="amber" />
      </div>

      {/* Directories & Social */}
      <div className="grid gap-4 lg:grid-cols-2">
        <StrategySection icon={MapPin} title="Directory Submissions" items={plan.directory_submissions} tone="blue" />
        <StrategySection icon={Globe} title="Social Platforms" items={plan.social_platforms} tone="purple" />
      </div>

      {/* Schema Types */}
      {plan.schema_types?.length > 0 && (
        <StrategySection icon={CheckCircle2} title="Schema.org Types" items={plan.schema_types} tone="primary" />
      )}

      {/* Strategy Text Blocks */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TextBlock title="Content Calendar" text={plan.content_calendar} />
        <TextBlock title="Internal Linking Strategy" text={plan.internal_linking_strategy} />
        <TextBlock title="Topical Authority Map" text={plan.topical_authority_map} />
        <TextBlock title="Google Guidelines Compliance" text={plan.google_guidelines_compliance} />
        <TextBlock title="Indexing Strategy" text={plan.indexing_strategy} />
        <TextBlock title="AEO Optimization" text={plan.aeo_optimization} />
        <TextBlock title="Local SEO Strategy" text={plan.local_seo_strategy} />
        <TextBlock title="Conversion Optimization" text={plan.conversion_optimization} />
      </div>

      {/* Next Steps */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={() => onNavigate('url-generator')}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
        >
          <Globe className="w-4 h-4" /> Generate URLs for This Niche
        </button>
        <button
          onClick={() => onNavigate('simulation')}
          className="px-4 py-2 rounded-md bg-card border border-border text-sm font-medium hover:border-primary/30 flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4" /> Simulate Revenue
        </button>
      </div>
    </div>
  );
}

function StrategySection({ icon: Icon, title, items, tone }) {
  const tones = {
    primary: 'bg-primary/5 border-primary/20 text-primary',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    rose: 'bg-rose-50 border-rose-200 text-rose-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h4 className="font-heading text-sm font-semibold text-foreground">{title}</h4>
        <span className="ml-auto text-xs text-muted-foreground">{items?.length || 0}</span>
      </div>
      {items?.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span key={i} className={`px-2 py-1 rounded text-xs border ${tones[tone] || tones.primary}`}>{item}</span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Not specified</p>
      )}
    </div>
  );
}

function TextBlock({ title, text }) {
  if (!text) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h4 className="font-heading text-sm font-semibold text-foreground mb-2">{title}</h4>
      <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">{text}</p>
    </div>
  );
}