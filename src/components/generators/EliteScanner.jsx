import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Shield, Eye } from 'lucide-react';
import { GeneratorShell } from './IdeaGenerator';
import { TextBlock, TagList } from './WealthGenerator';

export default function EliteScanner() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an elite intelligence scanner with political awareness. Scan and analyze: "${prompt}".

Provide a comprehensive elite & political scan:
- key_players: Array of {name, role, influence_level, affiliation, public_stance}
- power_brokers: Who holds real decision-making power
- political_landscape: Current political dynamics affecting this space
- regulatory_risks: Upcoming regulations that could impact
- lobbying_opportunities: Where influence can be applied
- public_sentiment: Current public opinion trends
- media_narratives: Dominant media stories
- elite_networks: Key networks and connections
- timing_windows: When to act for maximum impact
- strategic_positioning: How to position for elite-level success
- political_compliance: Ensure all strategies are legal and ethical
- risk_assessment: Array of risks with mitigation

IMPORTANT: Only suggest legal, ethical, and compliant strategies. No illegal influence peddling.

Return as JSON.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            key_players: { type: 'array', items: { type: 'object', properties: {
              name: { type: 'string' }, role: { type: 'string' },
              influence_level: { type: 'string' }, affiliation: { type: 'string' }, public_stance: { type: 'string' },
            } } },
            power_brokers: { type: 'array', items: { type: 'string' } },
            political_landscape: { type: 'string' },
            regulatory_risks: { type: 'array', items: { type: 'string' } },
            lobbying_opportunities: { type: 'array', items: { type: 'string' } },
            public_sentiment: { type: 'string' },
            media_narratives: { type: 'array', items: { type: 'string' } },
            elite_networks: { type: 'array', items: { type: 'string' } },
            timing_windows: { type: 'array', items: { type: 'string' } },
            strategic_positioning: { type: 'string' },
            political_compliance: { type: 'string' },
            risk_assessment: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      await base44.entities.GeneratedAsset.create({
        generator_type: 'elite_scan',
        title: `Elite scan: ${prompt.slice(0, 60)}`,
        input_prompt: prompt,
        output_json: JSON.stringify(res),
        summary: 'Elite & political intelligence scan complete',
      });

      setResult(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <GeneratorShell
      icon={Shield}
      title="Elite & Political Scanner"
      subtitle="Scans the elite and political landscape — key players, power brokers, regulatory risks, and strategic positioning opportunities"
      prompt={prompt}
      setPrompt={setPrompt}
      onGenerate={handleGenerate}
      loading={loading}
      placeholder="e.g. Scan the political landscape for home services regulation in 2026..."
    >
      {result && (
        <div className="space-y-4">
          {/* Compliance Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">All strategies are legal, ethical, and compliant. No illegal influence or lobbying is suggested.</p>
          </div>

          {/* Key Players */}
          {result.key_players?.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Key Players</h4>
              <div className="space-y-2">
                {result.key_players.map((p, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs border-b border-border pb-2">
                    <div className="flex-1">
                      <span className="font-medium text-foreground">{p.name}</span> — <span className="text-muted-foreground">{p.role}</span>
                      <div className="text-muted-foreground">Affiliation: {p.affiliation} · Stance: {p.public_stance}</div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 ${p.influence_level === 'critical' ? 'bg-rose-100 text-rose-700' : p.influence_level === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{p.influence_level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.power_brokers?.length > 0 && <TagList title="Power Brokers" items={result.power_brokers} />}
          <TextBlock title="Political Landscape" text={result.political_landscape} />
          {result.regulatory_risks?.length > 0 && <TagList title="Regulatory Risks" items={result.regulatory_risks} tone="rose" />}
          {result.lobbying_opportunities?.length > 0 && <TagList title="Lobbying Opportunities (Legal)" items={result.lobbying_opportunities} tone="emerald" />}
          <TextBlock title="Public Sentiment" text={result.public_sentiment} />
          {result.media_narratives?.length > 0 && <TagList title="Media Narratives" items={result.media_narratives} tone="blue" />}
          {result.elite_networks?.length > 0 && <TagList title="Elite Networks" items={result.elite_networks} />}
          {result.timing_windows?.length > 0 && <TagList title="Timing Windows" items={result.timing_windows} />}
          <TextBlock title="Strategic Positioning" text={result.strategic_positioning} />
          <TextBlock title="Political Compliance" text={result.political_compliance} />
          {result.risk_assessment?.length > 0 && <TagList title="Risk Assessment" items={result.risk_assessment} tone="rose" />}
        </div>
      )}
    </GeneratorShell>
  );
}