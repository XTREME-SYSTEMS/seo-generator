import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// PredictiveRankingModel — uses historical score snapshots to predict which
// URLs will reach top-5 fastest. Analyzes score trajectory, velocity, and
// momentum to generate a predicted timeline and priority ranking.
//
// Invoke: base44.functions.invoke('PredictiveRankingModel', { weeks? })
// Returns: { ok, urls_analyzed, predictions: [{ url, current_score, predicted_score, weeks_to_top5, confidence }] }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const now = new Date().toISOString();
    const body = await req.json().catch(() => ({}));
    const weeksHistory = body.weeks || 8;

    // ── LOAD HISTORICAL SNAPSHOTS ──
    const snapshots = await svc.entities.UrlScoreSnapshot.list('-week_start', 500).catch(() => []);

    if (snapshots.length === 0) {
      return Response.json({ ok: true, urls_analyzed: 0, message: 'No historical data' });
    }

    // ── GROUP BY URL ──
    const byUrl = {};
    for (const snap of snapshots) {
      if (!byUrl[snap.url]) byUrl[snap.url] = [];
      byUrl[snap.url].push(snap);
    }

    console.log(`[PredictiveRankingModel] Analyzing ${Object.keys(byUrl).length} URLs`);

    const predictions = [];

    for (const [url, snaps] of Object.entries(byUrl)) {
      if (snaps.length < 2) continue;

      // Sort by week_start ascending (oldest first)
      snaps.sort((a, b) => new Date(a.week_start).getTime() - new Date(b.week_start).getTime());

      const latest = snaps[snaps.length - 1];
      const currentScore = latest.score || 0;
      const currentRank = latest.avg_rank || 999;

      // ── CALCULATE VELOCITY (score change per week) ──
      const recentSnaps = snaps.slice(-Math.min(weeksHistory, snaps.length));
      let totalGrowth = 0;
      let positiveWeeks = 0;
      for (let i = 1; i < recentSnaps.length; i++) {
        const delta = (recentSnaps[i].score || 0) - (recentSnaps[i - 1].score || 0);
        totalGrowth += delta;
        if (delta > 0) positiveWeeks++;
      }
      const avgWeeklyGrowth = recentSnaps.length > 1 ? totalGrowth / (recentSnaps.length - 1) : 0;
      const momentum = recentSnaps.length > 1 ? positiveWeeks / (recentSnaps.length - 1) : 0;

      // ── PREDICT TIME TO TOP-5 ──
      // Score 100 = top-3, score ~85 = top-5
      const targetScore = 85;
      const scoreGap = Math.max(0, targetScore - currentScore);
      let weeksToTop5 = avgWeeklyGrowth > 0 ? Math.ceil(scoreGap / avgWeeklyGrowth) : 999;

      // ── CALCULATE CONFIDENCE ──
      const confidence = Math.round(
        Math.min(100, (momentum * 40) + (avgWeeklyGrowth * 2) + (snaps.length * 2))
      );

      // ── PREDICTED SCORE IN 4 WEEKS ──
      const predictedScore4w = Math.min(100, currentScore + (avgWeeklyGrowth * 4));

      predictions.push({
        url,
        current_score: Math.round(currentScore),
        current_rank: Math.round(currentRank * 10) / 10,
        avg_weekly_growth: Math.round(avgWeeklyGrowth * 10) / 10,
        momentum: Math.round(momentum * 100),
        predicted_score_4w: Math.round(predictedScore4w),
        weeks_to_top5: weeksToTop5 >= 999 ? null : weeksToTop5,
        confidence,
      });
    }

    // ── SORT BY FASTEST TO TOP-5 ──
    predictions.sort((a, b) => {
      if (a.weeks_to_top5 === null) return 1;
      if (b.weeks_to_top5 === null) return -1;
      return a.weeks_to_top5 - b.weeks_to_top5;
    });

    // ── GENERATE SUGGESTIONS FOR HIGH-POTENTIAL URLs ──
    let suggestionsGenerated = 0;
    for (const pred of predictions.filter((p) => p.confidence > 50 && p.weeks_to_top5 && p.weeks_to_top5 < 8).slice(0, 10)) {
      await svc.entities.Suggestion.create({
        url: pred.url, kind: 'enhancement', surface: 'strategy',
        title: `HIGH POTENTIAL: ${pred.url} — predicted top-5 in ${pred.weeks_to_top5} weeks`,
        rationale: `This URL has ${pred.momentum}% positive momentum, growing ${pred.avg_weekly_growth} points/week. Predicted to reach top-5 in ${pred.weeks_to_top5} weeks. Prioritize resources here.`,
        treatment: `Prioritize this URL for accelerated optimization. Current score: ${pred.current_score}, predicted in 4 weeks: ${pred.predicted_score_4w}`,
        gap_type: 'SEO',
        evidence_tier: 'T3_OBSERVATIONAL',
        evidence_anchor: 'Historical score trajectory analysis',
        priority_score: 85,
        status: 'new',
        provenance: 'MEASURED',
        created_at: now,
      });
      suggestionsGenerated++;
    }

    // ── LOG ──
    await svc.entities.RunTelemetry.create({
      run_type: 'predictive_ranking', subsystem: 'intelligence', status: 'ok',
      started_at: now, records_written: predictions.length,
      message: `PredictiveRankingModel: ${predictions.length} URLs analyzed, ${suggestionsGenerated} high-potential suggestions`,
    });
    await svc.entities.Receipt.create({
      kind: 'validation', summary: `PredictiveRankingModel: ${predictions.length} URLs analyzed, ${suggestionsGenerated} high-potential URLs identified`,
      detail: JSON.stringify({ urls: predictions.length, suggestions: suggestionsGenerated, top_predictions: predictions.slice(0, 10) }).slice(0, 8000),
      source: 'predictive_ranking', provenance: 'MEASURED', occurred_at: now,
    });

    return Response.json({ ok: true, urls_analyzed: predictions.length, predictions: predictions.slice(0, 50), suggestions_generated: suggestionsGenerated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}