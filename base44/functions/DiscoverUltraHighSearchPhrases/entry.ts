import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// DiscoverUltraHighSearchPhrases — uses InvokeLLM with web context to research and identify
// every word/phrase across all industries that generates ultra-high search volume right now:
// trending terms, emerging demands, AI-related searches, and high-CPC commercial phrases.
// Google Suggest API validates each phrase. Results stored as NearMeCandidate records with
// pattern_type "phrase" for domain availability checking.
// Invoke: base44.functions.invoke('DiscoverUltraHighSearchPhrases', { count?: number })

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

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const count = body.count || 50;

    // Use InvokeLLM with web context to discover ultra-high search phrases
    const llmRes = await svc.integrations.Core.InvokeLLM({
      model: 'gemini_3_1_pro',
      add_context_from_internet: true,
      prompt: `You are a search trend intelligence analyst. Identify the ${count} highest-value search phrases right now across ALL industries — phrases that generate ultra-high search volume and have strong commercial intent.

Focus on:
1. TRENDING terms — what's surging in search right now (AI tools, new technologies, viral services)
2. EMERGING demands — new services/products people are starting to search for heavily
3. AI-RELATED searches — "ai writer", "ai chatbot", "ai image generator", "ai seo", etc.
4. HIGH-CPC commercial phrases — terms where advertisers pay $5-$50+ per click
5. NEAR ME variants — phrases commonly searched with "near me" that have massive volume

For each phrase provide:
- phrase — the exact search phrase
- category — "trending" | "emerging" | "ai" | "commercial" | "local"
- search_volume — estimated US monthly search volume (number)
- cpc — estimated cost per click in USD (number)
- commercial_intent — "low" | "medium" | "high" | "critical"
- domain_potential — a domain slug that could capture this search (e.g. "aiwriter", "aitools")
- trend_summary — 1-2 sentence summary of why this phrase is hot right now

Return JSON: { "phrases": [ { phrase, category, search_volume, cpc, commercial_intent, domain_potential, trend_summary } ] }`,
      response_json_schema: {
        type: 'object',
        properties: {
          phrases: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                phrase: { type: 'string' },
                category: { type: 'string' },
                search_volume: { type: 'number' },
                cpc: { type: 'number' },
                commercial_intent: { type: 'string' },
                domain_potential: { type: 'string' },
                trend_summary: { type: 'string' }
              }
            }
          }
        }
      }
    });

    const phrases = (llmRes && Array.isArray(llmRes.phrases)) ? llmRes.phrases : [];

    // Validate each phrase via Google Autocomplete and build candidate records
    const candidates = [];
    const seen = new Set();
    for (const p of phrases) {
      const slug = String(p.domain_potential || p.phrase).toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (!slug || slug.length < 3) continue;

      const autocomplete = await getAutocomplete(p.phrase);

      // Generate domain patterns from the phrase
      for (const suffix of ['nearme.com', 'near.com', 'nearyou.com']) {
        const domain = `${slug}${suffix}`;
        if (seen.has(domain)) continue;
        seen.add(domain);
        candidates.push({
          domain,
          niche: p.phrase,
          naics_sector: p.category || 'ultra-high',
          pattern_type: 'phrase',
          search_volume_estimate: p.search_volume || 0,
          cpc_estimate: p.cpc || 0,
          commercial_intent: p.commercial_intent || 'high',
          ai_trend_summary: p.trend_summary || '',
          autocomplete_suggestions: autocomplete,
          demand_score: Math.min(100, Math.max(0, Math.round((p.search_volume || 0) / 1000 + (p.cpc || 0) * 5))),
          availability_status: 'unchecked'
        });
      }
    }

    // Deduplicate against existing
    const existing = await svc.entities.NearMeCandidate.list('-created_date', 500);
    const existingDomains = new Set(existing.map(c => c.domain.toLowerCase()));
    const novel = candidates.filter(c => !existingDomains.has(c.domain.toLowerCase()));

    let created = [];
    if (novel.length) {
      created = await svc.entities.NearMeCandidate.bulkCreate(novel);
    }

    await svc.entities.Receipt.create({
      summary: `Ultra-high search phrase discovery: ${created.length} phrase-based domains from ${phrases.length} phrases`,
      source: 'DiscoverUltraHighSearchPhrases',
      occurred_at: new Date().toISOString(),
      proof_level: 1
    });

    return Response.json({
      phrases_researched: phrases.length,
      candidates_generated: candidates.length,
      created: created.length,
      duplicates_skipped: candidates.length - novel.length,
      top_phrases: phrases.slice(0, 10).map(p => ({ phrase: p.phrase, volume: p.search_volume, cpc: p.cpc, category: p.category }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}