import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// ── Ideation Frameworks ──
// Each framework is a distinct lens for generating ideas from the same seed.
const FRAMEWORKS = {
  first_principles: {
    name: 'First Principles',
    directive: `Break the problem down to its most fundamental truths that cannot be deduced any further. Strip away all assumptions, conventions, and analogies. Rebuild the solution from these foundational truths alone. What becomes possible when you ignore how it's always been done?`,
  },
  scamper: {
    name: 'SCAMPER',
    directive: `Apply each SCAMPER technique to the seed: Substitute (what materials/processes can be swapped), Combine (merge two unrelated things), Adapt (borrow from another field), Modify (change scale, shape, or attributes), Put to other use (new application), Eliminate (remove a core element), Reverse (invert the logic or sequence). Generate ideas from each angle.`,
  },
  cross_industry: {
    name: 'Cross-Industry Innovation',
    directive: `Identify a completely unrelated industry that has solved an analogous problem brilliantly. Borrow their mechanism, business model, or technology and transplant it into this domain. Explain the analogy and why the transplant works.`,
  },
  trend_surfing: {
    name: 'Trend Surfing',
    directive: `Identify 2-3 emerging technology, demographic, regulatory, or cultural trends that are accelerating right now. Build an idea that rides each trend wave — the idea only becomes more valuable as the trend grows. Name the trend explicitly.`,
  },
  constraint_removal: {
    name: 'Constraint Removal',
    directive: `List the hard constraints everyone in this space assumes are fixed (cost, speed, regulation, physics, talent, distribution). Remove each one hypothetically. What business becomes possible in the unconstrained world? Then find the version that works WITH the constraint still present.`,
  },
  analogy: {
    name: 'Analogical',
    directive: `Find a powerful analogy from nature, history, or a different domain. Use the analogy's structure as a template to generate a new idea. Explain the mapping between the analogy and the new idea.`,
  },
  inversion: {
    name: 'Inversion',
    directive: `Instead of asking how to succeed, ask: how would this definitively fail? What's the worst possible version of this? Then invert every failure mode into a design principle. The idea that avoids all failure modes is the winner.`,
  },
  edge_cases: {
    name: 'Edge Cases',
    directive: `Find an extreme, underserved, or ignored user — the edge of the market. Build an idea that serves them obsessively. Often the edge becomes the center.`,
  },
};

export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      seed,
      industry,
      count = 10,
      frameworks = ['first_principles', 'scamper', 'cross_industry', 'trend_surfing', 'constraint_removal', 'analogy', 'inversion', 'edge_cases'],
      model = 'gpt_5_6_luna',
    } = body;

    if (!seed || !seed.trim()) {
      return Response.json({ error: 'A seed prompt is required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Build the master ideation prompt
    const frameworkBlocks = frameworks
      .map((key: string) => {
        const f = FRAMEWORKS[key];
        if (!f) return '';
        return `### Framework: ${f.name}\n${f.directive}`;
      })
      .filter(Boolean)
      .join('\n\n');

    const masterPrompt = `You are an elite ideation AI — a specialist whose sole purpose is generating original, high-quality, actionable ideas. You think like a combination of a serial founder, a venture capitalist, a design researcher, and a lateral-thinking strategist.

## SEED
"${seed}"

## INDUSTRY CONTEXT
${industry || 'General — apply broadly'}

## YOUR METHODOLOGY
You will generate exactly ${count} ideas by applying ${frameworks.length} distinct ideation frameworks. Distribute the ideas across frameworks so the portfolio has intellectual diversity. For each idea, explicitly name which framework produced it and show the reasoning chain.

${frameworkBlocks}

## OUTPUT REQUIREMENTS
For each idea, produce a richly structured object with:
- title: A punchy, memorable name (2-5 words)
- framework: Which ideation framework generated this idea
- reasoning_chain: 2-3 sentences showing how the framework led to this idea
- problem: The specific, painful problem this solves
- solution: How it solves it — be concrete about the mechanism
- target_audience: The precise buyer persona
- monetization: Revenue model with rough pricing
- tech_stack: Key technologies/platforms needed
- difficulty: "easy" | "medium" | "hard"
- market_size: Estimated TAM with brief justification
- competitive_advantage: The defensible moat or wedge
- automation_potential: 0-100 (how much can be automated)
- viability_score: 0-100 (your overall judgment of this idea's promise — consider problem severity, solution elegance, market timing, and execution feasibility)
- one_liner: A single sentence that captures the entire idea's essence
- next_step: The single first action to validate this idea

Rank ideas by viability_score descending. Be bold — prefer non-obvious ideas over incremental ones. Every idea must be genuinely different from the others.`;

    const llmRes = await base44.integrations.Core.InvokeLLM({
      prompt: masterPrompt,
      model,
      response_json_schema: {
        type: 'object',
        properties: {
          ideas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                framework: { type: 'string' },
                reasoning_chain: { type: 'string' },
                problem: { type: 'string' },
                solution: { type: 'string' },
                target_audience: { type: 'string' },
                monetization: { type: 'string' },
                tech_stack: { type: 'string' },
                difficulty: { type: 'string' },
                market_size: { type: 'string' },
                competitive_advantage: { type: 'string' },
                automation_potential: { type: 'number' },
                viability_score: { type: 'number' },
                one_liner: { type: 'string' },
                next_step: { type: 'string' },
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

    const ideas = (llmRes.ideas || []).sort(
      (a: any, b: any) => (b.viability_score || 0) - (a.viability_score || 0)
    );
    const meta = llmRes.meta || {};

    // Persist to GeneratedAsset
    const record = await base44.entities.GeneratedAsset.create({
      generator_type: 'idea',
      title: `Ideas for: ${seed.slice(0, 60)}`,
      input_prompt: seed,
      output_json: JSON.stringify({ ideas, meta }),
      summary: `${ideas.length} ideas generated via ${frameworks.length} frameworks`,
      tags: [industry || 'general', ...frameworks],
    });

    return Response.json({
      status: 'success',
      ideas,
      meta,
      frameworks: frameworks.map((k: string) => ({ key: k, name: FRAMEWORKS[k]?.name || k })),
      asset_id: record.id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}