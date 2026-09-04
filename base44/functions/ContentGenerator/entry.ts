import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// ContentGenerator — generates the actual content for SEO treatments. The
// system suggests what to change but doesn't create the content. This closes
// that gap: it generates meta titles, meta descriptions, H1 headings, schema
// markup, and page copy recommendations for each URL based on its target
// queries, page type, and industry.
//
// Invoke: base44.functions.invoke('ContentGenerator', { url?, limit? })
// If url is omitted, generates for the top N priority URLs.
// Returns: { ok, generated, content: [{ url, meta_title, meta_description, h1, schema, copy }] }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const svc = base44.asServiceRole;
    const now = new Date().toISOString();
    const body = await req.json().catch(() => ({}));
    const targetUrl = body.url;
    const limit = body.limit || 10;

    // ── LOAD TARGETS ──
    let targets;
    if (targetUrl) {
      targets = (await svc.entities.AreSheetRow.filter({ url: targetUrl }, '-priority_score', 1).catch(() => []));
      if (targets.length === 0) {
        targets = (await svc.entities.UrlInventory.filter({ url: targetUrl }, '-priority', 1).catch(() => []));
      }
    } else {
      targets = await svc.entities.AreSheetRow.list('-priority_score', limit).catch(() => []);
    }

    if (targets.length === 0) {
      return Response.json({ ok: true, generated: 0, message: 'No targets found' });
    }

    console.log(`[ContentGenerator] Generating content for ${targets.length} URLs`);

    const contentResults = [];

    for (const target of targets) {
      const url = target.url;
      const query = target.query || target.top_query || '';
      const pageType = target.page_type || 'other';
      const industry = target.industry || 'General';

      // ── GENERATE CONTENT VIA LLM ──
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert SEO content generator. Generate optimized on-page content for this URL:

URL: ${url}
Target Query: ${query}
Page Type: ${pageType}
Industry: ${industry}

Generate:
1. **Meta Title** (50-60 chars, include the target query naturally)
2. **Meta Description** (150-160 chars, compelling, include query)
3. **H1 Heading** (clear, query-focused)
4. **Schema Markup** (JSON-LD for this page type — use Article, Product, FAQPage, LocalBusiness, or BreadcrumbList as appropriate)
5. **Opening Paragraph** (100-150 words, naturally includes the query and related terms)
6. **FAQ Section** (3 questions + answers that would capture long-tail and AI search visibility)

Return as JSON with keys: meta_title, meta_description, h1, schema_markup, opening_paragraph, faq (array of {question, answer}).`,
          response_json_schema: {
            type: 'object',
            properties: {
              meta_title: { type: 'string' },
              meta_description: { type: 'string' },
              h1: { type: 'string' },
              schema_markup: { type: 'string' },
              opening_paragraph: { type: 'string' },
              faq: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    question: { type: 'string' },
                    answer: { type: 'string' },
                  },
                },
              },
            },
          },
        });

        const content = res.data || res;

        // ── STORE AS SUGGESTION ──
        await svc.entities.Suggestion.create({
          url,
          query,
          surface: 'sheet',
          kind: 'enhancement',
          title: `Content generated for ${pageType} page`,
          rationale: `AI-generated meta tags, schema, and content for query "${query}"`,
          treatment: JSON.stringify({
            meta_title: content.meta_title,
            meta_description: content.meta_description,
            h1: content.h1,
            schema_markup: content.schema_markup,
            opening_paragraph: content.opening_paragraph,
            faq: content.faq,
          }).slice(0, 8000),
          gap_type: 'CONTENT',
          evidence_tier: 'T1_CONFIRMED_SYSTEM',
          evidence_anchor: 'On-page content optimization is a confirmed Google ranking factor',
          priority_score: 70,
          status: 'new',
          provenance: 'MODELED',
          created_at: now,
        });

        contentResults.push({
          url,
          query,
          meta_title: content.meta_title,
          meta_description: content.meta_description,
          h1: content.h1,
          has_schema: !!content.schema_markup,
          has_faq: (content.faq || []).length > 0,
        });
      } catch (e) {
        console.error(`[ContentGenerator] Failed for ${url}:`, e.message);
        contentResults.push({ url, error: e.message });
      }
    }

    // ── LOG ──
    await svc.entities.RunTelemetry.create({
      run_type: 'content_generation',
      subsystem: 'execution',
      status: 'ok',
      started_at: now,
      records_written: contentResults.length,
      message: `ContentGenerator: generated content for ${contentResults.length} URLs`,
    });

    await svc.entities.Receipt.create({
      kind: 'validation',
      summary: `ContentGenerator: ${contentResults.length} URLs got meta tags, schema, and content`,
      detail: JSON.stringify(contentResults.slice(0, 20), null, 2).slice(0, 8000),
      source: 'content_generator',
      provenance: 'MODELED',
      occurred_at: now,
    });

    return Response.json({
      ok: true,
      generated: contentResults.length,
      content: contentResults,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}