// Pulls every URL Google Search Console knows about (across all authorized properties),
// classifies each one against the pillar/cluster + funnel + intent taxonomy,
// and upserts workbook rows. Idempotent on property|url.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { gscHeaders, listSites, searchAnalytics } from '../../shared/gsc.js';
import { classifyUrl, classifyBrand, domainFromProperty } from '../../shared/urlTaxonomy.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const svc = base44.asServiceRole;
    const headers = await gscHeaders(base44);
    const sites = await listSites(headers);

    const clients = await svc.entities.Client.list(undefined, 200);
    const clientByDomain = {};
    for (const c of clients) if (c.domain) clientByDomain[c.domain.toLowerCase()] = c;

    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10);
    const now = new Date().toISOString();

    // Existing rows for idempotent upsert
    const existing = await svc.entities.UrlInventory.list(undefined, 5000);
    const byKey = {};
    for (const r of existing) if (r.row_key) byKey[r.row_key] = r;

    const summary = [];
    for (const site of sites) {
      const property = site.url;
      const domain = domainFromProperty(property);
      const client = clientByDomain[domain.toLowerCase()] || null;
      const brand = classifyBrand(domain);
      const ownership = client && client.status === 'shadow' ? 'analysis_only' : 'owned';

      let pageRows = [];
      let topQueryByPage = {};
      let error = null;
      try {
        pageRows = await searchAnalytics(headers, property, {
          startDate: start, endDate: end, dimensions: ['page'], dataState: 'all'
        });
        // Top query per page (best-effort, capped)
        const pq = await searchAnalytics(headers, property, {
          startDate: start, endDate: end, dimensions: ['page', 'query'], dataState: 'all'
        });
        for (const row of pq) {
          const [page, query] = row.keys;
          const cur = topQueryByPage[page];
          if (!cur || row.clicks > cur.clicks || (row.clicks === cur.clicks && row.impressions > cur.impressions)) {
            topQueryByPage[page] = { query, clicks: row.clicks, impressions: row.impressions };
          }
        }
      } catch (e) {
        error = e.message;
      }

      const creates = [];
      const updates = [];
      for (const row of pageRows) {
        const url = row.keys[0];
        const rowKey = `${property}|${url}`;
        const tax = classifyUrl(url);
        const data = {
          client_id: client ? client.id : null,
          row_key: rowKey,
          gsc_property: property,
          url,
          domain,
          brand,
          ownership,
          industry: 'Epoxy Coatings & Flooring',
          sub_industry: tax.sub_industry,
          page_type: tax.page_type,
          topic_cluster: tax.topic_cluster,
          funnel_stage: tax.funnel_stage,
          search_intent: tax.search_intent,
          clicks_28d: row.clicks || 0,
          impressions_28d: row.impressions || 0,
          ctr_28d: row.ctr ? Math.round(row.ctr * 1000) / 10 : 0,
          avg_position_28d: row.position ? Math.round(row.position * 10) / 10 : null,
          top_query: topQueryByPage[url]?.query || '',
          provenance: 'MEASURED_GSC',
          last_synced_at: now
        };
        const prev = byKey[rowKey];
        if (prev) {
          // Preserve operator-owned fields on update
          delete data.sub_industry; delete data.page_type; delete data.topic_cluster;
          delete data.funnel_stage; delete data.search_intent;
          updates.push({ id: prev.id, ...data });
        } else {
          creates.push(data);
        }
      }

      for (let i = 0; i < creates.length; i += 200) {
        await svc.entities.UrlInventory.bulkCreate(creates.slice(i, i + 200));
      }
      for (let i = 0; i < updates.length; i += 200) {
        await svc.entities.UrlInventory.bulkUpdate(updates.slice(i, i + 200));
      }

      summary.push({ property, domain, urls: pageRows.length, created: creates.length, updated: updates.length, error });
    }

    const totalUrls = summary.reduce((a, s) => a + s.urls, 0);
    await svc.entities.Receipt.create({
      kind: 'ingestion',
      summary: `URL inventory sync: ${totalUrls} URLs across ${sites.length} GSC properties`,
      detail: JSON.stringify(summary),
      source: 'google_search_console',
      provenance: 'MEASURED',
      occurred_at: now
    });

    return Response.json({ ok: true, properties: summary, total_urls: totalUrls });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}