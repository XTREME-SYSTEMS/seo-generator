import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  scoreFromRank, weekStart, growthPct, classifyGap, priorityScore,
  bindingConstraint, newCycleId, RANK_FLOOR, GOAL_RANK,
} from '../../shared/are.js';
import { gscHeaders, listSites, propertyForDomain, pageQueryMetrics } from '../../shared/gsc.js';

const MAX_PAGES = 40;
const QUERIES_PER_PAGE = 5;

// ARE loop steps 1-3: Reflect current state, analyze competitors, detect + classify gaps.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const svc = base44.asServiceRole;
    const cycleId = body.cycle_id || newCycleId();
    const week = weekStart();

    const clients = body.client_id
      ? [await svc.entities.Client.get(body.client_id)]
      : await svc.entities.Client.list('created_date', 100);

    const summary = [];

    // One Search Console session for the whole pass.
    let sites = [];
    let headers = null;
    try {
      headers = await gscHeaders(base44);
      sites = await listSites(headers);
    } catch (e) {
      summary.push({ note: `Search Console unavailable: ${e.message}` });
    }

    for (const client of clients.filter(Boolean)) {
      let targets = await svc.entities.UrlTarget.filter({ client_id: client.id }, '-created_date', 500);

      // MEASURED: pull real page x query performance for this client's property, if readable.
      const property = headers ? propertyForDomain(sites, client.domain) : null;
      let gscByPage = new Map();
      if (property) {
        gscByPage = await pageQueryMetrics(headers, property.url, 28);

        // Auto-register the pages Google actually shows, with their real top queries.
        const known = new Set(targets.map((t) => t.url));
        const topPages = [...gscByPage.entries()]
          .map(([url, qs]) => ({ url, impressions: qs.reduce((a, q) => a + q.impressions, 0), qs }))
          .sort((a, b) => b.impressions - a.impressions)
          .slice(0, MAX_PAGES);
        const newTargets = topPages
          .filter((p) => !known.has(p.url))
          .map((p) => ({
            client_id: client.id,
            url: p.url,
            domain: (client.domain || '').toLowerCase(),
            gsc_property: property.url,
            target_queries: p.qs.slice(0, QUERIES_PER_PAGE).map((q) => q.query),
            index_state: 'INDEXED',
            first_impression_at: new Date().toISOString(),
            clock_started_at: new Date().toISOString(),
            last_synced_at: new Date().toISOString(),
            notes: 'Auto-registered from measured Search Console impressions.',
          }));
        if (newTargets.length) {
          const created = await svc.entities.UrlTarget.bulkCreate(newTargets);
          targets = targets.concat(Array.isArray(created) ? created : newTargets);
        }
        // Existing targets with no queries adopt their measured top queries.
        const adopt = targets
          .filter((t) => !(t.target_queries || []).length && gscByPage.has(t.url))
          .map((t) => ({ id: t.id, target_queries: gscByPage.get(t.url).slice(0, QUERIES_PER_PAGE).map((q) => q.query) }));
        if (adopt.length) {
          await svc.entities.UrlTarget.bulkUpdate(adopt);
          targets = targets.map((t) => { const a = adopt.find((x) => x.id === t.id); return a ? { ...t, ...a } : t; });
        }
      }

      // Adopt any URL asset that belongs to this client by domain but was registered before
      // tenant binding existed — otherwise it would never enter the loop.
      const clientDomain = (client.domain || '').replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
      if (clientDomain) {
        const orphans = (await svc.entities.UrlTarget.filter({ client_id: null }, '-created_date', 500))
          .filter((t) => (t.domain || '').toLowerCase() === clientDomain);
        if (orphans.length) {
          await svc.entities.UrlTarget.bulkUpdate(orphans.map((t) => ({ id: t.id, client_id: client.id })));
          targets = targets.concat(orphans.map((t) => ({ ...t, client_id: client.id })));
        }
      }

      // One target per URL — duplicate registrations would produce duplicate row updates.
      targets = [...new Map(targets.map((t) => [t.url, t])).values()];
      if (!targets.length) { summary.push({ client: client.name, rows: 0, note: 'no url assets' }); continue; }

      const [existingRows, serps, competitors, metrics] = await Promise.all([
        svc.entities.AreSheetRow.filter({ client_id: client.id }, '-last_reflected_at', 500),
        svc.entities.SerpMeasurement.filter({ client_id: client.id }, '-measured_at', 500),
        svc.entities.Competitor.filter({ client_id: client.id }, '-last_observed_at', 200),
        svc.entities.HourlySearchMetric.filter({ client_id: client.id }, '-hour', 500),
      ]);

      const rowByKey = new Map(existingRows.map((r) => [r.row_key, r]));
      const toCreate = [];
      const toUpdate = [];
      const perUrl = new Map();

      for (const target of targets) {
        const queries = (target.target_queries || []).filter(Boolean);
        const queryList = queries.length ? queries : ['(unassigned)'];

        for (const query of queryList) {
          const rowKey = `${client.id}|${target.url}|${query}`;
          const prev = rowByKey.get(rowKey);

          const serp = serps.find((s) => s.query === query && (!s.url || s.url === target.url));
          const gscRow = (gscByPage.get(target.url) || []).find((q) => q.query === query);
          let impressions, clicks, avgPosition;
          if (gscRow) {
            impressions = gscRow.impressions;
            clicks = gscRow.clicks;
            avgPosition = gscRow.position;
          } else {
            const qMetrics = metrics.filter((m) => m.query === query && (!m.url || m.url === target.url));
            impressions = qMetrics.reduce((a, m) => a + (m.impressions || 0), 0);
            clicks = qMetrics.reduce((a, m) => a + (m.clicks || 0), 0);
            avgPosition = qMetrics.length
              ? Math.round((qMetrics.reduce((a, m) => a + (m.avg_position || 0), 0) / qMetrics.length) * 10) / 10
              : null;
          }

          const rank = serp && serp.rank ? serp.rank : null;
          // Exact rank when a licensed SERP measurement exists; otherwise the score is banded
          // from GSC average position (measured by Google, labeled as an average — never an exact rank).
          const effectiveRank = rank ?? avgPosition;
          const score = scoreFromRank(effectiveRank);
          const ctr = impressions ? Math.round((clicks / impressions) * 10000) / 10000 : 0;

          const base = {
            client_id: client.id,
            row_key: rowKey,
            url: target.url,
            query,
            // Impressions are proof of indexation.
            index_state: impressions > 0 && ['UNOBSERVED', 'NOT_INDEXED', 'CRAWLED_NOT_INDEXED'].includes(target.index_state || 'UNOBSERVED')
              ? 'INDEXED' : (target.index_state || 'UNOBSERVED'),
            canonical_agrees: !!target.canonical_agrees,
            rank,
            rank_provenance: rank ? (serp.provenance || 'MEASURED') : 'UNOBSERVED',
            avg_position: avgPosition,
            impressions,
            clicks,
            ctr,
            score,
            score_delta_7d: prev ? Math.round((score - (prev.score || 0)) * 10) / 10 : 0,
            last_reflected_at: new Date().toISOString(),
          };

          const gap = classifyGap({ ...base, rank: effectiveRank });
          base.gap_type = gap.gap_type;
          base.asymmetry_class = gap.asymmetry || '';
          base.targeted_system = gap.system;

          // Analyze: the strongest competitor currently occupying this query.
          const rival = competitors
            .filter((c) => (c.shared_query_count || 0) > 0 || c.domain)
            .sort((a, b) => (b.authority_signal || 0) - (a.authority_signal || 0))[0];
          base.top_competitor = rival ? (rival.domain || rival.name) : '';
          base.competitor_rank = rival && effectiveRank && effectiveRank > 1 ? 1 : null;

          base.recommended_treatment = TREATMENTS[gap.gap_type] || 'Hold — no evidence-based gap detected.';
          base.evidence_tier = gap.gap_type === 'NONE' ? 'T1_CONFIRMED_SYSTEM' : EVIDENCE[gap.gap_type];

          const pCross = pCrossFor(effectiveRank, gap.gap_type);
          // Traffic upside = what moving to the top-3 CTR band would add over what the query gets today.
          const deltaTraffic = Math.max(1, Math.round(trafficEstimate(3, impressions) - trafficEstimate(effectiveRank, impressions)));
          base.priority_score = priorityScore(pCross, deltaTraffic, HOURS[gap.gap_type] || 4);

          const attempts = prev ? (prev.status === 'blocked' ? 10 : 1) : 0;
          const constraint = bindingConstraint({ ...base, rank: effectiveRank }, attempts);
          base.binding_constraint = constraint || '';

          if (effectiveRank && effectiveRank <= GOAL_RANK) base.status = 'goal_met';
          else if (constraint) base.status = 'blocked';
          else if (prev && ['deployed', 'validated'].includes(prev.status)) base.status = prev.status;
          else base.status = 'open';

          if (prev) { if (!toUpdate.some((u) => u.id === prev.id)) toUpdate.push({ id: prev.id, ...base }); }
          else toCreate.push(base);

          const agg = perUrl.get(target.url) || { rows: [], impressions: 0, clicks: 0 };
          agg.rows.push(base);
          agg.impressions += impressions;
          agg.clicks += clicks;
          perUrl.set(target.url, agg);
        }
      }

      if (toCreate.length) await svc.entities.AreSheetRow.bulkCreate(toCreate);
      if (toUpdate.length) await svc.entities.AreSheetRow.bulkUpdate(toUpdate);

      // Weekly score snapshot per URL — this is what the scoreboard animates week by week.
      const prevSnapshots = await svc.entities.UrlScoreSnapshot.filter({ client_id: client.id }, '-week_start', 500);
      const snapCreate = [];
      const snapUpdate = [];

      for (const [url, agg] of perUrl.entries()) {
        const ranked = agg.rows.map((r) => Number(r.rank ?? r.avg_position)).filter((n) => n > 0);
        const exact = agg.rows.some((r) => r.rank);
        const score = agg.rows.length
          ? Math.round((agg.rows.reduce((a, r) => a + r.score, 0) / agg.rows.length) * 10) / 10
          : 0;
        const key = `${client.id}|${url}|${week}`;
        const existing = prevSnapshots.find((s) => s.snapshot_key === key);
        const priorWeek = prevSnapshots
          .filter((s) => s.url === url && s.week_start < week)
          .sort((a, b) => (a.week_start < b.week_start ? 1 : -1))[0];

        const payload = {
          client_id: client.id,
          url,
          week_start: week,
          snapshot_key: key,
          score,
          best_rank: ranked.length ? Math.min(...ranked) : null,
          avg_rank: ranked.length ? Math.round((ranked.reduce((a, b) => a + b, 0) / ranked.length) * 10) / 10 : null,
          queries_tracked: agg.rows.length,
          queries_top3: agg.rows.filter((r) => (r.rank ?? r.avg_position) && (r.rank ?? r.avg_position) <= 3).length,
          queries_page_one: agg.rows.filter((r) => (r.rank ?? r.avg_position) && (r.rank ?? r.avg_position) <= 10).length,
          impressions: agg.impressions,
          clicks: agg.clicks,
          ctr: agg.impressions ? Math.round((agg.clicks / agg.impressions) * 10000) / 10000 : 0,
          traffic_estimate: Math.round(agg.rows.reduce((a, r) => a + trafficEstimate(r.rank ?? r.avg_position, r.impressions), 0)),
          growth_pct: growthPct(score, priorWeek ? priorWeek.score : 0),
          open_asymmetries: agg.rows.filter((r) => r.status === 'open').length,
          blocked_count: agg.rows.filter((r) => r.status === 'blocked').length,
          provenance: exact ? 'MEASURED' : ranked.length ? 'PROVIDER' : 'UNOBSERVED',
          captured_at: new Date().toISOString(),
        };
        if (existing) snapUpdate.push({ id: existing.id, ...payload });
        else snapCreate.push(payload);
      }

      if (snapCreate.length) await svc.entities.UrlScoreSnapshot.bulkCreate(snapCreate);
      if (snapUpdate.length) await svc.entities.UrlScoreSnapshot.bulkUpdate(snapUpdate);

      await svc.entities.ReflectionRecord.create({
        client_id: client.id,
        cycle_id: cycleId,
        phase: 'reflect',
        deployed: 'reflect+analyze+detect pass',
        expected: `${toCreate.length + toUpdate.length} rows reflected`,
        validation_status: 'not_applicable',
        provenance: 'MEASURED',
        occurred_at: new Date().toISOString(),
      });

      summary.push({
        client: client.name,
        gsc_property: property ? property.url : null,
        measured_pages: gscByPage.size,
        rows: toCreate.length + toUpdate.length,
        urls: perUrl.size,
        blocked: [...perUrl.values()].reduce((a, g) => a + g.rows.filter((r) => r.status === 'blocked').length, 0),
      });
    }

    return Response.json({ ok: true, cycle_id: cycleId, week, summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

const TREATMENTS = {
  TECHNICAL: 'Resolve retrieval blocker: confirm crawlability, canonical agreement, render parity, and internal link path from a crawled hub.',
  CONTENT: 'Close information gap: cover the sub-questions the top results answer, add first-hand specifics, tighten the primary passage.',
  AUTHORITY: 'Earn authority: pursue contextual links from topically relevant higher-authority domains and partner properties.',
  SEO: 'Cross the re-ranking threshold: strengthen primary passage relevance, entity clarity, and internal anchor consistency.',
  SURFACE: 'Improve presentation: rewrite title/meta for the query intent to lift CTR at the current rank.',
  AEO: 'Answer-engine readiness: add a direct, extractable answer block plus structured data for the entity.',
  SAO: 'Search-AI readiness: consolidate entity signals so the page is a reliable citation source.',
  NONE: 'Hold — no evidence-based gap detected. Maintain and monitor.',
};

const EVIDENCE = {
  TECHNICAL: 'T0_GOOGLE_DOC',
  CONTENT: 'T1_CONFIRMED_SYSTEM',
  AUTHORITY: 'T0_GOOGLE_DOC',
  SEO: 'T1_CONFIRMED_SYSTEM',
  SURFACE: 'T1_CONFIRMED_SYSTEM',
  AEO: 'T2_EXPERIMENT',
  SAO: 'T2_EXPERIMENT',
  NONE: 'T1_CONFIRMED_SYSTEM',
};

const HOURS = { TECHNICAL: 2, CONTENT: 6, AUTHORITY: 12, SEO: 4, SURFACE: 1, AEO: 3, SAO: 3, NONE: 1 };

function pCrossFor(rank, gapType) {
  const r = Number(rank) || RANK_FLOOR;
  let base = r <= 10 ? 0.55 : r <= 20 ? 0.42 : r <= 50 ? 0.24 : r <= 100 ? 0.12 : 0.06;
  if (gapType === 'TECHNICAL') base += 0.25;
  if (gapType === 'AUTHORITY') base -= 0.05;
  return Math.max(0.02, Math.min(0.95, Math.round(base * 100) / 100));
}

function trafficEstimate(rank, impressions) {
  const r = Number(rank) || RANK_FLOOR;
  const curve = r <= 1 ? 0.28 : r <= 3 ? 0.15 : r <= 5 ? 0.08 : r <= 10 ? 0.03 : r <= 20 ? 0.01 : 0.003;
  return (impressions || 0) * curve;
}