import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// ResearchBestMethods — the system's continuous research engine. Uses web search
// to find the latest SEO ranking methods, strategies, and tactics from across the
// internet. Stores findings as RankingMethod records.
//
// Invoke: base44.functions.invoke('ResearchBestMethods', { topic?, count? })
// Returns: { ok, methodsFound, methods }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const topic = String(body.topic || 'SEO ranking methods 2025 2026').trim();
    const count = Math.min(body.count || 10, 20);

    const prompt = `You are an SEO research analyst. Search the web for the latest and most effective SEO ranking methods, strategies, and tactics.
Focus on: ${topic}

Find ${count} methods that are:
1. Evidence-based (backed by Google leaks, patents, studies, or case studies)
2. Actionable (can be implemented on a real website)
3. Current (relevant for 2025-2026)
4. Not black-hat (no link buying, cloaking, or spam)

For each method, provide:
- name: short name
- category: technical/content/authority/ai_search/local/programmatic/ux/link_building/brand/social/measurement
- mechanism: the Google algorithm signal or system it exploits
- implementation_steps: array of steps
- expected_impact: what ranking improvement to expect
- risk_level: safe/moderate/aggressive
- source: where it was found (reddit, linkedin, google_leak, youtube, google_blog, study, etc.)
- source_url: URL if available
- proof_level: 0-7 (0=theory, 7=confirmed across multiple live deployments)

Output strict JSON: { methods: [{ name, category, mechanism, implementation_steps, expected_impact, risk_level, source, source_url, proof_level }] }`;

    const schema = {
      type: 'object',
      properties: {
        methods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              mechanism: { type: 'string' },
              implementation_steps: { type: 'array', items: { type: 'string' } },
              expected_impact: { type: 'string' },
              risk_level: { type: 'string' },
              source: { type: 'string' },
              source_url: { type: 'string' },
              proof_level: { type: 'number' },
            },
          },
        },
      },
    };

    const llmRes = await svc.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
    });
    const data = llmRes?.data ?? llmRes;
    if (!data?.methods) return Response.json({ error: 'AI did not return methods' }, { status: 502 });

    // Store as RankingMethod records
    let stored = 0;
    for (const method of data.methods) {
      await svc.entities.RankingMethod.create({
        name: method.name,
        category: method.category || 'content',
        mechanism: method.mechanism || '',
        implementation_steps: method.implementation_steps || [],
        expected_impact: method.expected_impact || '',
        risk_level: method.risk_level || 'safe',
        source: method.source || 'web_research',
        source_url: method.source_url || '',
        proof_level: method.proof_level || 0,
        status: 'discovered',
        discovered_at: new Date().toISOString(),
      }).catch(() => {});
      stored++;
    }

    // Log
    await svc.entities.Receipt.create({
      type: 'research_best_methods',
      summary: `Researched ${data.methods.length} methods, stored ${stored}`,
      details: JSON.stringify({ topic, count, found: data.methods.length, stored }),
      provenance: 'INFERRED',
      occurred_at: new Date().toISOString(),
    }).catch(() => {});

    return Response.json({
      ok: true,
      topic,
      methodsFound: data.methods.length,
      methodsStored: stored,
      methods: data.methods,
      researchedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}