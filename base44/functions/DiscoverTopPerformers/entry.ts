import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// DiscoverTopPerformers — discovers the top-performing websites in an industry
// or niche using web search. Identifies who ranks #1-10 for key terms, extracts
// their strategies, and stores them as Competitor records.
//
// Invoke: base44.functions.invoke('DiscoverTopPerformers', { industry, market?, count? })
// Returns: { ok, performersFound, performers }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const industry = String(body.industry || '').trim();
    const market = String(body.market || 'US').trim();
    const count = Math.min(body.count || 10, 20);
    if (!industry) return Response.json({ error: 'industry is required' }, { status: 400 });

    const prompt = `You are a competitive intelligence analyst. Search the web for the top-performing websites in the "${industry}" industry in the ${market} market.

Find the top ${count} websites that:
1. Rank on page 1 of Google for key industry terms
2. Have strong domain authority
3. Get significant organic traffic
4. Have well-optimized SEO (title, meta, schema, content)

For each performer, provide:
- domain: the website domain
- name: company name
- estimated_traffic: monthly organic traffic estimate
- top_keywords: array of keywords they rank for
- strengths: array of SEO strengths (what they do well)
- weaknesses: array of SEO weaknesses (what they do poorly)
- key_pages: array of their top-performing pages
- schema_types: array of schema types they use
- backlink_estimate: estimated number of backlinks

Output strict JSON: { performers: [{ domain, name, estimated_traffic, top_keywords, strengths, weaknesses, key_pages, schema_types, backlink_estimate }] }`;

    const schema = {
      type: 'object',
      properties: {
        performers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              domain: { type: 'string' },
              name: { type: 'string' },
              estimated_traffic: { type: 'number' },
              top_keywords: { type: 'array', items: { type: 'string' } },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              key_pages: { type: 'array', items: { type: 'string' } },
              schema_types: { type: 'array', items: { type: 'string' } },
              backlink_estimate: { type: 'number' },
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
    if (!data?.performers) return Response.json({ error: 'AI did not return performers' }, { status: 502 });

    // Store as Competitor records
    let stored = 0;
    for (const p of data.performers) {
      await svc.entities.Competitor.create({
        domain: p.domain,
        name: p.name || p.domain,
        industry,
        strengths: p.strengths || [],
        weaknesses: p.weaknesses || [],
        top_keywords: p.top_keywords || [],
        key_pages: p.key_pages || [],
        schema_types: p.schema_types || [],
        backlink_estimate: p.backlink_estimate || 0,
        estimated_traffic: p.estimated_traffic || 0,
        discovered_at: new Date().toISOString(),
      }).catch(() => {});
      stored++;
    }

    return Response.json({
      ok: true,
      industry,
      market,
      performersFound: data.performers.length,
      performersStored: stored,
      performers: data.performers,
      discoveredAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}