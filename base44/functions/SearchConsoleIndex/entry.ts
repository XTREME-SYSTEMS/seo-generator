import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list_sites';
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
    const h = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    if (action === 'list_sites') {
      const r = await fetch('https://www.googleapis.com/webmasters/v3/sites', { headers: h });
      const data = await r.json();
      if (!r.ok) return Response.json({ error: data.error?.message || 'GSC list_sites failed', status: r.status }, { status: r.status });
      return Response.json({ sites: (data.siteEntry || []).map((s) => ({ url: s.siteUrl, permission: s.permissionLevel })) });
    }

    if (action === 'inspect') {
      const { url, site_url } = body;
      if (!url || !site_url) return Response.json({ error: 'url and site_url required' }, { status: 400 });
      const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
        method: 'POST', headers: h,
        body: JSON.stringify({ inspectionUrl: url, siteUrl: site_url, languageCode: 'en-US' })
      });
      const data = await r.json();
      if (!r.ok) return Response.json({ error: data.error?.message || 'inspect failed', status: r.status }, { status: r.status });
      return Response.json({ inspection: data.inspectionResult || data });
    }

    if (action === 'submit_sitemap') {
      const { site_url, sitemap_url } = body;
      if (!site_url || !sitemap_url) return Response.json({ error: 'site_url and sitemap_url required' }, { status: 400 });
      const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site_url)}/sitemaps/${encodeURIComponent(sitemap_url)}`, {
        method: 'PUT', headers: h
      });
      const data = await r.json().catch(() => ({}));
      return Response.json({ ok: r.ok, status: r.status, message: r.ok ? 'Sitemap submitted — Google will fetch it shortly' : (data.error?.message || 'submit failed') });
    }

    if (action === 'search_analytics') {
      const { site_url, start_date, end_date, dimensions } = body;
      if (!site_url) return Response.json({ error: 'site_url required' }, { status: 400 });
      const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site_url)}/searchAnalytics/query`, {
        method: 'POST', headers: h,
        body: JSON.stringify({
          startDate: start_date, endDate: end_date,
          dimensions: dimensions || ['query'],
          rowLimit: 50
        })
      });
      const data = await r.json();
      if (!r.ok) return Response.json({ error: data.error?.message || 'search_analytics failed', status: r.status }, { status: r.status });
      return Response.json({ rows: data.rows || [] });
    }

    return Response.json({ error: `unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}