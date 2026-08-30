import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { gscHeaders, listSites, inspectUrl, searchAnalytics, readIndexState, deriveUrlState, normalize } from '../../shared/gsc.js';

// Persistent, auditable 24/7 Search Console sync.
// actions: list_sites | register_urls | sync (default) | sync_one
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'sync';
    const svc = base44.asServiceRole;
    const headers = await gscHeaders(base44);

    if (action === 'list_sites') {
      return Response.json({ sites: await listSites(headers) });
    }

    // Register a batch of URLs against a GSC property.
    if (action === 'register_urls') {
      const { gsc_property, urls, client_id, target_queries } = body;
      if (!gsc_property || !Array.isArray(urls) || urls.length === 0) {
        return Response.json({ error: 'gsc_property and urls[] required' }, { status: 400 });
      }
      const existing = await svc.entities.UrlTarget.filter({ gsc_property });
      const known = new Set(existing.map((u) => normalize(u.url)));
      const nowIso = new Date().toISOString();
      const fresh = urls
        .map((u) => String(u).trim())
        .filter((u) => u && !known.has(normalize(u)))
        .map((u) => ({
          client_id: client_id || null,
          url: u,
          domain: safeHost(u),
          gsc_property,
          url_state: 'NEW_NO_HISTORY',
          index_state: 'UNOBSERVED',
          target_queries: Array.isArray(target_queries) ? target_queries : [],
          clock_started_at: nowIso
        }));
      if (fresh.length) await svc.entities.UrlTarget.bulkCreate(fresh);
      return Response.json({ registered: fresh.length, skipped_existing: urls.length - fresh.length });
    }

    // Sync — the repeatable, auditable loop.
    const targets = action === 'sync_one'
      ? await svc.entities.UrlTarget.filter({ id: body.url_target_id })
      : await svc.entities.UrlTarget.list('-created_date', body.limit || 25);

    if (targets.length === 0) return Response.json({ synced: 0, message: 'No URLs registered yet' });

    const properties = [...new Set(targets.map((t) => t.gsc_property).filter(Boolean))];
    const startedAt = Date.now();
    const nowIso = new Date().toISOString();

    // Pull hourly page+query rows per property once, then fan out to targets.
    const rowsByProperty = {};
    for (const property of properties) {
      const { startDate, endDate } = hourlyWindow(body.days || 2);
      try {
        rowsByProperty[property] = await searchAnalytics(headers, property, {
          startDate,
          endDate,
          dataState: 'HOURLY_ALL',
          dimensions: ['HOUR', 'PAGE', 'QUERY']
        });
      } catch (e) {
        rowsByProperty[property] = [];
        await svc.entities.RunTelemetry.create({
          run_type: 'gsc_ingest', subsystem: 'search', status: 'degraded',
          started_at: nowIso, message: `${property}: ${e.message}`
        });
      }
    }

    const metricRows = [];
    const results = [];

    for (const t of targets) {
      const rows = rowsByProperty[t.gsc_property] || [];
      const mine = rows.filter((r) => normalize(r.keys?.[1]) === normalize(t.url));

      let impressions = 0;
      let clicks = 0;
      let bestAvgPosition = null;
      let earliestImpressionHour = null;

      for (const r of mine) {
        const [hour, page, query] = r.keys;
        impressions += r.impressions || 0;
        clicks += r.clicks || 0;
        if (r.impressions > 0) {
          if (r.position != null && (bestAvgPosition == null || r.position < bestAvgPosition)) bestAvgPosition = r.position;
          if (!earliestImpressionHour || hour < earliestImpressionHour) earliestImpressionHour = hour;
        }
        metricRows.push({
          client_id: t.client_id || null,
          gsc_property: t.gsc_property,
          url: page,
          query,
          hour,
          clicks: r.clicks || 0,
          impressions: r.impressions || 0,
          ctr: r.ctr || 0,
          avg_position: r.position != null ? r.position : null,
          data_state: 'HOURLY_ALL',
          is_partial: true,
          provenance: 'MEASURED_GSC',
          ingested_at: nowIso,
          row_key: `${t.gsc_property}|${normalize(page)}|${query}|${hour}`
        });
      }

      // URL Inspection — the retrieval-gate truth.
      let inspected = null;
      try {
        inspected = readIndexState(await inspectUrl(headers, t.gsc_property, t.url));
      } catch (e) {
        inspected = null;
        results.push({ url: t.url, inspection_error: e.message });
      }

      const indexState = inspected ? inspected.index_state : t.index_state;
      const nextState = deriveUrlState(indexState, impressions, bestAvgPosition);

      const patch = {
        index_state: indexState,
        url_state: advanceOnly(t.url_state, nextState),
        last_synced_at: nowIso
      };
      if (inspected) {
        patch.google_canonical = inspected.google_canonical;
        patch.declared_canonical = inspected.declared_canonical;
        patch.canonical_agrees = inspected.canonical_agrees;
        if (inspected.last_crawl_at) patch.last_crawl_at = inspected.last_crawl_at;
      }
      // Milestone clocks — written once, never overwritten, measured evidence only.
      if (indexState === 'INDEXED' && !t.first_index_at) patch.first_index_at = nowIso;
      if (impressions > 0 && !t.first_impression_at) patch.first_impression_at = earliestImpressionHour || nowIso;
      stampMilestone(patch, t, patch.url_state, nowIso);
      if (!t.clock_started_at) patch.clock_started_at = nowIso;

      await svc.entities.UrlTarget.update(t.id, patch);

      results.push({
        url: t.url,
        index_state: indexState,
        url_state: patch.url_state,
        canonical_agrees: inspected ? inspected.canonical_agrees : null,
        impressions,
        clicks,
        best_avg_position: bestAvgPosition,
        hourly_rows: mine.length
      });
    }

    // Idempotent hourly-metric write: skip rows already stored.
    let written = 0;
    if (metricRows.length) {
      const keys = new Set();
      const deduped = metricRows.filter((m) => {
        if (keys.has(m.row_key)) return false;
        keys.add(m.row_key);
        return true;
      });
      const existingKeys = new Set(
        (await svc.entities.HourlySearchMetric.list('-hour', 5000)).map((m) => m.row_key)
      );
      const toWrite = deduped.filter((m) => !existingKeys.has(m.row_key));
      for (let i = 0; i < toWrite.length; i += 400) {
        await svc.entities.HourlySearchMetric.bulkCreate(toWrite.slice(i, i + 400));
      }
      written = toWrite.length;
    }

    await svc.entities.RunTelemetry.create({
      run_type: 'gsc_ingest', subsystem: 'search', status: 'ok',
      started_at: nowIso, duration_ms: Date.now() - startedAt, records_written: written,
      message: `Synced ${targets.length} URLs across ${properties.length} properties`
    });
    await svc.entities.Receipt.create({
      kind: 'ingestion',
      summary: `GSC sync — ${targets.length} URLs, ${written} hourly rows`,
      detail: JSON.stringify(results).slice(0, 4000),
      source: 'google_search_console',
      provenance: 'MEASURED',
      occurred_at: nowIso
    });

    return Response.json({ synced: targets.length, hourly_rows_written: written, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function safeHost(u) {
  try { return new URL(u).hostname; } catch (_) { return ''; }
}

function hourlyWindow(days) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 3600 * 1000);
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

const LADDER = [
  'NEW_NO_HISTORY', 'DISCOVERED_NOT_INDEXED', 'INDEXED_NO_IMPRESSIONS', 'IMPRESSIONS_NO_VERIFIED_RANK',
  'TOP100', 'TOP50', 'TOP30', 'STRIKING_DISTANCE_11_20', 'PAGE_ONE_6_10', 'TOP5', 'TOP3'
];

// Regressions are real and must be recorded, but a state is never invented from absent data.
function advanceOnly(current, next) {
  if (!next) return current;
  if (LADDER.indexOf(next) < 0) return current;
  return next;
}

function stampMilestone(patch, t, state, nowIso) {
  const field = {
    TOP100: 'top100_at', TOP50: 'top50_at', TOP30: 'top30_at',
    STRIKING_DISTANCE_11_20: 'striking_distance_at', PAGE_ONE_6_10: 'page_one_at',
    TOP5: 'top5_at', TOP3: 'top3_at'
  };
  const reached = LADDER.indexOf(state);
  for (const [s, f] of Object.entries(field)) {
    if (LADDER.indexOf(s) <= reached && !t[f]) patch[f] = nowIso;
  }
}