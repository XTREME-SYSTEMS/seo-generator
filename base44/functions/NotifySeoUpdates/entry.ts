import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// NotifySeoUpdates — detects recently updated SeoContent (title/description changes)
// in the epoxyquotenearme.com app and notifies Google via IndexNow + GSC sitemap resubmission.
//
// Invoke: base44.functions.invoke('NotifySeoUpdates', { hours_back?, host?, dry_run? })
// Returns: { checked, updated, pinged, gsc_submitted, details }

const EPOXY_APP_ID = '6a77f4491f0bf92de9a3ed8b';
const EPOXY_HOST = 'epoxyquotenearme.com';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const hoursBack = body.hours_back || 1;
    const host = body.host || EPOXY_HOST;
    const dryRun = body.dry_run || false;

    const apiKey = process.env.EPOXYQUOTENEARYOU_API_KEY;
    if (!apiKey) return Response.json({ error: 'EPOXYQUOTENEARYOU_API_KEY not set' }, { status: 500 });

    // 1. Fetch recently updated SeoContent records from epoxyquotenearme.com
    const since = new Date(Date.now() - hoursBack * 3600 * 1000).toISOString();
    let allUpdated = [];
    let offset = 0;
    while (true) {
      const res = await fetch(
        `https://base44.app/api/apps/${EPOXY_APP_ID}/entities/SeoContent?limit=200&skip=${offset}&fields=id,route,title,description,updated_date`,
        { headers: { 'Authorization': `Bearer ${apiKey}` } }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return Response.json({ error: 'Failed to fetch SeoContent', detail: err }, { status: 502 });
      }
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.items || []);
      if (items.length === 0) break;
      const recent = items.filter(r => r.updated_date && new Date(r.updated_date) >= new Date(since));
      allUpdated.push(...recent);
      offset += items.length;
      if (items.length < 200) break;
    }

    if (allUpdated.length === 0) {
      return Response.json({
        checked: offset,
        updated: 0,
        pinged: 0,
        gsc_submitted: false,
        message: `No SeoContent updates in the last ${hoursBack} hour(s)`,
        since,
      });
    }

    // 2. Build full URLs for IndexNow ping
    const urls = allUpdated.map(r => `https://${host}${r.route}`);

    // 3. Ping IndexNow (instant indexing for Bing/Yandex/etc; Google via sitemap)
    let indexNowResult = null;
    if (!dryRun && urls.length > 0) {
      const key = Array.from({ length: 16 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
      const keyLocation = `https://${host}/${key}.txt`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const resp = await fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host, key, key_location: keyLocation, url_list: urls.slice(0, 10000) }),
          signal: controller.signal,
        });
        indexNowResult = { status: resp.status, ok: resp.ok };
        clearTimeout(timeout);
      } catch (e) {
        indexNowResult = { error: e?.message || 'IndexNow ping failed' };
        clearTimeout(timeout);
      }
    }

    // 4. Submit sitemap to GSC for recrawl (Google doesn't support IndexNow, uses sitemap)
    let gscResult = null;
    if (!dryRun) {
      try {
        const { accessToken } = await svc.connectors.getConnection('google_search_console');
        // Submit sitemap for the epoxyquotenearme.com property
        const siteUrl = `sc-domain:${host}`;
        const sitemapUrl = `https://${host}/sitemap.xml`;
        const gscRes = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
          { method: 'PUT', headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        gscResult = { status: gscRes.status, ok: gscRes.ok, site: siteUrl, sitemap: sitemapUrl };
      } catch (e) {
        gscResult = { error: e?.message || 'GSC sitemap submission failed' };
      }
    }

    // 5. Log a Receipt for provenance
    if (!dryRun) {
      await svc.entities.Receipt.create({
        type: 'seo_update_notification',
        url: `https://${host}`,
        summary: `Notified Google of ${allUpdated.length} SeoContent update(s) — IndexNow ${indexNowResult?.status || 'N/A'}, GSC ${gscResult?.status || 'N/A'}`,
        details: JSON.stringify({
          host,
          hoursBack,
          updatedRoutes: allUpdated.map(r => r.route),
          indexNow: indexNowResult,
          gsc: gscResult,
        }),
        provenance: 'MEASURED',
        occurred_at: new Date().toISOString(),
      }).catch(() => {});
    }

    return Response.json({
      checked: offset,
      updated: allUpdated.length,
      pinged: urls.length,
      indexNow: indexNowResult,
      gsc_submitted: gscResult,
      updated_routes: allUpdated.map(r => ({ route: r.route, title: r.title, updated: r.updated_date })),
      since,
      dry_run: dryRun,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}