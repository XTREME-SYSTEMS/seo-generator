import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// SystemSelfReflection — the persistent self-reflection engine.
// Compares the system's current state against the vision and strategy,
// identifies what's working, what's failing, what's missing, and generates
// actionable auto-fix, auto-heal, auto-harden, auto-optimize directives.
//
// Invoke: base44.functions.invoke('SystemSelfReflection', { cycle_id?, vision? })
// Returns: { ok, reflection, directives, system_assessment }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const cycleId = body.cycle_id || `reflect-${Date.now().toString(36)}`;
    const vision = body.vision || 'Drive managed URLs to top-5 organic rankings autonomously, non-stop.';
    const now = new Date().toISOString();

    // ── SNAPSHOT THE FULL SYSTEM ──
    const [
      sheetRows, suggestions, gaps, methods, capabilities, connectors,
      reflections, experiments, telemetry, tests, clients, urlTargets, snapshots, fixAttempts
    ] = await Promise.all([
      svc.entities.AreSheetRow.list('-updated_date', 200).catch(() => []),
      svc.entities.Suggestion.list('-created_at', 50).catch(() => []),
      svc.entities.SystemGap.list('-logged_at', 30).catch(() => []),
      svc.entities.RankingMethod.list('-proof_level', 50).catch(() => []),
      svc.entities.Capability.list('-impact_score', 100).catch(() => []),
      svc.entities.ConnectorStatus.list('-updated_date', 20).catch(() => []),
      svc.entities.ReflectionRecord.list('-occurred_at', 20).catch(() => []),
      svc.entities.Experiment.list('-started_at', 20).catch(() => []),
      svc.entities.RunTelemetry.list('-started_at', 20).catch(() => []),
      svc.entities.ValidationTest.list('-last_run_at', 50).catch(() => []),
      svc.entities.Client.list('-updated_date', 20).catch(() => []),
      svc.entities.UrlTarget.list('-updated_date', 50).catch(() => []),
      svc.entities.UrlScoreSnapshot.list('-captured_at', 10).catch(() => []),
      svc.entities.FixAttempt.list('-created_at', 20).catch(() => []),
    ]);

    // ── COMPUTE SYSTEM METRICS ──
    const totalUrls = sheetRows.length;
    const topRankUrls = sheetRows.filter((r) => (r.avg_position || 999) <= 5).length;
    const blockedRows = sheetRows.filter((r) => r.status === 'blocked').length;
    const openRows = sheetRows.filter((r) => r.status === 'open').length;
    const goalMetRows = sheetRows.filter((r) => r.status === 'goal_met').length;
    const convergencePct = totalUrls > 0 ? Math.round((topRankUrls / totalUrls) * 100) : 0;

    const implementedCaps = capabilities.filter((c) => c.status === 'implemented').length;
    const availableCaps = capabilities.filter((c) => c.status === 'available').length;
    const requiresCredsCaps = capabilities.filter((c) => c.status === 'requires_credentials').length;
    const capImplementationPct = capabilities.length > 0 ? Math.round((implementedCaps / capabilities.length) * 100) : 0;

    const validatedMethods = methods.filter((m) => m.status === 'validated').length;
    const discoveredMethods = methods.filter((m) => m.status === 'discovered').length;
    const testingMethods = methods.filter((m) => m.status === 'testing').length;

    const failingTests = tests.filter((t) => t.status === 'fail').length;
    const blockedTests = tests.filter((t) => t.status === 'blocked').length;
    const passingTests = tests.filter((t) => t.status === 'pass').length;

    const failedTelemetry = telemetry.filter((t) => t.status === 'failed' || t.status === 'error').length;
    const recentReflections = reflections.filter((r) => r.validation_status === 'fail').length;

    const failedFixes = fixAttempts.filter((f) => f.status === 'failed' || f.status === 'exhausted').length;
    const pendingFixes = fixAttempts.filter((f) => f.status === 'pending' || f.status === 'applied').length;

    const systemSnapshot = {
      vision: vision.slice(0, 300),
      cycle_id: cycleId,
      convergence: { total_urls: totalUrls, top_rank_urls: topRankUrls, convergence_pct: convergencePct, blocked: blockedRows, open: openRows, goal_met: goalMetRows },
      capabilities: { total: capabilities.length, implemented: implementedCaps, available: availableCaps, requires_credentials: requiresCredsCaps, implementation_pct: capImplementationPct },
      methods: { total: methods.length, validated: validatedMethods, discovered: discoveredMethods, testing: testingMethods },
      validation: { total_tests: tests.length, passing: passingTests, failing: failingTests, blocked: blockedTests, failed_reflections: recentReflections },
      health: { failed_telemetry: failedTelemetry, failed_fixes: failedFixes, pending_fixes: pendingFixes, open_gaps: gaps.filter((g) => g.status === 'logged').length },
      connectors: connectors.map((c) => ({ service: c.service, state: c.state })),
      clients: clients.length,
    };

    // ── RUN THE SELF-REFLECTION LLM ──
    const reflectionPrompt = `You are the Self-Reflection engine of the Search Dominance OS — an autonomous SEO ranking platform. Your job is to look at the system's current state vs its vision and generate a brutally honest self-assessment with actionable directives.

VISION:
${vision}

SYSTEM SNAPSHOT:
${JSON.stringify(systemSnapshot, null, 2)}

Generate a self-reflection that includes:
1. system_assessment — one paragraph: where is the system vs the vision? What's the gap?
2. what_is_working — list of things that are going well (convergence progress, implemented capabilities, validated methods, passing tests)
3. what_is_failing — list of things that are broken or underperforming (blocked rows, failing tests, failed telemetry, failed fixes)
4. what_is_missing — list of capabilities not yet implemented, methods not yet validated, gaps not yet addressed
5. directives — an ordered list of actions the system should take, each with:
   - action_type: one of "auto_fix", "auto_heal", "auto_harden", "auto_optimize", "auto_implement"
   - target: what entity/function/area to act on
   - description: the specific action
   - priority: critical|high|medium|low
   - invoke_function: the backend function to call to execute this directive (or null if it requires manual action)
   - payload: the arguments to pass to that function

Be specific and actionable. Every directive must be executable by invoking a backend function. No vague advice.`;

    const llm = await svc.integrations.Core.InvokeLLM({
      prompt: reflectionPrompt,
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          system_assessment: { type: 'string' },
          what_is_working: { type: 'array', items: { type: 'string' } },
          what_is_failing: { type: 'array', items: { type: 'string' } },
          what_is_missing: { type: 'array', items: { type: 'string' } },
          directives: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                action_type: { type: 'string', enum: ['auto_fix', 'auto_heal', 'auto_harden', 'auto_optimize', 'auto_implement'] },
                target: { type: 'string' },
                description: { type: 'string' },
                priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                invoke_function: { type: 'string' },
                payload: { type: 'object', additionalProperties: true },
              },
              required: ['action_type', 'target', 'description', 'priority'],
            },
          },
        },
        required: ['system_assessment', 'what_is_working', 'what_is_failing', 'what_is_missing', 'directives'],
      },
    });

    // ── PERSIST THE REFLECTION ──
    const reflection = await svc.entities.ReflectionRecord.create({
      cycle_id: cycleId,
      phase: 'self_reflect',
      deployed: `Self-reflection cycle ${cycleId}`,
      expected: `Convergence to 100% (all URLs top-5), all capabilities implemented, all validations passing`,
      measured: `Convergence: ${convergencePct}% (${topRankUrls}/${totalUrls}), Capabilities: ${capImplementationPct}% implemented, Tests: ${passingTests}/${tests.length} passing, Methods: ${validatedMethods} validated`,
      expected_score: 100,
      measured_score: convergencePct,
      validation_status: convergencePct >= 100 && failingTests === 0 ? 'pass' : 'pending',
      failed_guidelines: llm.what_is_failing || [],
      regressions: (llm.what_is_failing || []).slice(0, 5),
      auto_fix_attempted: (llm.directives || []).length > 0,
      auto_fix_result: (llm.directives || []).length > 0 ? 'pending' : 'none',
      binding_constraint: blockedRows > 0 ? `${blockedRows} blocked rows` : failingTests > 0 ? `${failingTests} failing tests` : availableCaps > 0 ? `${availableCaps} unimplemented capabilities` : 'none',
      provenance: 'MEASURED',
      occurred_at: now,
    });

    // ── LOG ──
    await svc.entities.Receipt.create({
      kind: 'validation',
      summary: `Self-reflection ${cycleId}: convergence ${convergencePct}%, ${llm.directives?.length || 0} directives generated`,
      detail: JSON.stringify({
        system_snapshot: systemSnapshot,
        reflection: llm,
        reflection_id: reflection.id,
      }, null, 2).slice(0, 8000),
      source: 'system_self_reflection',
      provenance: 'MEASURED',
      occurred_at: now,
    });

    await svc.entities.RunTelemetry.create({
      run_type: 'system_self_reflection',
      subsystem: 'orchestration',
      status: 'ok',
      started_at: now,
      records_written: 1,
      message: `Self-reflection: ${convergencePct}% convergence, ${(llm.directives || []).length} directives, binding: ${blockedRows > 0 ? 'blocked rows' : failingTests > 0 ? 'failing tests' : availableCaps > 0 ? 'unimplemented caps' : 'none'}`,
    });

    return Response.json({
      ok: true,
      cycle_id: cycleId,
      reflection_id: reflection.id,
      system_assessment: llm.system_assessment,
      what_is_working: llm.what_is_working || [],
      what_is_failing: llm.what_is_failing || [],
      what_is_missing: llm.what_is_missing || [],
      directives: llm.directives || [],
      system_snapshot: systemSnapshot,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}