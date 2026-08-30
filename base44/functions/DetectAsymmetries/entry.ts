import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { normalize } from '../../shared/gsc.js';

// The engine's brain. Scans measured GSC evidence for the asymmetry classes that are
// detectable without human judgment, and emits a ranked opportunity queue.
// Every rule below targets a Google-CONFIRMED signal only (evidence tier T0/T1).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const svc = base44.asServiceRole;
    const startedAt = Date.now();
    const nowIso = new Date().toISOString();

    const targets = await svc.entities.UrlTarget.list('-last_synced_at', 200);
    if (targets.length === 0) return Response.json({ detected: 0, message: 'No URLs registered' });

    const metrics = await svc.entities.HourlySearchMetric.list('-hour', 5000);

    // Aggregate measured GSC signal per (url, query).
    const perUrlQuery = new Map();
    const perQueryUrls = new Map();
    for (const m of metrics) {
      if (!m.query) continue;
      const uk = `${normalize(m.url)}||${m.query}`;
      const agg = perUrlQuery.get(uk) || { url: m.url, query: m.query, impressions: 0, clicks: 0, positions: [] };
      agg.impressions += m.impressions || 0;
      agg.clicks += m.clicks || 0;
      if (m.avg_position != null) agg.positions.push(m.avg_position);
      perUrlQuery.set(uk, agg);

      const qset = perQueryUrls.get(m.query) || new Map();
      const prev = qset.get(normalize(m.url)) || { url: m.url, impressions: 0, positions: [] };
      prev.impressions += m.impressions || 0;
      if (m.avg_position != null) prev.positions.push(m.avg_position);
      qset.set(normalize(m.url), prev);
      perQueryUrls.set(m.query, qset);
    }

    const found = [];

    for (const t of targets) {
      const tn = normalize(t.url);

      // ---- A9-adjacent / RETRIEVAL unlocks: the binary gates. Highest value in search. ----
      if (t.index_state === 'EXCLUDED_NOINDEX' || t.index_state === 'EXCLUDED_ROBOTS') {
        found.push(mk(t, null, 'A2_THRESHOLD', 'RETRIEVAL', 'INDEXED',
          `URL is excluded from the index (${t.index_state}). It cannot rank for anything.`,
          'Remove the noindex directive or unblock the path in robots.txt, then request indexing.',
          0.95, 1000, 0.25, nowIso));
      } else if (t.index_state === 'INDEXED' && t.canonical_agrees === false && t.google_canonical) {
        found.push(mk(t, null, 'A2_THRESHOLD', 'RETRIEVAL', 'INDEXED',
          `Google selected a different canonical (${t.google_canonical}) than declared. This URL is not a candidate.`,
          'Make the canonical self-referential, point every internal link and the sitemap at one URL form, remove conflicting alternates.',
          0.85, 800, 0.5, nowIso));
      } else if (t.index_state === 'DUPLICATE_ALTERNATE') {
        found.push(mk(t, null, 'A2_THRESHOLD', 'RETRIEVAL', 'INDEXED',
          'Treated as a duplicate/alternate of another URL — signals are being attributed elsewhere.',
          'Differentiate the page or consolidate deliberately into the chosen canonical owner.',
          0.7, 700, 1, nowIso));
      } else if (t.index_state === 'CRAWLED_NOT_INDEXED' || t.index_state === 'NOT_INDEXED') {
        found.push(mk(t, null, 'A2_THRESHOLD', 'RETRIEVAL', 'INDEXED',
          'Crawled but not indexed — the retrieval gate is failing before any ranking system applies.',
          'Add internal links from relevant indexed pages, ensure the content is substantive and unique, refresh sitemap lastmod.',
          0.5, 900, 1, nowIso));
      }

      // ---- CANDIDATE SELECTION: declared target queries with zero measured impressions ----
      const queries = Array.isArray(t.target_queries) ? t.target_queries : [];
      for (const q of queries) {
        const agg = perUrlQuery.get(`${tn}||${q}`);
        if (t.index_state === 'INDEXED' && (!agg || agg.impressions === 0)) {
          found.push(mk(t, q, 'A4_INTENT', 'CANDIDATE_SELECTION', 'FIRST_IMPRESSION',
            `Indexed but zero impressions for "${q}" — Google is not treating this URL as a candidate.`,
            `Align <title> and <h1> with the phrasing of "${q}" and add one self-contained passage that directly answers it. Passage-level indexing means one qualifying block is enough.`,
            0.6, 400, 1, nowIso));
        }
      }

      // ---- A2 THRESHOLD: distance to the nearest discrete boundary ----
      for (const [, agg] of perUrlQuery) {
        if (normalize(agg.url) !== tn || agg.impressions === 0 || agg.positions.length === 0) continue;
        const pos = avg(agg.positions);
        const b = nearestBoundary(pos);
        if (b) {
          found.push(mk(t, agg.query, 'A2_THRESHOLD', b.system, b.boundary,
            `"${agg.query}" sits at average position ${pos.toFixed(1)} — ${b.label}`,
            b.treatment, b.p, b.value * Math.max(agg.impressions, 1), b.hours, nowIso));
        }
      }

      // ---- A1 LATENCY: a hard deadline may only ever be served by fast-reprocess work ----
      if (t.index_state === 'INDEXED' && !t.first_impression_at && t.last_crawl_at) {
        const daysSinceCrawl = (Date.now() - new Date(t.last_crawl_at).getTime()) / 86400000;
        if (daysSinceCrawl > 7) {
          found.push(mk(t, null, 'A1_LATENCY', 'RETRIEVAL', 'FIRST_IMPRESSION',
            `Last crawled ${Math.round(daysSinceCrawl)} days ago — changes are not being re-evaluated.`,
            'Bump sitemap lastmod for this URL, resubmit the sitemap, and add fresh internal links to trigger recrawl.',
            0.55, 300, 0.5, nowIso));
        }
      }
    }

    // ---- A8 CANNIBALIZATION: two of our URLs competing for one query ----
    const ownedNorms = new Set(targets.map((t) => normalize(t.url)));
    for (const [query, urlMap] of perQueryUrls) {
      const competing = [...urlMap.values()].filter((u) => u.impressions > 0 && ownedNorms.has(normalize(u.url)));
      if (competing.length < 2) continue;
      const best = competing.reduce((a, b) => (avg(a.positions) <= avg(b.positions) ? a : b));
      const owner = targets.find((t) => normalize(t.url) === normalize(best.url));
      if (!owner) continue;
      found.push(mk(owner, query, 'A8_CANNIBALIZATION', 'RE_RANKING', 'PAGE_ONE',
        `${competing.length} of our URLs hold impressions for "${query}" — signals are split between them.`,
        `Designate ${best.url} as the single owner for "${query}"; consolidate or de-target the others and internally link them to the owner.`,
        0.65, 500, 1, nowIso));
    }

    // Replace the open queue so the surface always reflects current reality.
    const open = await svc.entities.Asymmetry.filter({ status: 'open' });
    if (open.length) await svc.entities.Asymmetry.deleteMany({ status: 'open' });
    for (let i = 0; i < found.length; i += 400) {
      await svc.entities.Asymmetry.bulkCreate(found.slice(i, i + 400));
    }

    await svc.entities.RunTelemetry.create({
      run_type: 'opportunity_generation', subsystem: 'search', status: 'ok',
      started_at: nowIso, duration_ms: Date.now() - startedAt, records_written: found.length,
      message: `Detected ${found.length} asymmetries across ${targets.length} URLs`
    });

    const top = [...found].sort((a, b) => b.priority_score - a.priority_score).slice(0, 10);
    return Response.json({ detected: found.length, cleared_previous: open.length, top });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function avg(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null; }

function mk(t, query, cls, system, boundary, signal, treatment, p, value, hours, nowIso) {
  return {
    client_id: t.client_id || null,
    url: t.url,
    query: query || null,
    asymmetry_class: cls,
    signal,
    targeted_system: system,
    boundary_target: boundary,
    p_cross: p,
    delta_traffic: value,
    hours_estimate: hours,
    priority_score: Math.round(((p * value) / Math.max(hours, 0.25)) * 100) / 100,
    latency_class: hours <= 3 ? 'FAST_REPROCESS' : 'SLOW_ACCRUAL',
    recommended_treatment: treatment,
    evidence_tier: 'T1_CONFIRMED_SYSTEM',
    status: 'open',
    detected_at: nowIso
  };
}

// Boundaries are discrete. A move of one position is worth wildly different amounts
// depending on which line it crosses. This is the whole point of A2.
function nearestBoundary(pos) {
  if (pos > 10 && pos <= 20) return {
    boundary: 'PAGE_ONE', system: 'RE_RANKING', p: 0.5, value: 5, hours: 2,
    label: 'striking distance of the page-one break, which is worth 3–5x the CTR of its current slot.',
    treatment: 'Match the title/H1 to the query, add the missing direct answer near the top, consolidate any competing URL, and route internal links from the strongest relevant pages.'
  };
  if (pos > 5 && pos <= 10) return {
    boundary: 'TOP5', system: 'RE_RANKING', p: 0.4, value: 3, hours: 3,
    label: 'on page one but below the top-5 cluster.',
    treatment: 'Add irreplaceable first-party information competitors lack (real prices, measured outcomes, original photos) and named credentialed authorship — the Original Content and Experience levers.'
  };
  if (pos > 3 && pos <= 5) return {
    boundary: 'TOP3', system: 'PRESENTATION', p: 0.35, value: 4, hours: 2,
    label: 'just outside the top-3 above-fold cluster.',
    treatment: 'Attack the weakest present surface instead of grinding organic: format a direct 40–60 word answer or list/table for featured-snippet eligibility.'
  };
  if (pos > 20 && pos <= 50) return {
    boundary: 'TOP30', system: 'CANDIDATE_SELECTION', p: 0.45, value: 1, hours: 2,
    label: 'a candidate but weakly matched.',
    treatment: 'Strengthen query-to-passage matching: exact query phrasing in title/H1 and a dedicated answering section.'
  };
  return null;
}