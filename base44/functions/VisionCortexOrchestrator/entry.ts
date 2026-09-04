import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// VisionCortexOrchestrator — the master autonomous brain of the SEO Generator.
// This is the ONE function that runs the ENTIRE system from the Prompt Library.
//
// It persistently follows the vision and strategy by executing a full autonomous cycle:
//   1. LOAD   — read the vision, strategy, and Prompt Library
//   2. AUDIT  — run SystemDNA + VisionCortexWatch (find the binding constraint)
//   3. REFLECT — run SystemSelfReflection (compare state vs vision)
//   4. DISCOVER — run DiscoverCapabilities + GenerateRankingMethods (find new methods)
//   5. SUGGEST — run AreSuggest (generate evidence-anchored suggestions)
//   6. IMPLEMENT — run AutonomousSystemImplementer + AreImplement (deploy treatments)
//   7. VALIDATE — run ValidateSystem (validate outcomes)
//   8. HEAL   — run FixEngine (auto-fix blocked rows)
//   9. CONVERGE — run AutonomousConvergence (drive URLs to top-5)
//   10. PROMPTS — execute ready prompts from the Prompt Library
//   11. LOG   — write comprehensive receipt and telemetry
//
// Invoke: base44.functions.invoke('VisionCortexOrchestrator', { cycle_id?, skip_phases? })
// Returns: { ok, cycle_id, phases_run, results, system_assessment }

const VISION = `Search Dominance OS — an autonomous search-ranking weapon.
MISSION: Move any URL to Google first-page top 5 as fast as technologically possible, then hold it there.
The system is the discoverer, researcher, tester, validator, perfector, and achiever.
It operates fully autonomously with zero human input. It never waits. It resolves, executes, measures, iterates.
Evidence-first. No black-hat. Organic parity with paid advertising — without paying Google.`;

const STRATEGY_PHASES = [
  { phase: 'discover', function: 'GenerateRankingMethods', desc: 'Find every ranking method in existence' },
  { phase: 'research', function: 'AlgorithmUpdateMonitor', desc: 'Deep-dive each method, classify by Google signal' },
  { phase: 'test', function: 'AreTwinOptimizer', desc: 'Deploy candidates into the SERP Digital Twin' },
  { phase: 'validate', function: 'MethodAttribution', desc: 'Measure GSC delta, promote or demote' },
  { phase: 'perfect', function: 'SprintPlanner', desc: 'Optimize implementation, build sprint plan' },
  { phase: 'achieve', function: 'AreImplement', desc: 'Execute the sprint, drive to top 5' },
];

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const cycleId = body.cycle_id || `orch-${Date.now().toString(36)}`;
    const skipPhases = new Set(body.skip_phases || []);
    const now = new Date().toISOString();

    console.log(`[VisionCortexOrchestrator] Starting cycle ${cycleId}`);

    // ── 1. LOAD — read the Prompt Library ──
    const prompts = await svc.entities.PromptLibrary.filter({ status: 'ready' }, '-impact', 50).catch(() => []);
    console.log(`[VisionCortexOrchestrator] Loaded ${prompts.length} ready prompts from library`);

    const results = {
      cycle_id: cycleId,
      vision: VISION.slice(0, 100) + '...',
      started_at: now,
      phases: {},
      prompts_run: 0,
      prompts_succeeded: 0,
      prompts_failed: 0,
      errors: [],
    };

    // Helper: invoke a backend function safely
    async function runPhase(name: string, fnName: string, payload: any = {}) {
      if (skipPhases.has(name)) {
        results.phases[name] = { skipped: true };
        return null;
      }
      console.log(`[VisionCortexOrchestrator] Phase: ${name} → ${fnName}`);
      try {
        const res = await svc.functions.invoke(fnName, payload);
        const data = res?.data || res;
        results.phases[name] = { function: fnName, ok: true, summary: JSON.stringify(data).slice(0, 500) };
        return data;
      } catch (e) {
        results.phases[name] = { function: fnName, ok: false, error: e.message };
        results.errors.push(`${name}: ${e.message}`);
        console.error(`[VisionCortexOrchestrator] Phase ${name} failed:`, e.message);
        return null;
      }
    }

    // ── 2-3. AUDIT + REFLECT (parallel — independent phases) ──
    await Promise.all([
      runPhase('audit_dna', 'SystemDNA', {}),
      runPhase('audit_brain', 'VisionCortexWatch', {}),
      runPhase('reflect', 'SystemSelfReflection', { cycle_id: cycleId, vision: VISION }),
    ]);

    // ── 4. DISCOVER (parallel — independent phases) ──
    await Promise.all([
      runPhase('discover_capabilities', 'DiscoverCapabilities', {}),
      runPhase('discover_methods', 'GenerateRankingMethods', {}),
    ]);

    // ── 5. SUGGEST ──
    await runPhase('suggest', 'AreSuggest', {});

    // ── 6. IMPLEMENT (parallel — independent) ──
    await Promise.all([
      runPhase('implement_capabilities', 'AutonomousSystemImplementer', { cycle_id: cycleId }),
      runPhase('implement_treatments', 'AreImplement', {}),
    ]);

    // ── 7-8. VALIDATE + HEAL (parallel — independent) ──
    await Promise.all([
      runPhase('validate', 'ValidateSystem', {}),
      runPhase('heal', 'FixEngine', {}),
    ]);

    // ── 9. CONVERGE — drive URLs to top-5 (runs last, depends on everything above) ──
    // Note: the Non-Stop Convergence Loop workflow also handles this every 15 min,
    // so we skip it here to avoid duplication and keep the orchestrator fast.
    if (!skipPhases.has('converge')) {
      console.log('[VisionCortexOrchestrator] Skipping converge phase (handled by Non-Stop Convergence Loop workflow every 15 min)');
      results.phases.converge = { skipped: true, reason: 'handled by Non-Stop Convergence Loop workflow' };
    }

    // ── 10. PROMPTS — execute ready prompts from the Prompt Library ──
    for (const p of prompts) {
      if (!p.invoke_function) continue;
      console.log(`[VisionCortexOrchestrator] Running prompt: ${p.title} → ${p.invoke_function}`);
      try {
        await svc.functions.invoke(p.invoke_function, {});
        results.prompts_run++;
        results.prompts_succeeded++;
        await svc.entities.PromptLibrary.update(p.id, {
          status: 'run',
          last_run_at: now,
        });
      } catch (e) {
        results.prompts_run++;
        results.prompts_failed++;
        results.errors.push(`prompt "${p.title}": ${e.message}`);
        console.error(`[VisionCortexOrchestrator] Prompt "${p.title}" failed:`, e.message);
      }
    }

    // ── 11. LOG — write comprehensive receipt and telemetry ──
    const phaseCount = Object.keys(results.phases).length;
    const successCount = Object.values(results.phases).filter((p: any) => p.ok).length;
    const overallOk = results.errors.length === 0;

    await svc.entities.RunTelemetry.create({
      run_type: 'vision_cortex_orchestrator',
      subsystem: 'orchestration',
      status: overallOk ? 'ok' : 'degraded',
      started_at: now,
      records_written: phaseCount + results.prompts_run,
      message: `Orchestrator cycle ${cycleId}: ${successCount}/${phaseCount} phases ok, ${results.prompts_run} prompts run (${results.prompts_succeeded} ok, ${results.prompts_failed} failed)`,
    });

    await svc.entities.Receipt.create({
      kind: 'validation',
      summary: `VisionCortexOrchestrator cycle ${cycleId}: ${successCount}/${phaseCount} phases succeeded, ${results.prompts_run} prompts executed`,
      detail: JSON.stringify(results, null, 2).slice(0, 8000),
      source: 'vision_cortex_orchestrator',
      provenance: 'MEASURED',
      occurred_at: now,
    });

    console.log(`[VisionCortexOrchestrator] Cycle ${cycleId} complete: ${successCount}/${phaseCount} phases ok`);

    return Response.json({
      ok: true,
      cycle_id: cycleId,
      phases_run: phaseCount,
      phases_succeeded: successCount,
      prompts_run: results.prompts_run,
      prompts_succeeded: results.prompts_succeeded,
      prompts_failed: results.prompts_failed,
      errors: results.errors,
      phases: results.phases,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}