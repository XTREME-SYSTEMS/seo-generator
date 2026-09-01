// Shared Google Search Console access layer.
// All GSC reads/writes in this app go through here so provenance and pagination stay correct.

const WM = 'https://www.googleapis.com/webmasters/v3';
const SC = 'https://searchconsole.googleapis.com/v1';

export async function gscHeaders(base44) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
  return { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
}

export async function listSites(headers) {
  const r = await fetch(`${WM}/sites`, { headers });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || 'GSC sites list failed');
  return (data.siteEntry || []).map((s) => ({ url: s.siteUrl, permission: s.permissionLevel }));
}

export async function inspectUrl(headers, siteUrl, inspectionUrl) {
  const r = await fetch(`${SC}/urlInspection/index:inspect`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ inspectionUrl, siteUrl, languageCode: 'en-US' })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || 'GSC URL inspection failed');
  return data.inspectionResult || {};
}

// Paginated Search Analytics query. Pulls every row, not the first page.
export async function searchAnalytics(headers, siteUrl, body) {
  const rows = [];
  const rowLimit = 25000;
  let startRow = 0;
  for (let page = 0; page < 40; page++) {
    const r = await fetch(`${WM}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...body, rowLimit, startRow })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || 'GSC search analytics failed');
    const batch = data.rows || [];
    rows.push(...batch);
    if (batch.length < rowLimit) break;
    startRow += rowLimit;
  }
  return rows;
}

// Finds the GSC property the connected account can actually read for a client domain.
export function propertyForDomain(sites, domain) {
  const d = String(domain || '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
  if (!d) return null;
  const readable = sites.filter((s) => s.permission && s.permission !== 'siteUnverifiedUser');
  return readable.find((s) => s.url === `sc-domain:${d}`)
    || readable.find((s) => normalize(s.url).replace(/^www\./, '') === d)
    || null;
}

// Measured page x query performance for the last N days. Returns Map<page, rows[]>
// where each row = { query, clicks, impressions, ctr, position } sorted by impressions desc.
export async function pageQueryMetrics(headers, siteUrl, days = 28) {
  const end = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10); // GSC lags ~2 days
  const start = new Date(Date.now() - (days + 2) * 86400000).toISOString().slice(0, 10);
  const rows = await searchAnalytics(headers, siteUrl, {
    startDate: start, endDate: end, dimensions: ['page', 'query'], dataState: 'all',
  });
  const byPage = new Map();
  for (const r of rows) {
    const [page, query] = r.keys;
    const list = byPage.get(page) || [];
    list.push({
      query,
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: r.position ? Math.round(r.position * 10) / 10 : null,
    });
    byPage.set(page, list);
  }
  for (const list of byPage.values()) list.sort((a, b) => b.impressions - a.impressions);
  return byPage;
}

export async function submitSitemap(headers, siteUrl, sitemapUrl) {
  const r = await fetch(
    `${WM}/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
    { method: 'PUT', headers }
  );
  return { ok: r.ok, status: r.status };
}

// Maps a GSC inspection result onto our index-state vocabulary. Never guesses.
export function readIndexState(inspection) {
  const idx = inspection.indexStatusResult || {};
  const verdict = idx.verdict;
  const coverage = (idx.coverageState || '').toLowerCase();

  let state = 'UNOBSERVED';
  if (verdict === 'PASS') state = 'INDEXED';
  else if (coverage.includes('noindex')) state = 'EXCLUDED_NOINDEX';
  else if (coverage.includes('robots')) state = 'EXCLUDED_ROBOTS';
  else if (coverage.includes('duplicate') || coverage.includes('alternate')) state = 'DUPLICATE_ALTERNATE';
  else if (coverage.includes('crawled')) state = 'CRAWLED_NOT_INDEXED';
  else if (verdict === 'FAIL' || verdict === 'NEUTRAL') state = 'NOT_INDEXED';

  const googleCanonical = idx.googleCanonical || '';
  const declaredCanonical = idx.userCanonical || '';

  return {
    index_state: state,
    coverage_state: idx.coverageState || '',
    verdict: verdict || 'UNOBSERVED',
    google_canonical: googleCanonical,
    declared_canonical: declaredCanonical,
    canonical_agrees: Boolean(googleCanonical && declaredCanonical && normalize(googleCanonical) === normalize(declaredCanonical)),
    last_crawl_at: idx.lastCrawlTime || null,
    robots_verdict: idx.robotsTxtState || '',
    sitemaps: idx.sitemap || [],
    referring_urls: idx.referringUrls || [],
    mobile_verdict: inspection.mobileUsabilityResult?.verdict || 'UNOBSERVED',
    rich_results_verdict: inspection.richResultsResult?.verdict || 'UNOBSERVED'
  };
}

export function normalize(u) {
  return String(u || '').replace(/\/+$/, '').replace(/^https?:\/\//, '').toLowerCase();
}

// Derives the URL-state from measured GSC evidence only. Modeled data never advances a state.
export function deriveUrlState(indexState, impressions, bestAvgPosition) {
  if (indexState !== 'INDEXED') {
    return indexState === 'UNOBSERVED' ? 'NEW_NO_HISTORY' : 'DISCOVERED_NOT_INDEXED';
  }
  if (!impressions) return 'INDEXED_NO_IMPRESSIONS';
  if (bestAvgPosition == null) return 'IMPRESSIONS_NO_VERIFIED_RANK';
  // GSC average position is used ONLY as a coarse band here, never as an exact rank claim.
  if (bestAvgPosition <= 3) return 'TOP3';
  if (bestAvgPosition <= 5) return 'TOP5';
  if (bestAvgPosition <= 10) return 'PAGE_ONE_6_10';
  if (bestAvgPosition <= 20) return 'STRIKING_DISTANCE_11_20';
  if (bestAvgPosition <= 30) return 'TOP30';
  if (bestAvgPosition <= 50) return 'TOP50';
  if (bestAvgPosition <= 100) return 'TOP100';
  return 'IMPRESSIONS_NO_VERIFIED_RANK';
}