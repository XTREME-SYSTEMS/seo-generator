import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// DiscoverStrategicUrls — finds and evaluates high-value URL patterns for lead-gen site building.
// Uses LLM + live web research to identify URLs with the highest lead-gen revenue potential,
// then scores each on search volume, CPC, lead value, programmatic potential, and estimated site value.
// Invoke: POST /functions/DiscoverStrategicUrls with { niche, location_type }
// location_type: "emergency" | "near_you" | "near_me" | "service" | "local" (default: near_you)

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    // Admin-only guard
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const niche = (body.niche || '').trim();
    const locationType = body.location_type || 'near_you';

    if (!niche) {
      return Response.json({ error: 'niche is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Check for existing URLs in this niche to avoid duplicates
    const existing = await svc.entities.StrategicUrl.list('-created_date', 100);
    const existingUrls = new Set(existing.filter(u => u.niche === niche).map(u => u.url.toLowerCase()));

    const prompt = `You are a strategic URL investment analyst specializing in lead-generation website portfolios.

Analyze the "${niche}" niche and find the HIGHEST-VALUE URL patterns that could generate massive lead-gen revenue. Focus on ${locationType} intent URLs.

Prioritize these URL categories:
1. EMERGENCY services — urgent needs with high CPC (water damage, burst pipe, lockout, towing, emergency vet, emergency dentist, emergency roof repair, emergency HVAC, etc.)
2. "NEAR YOU" / "NEAR ME" — local intent with high commercial value
3. HIGH-CPC commercial keywords — industries where a single lead is worth $100-$2000+
4. PROGRAMMATIC potential — URLs that can scale to hundreds of city/service pages

For each URL evaluate:
- Estimated monthly search volume (national)
- CPC estimate (what advertisers pay per click — indicates lead value)
- Competition level (low/medium/high)
- Lead gen potential score (0-100, where 100 = massive revenue)
- Estimated monthly leads (if ranked on page 1)
- Estimated lead value (what each lead is worth to the business)
- Estimated monthly revenue (leads × lead value)
- Estimated site value (what a finished, page-1 ranked site is worth to a buyer — typically 24-36x monthly revenue)
- Programmatic pages potential (how many city × service pages can be generated)
- Google first page difficulty (0-100, where 100 = hardest)
- Target buyer industry (who would pay top dollar for this site)
- Rationale (2-3 sentences explaining why this URL is a strategic goldmine)

Return 10-15 URLs ranked by estimated_site_value (highest first). Use realistic domain patterns like:
- emergency{service}nearyou.com
- {service}nearme.com
- {city}{service}pros.com (for programmatic)
- find{service}fast.com
- {service}quotesnearme.com`;

    const schema = {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              keyword_category: { type: 'string', enum: ['emergency', 'near_you', 'near_me', 'service', 'local', 'commercial'] },
              primary_keyword: { type: 'string' },
              secondary_keywords: { type: 'array', items: { type: 'string' } },
              search_volume_estimate: { type: 'number' },
              competition_level: { type: 'string', enum: ['low', 'medium', 'high'] },
              cpc_estimate: { type: 'number' },
              lead_gen_potential_score: { type: 'number' },
              estimated_monthly_leads: { type: 'number' },
              estimated_lead_value: { type: 'number' },
              estimated_monthly_revenue: { type: 'number' },
              estimated_site_value: { type: 'number' },
              target_buyer_industry: { type: 'string' },
              programmatic_pages_potential: { type: 'number' },
              google_first_page_difficulty: { type: 'number' },
              rationale: { type: 'string' }
            },
            required: ['url', 'primary_keyword', 'estimated_site_value']
          }
        }
      },
      required: ['urls']
    };

    const llmRes = await svc.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: schema
    });

    const candidates = (llmRes && Array.isArray(llmRes.urls)) ? llmRes.urls : [];

    // Filter out duplicates
    const novel = candidates.filter(c => c.url && !existingUrls.has(c.url.toLowerCase()));

    const records = novel.map(c => ({
      url: String(c.url).toLowerCase(),
      niche,
      keyword_category: c.keyword_category || locationType,
      primary_keyword: c.primary_keyword || '',
      secondary_keywords: c.secondary_keywords || [],
      search_volume_estimate: c.search_volume_estimate || 0,
      competition_level: c.competition_level || 'medium',
      cpc_estimate: c.cpc_estimate || 0,
      lead_gen_potential_score: c.lead_gen_potential_score || 0,
      estimated_monthly_leads: c.estimated_monthly_leads || 0,
      estimated_lead_value: c.estimated_lead_value || 0,
      estimated_monthly_revenue: c.estimated_monthly_revenue || 0,
      estimated_site_value: c.estimated_site_value || 0,
      target_buyer_industry: c.target_buyer_industry || '',
      programmatic_pages_potential: c.programmatic_pages_potential || 0,
      google_first_page_difficulty: c.google_first_page_difficulty || 50,
      rationale: c.rationale || '',
      status: 'evaluated'
    }));

    let created = [];
    if (records.length) {
      created = await svc.entities.StrategicUrl.bulkCreate(records);
    }

    await svc.entities.Receipt.create({
      kind: 'ingestion',
      summary: `Strategic URL discovery for "${niche}": ${created.length} URLs evaluated`,
      detail: `${candidates.length} candidates, ${created.length} new (after dedup). Top value: $${records[0]?.estimated_site_value?.toLocaleString() || 0}`,
      source: 'DiscoverStrategicUrls',
      provenance: 'INFERRED',
      occurred_at: now
    });

    return Response.json({
      niche,
      discovered: candidates.length,
      created: created.length,
      urls: created
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}