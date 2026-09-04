import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// ABTestRunner — automatically A/B tests different treatments in the SERP
// Digital Twin before deploying to production. Creates twin mutations with
// different module weights, predicts outcomes, and promotes the winner.
//
// Invoke: base44.functions.invoke('ABTestRunner', { url?, limit? })
// Returns: { ok, tests_run, winners_found, promoted }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const now = new Date().toISOString();
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 5;

    // ── LOAD TARGETS WITH SUGGESTIONS ──
    let targets;
    if (body.url) {
      targets = await svc.entities.AreSheetRow.filter({ url: body.url }, '-priority_score', 1).catch(() => []);
    } else {
      targets = await svc.entities.AreSheetRow.filter({ status: 'open' }, '-priority_score', limit).catch(() => []);
    }

    if (targets.length === 0) {
      return Response.json({ ok: true, tests_run: 0, message: 'No URLs to test' });
    }

    console.log(`[ABTestRunner] Running A/B tests on ${targets.length} URLs`);

    let testsRun = 0, winnersFound = 0, promoted = 0;

    for (const target of targets) {
      const url = target.url;
      const query = target.query || '';
      const sessionId = `abtest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // ── CREATE 3 VARIANTS (A/B/C) ──
      const variants = [
        { name: 'A_content_focus', modules: ['content_depth', 'topical_authority', 'semantic_relevance'], weights: 'content-heavy' },
        { name: 'B_technical_focus', modules: ['page_speed', 'schema_markup', 'mobile_optimization'], weights: 'technical-heavy' },
        { name: 'C_authority_focus', modules: ['internal_links', 'external_links', 'brand_signals'], weights: 'authority-heavy' },
      ];

      let bestVariant = null;
      let bestPredictedRank = 999;

      for (const variant of variants) {
        // ── SIMULATE IN TWIN ──
        const simRes = await base44.integrations.Core.InvokeLLM({
          prompt: `Simulate this SEO treatment variant in a SERP Digital Twin:

URL: ${url}
Query: "${query}"
Current rank: ${target.avg_position || 'unknown'}
Variant: ${variant.name}
Module focus: ${variant.modules.join(', ')}
Weight profile: ${variant.weights}

Predict the ranking outcome after 30 days. Consider:
- How much would this variant improve the ranking?
- What's the predicted final rank position?
- What's the confidence level?

Return as JSON: { "predicted_rank": number, "predicted_delta": number, "confidence": 0-100, "reasoning": "..." }`,
          response_json_schema: {
            type: 'object',
            properties: {
              predicted_rank: { type: 'number' },
              predicted_delta: { type: 'number' },
              confidence: { type: 'number' },
              reasoning: { type: 'string' },
            },
          },
        });

        const simData = simRes.data || simRes;

        // ── STORE MUTATION ──
        const mutation = await svc.entities.TwinMutation.create({
          session_id: sessionId,
          url,
          query,
          generation: 1,
          config: JSON.stringify({ variant: variant.name, weights: variant.weights }),
          modules: variant.modules,
          predicted_rank: simData.predicted_rank || 50,
          predicted_delta: simData.predicted_delta || 0,
          is_winner: false,
          deployed: false,
          provenance: 'MODELED',
          created_at: now,
        });

        testsRun++;

        if ((simData.predicted_rank || 999) < bestPredictedRank) {
          bestPredictedRank = simData.predicted_rank || 999;
          bestVariant = { mutation, variant, simData };
        }
      }

      // ── MARK WINNER ──
      if (bestVariant) {
        winnersFound++;
        await svc.entities.TwinMutation.update(bestVariant.mutation.id, { is_winner: true });

        // ── PROMOTE WINNER IF CONFIDENT ──
        if ((bestVariant.simData.confidence || 0) > 65 && bestPredictedRank < (target.avg_position || 999)) {
          promoted++;
          await svc.entities.TwinMutation.update(bestVariant.mutation.id, { deployed: true });

          // ── CREATE SUGGESTION FROM WINNER ──
          await svc.entities.Suggestion.create({
            url, query, kind: 'upgrade', surface: 'twin',
            title: `A/B Test Winner: ${bestVariant.variant.name} for ${query}`,
            rationale: `Twin simulation predicted rank ${bestPredictedRank.toFixed(1)} (from ${target.avg_position || 'unknown'}). Confidence: ${bestVariant.simData.confidence}%. Winning modules: ${bestVariant.variant.modules.join(', ')}`,
            treatment: `Deploy ${bestVariant.variant.name} treatment: focus on ${bestVariant.variant.modules.join(', ')}`,
            gap_type: 'SEO',
            evidence_tier: 'T2_EXPERIMENT',
            evidence_anchor: 'Twin simulation with predicted rank improvement',
            priority_score: 80,
            status: 'new',
            provenance: 'MODELED',
            created_at: now,
          });
        }
      }
    }

    // ── LOG ──
    await svc.entities.RunTelemetry.create({
      run_type: 'ab_test_runner', subsystem: 'execution', status: 'ok',
      started_at: now, records_written: testsRun,
      message: `ABTestRunner: ${testsRun} variants tested, ${winnersFound} winners, ${promoted} promoted`,
    });
    await svc.entities.Receipt.create({
      kind: 'validation', summary: `ABTestRunner: ${testsRun} A/B variants tested, ${winnersFound} winners found, ${promoted} promoted to deployment`,
      detail: JSON.stringify({ targets: targets.length, tests: testsRun, winners: winnersFound, promoted }).slice(0, 4000),
      source: 'ab_test_runner', provenance: 'MODELED', occurred_at: now,
    });

    return Response.json({ ok: true, tests_run: testsRun, winners_found: winnersFound, promoted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}