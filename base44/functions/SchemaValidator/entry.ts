import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// SchemaValidator — fetches managed URLs, extracts JSON-LD schema markup,
// validates it against schema.org types, and generates fix suggestions for
// missing or invalid schema.
//
// Invoke: base44.functions.invoke('SchemaValidator', { url?, limit? })
// Returns: { ok, checked, valid_schema, invalid_schema, missing_schema, suggestions }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const now = new Date().toISOString();
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 15;

    // ── LOAD TARGETS ──
    let targets;
    if (body.url) {
      targets = await svc.entities.UrlInventory.filter({ url: body.url }, '-priority', 1).catch(() => []);
    } else {
      targets = await svc.entities.UrlInventory.list('-priority', limit).catch(() => []);
    }

    if (targets.length === 0) {
      targets = await svc.entities.AreSheetRow.list('-priority_score', limit).catch(() => []);
    }

    if (targets.length === 0) {
      return Response.json({ ok: true, checked: 0, message: 'No URLs to check' });
    }

    console.log(`[SchemaValidator] Validating schema on ${targets.length} URLs`);

    let validCount = 0, invalidCount = 0, missingCount = 0, suggestionsGenerated = 0;

    for (const target of targets) {
      const url = target.url;
      if (!url) continue;

      let html = '';
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
        html = await res.text();
      } catch (e) { continue; }

      // ── EXTRACT JSON-LD ──
      const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
      const schemas = jsonLdMatches.map((m) => {
        const content = m.match(/>([\s\S]*?)<\/script>/i)?.[1];
        try { return JSON.parse(content); } catch { return null; }
      }).filter(Boolean);

      const pageType = target.page_type || 'other';

      if (schemas.length === 0) {
        missingCount++;
        // ── SUGGEST ADDING SCHEMA ──
        const expectedTypes = {
          home: ['Organization', 'WebSite'],
          product: ['Product', 'Offer'],
          service: ['Service', 'LocalBusiness'],
          location: ['LocalBusiness', 'PostalAddress'],
          blog_resource: ['Article', 'BlogPosting'],
          faq: ['FAQPage'],
          about_trust: ['Organization', 'BreadcrumbList'],
          category: ['BreadcrumbList', 'ItemList'],
        };
        const recommended = expectedTypes[pageType] || ['BreadcrumbList'];

        await svc.entities.Suggestion.create({
          url, kind: 'enhancement', surface: 'sheet',
          title: `Add ${recommended.join('/')} schema markup to ${url}`,
          rationale: `No JSON-LD schema found on this ${pageType} page. Schema markup is a confirmed ranking factor and enables rich results.`,
          treatment: `Add JSON-LD schema of type ${recommended.join(' and ')} to the page head`,
          gap_type: 'TECHNICAL',
          evidence_tier: 'T1_CONFIRMED_SYSTEM',
          evidence_anchor: 'Structured data enables rich results and is a confirmed Google ranking factor',
          priority_score: 68,
          status: 'new',
          provenance: 'MEASURED',
          created_at: now,
        });
        suggestionsGenerated++;
      } else {
        // ── VALIDATE SCHEMA ──
        let hasValid = false;
        for (const schema of schemas) {
          if (schema['@type'] && schema['@context']) {
            hasValid = true;
            // Check for missing required fields
            const missingFields = [];
            if (schema['@type'] === 'Article' && !schema.headline) missingFields.push('headline');
            if (schema['@type'] === 'Product' && !schema.name) missingFields.push('name');
            if (schema['@type'] === 'LocalBusiness' && !schema.address) missingFields.push('address');
            if (schema['@type'] === 'FAQPage' && !schema.mainEntity) missingFields.push('mainEntity');

            if (missingFields.length > 0) {
              invalidCount++;
              await svc.entities.Suggestion.create({
                url, kind: 'fix', surface: 'sheet',
                title: `Fix ${schema['@type']} schema — missing ${missingFields.join(', ')}`,
                rationale: `Schema of type ${schema['@type']} is missing required fields: ${missingFields.join(', ')}. This prevents rich results.`,
                treatment: `Add missing fields to ${schema['@type']} schema: ${missingFields.join(', ')}`,
                gap_type: 'TECHNICAL',
                evidence_tier: 'T1_CONFIRMED_SYSTEM',
                evidence_anchor: 'Valid structured data with required fields enables rich results',
                priority_score: 65,
                status: 'new',
                provenance: 'MEASURED',
                created_at: now,
              });
              suggestionsGenerated++;
            } else {
              validCount++;
            }
          }
        }
        if (!hasValid) invalidCount++;
      }
    }

    // ── LOG ──
    await svc.entities.RunTelemetry.create({
      run_type: 'schema_validator', subsystem: 'seo_technical', status: 'ok',
      started_at: now, records_written: targets.length,
      message: `SchemaValidator: ${validCount} valid, ${invalidCount} invalid, ${missingCount} missing, ${suggestionsGenerated} suggestions`,
    });
    await svc.entities.Receipt.create({
      kind: 'validation', summary: `SchemaValidator: ${validCount} valid, ${invalidCount} invalid, ${missingCount} missing schema`,
      detail: JSON.stringify({ checked: targets.length, valid: validCount, invalid: invalidCount, missing: missingCount, suggestions: suggestionsGenerated }).slice(0, 4000),
      source: 'schema_validator', provenance: 'MEASURED', occurred_at: now,
    });

    return Response.json({
      ok: true, checked: targets.length, valid_schema: validCount,
      invalid_schema: invalidCount, missing_schema: missingCount, suggestions: suggestionsGenerated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}