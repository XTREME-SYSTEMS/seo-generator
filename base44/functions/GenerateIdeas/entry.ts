import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const FRAMEWORKS = {
  first_principles: { name: 'First Principles', directive: `Break the problem down to its most fundamental truths that cannot be deduced any further. Strip away all assumptions, conventions, and analogies. Rebuild the solution from these foundational truths alone. What becomes possible when you ignore how it's always been done?` },
  scamper: { name: 'SCAMPER', directive: `Apply each SCAMPER technique to the seed: Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse. Generate ideas from each angle.` },
  cross_industry: { name: 'Cross-Industry Innovation', directive: `Identify a completely unrelated industry that has solved an analogous problem brilliantly. Borrow their mechanism, business model, or technology and transplant it into this domain.` },
  trend_surfing: { name: 'Trend Surfing', directive: `Identify 2-3 emerging technology, demographic, regulatory, or cultural trends that are accelerating right now. Build an idea that rides each trend wave.` },
  constraint_removal: { name: 'Constraint Removal', directive: `List the hard constraints everyone assumes are fixed. Remove each one hypothetically. What business becomes possible?` },
  analogy: { name: 'Analogical', directive: `Find a powerful analogy from nature, history, or a different domain. Use the analogy's structure as a template to generate a new idea.` },
  inversion: { name: 'Inversion', directive: `Ask: how would this definitively fail? Then invert every failure mode into a design principle.` },
  edge_cases: { name: 'Edge Cases', directive: `Find an extreme, underserved, or ignored user — the edge of the market. Build an idea that serves them obsessively.` },
};

export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      seed,
      industry,
      count = 10,
      frameworks = Object.keys(FRAMEWORKS),
      research = false,
    } = body;

    if (!seed || !seed.trim()) {
      return Response.json({ error: 'A seed prompt is required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    // Auth is optional on public apps — don't hard-fail if no user
    let user = null;
    try { user = await base44.auth.me(); } catch { /* public app — ok */ }

    const frameworkBlocks = frameworks
      .map((key: string) => { const f = FRAMEWORKS[key]; return f ? `### Framework: ${f.name}\n${f.directive}` : ''; })
      .filter(Boolean).join('\n\n');

    const masterPrompt = `You are an elite ideation AI — a specialist whose sole purpose is generating original, high-quality, actionable ideas. You think like a serial founder, a venture capitalist, a design researcher, and a lateral-thinking strategist.

## SEED
"${seed}"

## INDUSTRY CONTEXT
${industry || 'General — apply broadly'}

## YOUR METHODOLOGY
Generate exactly ${count} ideas by applying ${frameworks.length} distinct ideation frameworks. Distribute ideas across frameworks for intellectual diversity. For each idea, name which framework produced it and show the reasoning chain.

${frameworkBlocks}

## OUTPUT REQUIREMENTS
For each idea produce: title, framework, reasoning_chain, problem, solution, target_audience, monetization, tech_stack, difficulty (easy|medium|hard), market_size, competitive_advantage, automation_potential (0-100), viability_score (0-100), one_liner, next_step.

Rank ideas by viability_score descending. Be bold — prefer non-obvious ideas over incremental ones.`;

    // Deep research mode uses Gemini with live web context; fast mode uses gpt_5_mini
    const llmRes = await base44.integrations.Core.InvokeLLM({
      prompt: masterPrompt,
      model: research ? 'gemini_3_flash' : 'gpt_5_mini',
      add_context_from_internet: research,
      response_json_schema: {
        type: 'object',
        properties: {
          ideas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' }, framework: { type: 'string' }, reasoning_chain: { type: 'string' },
                problem: { type: 'string' }, solution: { type: 'string' }, target_audience: { type: 'string' },
                monetization: { type: 'string' }, tech_stack: { type: 'string' }, difficulty: { type: 'string' },
                market_size: { type: 'string' }, competitive_advantage: { type: 'string' },
                automation_potential: { type: 'number' }, viability_score: { type: 'number' },
                one_liner: { type: 'string' }, next_step: { type: 'string' },
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              frameworks_applied: { type: 'array', items: { type: 'string' } },
              top_themes: { type: 'array', items: { type: 'string' } },
              overall_assessment: { type: 'string' },
            },
          },
        },
      },
    });

    const ideas = (llmRes.ideas || []).sort((a: any, b: any) => (b.viability_score || 0) - (a.viability_score || 0));
    const meta = llmRes.meta || {};

    // Persist to GeneratedAsset (best-effort — don't fail the request if this errors)
    let asset_id = null;
    try {
      const record = await base44.entities.GeneratedAsset.create({
        generator_type: 'idea',
        title: `Ideas for: ${seed.slice(0, 60)}`,
        input_prompt: seed,
        output_json: JSON.stringify({ ideas, meta }),
        summary: `${ideas.length} ideas generated via ${frameworks.length} frameworks${research ? ' (deep research)' : ''}`,
        tags: [industry || 'general', ...frameworks],
      });
      asset_id = record.id;
    } catch { /* non-critical */ }

    return Response.json({
      status: 'success',
      ideas,
      meta,
      frameworks: frameworks.map((k: string) => ({ key: k, name: FRAMEWORKS[k]?.name || k })),
      asset_id,
      research_mode: research,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}