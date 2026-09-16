import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Bot, Zap, TrendingUp, Eye } from 'lucide-react';
import GeneratorShell from './GeneratorShell';
import { TextBlock, TagList } from './WealthGenerator';

export default function AICompanyFollower() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState([]);

  const loadSaved = useCallback(async () => {
    try {
      const data = await base44.entities.GeneratedAsset.filter({ generator_type: 'ai_company_data' }, '-created_date', 20);
      setSaved(data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadSaved(); }, [loadSaved]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI company intelligence follower. Track and analyze AI companies related to: "${prompt}".

Provide comprehensive intelligence on AI companies in this space:
- companies: Array of {name, focus_area, funding_stage, valuation, key_products, api_available, api_docs, recent_news, strategic_moves}
- market_trends: Current AI trends in this space
- investment_opportunities: Where capital is flowing
- competitive_threats: Which companies are threatening
- partnership_opportunities: Companies to partner with
- api_landscape: Available APIs and their capabilities
- talent_movement: Key hires and departures
- product_launches: Recent launches
- predictions: 6-12 month predictions
- action_items: What you should do based on this intelligence

Return as JSON.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            companies: { type: 'array', items: { type: 'object', properties: {
              name: { type: 'string' }, focus_area: { type: 'string' },
              funding_stage: { type: 'string' }, valuation: { type: 'string' },
              key_products: { type: 'array', items: { type: 'string' } },
              api_available: { type: 'boolean' }, api_docs: { type: 'string' },
              recent_news: { type: 'string' }, strategic_moves: { type: 'string' },
            } } },
            market_trends: { type: 'array', items: { type: 'string' } },
            investment_opportunities: { type: 'array', items: { type: 'string' } },
            competitive_threats: { type: 'array', items: { type: 'string' } },
            partnership_opportunities: { type: 'array', items: { type: 'string' } },
            api_landscape: { type: 'string' },
            talent_movement: { type: 'array', items: { type: 'string' } },
            product_launches: { type: 'array', items: { type: 'string' } },
            predictions: { type: 'array', items: { type: 'string' } },
            action_items: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      const record = await base44.entities.GeneratedAsset.create({
        generator_type: 'ai_company_data',
        title: `AI intel: ${prompt.slice(0, 60)}`,
        input_prompt: prompt,
        output_json: JSON.stringify(res),
        summary: `${res.companies?.length || 0} companies tracked`,
      });

      setResult(res);
      await loadSaved();
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <GeneratorShell
      icon={Bot}
      title="AI Company Data Follower"
      subtitle="Follow AI companies — track funding, products, APIs, talent, partnerships, and competitive threats in real-time"
      prompt={prompt}
      setPrompt={setPrompt}
      onGenerate={handleGenerate}
      loading={loading}
      placeholder="e.g. Track AI companies in the SEO and content generation space..."
    >
      {/* Saved Scans */}
      {saved.length > 0 && !result && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-2">Previous Scans</div>
          <div className="flex flex-wrap gap-2">
            {saved.map(s => (
              <button key={s.id} onClick={() => setResult(JSON.parse(s.output_json))} className="px-3 py-1.5 rounded-md text-xs border border-border bg-background text-foreground hover:border-primary/30">
                {s.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Companies */}
          {result.companies?.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Tracked Companies</h4>
              <div className="space-y-3">
                {result.companies.map((c, i) => (
                  <div key={i} className="border border-border rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading text-sm font-semibold text-foreground">{c.name}</span>
                      <div className="flex items-center gap-2">
                        {c.api_available && <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-700">API</span>}
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary">{c.funding_stage}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{c.focus_area} · Valuation: {c.valuation}</div>
                    {c.key_products?.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">Products: {c.key_products.join(', ')}</div>
                    )}
                    {c.recent_news && <div className="text-xs text-foreground mt-1">📰 {c.recent_news}</div>}
                    {c.strategic_moves && <div className="text-xs text-primary mt-1">⚡ {c.strategic_moves}</div>}
                    {c.api_docs && <a href={c.api_docs} target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline">API Docs →</a>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.market_trends?.length > 0 && <TagList title="Market Trends" items={result.market_trends} />}
          {result.investment_opportunities?.length > 0 && <TagList title="Investment Opportunities" items={result.investment_opportunities} tone="emerald" />}
          {result.competitive_threats?.length > 0 && <TagList title="Competitive Threats" items={result.competitive_threats} tone="rose" />}
          {result.partnership_opportunities?.length > 0 && <TagList title="Partnership Opportunities" items={result.partnership_opportunities} tone="blue" />}
          <TextBlock title="API Landscape" text={result.api_landscape} />
          {result.talent_movement?.length > 0 && <TagList title="Talent Movement" items={result.talent_movement} />}
          {result.product_launches?.length > 0 && <TagList title="Product Launches" items={result.product_launches} />}
          {result.predictions?.length > 0 && <TagList title="6-12 Month Predictions" items={result.predictions} tone="amber" />}

          {result.action_items?.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Action Items</h4>
              <ol className="space-y-1 text-xs text-foreground list-decimal pl-4">
                {result.action_items.map((a, i) => <li key={i}>{a}</li>)}
              </ol>
            </div>
          )}
        </div>
      )}
    </GeneratorShell>
  );
}