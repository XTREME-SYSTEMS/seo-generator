import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { niche, sub_industry, mass_production_queue_id } = body;

    if (!niche) return Response.json({ error: 'niche is required' }, { status: 400 });

    // Check if a playbook already exists for this industry
    const existing = await base44.entities.IndustryPlaybook.filter({ industry: niche });
    if (existing.length > 0) {
      return Response.json({
        success: true,
        message: 'Playbook already exists for this niche',
        playbook: existing[0],
        skipped: true,
      });
    }

    const prompt = `You are an elite SEO/AEO strategist specializing in the "${niche}" industry${sub_industry ? ` (${sub_industry})` : ''}.
You are building a mass-production playbook for generating hundreds of local lead-generation sites in this niche.

Generate a comprehensive Industry Playbook. Return ONLY a JSON object with these exact fields:

- benchmark_summary: Reverse-engineered combined benchmark of the top 3 competitors in this niche (word counts, page types, schema, review counts, domain authority, content structure)
- target_summary: The 20%-better-than-benchmark target our sites must hit to outrank competitors
- competitor_strengths: Array of what top competitors do well
- competitor_failure_points: Array of weaknesses/gaps in competitor sites we can exploit
- content_gaps: Array of content topics/pages competitors are missing
- authority_gaps: Array of authority signals competitors lack
- surface_wins: Array of quick-win surface optimizations (schema, meta, UX, CRO)
- norms: Array of industry norms (typical word counts, page types, schema types, review counts, citation patterns)
- partner_authority_domains: Array of high-DA domains we can get backlinks from (industry associations, directories, .gov, .edu)
- partner_p_cross_boost: Number 0-100 representing modeled uplift to cross-domain authority from partner links

Focus on:
- Local SEO: Google Business Profile optimization, NAP consistency, local citations, review velocity
- Emergency/urgency signals for "${niche}" (response time, 24/7 availability, emergency callouts)
- Commercial intent: high-CPC keywords, lead capture forms, phone tracking, instant response
- Schema markup: LocalBusiness, Service, FAQPage, Review, AggregateRating, BreadcrumbList
- Content structure: service pages, city/location pages, FAQ, trust signals, before/after galleries
- Authority building: industry associations, manufacturer partnerships, local chambers of commerce
- Conversion optimization: form design, click-to-call, response time messaging, trust badges
- AI Search/AEO: answer-target content, FAQ schema, conversational queries, featured snippet targets`;

    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          benchmark_summary: { type: 'string' },
          target_summary: { type: 'string' },
          competitor_strengths: { type: 'array', items: { type: 'string' } },
          competitor_failure_points: { type: 'array', items: { type: 'string' } },
          content_gaps: { type: 'array', items: { type: 'string' } },
          authority_gaps: { type: 'array', items: { type: 'string' } },
          surface_wins: { type: 'array', items: { type: 'string' } },
          norms: { type: 'array', items: { type: 'string' } },
          partner_authority_domains: { type: 'array', items: { type: 'string' } },
          partner_p_cross_boost: { type: 'number' },
        },
      },
    });

    const playbookData = {
      industry: niche,
      sub_industry: sub_industry || null,
      benchmark_summary: llmResponse.benchmark_summary || '',
      target_summary: llmResponse.target_summary || '',
      competitor_strengths: llmResponse.competitor_strengths || [],
      competitor_failure_points: llmResponse.competitor_failure_points || [],
      content_gaps: llmResponse.content_gaps || [],
      authority_gaps: llmResponse.authority_gaps || [],
      surface_wins: llmResponse.surface_wins || [],
      norms: llmResponse.norms || [],
      partner_authority_domains: llmResponse.partner_authority_domains || [],
      partner_p_cross_boost: llmResponse.partner_p_cross_boost || 0,
      provenance: 'MODELED',
      compiled_at: new Date().toISOString(),
    };

    const playbook = await base44.entities.IndustryPlaybook.create(playbookData);

    // Link playbook to the mass production queue item if ID was provided
    if (mass_production_queue_id) {
      await base44.entities.MassProductionQueue.update(mass_production_queue_id, {
        notes: `Playbook generated: ${playbook.id}`,
      });
    }

    return Response.json({ success: true, playbook });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}