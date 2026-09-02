import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// CloudBrowser Control — MCP tools surface (see SEO_GENERATOR_HANDOFF.md).
// Flow per query: browser_navigate -> (captcha auto-solve + re-navigate) -> browser_act:evaluate (DOM) -> exact rank.
const DEFAULT_MCP_URL = 'https://cloud-browser.base44.app/api/functions/mcpTools';

// Runs inside the Google results page. Returns organic results in DOM order with real hrefs.
const EXTRACT_ORGANIC_JS = `() => {
  const out = [];
  const seen = new Set();
  const nodes = document.querySelectorAll('#search a[href], #rso a[href]');
  for (const a of nodes) {
    const href = a.href;
    if (!href || !href.startsWith('http') || seen.has(href)) continue;
    let host = '';
    try { host = new URL(href).hostname.toLowerCase(); } catch { continue; }
    if (host.endsWith('google.com') || host.endsWith('gstatic.com') || host.endsWith('googleusercontent.com')) continue;
    if (!a.querySelector('h3') && !a.closest('.g, .tF2Cxc, [data-sokoban-container]')) continue;
    seen.add(href);
    const title = (a.querySelector('h3')?.textContent || a.textContent || '').trim().slice(0, 160);
    out.push({ position: out.length + 1, url: href, domain: host.replace(/^www\\./, ''), title });
    if (out.length >= 100) break;
  }
  const aio = document.querySelector('[data-attrid="AIOverview"], .LGOjhe, .IZ6rId, .zXz7ue');
  return JSON.stringify({ organic: out, ai_overview: !!aio });
}`;

function extractDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
}

function domainsMatch(a, b) {
  if (!a || !b) return false;
  return a === b || a.endsWith('.' + b) || b.endsWith('.' + a);
}

async function mcp(url, apiKey, tool, params) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ tool, params }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${tool} ${res.status}: ${(data.error || '').toString().slice(0, 140)}`);
  return data;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // Allow admin UI calls AND trusted workflow calls (no user token).
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { client_id, query, queries } = body;
    if (!client_id) return Response.json({ error: 'client_id required' }, { status: 400 });
    const queryList = queries || (query ? [query] : []);
    if (!queryList.length) return Response.json({ error: 'query or queries required' }, { status: 400 });
    const batch = queryList.slice(0, 10);

    const svc = base44.asServiceRole;
    const client = await svc.entities.Client.get(client_id);
    if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });
    if (!client.domain) return Response.json({ error: 'Client has no domain set' }, { status: 400 });
    const clientDomain = extractDomain(client.domain) || client.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();

    const apiKey = secrets.get('CLOUDBROWSER_API_KEY');
    if (!apiKey) return Response.json({ error: 'CLOUDBROWSER_API_KEY not set' }, { status: 500 });
    // CLOUDBROWSER_MCP_URL secret currently points at a dead preview-sandbox host; use the published app.
    const mcpUrl = DEFAULT_MCP_URL;

    const now = new Date().toISOString();
    const results = [];
    let measured = 0;
    let errors = 0;

    const start = await mcp(mcpUrl, apiKey, 'browser_start', {
      captcha_solver: true,
      use_pool: false,
      viewport: { width: 1920, height: 1080 },
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const sessionId = start.session_id;
    if (!sessionId) return Response.json({ error: 'CloudBrowser returned no session_id' }, { status: 500 });

    try {
      for (const q of batch) {
        try {
          const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}&num=100&gl=us&hl=en`;
          let nav = await mcp(mcpUrl, apiKey, 'browser_navigate', { session_id: sessionId, url: googleUrl, timeout: 120000 });

          let captchaSolved = false;
          if (nav.captcha?.detected) {
            if (!nav.captcha.solved) throw new Error('reCAPTCHA detected but not solved');
            captchaSolved = true;
            // Solve redirects to google.com/ with a cleared cookie — re-request the SERP.
            nav = await mcp(mcpUrl, apiKey, 'browser_navigate', { session_id: sessionId, url: googleUrl, timeout: 60000 });
            if (nav.captcha?.detected && !nav.captcha.solved) throw new Error('reCAPTCHA on re-navigation not solved');
          }
          if ((nav.url || '').includes('/sorry/')) throw new Error('Google served the block page');

          await new Promise((r) => setTimeout(r, 1500));
          const act = await mcp(mcpUrl, apiKey, 'browser_act', { session_id: sessionId, action_type: 'evaluate', value: EXTRACT_ORGANIC_JS, options: { fn: EXTRACT_ORGANIC_JS } });
          const raw = act.result?.data ?? act.result?.result ?? act.result;
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          const organic = parsed?.organic || [];
          if (!organic.length) throw new Error('No organic results found in DOM');

          const hit = organic.find((r) => domainsMatch(r.domain, clientDomain));
          const rank = hit ? hit.position : null;

          await svc.entities.SerpMeasurement.create({
            client_id,
            query: q,
            measured_at: now,
            source: 'cloudbrowser_control',
            provenance: 'MEASURED',
            rank: rank || 0,
            url: hit ? hit.url : '',
            features: [
              ...(parsed.ai_overview ? ['ai_overview'] : []),
              ...(captchaSolved ? ['captcha_solved'] : []),
              ...organic.slice(0, 10).map((r) => r.domain),
            ],
          });

          const opps = await svc.entities.Opportunity.filter({ client_id, query: q }, '-updated_date', 1);
          if (opps.length) await svc.entities.Opportunity.update(opps[0].id, { measured_rank: rank || 0, rank_provenance: 'MEASURED' });

          measured++;
          results.push({ query: q, rank, matched_url: hit?.url || null, organicCount: organic.length, aiOverview: parsed.ai_overview, captchaSolved, topResults: organic.slice(0, 5).map((r) => r.domain) });

          if (batch.length > 1) await new Promise((r) => setTimeout(r, 1500));
        } catch (err) {
          errors++;
          results.push({ query: q, error: err.message });
        }
      }
    } finally {
      await mcp(mcpUrl, apiKey, 'browser_end', { session_id: sessionId }).catch(() => {});
    }

    await svc.entities.Receipt.create({
      client_id,
      kind: 'measurement',
      summary: `CloudBrowser SERP measurement: ${measured}/${batch.length} queries measured`,
      detail: JSON.stringify(results.map((r) => ({ query: r.query, rank: r.rank, url: r.matched_url, error: r.error }))),
      source: 'cloudbrowser_control',
      provenance: 'MEASURED',
      occurred_at: now,
    });

    await svc.entities.RunTelemetry.create({
      run_type: 'serp_measurement',
      subsystem: 'search',
      status: measured > 0 ? 'ok' : 'failed',
      started_at: now,
      records_written: measured,
      message: `${measured}/${batch.length} measured, ${errors} errors`,
    });

    return Response.json({ success: true, client: client.name, domain: clientDomain, measured, errors, total: batch.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}