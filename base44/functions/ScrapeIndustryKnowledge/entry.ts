import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// ScrapeIndustryKnowledge — uses web search to gather deep industry knowledge:
// pricing ranges, service descriptions, process steps, common FAQs, terminology.
// Stores as ResearchFinding records for use by content generators.
//
// Invoke: base44.functions.invoke('ScrapeIndustryKnowledge', { industry, topics? })
// Returns: { ok, knowledgeGathered, knowledge }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const industry = String(body.industry || '').trim();
    const topics = Array.isArray(body.topics) ? body.topics : ['pricing', 'services', 'process', 'faq', 'terminology', 'common_questions'];
    if (!industry) return Response.json({ error: 'industry is required' }, { status: 400 });

    const prompt = `You are an industry knowledge analyst. Search the web for comprehensive knowledge about the "${industry}" industry.

Gather information on these topics: ${topics.join(', ')}

For each topic, provide:
- topic: the topic name
- summary: 2-3 sentence summary of what you found
- key_facts: array of key facts (pricing ranges, standard processes, common terms, etc.)
- data_points: array of specific data points (prices, timelines, measurements, etc.)
- sources: array of source URLs
- confidence: high/medium/low

Output strict JSON: { knowledge: [{ topic, summary, key_facts, data_points, sources, confidence }] }`;

    const schema = {
      type: 'object',
      properties: {
        knowledge: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              summary: { type: 'string' },
              key_facts: { type: 'array', items: { type: 'string' } },
              data_points: { type: 'array', items: { type: 'string' } },
              sources: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'string' },
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
    if (!data?.knowledge) return Response.json({ error: 'AI did not return knowledge' }, { status: 502 });

    // Store as ResearchFinding records
    let stored = 0;
    for (const k of data.knowledge) {
      await svc.entities.ResearchFinding.create({
        topic: `${industry}: ${k.topic}`,
        finding: k.summary,
        source: (k.sources || []).join(', '),
        provenance: 'INFERRED',
        observed_at: new Date().toISOString(),
      }).catch(() => {});
      stored++;
    }

    return Response.json({
      ok: true,
      industry,
      knowledgeGathered: data.knowledge.length,
      knowledgeStored: stored,
      knowledge: data.knowledge,
      gatheredAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}