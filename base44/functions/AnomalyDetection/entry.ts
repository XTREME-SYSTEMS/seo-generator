import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// AnomalyDetection — detects sudden traffic/ranking drops by comparing recent
// GSC metrics with historical baselines. When a significant drop is detected,
// triggers immediate investigation and creates a SystemGap + Suggestion.
//
// Invoke: base44.functions.invoke('AnomalyDetection', { threshold? })
// Returns: { ok, urls_checked, anomalies_detected, suggestions_generated }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const now = new Date().toISOString();
    const body = await req.json().catch(() => ({}));
    const dropThreshold = body.threshold || 30; // 30% drop = anomaly

    // ── LOAD RECENT SCORE SNAPSHOTS ──
    const recentSnapshots = await svc.entities.UrlScoreSnapshot.list('-week_start', 200).catch(() => []);

    if (recentSnapshots.length === 0) {
      return Response.json({ ok: true, urls_checked: 0, message: 'No snapshots to analyze' });
    }

    // ── GROUP BY URL ──
    const byUrl = {};
    for (const snap of recentSnapshots) {
      if (!byUrl[snap.url]) byUrl[snap.url] = [];
      byUrl[snap.url].push(snap);
    }

    console.log(`[AnomalyDetection] Checking ${Object.keys(byUrl).length} URLs for anomalies`);

    let anomaliesDetected = 0;
    let suggestionsGenerated = 0;
    const anomalies = [];

    for (const [url, snaps] of Object.entries(byUrl)) {
      if (snaps.length < 2) continue;

      // Sort by week_start descending
      snaps.sort((a, b) => new Date(b.week_start).getTime() - new Date(a.week_start).getTime());

      const latest = snaps[0];
      const previous = snaps[1];

      // ── CHECK FOR TRAFFIC/IMPRESSION DROP ──
      const impressionDrop = previous.impressions > 0
        ? ((previous.impressions - latest.impressions) / previous.impressions) * 100
        : 0;
      const clickDrop = previous.clicks > 0
        ? ((previous.clicks - latest.clicks) / previous.clicks) * 100
        : 0;
      const scoreDrop = previous.score > 0
        ? ((previous.score - latest.score) / previous.score) * 100
        : 0;
      const rankDrop = latest.avg_rank > 0 && previous.avg_rank > 0
        ? latest.avg_rank - previous.avg_rank // positive = worse rank
        : 0;

      const isAnomaly = impressionDrop >= dropThreshold || clickDrop >= dropThreshold || scoreDrop >= dropThreshold || rankDrop >= 10;

      if (!isAnomaly) continue;

      anomaliesDetected++;
      const anomalyType = impressionDrop >= dropThreshold ? 'impression_drop' : clickDrop >= dropThreshold ? 'click_drop' : scoreDrop >= dropThreshold ? 'score_drop' : 'rank_drop';

      anomalies.push({
        url, type: anomalyType,
        impression_drop_pct: Math.round(impressionDrop),
        click_drop_pct: Math.round(clickDrop),
        score_drop_pct: Math.round(scoreDrop),
        rank_change: Math.round(rankDrop * 10) / 10,
      });

      // ── INVESTIGATE VIA LLM ──
      const investigation = await base44.integrations.Core.InvokeLLM({
        prompt: `A URL has experienced a sudden drop in search performance. Investigate possible causes.

URL: ${url}
Anomaly type: ${anomalyType}
Impression drop: ${Math.round(impressionDrop)}%
Click drop: ${Math.round(clickDrop)}%
Score drop: ${Math.round(scoreDrop)}%
Rank change: ${Math.round(rankDrop * 10) / 10} positions

What are the most likely causes? Consider: Google algorithm update, technical issue, competitor movement, content quality issue, indexing problem, manual penalty, seasonal variation.

Return as JSON: { "likely_causes": ["..."], "recommended_actions": ["..."], "urgency": "low|medium|high|critical" }`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            likely_causes: { type: 'array', items: { type: 'string' } },
            recommended_actions: { type: 'array', items: { type: 'string' } },
            urgency: { type: 'string' },
          },
        },
      });

      const investData = investigation.data || investigation;

      // ── CREATE SUGGESTION ──
      await svc.entities.Suggestion.create({
        url, kind: 'fix', surface: 'sheet',
        title: `ANOMALY: ${anomalyType.replace('_', ' ')} on ${url} — ${Math.round(impressionDrop)}% drop`,
        rationale: `Sudden performance drop detected. Likely causes: ${(investData.likely_causes || []).join('; ')}`,
        treatment: (investData.recommended_actions || []).join('; '),
        gap_type: 'TECHNICAL',
        evidence_tier: 'T2_EXPERIMENT',
        evidence_anchor: 'Measured performance anomaly via GSC time-series comparison',
        priority_score: investData.urgency === 'critical' ? 95 : investData.urgency === 'high' ? 85 : 70,
        status: 'new',
        provenance: 'MEASURED',
        created_at: now,
      });
      suggestionsGenerated++;

      // ── CREATE SYSTEM GAP ──
      await svc.entities.SystemGap.create({
        dimension: 'measurement',
        gap: `Anomaly: ${anomalyType} on ${url}`,
        severity: investData.urgency || 'medium',
        recommended_fix: (investData.recommended_actions || []).join('; '),
        status: 'logged',
        logged_at: now,
      }).catch(() => {});
    }

    // ── LOG ──
    await svc.entities.RunTelemetry.create({
      run_type: 'anomaly_detection', subsystem: 'monitor', status: 'ok',
      started_at: now, records_written: anomaliesDetected,
      message: `AnomalyDetection: ${anomaliesDetected} anomalies detected from ${Object.keys(byUrl).length} URLs`,
    });
    await svc.entities.Receipt.create({
      kind: 'validation', summary: `AnomalyDetection: ${anomaliesDetected} anomalies detected, ${suggestionsGenerated} investigation suggestions`,
      detail: JSON.stringify({ urls_checked: Object.keys(byUrl).length, anomalies: anomalies.slice(0, 20) }).slice(0, 6000),
      source: 'anomaly_detection', provenance: 'MEASURED', occurred_at: now,
    });

    return Response.json({ ok: true, urls_checked: Object.keys(byUrl).length, anomalies_detected: anomaliesDetected, suggestions_generated: suggestionsGenerated, anomalies });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}