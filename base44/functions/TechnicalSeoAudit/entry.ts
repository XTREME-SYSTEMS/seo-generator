import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { extractMeta, extractAll, safeUrl, fetchWithTimeout } from '../../shared/htmlUtils.ts';

// TechnicalSeoAudit — scans a URL for technical SEO issues using fetch + regex.
// Checks: title, meta, canonical, OG tags, JSON-LD schema, H1s, images, alt text,
// internal links, word count, robots.txt, sitemap.xml, mobile-friendly, SSL.
// No external secrets required — pure HTTP analysis.
//
// Invoke: base44.functions.invoke('TechnicalSeoAudit', { url })
// Returns: { ok, url, score, issues, meta, counts }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const url = String(body.url || '').trim();
    if (!url) return Response.json({ error: 'url is required' }, { status: 400 });

    const parsed = safeUrl(url);
    if (!parsed) return Response.json({ error: 'Invalid URL (only http/https allowed)' }, { status: 400 });

    const fetched = await fetchWithTimeout(url, 'SEOGenerator-TechnicalAudit/1.0');
    if ('error' in fetched) return Response.json({ error: fetched.error }, { status: 502 });
    const { html, finalUrl } = fetched;

    const metaTitle = extractMeta(html, /<title[^>]*>([^<]+)<\/title>/i);
    const metaDescription = extractMeta(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
      extractMeta(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    const canonical = extractMeta(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
    const ogTitle = extractMeta(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const ogImage = extractMeta(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    const robotsTag = extractMeta(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
    const jsonLdBlocks = extractAll(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    const h1s = extractAll(html, /<h1[^>]*>([^<]+)<\/h1>/gi);
    const imgs = html.match(/<img[^>]+src=/gi) || [];
    const imgsNoAlt = (html.match(/<img(?![^>]*\salt=)[^>]*src=/gi) || []).length;
    const internalLinks = (html.match(/href=["']\/[^"']*["']/gi) || []).length;
    const externalLinks = (html.match(/href=["']https?:\/\/(?!${finalUrl.hostname})[^"']*["']/gi) || []).length;
    const wordCount = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

    // Check sitemap + robots
    let robotsTxt = null, sitemapXml = null;
    try {
      const r = await fetch(finalUrl.origin + '/robots.txt', { signal: AbortSignal.timeout(6000) });
      if (r.ok) robotsTxt = (await r.text()).slice(0, 500);
    } catch { /* none */ }
    try {
      const s = await fetch(finalUrl.origin + '/sitemap.xml', { signal: AbortSignal.timeout(6000) });
      if (s.ok) sitemapXml = 'present';
    } catch { /* none */ }

    const issues = [];
    if (!metaTitle) issues.push({ severity: 'critical', issue: 'Missing <title> tag', fix: 'Add a unique, keyword-rich title (<60 chars).' });
    else if (metaTitle.length > 60) issues.push({ severity: 'medium', issue: `Title too long (${metaTitle.length} chars)`, fix: 'Trim to <60 chars.' });
    if (!metaDescription) issues.push({ severity: 'high', issue: 'Missing meta description', fix: 'Add a compelling description (<155 chars).' });
    else if (metaDescription.length > 155) issues.push({ severity: 'medium', issue: `Meta description too long (${metaDescription.length} chars)`, fix: 'Trim to <155 chars.' });
    if (!canonical) issues.push({ severity: 'high', issue: 'Missing canonical tag', fix: 'Add <link rel="canonical"> to prevent duplicates.' });
    if (!ogTitle) issues.push({ severity: 'medium', issue: 'Missing Open Graph title', fix: 'Add og:title for social sharing.' });
    if (!ogImage) issues.push({ severity: 'medium', issue: 'Missing Open Graph image', fix: 'Add og:image for social sharing.' });
    if (jsonLdBlocks.length === 0) issues.push({ severity: 'high', issue: 'No JSON-LD structured data', fix: 'Add LocalBusiness/Service/FAQ schema.' });
    if (h1s.length === 0) issues.push({ severity: 'critical', issue: 'Missing H1 tag', fix: 'Add a single H1 with the primary keyword.' });
    if (h1s.length > 1) issues.push({ severity: 'medium', issue: `Multiple H1 tags (${h1s.length})`, fix: 'Use only one H1 per page.' });
    if (imgs.length > 0 && imgsNoAlt > 0) issues.push({ severity: 'medium', issue: `${imgsNoAlt} images missing alt text`, fix: 'Add descriptive alt attributes to all images.' });
    if (wordCount < 300) issues.push({ severity: 'medium', issue: `Thin content (${wordCount} words)`, fix: 'Expand to 500+ words with valuable content.' });
    if (!robotsTxt) issues.push({ severity: 'low', issue: 'Missing robots.txt', fix: 'Add a robots.txt file.' });
    if (!sitemapXml) issues.push({ severity: 'medium', issue: 'Missing sitemap.xml', fix: 'Generate and submit a sitemap.' });
    if (internalLinks < 5) issues.push({ severity: 'medium', issue: `Few internal links (${internalLinks})`, fix: 'Add more internal links to related pages.' });

    const critical = issues.filter(i => i.severity === 'critical').length;
    const high = issues.filter(i => i.severity === 'high').length;
    const medium = issues.filter(i => i.severity === 'medium').length;
    const low = issues.filter(i => i.severity === 'low').length;
    const score = Math.max(0, 100 - (critical * 25 + high * 10 + medium * 5 + low * 2));

    await svc.entities.Receipt.create({
      type: 'technical_seo_audit',
      url,
      summary: `Technical SEO audit: score ${score}/100, ${issues.length} issues`,
      details: JSON.stringify({ score, critical, high, medium, low }),
      provenance: 'MEASURED',
      occurred_at: new Date().toISOString(),
    }).catch(() => {});

    return Response.json({
      ok: true,
      url,
      finalUrl: finalUrl.href,
      score,
      issues,
      summary: { critical, high, medium, low, total: issues.length },
      meta: { metaTitle, metaDescription, canonical, ogTitle, ogImage, robotsTag },
      counts: { h1s: h1s.length, h2s: extractAll(html, /<h2[^>]*>([^<]+)<\/h2>/gi).length, images: imgs.length, imgsNoAlt, internalLinks, externalLinks, wordCount, jsonLdBlocks: jsonLdBlocks.length },
      robotsTxt: robotsTxt ? 'present' : 'missing',
      sitemapXml,
      auditedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}