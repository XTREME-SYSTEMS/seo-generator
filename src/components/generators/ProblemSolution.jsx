import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Sparkles } from 'lucide-react';
import { GeneratorShell } from './IdeaGenerator';

export default function ProblemSolution() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a problem-solution strategist. Analyze this context: "${prompt}".

Identify:
1. problems: Array of {problem, severity, affected_audience, current_pain, cost_of_problem}
2. solutions: Array of {solution, addresses_problem, implementation, tech_needed, time_to_market, revenue_model}
3. opportunities: Gaps in the market that can be exploited
4. quick_wins: Solutions that can be implemented in under 30 days

Return as JSON.`,
        response_json_schema: {
          type: 'object',
          properties: {
            problems: { type: 'array', items: { type: 'object', properties: {
              problem: { type: 'string' }, severity: { type: 'string' },
              affected_audience: { type: 'string' }, current_pain: { type: 'string' }, cost_of_problem: { type: 'string' },
            } } },
            solutions: { type: 'array', items: { type: 'object', properties: {
              solution: { type: 'string' }, addresses_problem: { type: 'string' },
              implementation: { type: 'string' }, tech_needed: { type: 'string' },
              time_to_market: { type: 'string' }, revenue_model: { type: 'string' },
            } } },
            opportunities: { type: 'array', items: { type: 'string' } },
            quick_wins: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      await base44.entities.GeneratedAsset.create({
        generator_type: 'problem_solution',
        title: `Problem/Solution: ${prompt.slice(0, 60)}`,
        input_prompt: prompt,
        output_json: JSON.stringify(res),
        summary: `${res.problems?.length || 0} problems, ${res.solutions?.length || 0} solutions`,
      });

      setResult(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <GeneratorShell
      icon={Sparkles}
      title="Problem Identifier & Solution Generator"
      subtitle="Identify every problem in a market and generate matching solutions with implementation plans"
      prompt={prompt}
      setPrompt={setPrompt}
      onGenerate={handleGenerate}
      loading={loading}
      placeholder="e.g. Local plumbers struggle to find leads and rely on expensive lead generation services..."
    >
      {result && (
        <div className="space-y-4">
          {result.problems?.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Problems Identified</h4>
              <div className="space-y-2">
                {result.problems.map((p, i) => (
                  <div key={i} className="border-l-2 border-rose-400 pl-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm">{p.problem}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${p.severity === 'critical' ? 'bg-rose-100 text-rose-700' : p.severity === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{p.severity}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">Affected: {p.affected_audience} · Pain: {p.current_pain} · Cost: {p.cost_of_problem}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.solutions?.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Solutions</h4>
              <div className="space-y-2">
                {result.solutions.map((s, i) => (
                  <div key={i} className="border-l-2 border-emerald-400 pl-3">
                    <div className="font-medium text-foreground text-sm">{s.solution}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Addresses: {s.addresses_problem}</div>
                    <div className="text-xs text-muted-foreground">Implementation: {s.implementation} · Tech: {s.tech_needed} · Time: {s.time_to_market} · Revenue: {s.revenue_model}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.opportunities?.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Market Opportunities</h4>
              <ul className="space-y-1 text-xs text-muted-foreground list-disc pl-4">
                {result.opportunities.map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </div>
          )}
          {result.quick_wins?.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Quick Wins (under 30 days)</h4>
              <ul className="space-y-1 text-xs text-foreground list-disc pl-4">
                {result.quick_wins.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </GeneratorShell>
  );
}