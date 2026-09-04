import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// SitemapIngestion — fetches a sitemap XML, parses all URLs, and adds new ones
// to the UrlInventory and UrlTarget entities. This is how the system autonomously
// discovers and ingests new URLs from any managed domain.
//
// Invoke: base44.functions.invoke('SitemapIngestion', { sitemap_url?, client_id?, domain? })
// If sitemap_url is omitted, tries https://<domain>/sitemap.xml
// Returns: { ok, sitemap_url, urls_found, urls_added, urls_skipped, errors }

function extractUrlsFromXml(xml: string): string[] {
  const urls: string[] = [];
  // Match both <loc> tags in standard sitemaps and <url><loc>...</loc></url> patterns
  const locRegex = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1].trim();
    if (url) urls.push(url);
  }
  return urls;
}

function getDomainFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return '';
  }
}

function inferPageType(url: string): string {
  const path = new URL(url).pathname.toLowerCase();
  if (path === '/' || path === '') return 'home';
  if (path.includes('/blog/') || path.includes('/resource/') || path.includes('/guide/')) return 'blog_resource';
  if (path.includes('/faq') || path.includes('/question')) return 'faq';
  if (path.includes('/about') || path.includes('/contact') || path.includes('/trust')) return 'about_trust';
  if (path.includes('/product/') || path.includes('/item/')) return 'product';
  if (path.includes('/category/') || path.includes('/collection/')) return 'category';
  if (path.includes('/service/') || path.includes('/services/')) return 'service';
  if (path.match(/\/[a-z]{2},\-[a-z]{2}\//) || path.match(/\/[a-z]+\/[a-z]+\/$/)) return 'location';
  if (path.includes('/legal') || path.includes('/privacy') || path.includes('/terms')) return 'legal';
  return 'other';
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const now = new Date().toISOString();

    let sitemapUrl = body.sitemap_url;
    const clientId = body.client_id || null;
    const domain = body.domain;

    if (!sitemapUrl && domain) {
      sitemapUrl = `https://${domain.replace(/^https?:\/\//, '')}/sitemap.xml`;
    }
    if (!sitemapUrl) {
      return Response.json({ error: 'Either sitemap_url or domain is required' }, { status: 400 });
    }

    console.log(`[SitemapIngestion] Fetching sitemap: ${sitemapUrl}`);

    // ── 1. FETCH THE SITEMAP XML ──
    const sitemapRes = await fetch(sitemapUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEODominanceOS/1.0)' },
      redirect: 'follow',
    });
    if (!sitemapRes.ok) {
      return Response.json({ error: `Failed to fetch sitemap: ${sitemapRes.status} ${sitemapRes.statusText}` }, { status: 502 });
    }
    const xml = await sitemapRes.text();
    const urls = extractUrlsFromXml(xml);
    console.log(`[SitemapIngestion] Found ${urls.length} URLs in sitemap`);

    if (urls.length === 0) {
      return Response.json({ ok: true, sitemap_url: sitemapUrl, urls_found: 0, urls_added: 0, urls_skipped: 0, message: 'No URLs found in sitemap' });
    }

    // ── 2. CHECK EXISTING URLS ──
    const existingInventory = await svc.entities.UrlInventory.list('url', 500).catch(() => []);
    const existingUrls = new Set(existingInventory.map((r) => r.url));

    // ── 3. ADD NEW URLS ──
    const newUrls = urls.filter((u) => !existingUrls.has(u));
    const skipped = urls.length - newUrls.length;
    let added = 0;
    const errors = [];

    for (const url of newUrls.slice(0, 200)) { // cap at 200 per run
      try {
        const urlDomain = getDomainFromUrl(url);
        const rowKey = `${urlDomain}|${url}`;
        const pageType = inferPageType(url);

        await svc.entities.UrlInventory.create({
          client_id: clientId,
          row_key: rowKey,
          gsc_property: urlDomain ? `sc-domain:${urlDomain}` : null,
          url: url,
          domain: urlDomain,
          page_type: pageType,
          ownership: 'owned',
          provenance: 'MEASURED_GSC',
          last_synced_at: now,
        });

        await svc.entities.UrlTarget.create({
          client_id: clientId,
          url: url,
          domain: urlDomain,
          url_state: 'NEW_NO_HISTORY',
          index_state: 'UNOBSERVED',
          last_synced_at: now,
        });

        added++;
      } catch (e) {
        errors.push(`${url}: ${e.message}`);
      }
    }

    // ── 4. LOG ──
    await svc.entities.RunTelemetry.create({
      run_type: 'sitemap_ingestion',
      subsystem: 'measurement',
      status: errors.length === 0 ? 'ok' : 'degraded',
      started_at: now,
      records_written: added,
      message: `Sitemap ${sitemapUrl}: ${urls.length} found, ${added} added, ${skipped} skipped, ${errors.length} errors`,
    });

    await svc.entities.Receipt.create({
      kind: 'ingestion',
      summary: `SitemapIngestion: ${added} new URLs added from ${sitemapUrl}`,
      detail: JSON.stringify({
        sitemap_url: sitemapUrl,
        urls_found: urls.length,
        urls_added: added,
        urls_skipped: skipped,
        errors: errors.slice(0, 20),
      }, null, 2).slice(0, 8000),
      source: 'sitemap_ingestion',
      provenance: 'MEASURED',
      occurred_at: now,
    });

    console.log(`[SitemapIngestion] Done: ${added} added, ${skipped} skipped, ${errors.length} errors`);

    return Response.json({
      ok: true,
      sitemap_url: sitemapUrl,
      urls_found: urls.length,
      urls_added: added,
      urls_skipped: skipped,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}