import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// ScrapeIndustryPricing — uses web search to gather competitor pricing data
// across an industry. Extracts price ranges, service tiers, and package deals.
// Stores as ResearchFinding records.
//
// Invoke: base44.functions.invoke('ScrapeIndustryPricing', { industry, competitors? })
// Returns: { ok, pricingFound, pricing }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const industry = String(body.industry || '').trim();
    const competitors = Array.isArray(body.competitors) ? body.competitors : [];
    if (!industry) return Response.json({ error: 'industry is required' }, { status: 400 });

    const compStr = competitors.length > 0 ? `\nFocus on these competitors: ${competitors.join(', ')}` : '';

    const prompt = `You are a pricing intelligence analyst. Search the web for pricing data in the "${industry}" industry.${compStr}

Find:
1. Average service prices (per square foot, per project, per hour)
2. Price ranges (low-end, mid-range, premium)
3. Package deals and tiers
4. Factors that affect pricing (size, condition, location, materials)
5. Seasonal pricing variations
6. Common upsells and add-ons

For each pricing data point:
- service: the service name
- price_range: the price range (e.g., "$3-$8 per sq ft")
- price_unit: per sq ft / per project / per hour / per day
- factors: array of factors affecting price
- competitor: which competitor offers this (if known)
- source_url: where the pricing was found
- confidence: high/medium/low

Output strict JSON: { pricing: [{ service, price_range, price_unit, factors, competitor, source_url, confidence }] }`;

    const schema = {
      type: 'object',
      properties: {
        pricing: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              price_range: { type: 'string' },
              price_unit: { type: 'string' },
              factors: { type: 'array', items: { type: 'string' } },
              competitor: { type: 'string' },
              source_url: { type: 'string' },
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
    if (!data?.pricing) return Response.json({ error: 'AI did not return pricing' }, { status: 502 });

    // Store as ResearchFinding records
    let stored = 0;
    for (const p of data.pricing) {
      await svc.entities.ResearchFinding.create({
        topic: 'pricing',
        industry,
        summary: `${p.service}: ${p.price_range} ${p.price_unit}`,
        key_facts: [p.price_range, `Factors: ${(p.factors || []).join(', ')}`],
        data_points: [p.price_range],
        sources: p.source_url ? [p.source_url] : [],
        confidence: p.confidence || 'medium',
        provenance: 'INFERRED',
        discovered_at: new Date().toISOString(),
      }).catch(() => {});
      stored++;
    }

    return Response.json({
      ok: true,
      industry,
      pricingFound: data.pricing.length,
      pricingStored: stored,
      pricing: data.pricing,
      scrapedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}