import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Uses web research to discover new AI/SEO/AEO capabilities and add them to the registry.
// Deduplicates against existing capability names.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const svc = base44.asServiceRole;

    const existing = await svc.entities.Capability.list('category', 500);
    const existingNames = new Set(existing.map((c) => c.name.toLowerCase().trim()));

    const prompt = [
      'You are a capability discovery engine for an enterprise SEO/AEO/AI-search orchestration platform.',
      'Research the LATEST 2025-2026 capabilities, methods, and AI-driven techniques across ALL of these domains:',
      '1. Technical SEO (indexing, canonicals, schema, core web vitals, crawl budget, hreflang, JS rendering, structured data)',
      '2. Content SEO (topical authority, entity coverage, content pruning, E-E-A-T, semantic SEO)',
      '3. Answer Engine Optimization / AEO (AI overviews, featured snippets, FAQ schema, answer passages, citation-worthiness)',
      '4. AI Search Visibility (ChatGPT, Perplexity, Gemini, Copilot citation tracking; brand mention; Reddit/forum presence)',
      '5. Authority & link building (digital PR, broken link building, unlinked mentions, partner links, HARO)',
      '6. Cloud browser automation (headless scraping, captcha solving, proxy rotation, anti-bot bypass, form fill, screenshot diffing)',
      '7. Autonomous ranking (self-healing, intelligent retry, digital twin simulation, algorithm update detection)',
      '8. Local SEO (GBP, citations, reviews, NAP)',
      '9. Measurement (GSC, GA4, rank tracking, SERP measurement, attribution)',
      '10. Ecosystem / API (webhooks, white-label, integrations)',
      'For EACH capability return: category (one of the 10 above), name, description, impact_score (0-100, estimated ranking+traffic impact), speed_tier (instant/fast/medium/slow — how fast impact shows), delivery (automated/ai_assisted/google_sync/manual — how it executes), evidence_tier (T0_GOOGLE_DOC/T1_CONFIRMED_SYSTEM/T2_EXPERIMENT/T3_OBSERVATIONAL/T4_SINGLE_CASE/T5_COMMUNITY/T6_HYPOTHESIS).',
      'Focus on capabilities that deliver the FASTEST and GREATEST impact. Include emerging AI techniques most SEOs are not using yet. Return at least 25 capabilities.',
    ].join('\n');

    const res = await svc.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          capabilities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                impact_score: { type: 'number' },
                speed_tier: { type: 'string' },
                delivery: { type: 'string' },
                evidence_tier: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const allowedCat = ['measurement', 'seo_technical', 'seo_content', 'aeo', 'ai_search', 'authority', 'cloud_browser', 'autonomous', 'local', 'ecosystem'];
    const allowedSpeed = ['instant', 'fast', 'medium', 'slow'];
    const allowedDelivery = ['automated', 'ai_assisted', 'google_sync', 'manual'];
    const allowedTier = ['T0_GOOGLE_DOC', 'T1_CONFIRMED_SYSTEM', 'T2_EXPERIMENT', 'T3_OBSERVATIONAL', 'T4_SINGLE_CASE', 'T5_COMMUNITY', 'T6_HYPOTHESIS'];

    const fresh = (res.capabilities || [])
      .map((c) => ({
        ...c,
        name: String(c.name || '').trim(),
        category: allowedCat.includes(c.category) ? c.category : 'seo_content',
        speed_tier: allowedSpeed.includes(c.speed_tier) ? c.speed_tier : 'medium',
        delivery: allowedDelivery.includes(c.delivery) ? c.delivery : 'ai_assisted',
        evidence_tier: allowedTier.includes(c.evidence_tier) ? c.evidence_tier : 'T3_OBSERVATIONAL',
        impact_score: Math.max(0, Math.min(100, Number(c.impact_score) || 50)),
      }))
      .filter((c) => c.name && c.description)
      .filter((c) => !existingNames.has(c.name.toLowerCase()));

    const payload = fresh.map((c) => ({
      category: c.category,
      name: c.name,
      description: c.description,
      status: 'available',
      implement_function: null,
      evidence_tier: c.evidence_tier,
      automation: 'on_demand',
      impact_score: c.impact_score,
      speed_tier: c.speed_tier,
      delivery: c.delivery,
      effort_hours: 2,
    }));

    let created = [];
    if (payload.length) {
      created = await svc.entities.Capability.bulkCreate(payload);
    }

    await svc.entities.Receipt.create({
      kind: 'ingestion',
      summary: `DiscoverCapabilities — ${payload.length} new capabilities discovered via web research`,
      detail: JSON.stringify(payload.map((p) => p.name)).slice(0, 4000),
      source: 'discover_capabilities',
      provenance: 'INFERRED',
      occurred_at: new Date().toISOString(),
    });

    return Response.json({ ok: true, discovered: payload.length, created: created.length, names: payload.map((p) => p.name) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}