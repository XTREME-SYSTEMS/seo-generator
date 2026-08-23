import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

const BROWSERLESS_BASE = 'https://production-sfo.browserless.io';

function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function domainsMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.endsWith('.' + b) || b.endsWith('.' + a)) return true;
  return false;
}

function parseGoogleSerp(html) {
  // Google wraps organic result URLs in /url?q= redirects.
  // Extract all of them in order — position = order of appearance.
  const urlPattern = /\/url\?q=(https?:\/\/[^&"<>]+)/g;
  const results = [];
  const seen = new Set();
  let match;
  while ((match = urlPattern.exec(html)) !== null) {
    let url;
    try { url = decodeURIComponent(match[1]); } catch { url = match[1]; }
    const domain = extractDomain(url);
    if (!domain || domain.includes('google.')) continue;
    if (seen.has(domain)) continue;
    seen.add(domain);
    results.push({ url, domain, position: results.length + 1 });
  }
  return results;
}

function detectAiOverview(html) {
  // Google AI Overviews render in containers with specific markers.
  // Check for common signals without being too fragile.
  const markers = ['id="overview"', 'data-async-trigger="overview"', 'class="LGOjhe"', 'aria-level="2"'];
  return markers.some(m => html.includes(m));
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Allow admin UI calls AND trusted workflow calls (no user token).
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { client_id, query, queries } = body;

    if (!client_id) return Response.json({ error: 'client_id required' }, { status: 400 });
    const queryList = queries || (query ? [query] : []);
    if (queryList.length === 0) return Response.json({ error: 'query or queries required' }, { status: 400 });

    // Cap batch to stay within function timeout — workflow calls repeatedly for more.
    const batch = queryList.slice(0, 10);

    const client = await base44.asServiceRole.entities.Client.get(client_id);
    if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });
    if (!client.domain) return Response.json({ error: 'Client has no domain set' }, { status: 400 });

    const clientDomain = extractDomain(client.domain) || client.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();

    const apiKey = secrets.get('BROWSERLESS_API_KEY');
    if (!apiKey) return Response.json({ error: 'BROWSERLESS_API_KEY not set' }, { status: 500 });

    const now = new Date().toISOString();
    const results = [];
    let measured = 0;
    let errors = 0;

    for (const q of batch) {
      try {
        const serpUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}&num=100&gl=us&hl=en`;

        const contentRes = await fetch(`${BROWSERLESS_BASE}/content?token=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: serpUrl,
            gotoOptions: { waitUntil: 'domcontentloaded', timeout: 25000 },
            rejectResourceTypes: ['image', 'media', 'font'],
            rejectRequestPattern: ['doubleclick.net', 'googlesyndication', 'googleadservices', 'google-analytics'],
          })
        });

        if (!contentRes.ok) {
          const errText = await contentRes.text().catch(() => '');
          errors++;
          results.push({ query: q, error: `Browserless ${contentRes.status}: ${errText.slice(0, 150)}` });
          continue;
        }

        const html = await contentRes.text();

        // Check for captcha / block
        if (html.includes('unusual traffic') || html.includes('captcha')) {
          errors++;
          results.push({ query: q, error: 'Google captcha/block detected', rank: null });
          continue;
        }

        const organic = parseGoogleSerp(html);
        const aiOverview = detectAiOverview(html);

        // Find client's position
        const clientHit = organic.find(r => domainsMatch(r.domain, clientDomain));
        const rank = clientHit ? clientHit.position : null;

        // Store measurement
        await base44.asServiceRole.entities.SerpMeasurement.create({
          client_id,
          query: q,
          measured_at: now,
          source: 'cloudbrowser_control',
          provenance: 'MEASURED',
          rank: rank || 0,
          url: clientHit ? clientHit.url : '',
          features: aiOverview ? ['ai_overview', ...organic.slice(0, 10).map(r => r.domain)] : organic.slice(0, 10).map(r => r.domain),
        });

        // Update opportunity measured_rank if exists
        const opps = await base44.asServiceRole.entities.Opportunity.filter({ client_id, query: q }, '-updated_date', 1);
        if (opps.length > 0) {
          await base44.asServiceRole.entities.Opportunity.update(opps[0].id, {
            measured_rank: rank || 0,
            rank_provenance: 'MEASURED'
          });
        }

        measured++;
        results.push({
          query: q,
          rank,
          organicCount: organic.length,
          aiOverview,
          topResults: organic.slice(0, 5).map(r => r.domain)
        });

        // Rate limit between requests to avoid Google blocks
        if (batch.length > 1) {
          await new Promise(r => setTimeout(r, 1200));
        }
      } catch (err) {
        errors++;
        results.push({ query: q, error: err.message });
      }
    }

    // Log receipt
    await base44.asServiceRole.entities.Receipt.create({
      client_id,
      kind: 'measurement',
      summary: `Cloud browser SERP measurement: ${measured}/${batch.length} queries measured`,
      detail: JSON.stringify(results.map(r => ({ query: r.query, rank: r.rank, error: r.error }))),
      source: 'cloudbrowser_control',
      provenance: 'MEASURED',
      occurred_at: now,
    });

    await base44.asServiceRole.entities.RunTelemetry.create({
      run_type: 'serp_measurement',
      subsystem: 'search',
      status: measured > 0 ? 'ok' : 'failed',
      started_at: now,
      records_written: measured,
      message: `${measured}/${batch.length} measured, ${errors} errors`
    });

    return Response.json({
      success: true,
      client: client.name,
      domain: clientDomain,
      measured,
      errors,
      total: batch.length,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}