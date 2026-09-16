import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw } from 'lucide-react';
import { GeneratorShell } from './IdeaGenerator';
import { TextBlock, TagList } from './WealthGenerator';

export default function ReverseEngineer() {
  const [prompt, setPrompt] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim() && !url.trim()) return;
    setLoading(true);
    try {
      const context = url ? `Reverse engineer this website/competitor: ${url}. ` : '';
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${context}Analyze and reverse engineer: "${prompt}".

Provide a complete reverse engineering analysis:
- target: What's being reverse engineered
- architecture: How their system/site is built
- tech_stack: Technologies detected
- content_strategy: Their content approach
- seo_strategy: SEO tactics used
- traffic_sources: Where their traffic comes from
- monetization: How they make money
- conversion_tactics: How they convert visitors
- weaknesses: Exploitable weaknesses
- replication_plan: Step-by-step plan to replicate their success
- improvement_opportunities: Where you can do better
- estimated_costs: What it would cost to replicate
- timeline_to_replicate: How long to build a better version

Return as JSON.`,
        add_context_from_internet: !!url,
        response_json_schema: {
          type: 'object',
          properties: {
            target: { type: 'string' },
            architecture: { type: 'string' },
            tech_stack: { type: 'array', items: { type: 'string' } },
            content_strategy: { type: 'string' },
            seo_strategy: { type: 'string' },
            traffic_sources: { type: 'array', items: { type: 'string' } },
            monetization: { type: 'string' },
            conversion_tactics: { type: 'array', items: { type: 'string' } },
            weaknesses: { type: 'array', items: { type: 'string' } },
            replication_plan: { type: 'array', items: { type: 'string' } },
            improvement_opportunities: { type: 'array', items: { type: 'string' } },
            estimated_costs: { type: 'string' },
            timeline_to_replicate: { type: 'string' },
          },
        },
      });

      await base44.entities.GeneratedAsset.create({
        generator_type: 'reverse_engineer',
        title: `Reverse engineer: ${(url || prompt).slice(0, 60)}`,
        input_prompt: prompt,
        output_json: JSON.stringify(res),
        summary: 'Reverse engineering analysis complete',
      });

      setResult(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <GeneratorShell
      icon={RefreshCw}
      title="Reverse Engineer Generator"
      subtitle="Reverse engineer any competitor's system, site, or strategy — then build a better version"
      prompt={prompt}
      setPrompt={setPrompt}
      onGenerate={handleGenerate}
      loading={loading}
      placeholder="e.g. Reverse engineer Angi's lead generation model for home services..."
    >
      {/* URL Input */}
      <div className="mb-4">
        <label className="block text-xs text-muted-foreground mb-1.5">Competitor URL (optional — enables web search)</label>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://competitor.com"
          className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40"
        />
      </div>

      {result && (
        <div className="space-y-4">
          <TextBlock title="Target" text={result.target} />
          <TextBlock title="Architecture" text={result.architecture} />
          {result.tech_stack?.length > 0 && <TagList title="Tech Stack" items={result.tech_stack} />}
          <TextBlock title="Content Strategy" text={result.content_strategy} />
          <TextBlock title="SEO Strategy" text={result.seo_strategy} />
          {result.traffic_sources?.length > 0 && <TagList title="Traffic Sources" items={result.traffic_sources} tone="blue" />}
          <TextBlock title="Monetization" text={result.monetization} />
          {result.conversion_tactics?.length > 0 && <TagList title="Conversion Tactics" items={result.conversion_tactics} />}
          {result.weaknesses?.length > 0 && <TagList title="Weaknesses to Exploit" items={result.weaknesses} tone="rose" />}

          {/* Replication Plan */}
          {result.replication_plan?.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Replication Plan</h4>
              <ol className="space-y-1.5">
                {result.replication_plan.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono text-[10px]">{i + 1}</span>
                    <span className="text-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {result.improvement_opportunities?.length > 0 && <TagList title="Improvement Opportunities" items={result.improvement_opportunities} tone="emerald" />}
          <TextBlock title="Estimated Costs" text={result.estimated_costs} />
          <TextBlock title="Timeline to Replicate" text={result.timeline_to_replicate} />
        </div>
      )}
    </GeneratorShell>
  );
}