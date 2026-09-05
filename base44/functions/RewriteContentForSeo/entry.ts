import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// RewriteContentForSeo — takes existing page content and rewrites it for maximum
// SEO + AEO performance. Uses LLM to enhance: keyword density, headings, FAQ
// sections, schema-ready content, internal linking suggestions, CTA placement.
//
// Invoke: base44.functions.invoke('RewriteContentForSeo', { url, target_keyword, business_name? })
// Returns: { ok, rewrittenContent, changes, seoScore }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const url = String(body.url || '').trim();
    const targetKeyword = String(body.target_keyword || '').trim();
    const businessName = String(body.business_name || '').trim();
    if (!url) return Response.json({ error: 'url is required' }, { status: 400 });
    if (!targetKeyword) return Response.json({ error: 'target_keyword is required' }, { status: 400 });

    // Fetch original content
    let parsed;
    try { parsed = new URL(url); } catch { return Response.json({ error: 'Invalid URL' }, { status: 400 }); }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let resp;
    try {
      resp = await fetch(url, { headers: { 'User-Agent': 'SEOGenerator-ContentRewriter/1.0' }, redirect: 'follow', signal: controller.signal });
    } catch (e) {
      clearTimeout(timeout);
      return Response.json({ error: 'Fetch failed: ' + (e?.message || 'unknown') }, { status: 502 });
    }
    clearTimeout(timeout);
    const html = await resp.text();

    // Extract main content
    const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || '';
    const metaDesc = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) || [])[1] || '';
    const h1s = [...html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi)].map(m => m[1]);
    const h2s = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi)].map(m => m[1]);
    const bodyText = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 4000);

    const prompt = `You are an expert SEO content rewriter. Rewrite the following page content for maximum SEO + AEO performance.

TARGET KEYWORD: ${targetKeyword}
${businessName ? `BUSINESS: ${businessName}` : ''}

ORIGINAL CONTENT:
Title: ${title}
Meta: ${metaDesc}
H1s: ${h1s.join(', ')}
H2s: ${h2s.join(', ')}
Body (first 4000 chars): ${bodyText}

REWRITE TO:
1. Optimized title tag (<60 chars, includes target keyword)
2. Optimized meta description (<155 chars, compelling, includes keyword)
3. Single H1 with target keyword
4. 3-5 H2s covering related subtopics
5. 500-800 words of expert content with natural keyword usage (1-2% density)
6. FAQ section with 3-5 questions (for AEO/AI search)
7. Internal linking suggestions (3-5 related page anchors)
8. CTA placement recommendations
9. Schema markup suggestions (LocalBusiness, FAQPage, Service)

Output strict JSON with: new_title, new_meta_description, new_h1, new_h2s (array), new_content (markdown), faq (array of {question, answer}), internal_links (array of {anchor_text, suggested_url}), schema_suggestions (array), seo_score (0-100)`;

    const schema = {
      type: 'object',
      properties: {
        new_title: { type: 'string' },
        new_meta_description: { type: 'string' },
        new_h1: { type: 'string' },
        new_h2s: { type: 'array', items: { type: 'string' } },
        new_content: { type: 'string' },
        faq: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, answer: { type: 'string' } } } },
        internal_links: { type: 'array', items: { type: 'object', properties: { anchor_text: { type: 'string' }, suggested_url: { type: 'string' } } } },
        schema_suggestions: { type: 'array', items: { type: 'string' } },
        seo_score: { type: 'number' },
      },
    };

    const llmRes = await svc.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema, model: 'claude_sonnet_4_6' });
    const data = llmRes?.data ?? llmRes;
    if (!data?.new_title) return Response.json({ error: 'AI did not return rewritten content' }, { status: 502 });

    // Create a suggestion
    await svc.entities.Suggestion.create({
      title: `Content rewrite for ${targetKeyword}`,
      url,
      query: targetKeyword,
      kind: 'upgrade',
      gap_type: 'CONTENT',
      treatment: data.new_content?.substring(0, 500),
      rationale: `Rewritten content with SEO score ${data.seo_score}/100`,
      evidence_tier: 'T2_EXPERIMENT',
      provenance: 'MODELED',
      status: 'new',
      created_at: new Date().toISOString(),
    }).catch(() => {});

    return Response.json({
      ok: true,
      url,
      targetKeyword,
      rewrittenContent: data,
      seoScore: data.seo_score,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}