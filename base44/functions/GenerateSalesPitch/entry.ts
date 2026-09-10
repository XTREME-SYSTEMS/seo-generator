import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// GenerateSalesPitch — creates a full sales pitch for a potential buyer of a strategic URL/site.
// Includes price evaluation, ROI projection, and stats backing the valuation.
// Invoke: POST /functions/GenerateSalesPitch with { buyer_prospect_id }
// OR: POST /functions/GenerateSalesPitch with { strategic_url_id, company_name, domain, industry }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const now = new Date().toISOString();

    let strategicUrl = null;
    let buyerProspectId = body.buyer_prospect_id;
    let company_name = body.company_name || '';
    let domain = body.domain || '';
    let industry = body.industry || '';

    // If buyer_prospect_id provided, load existing prospect + its strategic URL
    if (buyerProspectId) {
      const prospect = await svc.entities.BuyerProspect.get(buyerProspectId);
      if (!prospect) {
        return Response.json({ error: 'Buyer prospect not found' }, { status: 404 });
      }
      company_name = prospect.company_name;
      domain = prospect.domain || '';
      industry = prospect.industry || '';
      if (prospect.strategic_url_id) {
        strategicUrl = await svc.entities.StrategicUrl.get(prospect.strategic_url_id);
      }
    } else if (body.strategic_url_id) {
      strategicUrl = await svc.entities.StrategicUrl.get(body.strategic_url_id);
      if (!strategicUrl) {
        return Response.json({ error: 'Strategic URL not found' }, { status: 404 });
      }
    } else {
      return Response.json({ error: 'buyer_prospect_id or strategic_url_id required' }, { status: 400 });
    }

    if (!strategicUrl) {
      return Response.json({ error: 'Strategic URL not found' }, { status: 404 });
    }

    const url = strategicUrl.url;
    const monthlyRev = strategicUrl.estimated_monthly_revenue || 0;
    const monthlyLeads = strategicUrl.estimated_monthly_leads || 0;
    const leadValue = strategicUrl.estimated_lead_value || 0;
    const siteValue = strategicUrl.estimated_site_value || 0;
    const cpc = strategicUrl.cpc_estimate || 0;
    const searchVol = strategicUrl.search_volume_estimate || 0;
    const progPages = strategicUrl.programmatic_pages_potential || 0;
    const difficulty = strategicUrl.google_first_page_difficulty || 50;
    const leadScore = strategicUrl.lead_gen_potential_score || 0;
    const targetIndustry = strategicUrl.target_buyer_industry || industry;
    const primaryKw = strategicUrl.primary_keyword || '';
    const secondaryKws = (strategicUrl.secondary_keywords || []).join(', ');
    const rationale = strategicUrl.rationale || '';

    const prompt = `You are a senior M&A advisor specializing in digital asset sales. Create a COMPELLING sales pitch for selling the website "${url}" to ${company_name || `a company in the ${targetIndustry} industry`}${domain ? ` (${domain})` : ''}.

Here is the strategic data for this URL:
- URL: ${url}
- Niche: ${strategicUrl.niche || 'N/A'}
- Primary keyword: "${primaryKw}"
- Secondary keywords: ${secondaryKws}
- Monthly search volume: ${searchVol.toLocaleString()}
- CPC (cost per click): $${cpc}
- Lead gen potential score: ${leadScore}/100
- Estimated monthly leads (at page 1): ${monthlyLeads.toLocaleString()}
- Estimated lead value: $${leadValue}
- Estimated monthly revenue: $${monthlyRev.toLocaleString()}
- Estimated site value: $${siteValue.toLocaleString()}
- Programmatic pages potential: ${progPages.toLocaleString()} pages
- Google first page difficulty: ${difficulty}/100
- Target buyer industry: ${targetIndustry}
- Rationale: ${rationale}

Create a FULL sales pitch in markdown that includes:
1. **Executive Summary** — why this URL is a once-in-a-decade acquisition opportunity
2. **The Asset** — what ${url} is and why it's valuable
3. **Market Opportunity** — the market size, demand, and why NOW is the time
4. **Revenue Projections** — detailed 12-month, 24-month, and 36-month revenue projections
5. **Price Evaluation** — justified asking price with methodology (24-36x monthly revenue multiple)
6. **ROI Analysis** — how fast the buyer recoups the investment and ongoing ROI
7. **Competitive Advantage** — why owning this URL gives an unfair advantage over competitors
8. **Programmatic Scale** — how ${progPages.toLocaleString()} programmatic pages multiply the value
9. **Risk Mitigation** — why this is a low-risk acquisition
10. **Call to Action** — next steps and urgency

Also provide:
- A concise "stats_summary" (1-2 sentences of the most compelling stats)
- An "roi_projection" (1-2 sentences summarizing the ROI)
- The "price_evaluation" as a number (the asking price in USD)

Make the pitch persuasive, data-driven, and professional. Use specific numbers throughout.`;

    const schema = {
      type: 'object',
      properties: {
        pitch_document: { type: 'string', description: 'Full sales pitch in markdown' },
        price_evaluation: { type: 'number', description: 'Asking price in USD' },
        roi_projection: { type: 'string' },
        stats_summary: { type: 'string' }
      },
      required: ['pitch_document', 'price_evaluation']
    };

    const llmRes = await svc.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash',
      response_json_schema: schema
    });

    const pitchDoc = llmRes?.pitch_document || '';
    const priceEval = llmRes?.price_evaluation || siteValue;
    const roiProj = llmRes?.roi_projection || '';
    const statsSum = llmRes?.stats_summary || '';

    // Update or create the buyer prospect
    if (buyerProspectId) {
      await svc.entities.BuyerProspect.update(buyerProspectId, {
        pitch_document: pitchDoc,
        price_evaluation: priceEval,
        roi_projection: roiProj,
        stats_summary: statsSum,
        pitch_status: 'pitched',
        pitch_generated_at: now
      });
    } else {
      const newProspect = await svc.entities.BuyerProspect.create({
        strategic_url_id: strategicUrl.id,
        strategic_url: url,
        company_name,
        domain,
        industry: targetIndustry,
        reason_to_buy: `Strategic URL acquisition for ${primaryKw} market dominance`,
        pitch_document: pitchDoc,
        price_evaluation: priceEval,
        roi_projection: roiProj,
        stats_summary: statsSum,
        pitch_status: 'pitched',
        pitch_generated_at: now
      });
      buyerProspectId = newProspect.id;
    }

    await svc.entities.Receipt.create({
      kind: 'action',
      summary: `Sales pitch generated for ${url} → ${company_name || targetIndustry}`,
      detail: `Price evaluation: $${priceEval.toLocaleString()}. ROI: ${roiProj.slice(0, 100)}`,
      source: 'GenerateSalesPitch',
      provenance: 'INFERRED',
      occurred_at: now
    });

    return Response.json({
      ok: true,
      buyer_prospect_id: buyerProspectId,
      strategic_url: url,
      company_name,
      price_evaluation: priceEval,
      roi_projection: roiProj,
      stats_summary: statsSum,
      pitch_document: pitchDoc
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}