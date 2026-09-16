import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, DollarSign } from 'lucide-react';
import { GeneratorShell } from './IdeaGenerator';

export default function WealthGenerator() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a digital wealth strategist. The user's dream: "${prompt}".

Create a comprehensive digital wealth generation plan:
- revenue_streams: Array of {name, model, monthly_potential, setup_time, difficulty}
- digital_assets: Array of {asset_type, description, value_potential, creation_method}
- automation_stack: Tools and systems to automate revenue
- scaling_path: How to scale from $0 to target
- passive_income_sources: Recurring revenue strategies
- exit_strategy: How to sell/exit for maximum value
- total_addressable_market: Estimated TAM
- year_1_projection, year_3_projection, year_5_projection: Revenue projections
- risk_factors: Array of risks
- key_metrics: KPIs to track

Return as JSON.`,
        response_json_schema: {
          type: 'object',
          properties: {
            revenue_streams: { type: 'array', items: { type: 'object', properties: {
              name: { type: 'string' }, model: { type: 'string' },
              monthly_potential: { type: 'string' }, setup_time: { type: 'string' }, difficulty: { type: 'string' },
            } } },
            digital_assets: { type: 'array', items: { type: 'object', properties: {
              asset_type: { type: 'string' }, description: { type: 'string' },
              value_potential: { type: 'string' }, creation_method: { type: 'string' },
            } } },
            automation_stack: { type: 'string' },
            scaling_path: { type: 'string' },
            passive_income_sources: { type: 'array', items: { type: 'string' } },
            exit_strategy: { type: 'string' },
            total_addressable_market: { type: 'string' },
            year_1_projection: { type: 'string' },
            year_3_projection: { type: 'string' },
            year_5_projection: { type: 'string' },
            risk_factors: { type: 'array', items: { type: 'string' } },
            key_metrics: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      await base44.entities.GeneratedAsset.create({
        generator_type: 'wealth_strategy',
        title: `Wealth plan for: ${prompt.slice(0, 60)}`,
        input_prompt: prompt,
        output_json: JSON.stringify(res),
        summary: 'Digital wealth strategy generated',
      });

      setResult(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <GeneratorShell
      icon={DollarSign}
      title="Digital Wealth Generator"
      subtitle="Generate a complete digital wealth creation plan with revenue streams, assets, automation, and exit strategy"
      prompt={prompt}
      setPrompt={setPrompt}
      onGenerate={handleGenerate}
      loading={loading}
      placeholder="e.g. I want to build a portfolio of 20 NearMe domains generating $500K/year passively..."
    >
      {result && (
        <div className="space-y-4">
          {/* Projections */}
          <div className="grid gap-3 sm:grid-cols-3">
            <ProjCard label="Year 1" value={result.year_1_projection} />
            <ProjCard label="Year 3" value={result.year_3_projection} />
            <ProjCard label="Year 5" value={result.year_5_projection} />
          </div>

          {/* Revenue Streams */}
          {result.revenue_streams?.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Revenue Streams</h4>
              <div className="space-y-2">
                {result.revenue_streams.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-xs border-b border-border pb-2">
                    <div><span className="font-medium text-foreground">{s.name}</span> — <span className="text-muted-foreground">{s.model}</span></div>
                    <div className="text-right"><span className="text-primary font-mono">{s.monthly_potential}</span> <span className="text-muted-foreground">{s.setup_time}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Digital Assets */}
          {result.digital_assets?.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Digital Assets</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {result.digital_assets.map((a, i) => (
                  <div key={i} className="text-xs border border-border rounded p-2">
                    <div className="font-medium text-foreground">{a.asset_type}</div>
                    <div className="text-muted-foreground">{a.description}</div>
                    <div className="text-primary mt-1">{a.value_potential}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <TextBlock title="Automation Stack" text={result.automation_stack} />
          <TextBlock title="Scaling Path" text={result.scaling_path} />
          <TextBlock title="Exit Strategy" text={result.exit_strategy} />

          {result.passive_income_sources?.length > 0 && (
            <TagList title="Passive Income Sources" items={result.passive_income_sources} />
          )}
          {result.risk_factors?.length > 0 && (
            <TagList title="Risk Factors" items={result.risk_factors} tone="rose" />
          )}
          {result.key_metrics?.length > 0 && (
            <TagList title="Key Metrics" items={result.key_metrics} tone="blue" />
          )}
        </div>
      )}
    </GeneratorShell>
  );
}

function ProjCard({ label, value }) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-heading text-lg font-semibold text-primary">{value}</div>
    </div>
  );
}

export function TextBlock({ title, text }) {
  if (!text) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h4 className="font-heading text-sm font-semibold text-foreground mb-2">{title}</h4>
      <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">{text}</p>
    </div>
  );
}

export function TagList({ title, items, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary/5 border-primary/20 text-primary',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    rose: 'bg-rose-50 border-rose-200 text-rose-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  };
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h4 className="font-heading text-sm font-semibold text-foreground mb-3">{title}</h4>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={i} className={`px-2 py-1 rounded text-xs border ${tones[tone]}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}