import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// CloudBrowser MCP gateway — verified working endpoint
const MCP_URL = 'https://cloud-browser.base44.app/api/functions/mcpTools';

// Domains to exclude from organic result parsing
const NOISE_DOMAINS = new Set([
  'google.com', 'googleapis.com', 'gstatic.com', 'googleadservices.com',
  'googlesyndication.com', 'google-analytics.com', 'doubleclick.net',
  'youtube.com', 'gmpg.org', 'w3.org', 'schema.org', 'bing.com',
  'webmasterworld.com', 'support.google.com', 'policies.google.com',
  'maps.google.com', 'accounts.google.com', 'play.google.com',
]);

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

// Parse text content of a Google SERP to find organic result domains in order
function parseGoogleSerpText(text) {
  // Match domain-like patterns: "example.com", "www.example.com", "sub.example.co.uk"
  // Google SERP text shows visible URLs like "www.example.com" or "example.com/path"
  const domainPattern = /(?:https?:\/\/)?(?:www\.)?([a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,})/gi;
  const results = [];
  const seen = new Set();
  let match;
  while ((match = domainPattern.exec(text)) !== null) {
    let domain = match[1].toLowerCase();
    // Extract the main domain (last two parts for most TLDs)
    const parts = domain.split('.');
    // Handle common multi-part TLDs
    if (parts.length >= 3 && ['co', 'com', 'org', 'net'].includes(parts[parts.length - 2])) {
      domain = parts.slice(-3).join('.');
    } else if (parts.length >= 2) {
      domain = parts.slice(-2).join('.');
    }
    // Skip noise domains
    if (NOISE_DOMAINS.has(domain)) continue;
    if (domain.includes('google.')) continue;
    if (seen.has(domain)) continue;
    seen.add(domain);
    results.push({ domain, position: results.length + 1 });
  }
  return results;
}

function detectAiOverviewText(text) {
  const markers = ['AI Overview', 'AI-generated', 'Generated with AI', 'Overview'];
  return markers.some(m => text.includes(m));
}

async function callMcp(apiKey, tool, params) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ tool, params }),
  });
  return res;
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

    const apiKey = secrets.get('CLOUDBROWSER_API_KEY');
    if (!apiKey) return Response.json({ error: 'CLOUDBROWSER_API_KEY not set' }, { status: 500 });

    const now = new Date().toISOString();
    const results = [];
    let measured = 0;
    let errors = 0;

    // Start a single browser session for the entire batch
    let sessionId = null;
    try {
      const startRes = await callMcp(apiKey, 'browser_start', {});
      if (!startRes.ok) {
        const errText = await startRes.text().catch(() => '');
        return Response.json({ error: `CloudBrowser start failed: ${startRes.status} ${errText.slice(0, 100)}` }, { status: 500 });
      }
      const startData = await startRes.json();
      sessionId = startData.session_id;
      if (!sessionId) {
        return Response.json({ error: 'CloudBrowser returned no session_id' }, { status: 500 });
      }
    } catch (err) {
      return Response.json({ error: `CloudBrowser connection failed: ${err.message}` }, { status: 500 });
    }

    for (const q of batch) {
      try {
        const serpUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}&num=100&gl=us&hl=en`;

        // Navigate to the SERP
        const navRes = await callMcp(apiKey, 'browser_navigate', { session_id: sessionId, url: serpUrl });

        if (!navRes.ok) {
          errors++;
          results.push({ query: q, error: `Navigate failed: ${navRes.status}` });
          continue;
        }

        const navData = await navRes.json();

        // Check for Google captcha/block — Google redirects to /sorry/
        if (navData.url?.includes('/sorry/') || navData.url?.includes('captcha')) {
          errors++;
          results.push({ query: q, error: 'Google captcha/block detected', rank: null });
          continue;
        }

        // Wait for page to fully render
        await new Promise(r => setTimeout(r, 2500));

        // Extract page text content
        const extractRes = await callMcp(apiKey, 'browser_extract', { session_id: sessionId, selector: 'body' });

        if (!extractRes.ok) {
          errors++;
          results.push({ query: q, error: `Extract failed: ${extractRes.status}` });
          continue;
        }

        const extractData = await extractRes.json();
        const text = extractData.data || '';

        if (!text || text.length < 100) {
          errors++;
          results.push({ query: q, error: 'Empty page content' });
          continue;
        }

        // Check for captcha in text content
        if (text.includes('unusual traffic') || text.includes('captcha') || text.includes('detected unusual traffic')) {
          errors++;
          results.push({ query: q, error: 'Google captcha/block detected', rank: null });
          continue;
        }

        // Parse the text content for organic results
        const organic = parseGoogleSerpText(text);
        const aiOverview = detectAiOverviewText(text);

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
          url: clientHit ? `https://${clientHit.domain}` : '',
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
          await new Promise(r => setTimeout(r, 1500));
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
      summary: `CloudBrowser SERP measurement: ${measured}/${batch.length} queries measured`,
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