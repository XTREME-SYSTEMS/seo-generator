import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Filter } from 'lucide-react';
import GeneratorShell from './GeneratorShell';
import { TextBlock, TagList } from './WealthGenerator';

export default function FunnelIdeaGenerator() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 5 high-converting funnel ideas for: "${prompt}".

For each funnel:
- name: Funnel name
- stages: Array of {stage_name, action, conversion_tactic}
- traffic_source: How to drive traffic
- lead_magnet: What free thing to offer
- tripwire: Low-cost offer
- core_offer: Main product/service
- upsell: Additional offer
- estimated_conversion_rate: Expected %
- estimated_cac: Customer acquisition cost
- estimated_ltv: Lifetime value

Return as JSON.`,
        response_json_schema: {
          type: 'object',
          properties: {
            funnels: { type: 'array', items: { type: 'object', properties: {
              name: { type: 'string' },
              stages: { type: 'array', items: { type: 'object', properties: {
                stage_name: { type: 'string' }, action: { type: 'string' }, conversion_tactic: { type: 'string' },
              } } },
              traffic_source: { type: 'string' },
              lead_magnet: { type: 'string' },
              tripwire: { type: 'string' },
              core_offer: { type: 'string' },
              upsell: { type: 'string' },
              estimated_conversion_rate: { type: 'string' },
              estimated_cac: { type: 'string' },
              estimated_ltv: { type: 'string' },
            } } },
          },
        },
      });

      await base44.entities.GeneratedAsset.create({
        generator_type: 'funnel_idea',
        title: `Funnels for: ${prompt.slice(0, 60)}`,
        input_prompt: prompt,
        output_json: JSON.stringify(res.funnels || []),
        summary: `${(res.funnels || []).length} funnel ideas generated`,
      });

      setResult(res.funnels || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <GeneratorShell
      icon={Filter}
      title="Funnel Idea Generator"
      subtitle="Generate complete sales funnel architectures with stages, offers, and conversion projections"
      prompt={prompt}
      setPrompt={setPrompt}
      onGenerate={handleGenerate}
      loading={loading}
      placeholder="e.g. I want to sell SEO services to local plumbers..."
    >
      {result && result.map((funnel, i) => (
        <div key={i} className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-heading text-sm font-semibold text-foreground mb-3">{i + 1}. {funnel.name}</h4>
          <div className="space-y-2 mb-3">
            {funnel.stages?.map((s, j) => (
              <div key={j} className="flex items-start gap-2 text-xs">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono text-[10px]">{j + 1}</span>
                <div>
                  <span className="font-medium text-foreground">{s.stage_name}</span> — <span className="text-muted-foreground">{s.action}</span>
                  <div className="text-muted-foreground italic">{s.conversion_tactic}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-3 text-xs">
            <Mini label="Traffic" value={funnel.traffic_source} />
            <Mini label="Lead Magnet" value={funnel.lead_magnet} />
            <Mini label="Tripwire" value={funnel.tripwire} />
            <Mini label="Core Offer" value={funnel.core_offer} />
            <Mini label="Upsell" value={funnel.upsell} />
            <Mini label="Conv. Rate" value={funnel.estimated_conversion_rate} />
            <Mini label="CAC" value={funnel.estimated_cac} />
            <Mini label="LTV" value={funnel.estimated_ltv} />
          </div>
        </div>
      ))}
    </GeneratorShell>
  );
}

function Mini({ label, value }) {
  return (
    <div className="bg-muted/30 rounded p-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="text-foreground">{value}</div>
    </div>
  );
}