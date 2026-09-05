import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// SeoCrawlSite — crawls an entire site via sitemap.xml, fetches each page, and
// runs a quick SEO check on every URL. Returns a site-wide SEO health report.
// Limits: max 50 pages per crawl to prevent timeout.
//
// Invoke: base44.functions.invoke('SeoCrawlSite', { domain, maxPages? })
// Returns: { ok, domain, pagesCrawled, issues, score, pageResults }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const domain = String(body.domain || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const maxPages = Math.min(body.maxPages || 30, 50);
    if (!domain) return Response.json({ error: 'domain is required' }, { status: 400 });

    // ── FETCH SITEMAP ──
    let sitemapUrl = `https://${domain}/sitemap.xml`;
    let sitemapResp;
    try {
      sitemapResp = await fetch(sitemapUrl, { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'SEOGenerator-Crawler/1.0' } });
    } catch {
      return Response.json({ error: 'Could not fetch sitemap.xml' }, { status: 502 });
    }
    if (!sitemapResp.ok) return Response.json({ error: `Sitemap returned ${sitemapResp.status}` }, { status: 502 });

    const sitemapText = await sitemapResp.text();
    const urls = [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m => m[1].trim()).slice(0, maxPages);
    if (urls.length === 0) return Response.json({ error: 'No URLs found in sitemap' }, { status: 404 });

    // ── CRAWL EACH PAGE ──
    const pageResults = [];
    let totalIssues = 0;
    let totalScore = 0;

    for (const pageUrl of urls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const resp = await fetch(pageUrl, { headers: { 'User-Agent': 'SEOGenerator-Crawler/1.0' }, redirect: 'follow', signal: controller.signal });
        clearTimeout(timeout);

        const html = await resp.text();
        const hasTitle = /<title[^>]*>[^<]+<\/title>/i.test(html);
        const hasMetaDesc = /<meta[^>]+name=["']description["']/i.test(html);
        const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
        const hasH1 = /<h1[^>]*>[^<]+<\/h1>/i.test(html);
        const hasJsonLd = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
        const wordCount = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
        const imgsNoAlt = (html.match(/<img(?![^>]*\salt=)[^>]*src=/gi) || []).length;

        const issues = [];
        if (!hasTitle) issues.push('missing_title');
        if (!hasMetaDesc) issues.push('missing_meta_desc');
        if (!hasCanonical) issues.push('missing_canonical');
        if (!hasH1) issues.push('missing_h1');
        if (!hasJsonLd) issues.push('missing_schema');
        if (wordCount < 300) issues.push('thin_content');
        if (imgsNoAlt > 0) issues.push(`images_no_alt:${imgsNoAlt}`);

        const score = Math.max(0, 100 - issues.length * 12);
        totalIssues += issues.length;
        totalScore += score;

        pageResults.push({ url: pageUrl, status: resp.status, score, issues, wordCount });
      } catch (e) {
        pageResults.push({ url: pageUrl, status: 0, score: 0, issues: ['fetch_failed'], wordCount: 0 });
        totalIssues += 1;
      }
    }

    const avgScore = Math.round(totalScore / pageResults.length);
    const topIssues = {};
    for (const p of pageResults) {
      for (const i of p.issues) {
        const key = i.split(':')[0];
        topIssues[key] = (topIssues[key] || 0) + 1;
      }
    }

    // Log
    await svc.entities.Receipt.create({
      type: 'seo_crawl',
      url: `https://${domain}`,
      summary: `SEO crawl: ${pageResults.length} pages, avg score ${avgScore}/100, ${totalIssues} total issues`,
      details: JSON.stringify({ pagesCrawled: pageResults.length, avgScore, topIssues }),
      provenance: 'MEASURED',
      occurred_at: new Date().toISOString(),
    }).catch(() => {});

    return Response.json({
      ok: true,
      domain,
      pagesCrawled: pageResults.length,
      avgScore,
      totalIssues,
      topIssues: Object.entries(topIssues).sort((a, b) => b[1] - a[1]),
      pageResults: pageResults.sort((a, b) => a.score - b.score),
      crawledAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}