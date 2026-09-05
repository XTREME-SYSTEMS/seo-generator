import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// GenerateSitemap — fetches a site's pages (via sitemap.xml or by crawling the
// homepage links) and generates a fresh sitemap.xml + robots.txt. Returns the
// XML content ready to deploy.
//
// Invoke: base44.functions.invoke('GenerateSitemap', { domain, maxUrls? })
// Returns: { ok, sitemapXml, robotsTxt, urlCount }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const domain = String(body.domain || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const maxUrls = Math.min(body.maxUrls || 200, 1000);
    if (!domain) return Response.json({ error: 'domain is required' }, { status: 400 });

    const baseUrl = `https://${domain}`;
    const discoveredUrls = new Set<string>();

    // Try existing sitemap first
    try {
      const resp = await fetch(`${baseUrl}/sitemap.xml`, { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'SEOGenerator-SitemapGen/1.0' } });
      if (resp.ok) {
        const text = await resp.text();
        const urls = [...text.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m => m[1].trim());
        for (const u of urls) discoveredUrls.add(u);
      }
    } catch { /* no sitemap */ }

    // If no sitemap, crawl homepage for links
    if (discoveredUrls.size === 0) {
      try {
        const resp = await fetch(baseUrl, { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'SEOGenerator-SitemapGen/1.0' }, redirect: 'follow' });
        const html = await resp.text();
        const parsed = new URL(resp.url || baseUrl);

        // Internal links
        const relativeLinks = [...html.matchAll(/href=["'](\/[^"']*)["']/gi)].map(m => m[1]);
        const absoluteLinks = [...html.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)].map(m => m[1]).filter(l => l.includes(parsed.hostname));

        for (const l of relativeLinks) {
          try {
            const full = new URL(l, parsed.origin).href;
            if (full.startsWith(parsed.origin)) discoveredUrls.add(full);
          } catch { /* skip */ }
        }
        for (const l of absoluteLinks) {
          try {
            const u = new URL(l);
            if (u.origin === parsed.origin) discoveredUrls.add(u.href);
          } catch { /* skip */ }
        }
      } catch (e) {
        return Response.json({ error: 'Could not fetch homepage: ' + (e?.message || 'unknown') }, { status: 502 });
      }
    }

    const urls = [...discoveredUrls].slice(0, maxUrls);
    if (urls.length === 0) return Response.json({ error: 'No URLs discovered' }, { status: 404 });

    // Generate sitemap.xml
    const now = new Date().toISOString().split('T')[0];
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

    // Generate robots.txt
    const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;

    // Log
    await svc.entities.Receipt.create({
      type: 'generate_sitemap',
      url: baseUrl,
      summary: `Generated sitemap with ${urls.length} URLs + robots.txt`,
      details: JSON.stringify({ domain, urlCount: urls.length }),
      provenance: 'MEASURED',
      occurred_at: new Date().toISOString(),
    }).catch(() => {});

    return Response.json({
      ok: true,
      domain,
      sitemapXml,
      robotsTxt,
      urlCount: urls.length,
      urls: urls.slice(0, 50),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}