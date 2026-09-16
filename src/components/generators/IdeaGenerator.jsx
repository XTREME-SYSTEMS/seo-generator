import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, Lightbulb } from 'lucide-react';

export default function IdeaGenerator() {
  const [prompt, setPrompt] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 10 innovative business ideas based on this dream: "${prompt}". Industry context: ${industry || 'general'}.

For each idea provide:
- title: Short name
- problem: The problem it solves
- solution: How it solves it
- target_audience: Who buys it
- monetization: How it makes money
- tech_stack: Technologies needed
- difficulty: easy/medium/hard
- market_size: Estimated TAM
- competitive_advantage: Why this wins
- automation_potential: 0-100

Return as JSON.`,
        response_json_schema: {
          type: 'object',
          properties: {
            ideas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  problem: { type: 'string' },
                  solution: { type: 'string' },
                  target_audience: { type: 'string' },
                  monetization: { type: 'string' },
                  tech_stack: { type: 'string' },
                  difficulty: { type: 'string' },
                  market_size: { type: 'string' },
                  competitive_advantage: { type: 'string' },
                  automation_potential: { type: 'number' },
                },
              },
            },
          },
        },
      });

      const record = await base44.entities.GeneratedAsset.create({
        generator_type: 'idea',
        title: `Ideas for: ${prompt.slice(0, 60)}`,
        input_prompt: prompt,
        output_json: JSON.stringify(res.ideas || []),
        summary: `${(res.ideas || []).length} ideas generated`,
        tags: [industry || 'general'],
      });

      setResult(res.ideas || []);
      setSaved(prev => [record, ...prev].slice(0, 10));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <GeneratorShell
      icon={Lightbulb}
      title="Idea Generator"
      subtitle="Turn your dream into 10 actionable business ideas with monetization, tech stack, and market analysis"
      prompt={prompt}
      setPrompt={setPrompt}
      industry={industry}
      setIndustry={setIndustry}
      onGenerate={handleGenerate}
      loading={loading}
    >
      {result && (
        <div className="space-y-3">
          {result.map((idea, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="font-heading text-sm font-semibold text-foreground">{i + 1}. {idea.title}</h4>
                <span className={`px-2 py-0.5 rounded text-xs ${idea.difficulty === 'easy' ? 'bg-green-100 text-green-700' : idea.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{idea.difficulty}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                <Field label="Problem" value={idea.problem} />
                <Field label="Solution" value={idea.solution} />
                <Field label="Audience" value={idea.target_audience} />
                <Field label="Monetization" value={idea.monetization} />
                <Field label="Tech Stack" value={idea.tech_stack} />
                <Field label="Market Size" value={idea.market_size} />
                <Field label="Advantage" value={idea.competitive_advantage} />
                <Field label="Automation" value={`${idea.automation_potential || 0}%`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </GeneratorShell>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span> <span className="text-foreground">{value}</span>
    </div>
  );
}

export function GeneratorShell({ icon: Icon, title, subtitle, prompt, setPrompt, industry, setIndustry, onGenerate, loading, children, placeholder }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder || "Describe what you want to generate..."}
          rows={4}
          className="w-full bg-background border border-border rounded-md px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none"
        />
        <div className="flex flex-wrap items-end gap-3 mt-4">
          {setIndustry && (
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
          )}
          <button
            onClick={onGenerate}
            disabled={loading || !prompt.trim()}
            className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}