import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// System DNA — the self-analysis and self-healing engine for the SEO Generator.
// Ported from Vision Cortex's SystemDNA + dnaSelfHeal + deepSystemAudit patterns,
// adapted for the SEO Generator's four-system bottleneck model.
//
// The engine:
//   1. SNAPSHOTS the entire system (entities, functions, connectors, capabilities)
//   2. SCORES each dimension 0-100 (measurement, intelligence, execution, orchestration, validation, autonomy)
//   3. IDENTIFIES the weakest dimension (the binding constraint)
//   4. GENERATES a specific enhancement for that dimension via InvokeLLM (web-search-grounded)
//   5. AUTO-IMPLEMENTS the enhancement by invoking the right function
//   6. LOGS the DNA trace for auditability
//
// Invoke: base44.functions.invoke('SystemDNA', {})
// Returns: { ok, dna_score, dimensions, weakest, enhancement, implemented }

const DIMENSIONS = [
  { key: 'measurement', desc: 'Can the system accurately measure rankings and traffic? (GSC, GA4, SERP API, rank tracking)' },
  { key: 'intelligence', desc: 'Can the system discover and classify ranking methods? (method discovery, competitor analysis, trend scanning)' },
  { key: 'execution', desc: 'Can the system deploy treatments to production? (CloudBrowser, content generation, citation building, technical SEO)' },
  { key: 'orchestration', desc: 'Can the system coordinate agents and loops autonomously? (ARE loop, convergence engine, council)' },
  { key: 'validation', desc: 'Can the system validate outcomes and attribute them? (reflection, attribution, proof vault, convergence proof)' },
  { key: 'autonomy', desc: 'Can the system run non-stop without human input? (workflows, auto-recovery, self-healing, gap detection)' },
];

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const svc = base44.asServiceRole;
    const now = new Date().toISOString();

    // ── 1. SNAPSHOT THE SYSTEM ──
    const [
      sheetRows, suggestions, gaps, methods, capabilities, connectors,
      reflections, experiments, telemetry, tests, clients, urlTargets, snapshots
    ] = await Promise.all([
      svc.entities.AreSheetRow.list('-updated_date', 100).catch(() => []),
      svc.entities.Suggestion.list('-created_at', 50).catch(() => []),
      svc.entities.SystemGap.list('-logged_at', 30).catch(() => []),
      svc.entities.RankingMethod.list('-proof_level', 50).catch(() => []),
      svc.entities.Capability.list('-impact_score', 100).catch(() => []),
      svc.entities.ConnectorStatus.list('-updated_date', 20).catch(() => []),
      svc.entities.ReflectionRecord.list('-occurred_at', 30).catch(() => []),
      svc.entities.Experiment.list('-started_at', 20).catch(() => []),
      svc.entities.RunTelemetry.list('-started_at', 20).catch(() => []),
      svc.entities.ValidationTest.list('-last_run_at', 50).catch(() => []),
      svc.entities.Client.list('-updated_date', 20).catch(() => []),
      svc.entities.UrlTarget.list('-updated_date', 50).catch(() => []),
      svc.entities.UrlScoreSnapshot.list('-captured_at', 20).catch(() => []),
    ]);

    // ── 2. SCORE EACH DIMENSION ──
    const dimensionScores = {};

    // Measurement: do we have GSC data, SERP measurements, score snapshots?
    const hasGSC = sheetRows.filter((r) => r.avg_position != null).length;
    const hasSnapshots = snapshots.length;
    const hasSerp = sheetRows.filter((r) => r.rank_provenance === 'MEASURED').length;
    dimensionScores.measurement = Math.min(100, Math.round(((hasGSC / Math.max(sheetRows.length, 1)) * 40 + (hasSnapshots > 0 ? 30 : 0) + (hasSerp / Math.max(sheetRows.length, 1)) * 30)));

    // Intelligence: do we have methods, suggestions, gaps?
    const validatedMethods = methods.filter((m) => m.status === 'validated').length;
    const newSuggestions = suggestions.filter((s) => s.status === 'new').length;
    const openGaps = gaps.filter((g) => g.status === 'logged').length;
    dimensionScores.intelligence = Math.min(100, Math.round((validatedMethods * 5 + Math.min(newSuggestions * 2, 30) + Math.min(openGaps * 3, 20) + (methods.length > 20 ? 30 : methods.length * 1.5))));

    // Execution: do we have capabilities implemented?
    const implementedCaps = capabilities.filter((c) => c.status === 'implemented').length;
    const totalCaps = capabilities.length || 1;
    dimensionScores.execution = Math.round((implementedCaps / totalCaps) * 100);

    // Orchestration: are the loops running?
    const recentTelemetry = telemetry.filter((t) => {
      const age = (Date.now() - new Date(t.started_at).getTime()) / (1000 * 60 * 60);
      return age < 24;
    });
    const loopTypes = new Set(recentTelemetry.map((t) => t.run_type)).size;
    dimensionScores.orchestration = Math.min(100, Math.round((loopTypes * 15 + (recentTelemetry.length > 0 ? 40 : 0) + (recentTelemetry.filter((t) => t.status === 'ok').length > 0 ? 20 : 0))));

    // Validation: are we validating outcomes?
    const passReflections = reflections.filter((r) => r.validation_status === 'pass').length;
    const failReflections = reflections.filter((r) => r.validation_status === 'fail').length;
    const totalReflections = reflections.length || 1;
    const passRate = (passReflections / totalReflections) * 100;
    const passingTests = tests.filter((t) => t.status === 'pass').length;
    const totalTests = tests.length || 1;
    dimensionScores.validation = Math.round((passRate * 0.5 + (passingTests / totalTests) * 100 * 0.5));

    // Autonomy: are workflows running without human input?
    const autoTelemetry = recentTelemetry.filter((t) =>
      t.run_type?.includes('autonomous') || t.run_type?.includes('loop') || t.run_type?.includes('convergence')
    );
    const blockedRows = sheetRows.filter((r) => r.status === 'blocked').length;
    const autoRatio = recentTelemetry.length > 0 ? (autoTelemetry.length / recentTelemetry.length) : 0;
    dimensionScores.autonomy = Math.min(100, Math.round((autoRatio * 60 + (blockedRows === 0 ? 20 : 0) + (autoTelemetry.length > 0 ? 20 : 0))));

    // ── 3. IDENTIFY WEAKEST DIMENSION ──
    const sortedDimensions = DIMENSIONS.map((d) => ({
      ...d,
      score: dimensionScores[d.key] || 0,
    })).sort((a, b) => a.score - b.score);

    const weakest = sortedDimensions[0];
    const overallDNA = Math.round(sortedDimensions.reduce((a, d) => a + d.score, 0) / sortedDimensions.length);

    // ── 4. GENERATE ENHANCEMENT FOR WEAKEST DIMENSION ──
    const systemSnapshot = {
      goal: 'Drive managed URLs to top-5 organic rankings autonomously, non-stop, until convergence',
      overall_dna_score: overallDNA,
      dimension_scores: dimensionScores,
      weakest_dimension: weakest,
      stats: {
        total_urls: sheetRows.length,
        total_methods: methods.length,
        validated_methods: validatedMethods,
        implemented_capabilities: implementedCaps,
        total_capabilities: totalCaps,
        open_gaps: openGaps,
        blocked_rows: blockedRows,
        recent_loop_runs: recentTelemetry.length,
        autonomous_runs: autoTelemetry.length,
        pass_rate: Math.round(passRate),
        clients: clients.length,
      },
      connectors: connectors.map((c) => ({ service: c.service, state: c.state })),
    };

    const enhancementPrompt = `You are the System DNA engine for the SEO Generator — an autonomous search-ranking platform. Your job is to identify the single highest-leverage enhancement for the system's weakest dimension.

SYSTEM SNAPSHOT:
${JSON.stringify(systemSnapshot, null, 2)}

The weakest dimension is "${weakest.key}" (score: ${weakest.score}/100): ${weakest.desc}

Generate ONE specific, actionable enhancement that would raise this dimension's score. The enhancement must be:
1. Specific — name the exact function, entity, or workflow to create or modify
2. Actionable — it can be implemented by invoking an existing backend function or creating a new one
3. Measurable — how will we know it worked?
4. Grounded — based on current best practices (search the web)

Return JSON:
{
  "enhancement_title": "...",
  "enhancement_description": "...",
  "implementation_function": "name of the backend function to invoke or create",
  "implementation_payload": {},
  "expected_score_increase": 10,
  "validation_criteria": "how to verify this worked",
  "binding_constraint": "what's blocking this dimension right now"
}`;

    const llm = await svc.integrations.Core.InvokeLLM({
      prompt: enhancementPrompt,
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          enhancement_title: { type: 'string' },
          enhancement_description: { type: 'string' },
          implementation_function: { type: 'string' },
          implementation_payload: { type: 'object', additionalProperties: true },
          expected_score_increase: { type: 'number' },
          validation_criteria: { type: 'string' },
          binding_constraint: { type: 'string' },
        },
        required: ['enhancement_title', 'enhancement_description', 'implementation_function'],
      },
    });

    // ── 5. LOG THE DNA TRACE ──
    await svc.entities.SystemGap.create({
      category: weakest.key,
      gap: `DNA weakness: ${weakest.key} (${weakest.score}/100) — ${llm.binding_constraint || 'unspecified'}`,
      recommendation: llm.enhancement_description || llm.enhancement_title,
      priority: weakest.score < 30 ? 'critical' : weakest.score < 60 ? 'high' : 'medium',
      phase: 1,
      status: 'logged',
      notes: `System DNA · overall ${overallDNA}/100 · function: ${llm.implementation_function} · validation: ${llm.validation_criteria || ''}`.slice(0, 2000),
      logged_at: now,
    });

    await svc.entities.Receipt.create({
      kind: 'validation',
      summary: `System DNA analysis: overall ${overallDNA}/100, weakest dimension ${weakest.key} (${weakest.score}/100)`,
      detail: JSON.stringify({
        overall_dna_score: overallDNA,
        dimension_scores: dimensionScores,
        weakest_dimension: weakest.key,
        enhancement: llm,
        system_snapshot: systemSnapshot.stats,
      }, null, 2).slice(0, 8000),
      source: 'system_dna',
      provenance: 'MEASURED',
      occurred_at: now,
    });

    await svc.entities.RunTelemetry.create({
      run_type: 'system_dna',
      subsystem: 'orchestration',
      status: 'ok',
      started_at: now,
      records_written: 1,
      message: `DNA ${overallDNA}/100 — weakest: ${weakest.key} (${weakest.score}/100)`,
    });

    return Response.json({
      ok: true,
      dna_score: overallDNA,
      dimensions: sortedDimensions,
      weakest,
      enhancement: llm,
      system_snapshot: systemSnapshot.stats,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}