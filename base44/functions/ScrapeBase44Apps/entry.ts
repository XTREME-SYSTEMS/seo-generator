import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// ScrapeBase44Apps — Lists all apps in the user's Base44 workspace via the Base44 API,
// extracts page names and discovered routes, optionally scrapes each published app's
// URL to find all internal links. Stores results in the Base44App entity.
//
// Invoke: base44.functions.invoke('ScrapeBase44Apps', { scrape_pages?: boolean })
//   - scrape_pages: if true (default), fetches each app's published URL and extracts internal links
//
// Requires: BASE44_API_KEY secret (personal access token, sent as Bearer)

const BASE44_API = 'https://app.base44.com/api';

async function listAllApps(apiKey: string): Promise<any[]> {
  const res = await fetch(`${BASE44_API}/apps`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Base44 API returned ${res.status}: ${text}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data.apps || data.items || data.data || []);
}

async function scrapeAppPages(publishedUrl: string): Promise<string[]> {
  try {
    const res = await fetch(publishedUrl, {
      headers: { 'User-Agent': 'SEOGenerator-Base44AppScraper/1.0' },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) return [];
    const html = await res.text();
    const baseUrl = new URL(publishedUrl);
    const origin = baseUrl.origin;

    const hrefMatches = html.match(/href=["']([^"']+)["']/gi) || [];
    const urls = new Set<string>();

    for (const match of hrefMatches) {
      const href = match.match(/href=["']([^"']+)["']/i)?.[1];
      if (!href) continue;
      if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      let fullUrl: string;
      if (href.startsWith('http')) {
        fullUrl = href;
      } else if (href.startsWith('/')) {
        fullUrl = `${origin}${href}`;
      } else {
        fullUrl = `${origin}/${href}`;
      }
      try {
        const parsed = new URL(fullUrl);
        if (parsed.origin === origin) {
          const clean = `${parsed.origin}${parsed.pathname}`.replace(/\/$/, '') || origin;
          urls.add(clean);
        }
      } catch { /* invalid URL, skip */ }
    }

    return Array.from(urls).sort();
  } catch {
    return [];
  }
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const scrapePages = body.scrape_pages !== false; // default true

    const apiKey = Deno.env.get('BASE44_API_KEY');
    if (!apiKey) return Response.json({ error: 'BASE44_API_KEY secret not set' }, { status: 500 });

    // 1. List all apps from Base44 API
    const apps = await listAllApps(apiKey);
    if (!apps.length) return Response.json({ message: 'No apps found in workspace', apps: 0 });

    // 2. Load existing Base44App records to deduplicate
    const existing = await svc.entities.Base44App.list('-created_date', 500);
    const existingMap = new Map(existing.map((a: any) => [a.app_id, a]));

    const toCreate: any[] = [];
    const toUpdate: any[] = [];
    const results: any[] = [];

    for (const app of apps) {
      const appId = app.id || app._id;
      const name = app.name || app.slug || 'Unnamed';
      const slug = app.slug || '';
      const publishedUrl = slug ? `https://${slug}.base44.app` : '';
      const status = app.status?.state || app.status || 'unknown';
      const description = app.user_description || '';
      const workspaceId = app.organization_id || '';
      const createdAtApi = app.created_date || '';
      const pageNames: string[] = Array.isArray(app.page_names) ? app.page_names : [];

      let pages: string[] = [];
      let scrapeStatus = 'not_scraped';
      let scrapeError = '';

      if (scrapePages && publishedUrl && !app.is_unpublished) {
        pages = await scrapeAppPages(publishedUrl);
        scrapeStatus = pages.length > 0 ? 'completed' : 'failed';
        if (pages.length === 0) scrapeError = 'No internal links found or fetch failed';
      } else if (app.is_unpublished) {
        scrapeStatus = 'not_scraped';
        scrapeError = 'App is unpublished';
      }

      // Merge page_names into pages if scraping didn't find them
      const allPages = [...new Set([...pages, ...pageNames.map(p => p.toLowerCase().replace(/\s+/g, '-'))])];

      const record: any = {
        app_id: appId,
        name,
        slug,
        published_url: publishedUrl,
        status,
        description,
        workspace_id: workspaceId,
        created_at_api: createdAtApi,
        pages: allPages,
        page_count: allPages.length,
        scrape_status: scrapeStatus,
        last_scraped_at: scrapePages ? new Date().toISOString() : undefined,
        scrape_error: scrapeError
      };

      const existingRec = existingMap.get(appId);
      if (existingRec) {
        toUpdate.push({ id: existingRec.id, ...record });
      } else {
        toCreate.push(record);
      }

      results.push({ name, slug, published_url: publishedUrl, page_count: allPages.length, status: scrapeStatus, unpublished: !!app.is_unpublished });
    }

    // 3. Bulk persist
    if (toCreate.length) await svc.entities.Base44App.bulkCreate(toCreate);
    if (toUpdate.length) await svc.entities.Base44App.bulkUpdate(toUpdate);

    // 4. Receipt
    await svc.entities.Receipt.create({
      summary: `Scraped ${apps.length} Base44 apps (${toCreate.length} new, ${toUpdate.length} updated), ${scrapePages ? 'with page scraping' : 'page names only'}`,
      source: 'ScrapeBase44Apps',
      occurred_at: new Date().toISOString(),
      proof_level: 1
    });

    return Response.json({
      ok: true,
      total_apps: apps.length,
      created: toCreate.length,
      updated: toUpdate.length,
      total_pages_discovered: results.reduce((s, r) => s + r.page_count, 0),
      results: results.slice(0, 20)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}