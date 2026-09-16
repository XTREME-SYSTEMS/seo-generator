import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// ResearchSearchDemand — for each available domain candidate, runs two parallel research paths:
// 1. InvokeLLM with web context identifies Google's top search terms, search volume, CPC, commercial intent
// 2. Google Suggest API scrapes real-time autocomplete suggestions for the seed term
// Results are merged and scored into a demand_score (0-100).
// Invoke: base44.functions.invoke('ResearchSearchDemand', { limit?: number, domain?: string })

async function getAutocomplete(query) {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data[1]) ? data[1].slice(0, 10) : [];
  } catch {
    return [];
  }
}

async function batchProcess(items, fn, concurrency = 5) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 50;
    const singleDomain = body.domain;

    // Load available candidates without demand data
    let candidates;
    if (singleDomain) {
      candidates = await svc.entities.NearMeCandidate.filter({ domain: singleDomain }, '-created_date', 1);
    } else {
      // Get available candidates with demand_score = 0
      const all = await svc.entities.NearMeCandidate.filter({ availability_status: 'available' }, '-created_date', limit * 2);
      candidates = all.filter(c => !c.demand_score || c.demand_score === 0).slice(0, limit);
    }

    if (!candidates.length) return Response.json({ message: 'No candidates needing demand research', researched: 0 });

    const researchOne = async (c) => {
      try {
        const seedTerm = c.niche || c.domain.split('near')[0] || c.domain;

        // Path 1: LLM research with web context
        const llmRes = await svc.integrations.Core.InvokeLLM({
          model: 'gemini_3_1_pro',
          add_context_from_internet: true,
          prompt: `You are a search demand intelligence analyst. Research the search demand for "${seedTerm}" — specifically for the "{seedTerm} near me" search pattern.

Provide:
1. top_search_terms — the top 5-8 Google search terms related to "{seedTerm} near me" (array of strings)
2. search_volume — estimated US monthly search volume for "{seedTerm} near me" (number)
3. cpc — estimated cost per click in USD for this keyword (number)
4. commercial_intent — "low" | "medium" | "high" | "critical"
5. trend_summary — 2-3 sentence summary of search demand trends, AI search visibility, and why this is or isn't a high-value keyword right now
6. demand_score — 0-100 score where 100 = extremely high demand + high commercial intent + high CPC

Return JSON with all fields.`,
          response_json_schema: {
            type: 'object',
            properties: {
              top_search_terms: { type: 'array', items: { type: 'string' } },
              search_volume: { type: 'number' },
              cpc: { type: 'number' },
              commercial_intent: { type: 'string' },
              trend_summary: { type: 'string' },
              demand_score: { type: 'number' }
            }
          }
        });

        // Path 2: Google Autocomplete suggestions (real-time)
        const autocomplete = await getAutocomplete(`${seedTerm} near me`);

        // Merge results
        const demandScore = llmRes.demand_score || 0;
        const searchVolume = llmRes.search_volume || c.search_volume_estimate || 0;
        const cpc = llmRes.cpc || c.cpc_estimate || 0;
        const topTerms = llmRes.top_search_terms || [];

        return {
          id: c.id,
          domain: c.domain,
          demand_score: Math.min(100, Math.max(0, demandScore)),
          search_volume_estimate: searchVolume,
          cpc_estimate: cpc,
          top_search_terms: topTerms,
          ai_trend_summary: llmRes.trend_summary || '',
          autocomplete_suggestions: autocomplete,
          commercial_intent: llmRes.commercial_intent || c.commercial_intent || 'medium'
        };
      } catch (e) {
        return { id: c.id, domain: c.domain, error: e.message };
      }
    };

    const results = await batchProcess(candidates, researchOne, 5);

    // Bulk update candidates with demand data
    const updates = results.filter(r => !r.error).map(r => ({
      id: r.id,
      demand_score: r.demand_score,
      search_volume_estimate: r.search_volume_estimate,
      cpc_estimate: r.cpc_estimate,
      top_search_terms: r.top_search_terms,
      ai_trend_summary: r.ai_trend_summary,
      autocomplete_suggestions: r.autocomplete_suggestions,
      commercial_intent: r.commercial_intent
    }));

    if (updates.length) {
      await svc.entities.NearMeCandidate.bulkUpdate(updates);
    }

    await svc.entities.Receipt.create({
      summary: `Search demand research: ${updates.length} candidates researched with LLM + autocomplete`,
      source: 'ResearchSearchDemand',
      occurred_at: new Date().toISOString(),
      proof_level: 1
    });

    return Response.json({
      researched: updates.length,
      errors: results.filter(r => r.error).length,
      avg_demand: updates.length ? Math.round(updates.reduce((s, u) => s + u.demand_score, 0) / updates.length) : 0,
      results: results.map(r => ({ domain: r.domain, demand_score: r.demand_score, search_volume: r.search_volume_estimate, cpc: r.cpc_estimate }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}