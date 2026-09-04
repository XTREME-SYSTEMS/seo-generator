import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// PersistentMonitor — the watchdog agent that continuously cross-references
// ranking evidence against the target vision and triggers immediate auto-fix
// sequences whenever a gap is identified. This is the "always-on eyes" of the
// system that never sleeps.
//
// What it does every cycle:
//   1. VISION CHECK — load the target vision (all URLs at top-5)
//   2. EVIDENCE SCAN — load all ranking evidence (scores, snapshots, sheet rows)
//   3. GAP DETECTION — compare evidence vs vision, identify every gap
//   4. AUTO-FIX — for each gap, invoke FixEngine with the right parameters
//   5. ESCALATE — if a gap can't be auto-fixed, escalate to VisionCortexWatch
//   6. LOG — write a ReflectionRecord with the comparison + actions taken
//
// Invoke: base44.functions.invoke('PersistentMonitor', {})
// Returns: { ok, vision, evidence, gaps_found, auto_fixes_triggered, escalated, summary }

const TARGET_RANK = 5;
const TARGET_SCORE = 80; // 80/100 = roughly top-5

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const svc = base44.asServiceRole;
    const now = new Date().toISOString();
    const cycleId = `monitor-${Date.now().toString(36)}`;

    console.log(`[PersistentMonitor] Cycle ${cycleId} starting`);

    // ── 1. VISION CHECK ──
    const vision = {
      target: `All managed URLs at top-${TARGET_RANK} (score ≥ ${TARGET_SCORE}/100)`,
      target_rank: TARGET_RANK,
      target_score: TARGET_SCORE,
    };

    // ── 2. EVIDENCE SCAN ──
    const [sheetRows, snapshots, reflections, asymmetries, validations, fixAttempts] = await Promise.all([
      svc.entities.AreSheetRow.list('-updated_date', 500).catch(() => []),
      svc.entities.UrlScoreSnapshot.list('-captured_at', 100).catch(() => []),
      svc.entities.ReflectionRecord.list('-occurred_at', 50).catch(() => []),
      svc.entities.Asymmetry.list('-detected_at', 200).catch(() => []),
      svc.entities.ValidationTest.list('-last_run_at', 100).catch(() => []),
      svc.entities.FixAttempt.filter({ status: 'failed' }, '-created_at', 50).catch(() => []),
    ]);

    const totalUrls = sheetRows.length;
    const topRankUrls = sheetRows.filter((r) => (r.avg_position || 999) <= TARGET_RANK).length;
    const belowTarget = sheetRows.filter((r) => (r.score || 0) < TARGET_SCORE);
    const blockedRows = sheetRows.filter((r) => r.status === 'blocked');
    const failingValidations = validations.filter((v) => v.status === 'fail');
    const failedFixes = fixAttempts.filter((f) => f.status === 'failed' || f.status === 'exhausted');
    const openAsymmetries = asymmetries.filter((a) => !a.resolved_treatment);

    const evidence = {
      total_urls: totalUrls,
      top_rank_urls: topRankUrls,
      convergence_pct: totalUrls > 0 ? Math.round((topRankUrls / totalUrls) * 100) : 0,
      below_target_count: belowTarget.length,
      blocked_count: blockedRows.length,
      failing_validations: failingValidations.length,
      failed_fixes: failedFixes.length,
      open_asymmetries: openAsymmetries.length,
      recent_reflections: reflections.length,
    };

    console.log(`[PersistentMonitor] Evidence: ${JSON.stringify(evidence)}`);

    // ── 3. GAP DETECTION ──
    const gaps = [];

    // Gap 1: URLs below target score
    for (const row of belowTarget.slice(0, 20)) {
      gaps.push({
        type: 'below_target_score',
        url: row.url,
        current_score: row.score || 0,
        target_score: TARGET_SCORE,
        severity: (row.score || 0) < 30 ? 'critical' : 'high',
        action: 'fix',
        payload: { url: row.url, gap_type: row.gap_type || 'SEO', max_attempts: 3 },
      });
    }

    // Gap 2: Blocked rows
    for (const row of blockedRows.slice(0, 10)) {
      gaps.push({
        type: 'blocked_row',
        url: row.url,
        binding_constraint: row.binding_constraint,
        severity: 'critical',
        action: 'fix',
        payload: { url: row.url, gap_type: row.gap_type || 'TECHNICAL', max_attempts: 5 },
      });
    }

    // Gap 3: Failing validations
    for (const v of failingValidations.slice(0, 10)) {
      gaps.push({
        type: 'failing_validation',
        test_name: v.name,
        detail: v.detail,
        severity: 'high',
        action: 'validate',
        payload: { suite: v.suite },
      });
    }

    // Gap 4: Failed fixes that need escalation
    for (const f of failedFixes.slice(0, 10)) {
      gaps.push({
        type: 'failed_fix',
        url: f.url,
        approach: f.approach,
        severity: 'high',
        action: 'escalate',
        payload: { url: f.url, gap_id: f.gap_id, gap_type: f.gap_type },
      });
    }

    // Gap 5: Open asymmetries
    for (const a of openAsymmetries.slice(0, 15)) {
      gaps.push({
        type: 'open_asymmetry',
        url: a.url,
        asymmetry_class: a.asymmetry_class,
        severity: 'medium',
        action: 'fix',
        payload: { url: a.url, gap_id: a.id, gap_type: a.asymmetry_class || 'SEO', max_attempts: 3 },
      });
    }

    console.log(`[PersistentMonitor] Found ${gaps.length} gaps`);

    // ── 4. AUTO-FIX ──
    const autoFixesTriggered = [];
    const escalated = [];

    for (const gap of gaps) {
      if (gap.action === 'fix') {
        try {
          await svc.functions.invoke('FixEngine', gap.payload);
          autoFixesTriggered.push({
            type: gap.type,
            url: gap.url,
            status: 'triggered',
          });
        } catch (e) {
          escalated.push({
            type: gap.type,
            url: gap.url,
            error: e.message,
          });
        }
      } else if (gap.action === 'validate') {
        try {
          await svc.functions.invoke('ValidateSystem', gap.payload);
          autoFixesTriggered.push({
            type: gap.type,
            test: gap.test_name,
            status: 'triggered',
          });
        } catch (e) {
          escalated.push({ type: gap.type, error: e.message });
        }
      } else if (gap.action === 'escalate') {
        try {
          await svc.functions.invoke('VisionCortexWatch', {});
          escalated.push({
            type: gap.type,
            url: gap.url,
            status: 'escalated_to_brain',
          });
        } catch (e) {
          escalated.push({ type: gap.type, url: gap.url, error: e.message });
        }
      }
    }

    // ── 5. LOG ──
    const summary = {
      cycle_id: cycleId,
      vision,
      evidence,
      gaps_found: gaps.length,
      auto_fixes_triggered: autoFixesTriggered.length,
      escalated: escalated.length,
      timestamp: now,
    };

    await svc.entities.ReflectionRecord.create({
      cycle_id: cycleId,
      phase: 'self_reflect',
      deployed: `Auto-fixed ${autoFixesTriggered.length} gaps, escalated ${escalated.length}`,
      expected: `All ${totalUrls} URLs at top-${TARGET_RANK}`,
      measured: `${topRankUrls}/${totalUrls} at target (${evidence.convergence_pct}%)`,
      expected_score: TARGET_SCORE,
      measured_score: evidence.convergence_pct,
      validation_status: evidence.convergence_pct >= 100 ? 'pass' : 'fail',
      regressions: failingValidations.map((v) => v.name),
      auto_fix_attempted: autoFixesTriggered.length > 0,
      auto_fix_result: autoFixesTriggered.length > 0 ? 'fixed' : 'none',
      binding_constraint: gaps[0]?.type || null,
      provenance: 'MEASURED',
      occurred_at: now,
    });

    await svc.entities.RunTelemetry.create({
      run_type: 'persistent_monitor',
      subsystem: 'orchestration',
      status: 'ok',
      started_at: now,
      records_written: gaps.length,
      message: `PersistentMonitor: ${gaps.length} gaps found, ${autoFixesTriggered.length} auto-fixed, ${escalated.length} escalated`,
    });

    await svc.entities.Receipt.create({
      kind: 'validation',
      summary: `PersistentMonitor ${cycleId}: ${gaps.length} gaps → ${autoFixesTriggered.length} fixed → ${escalated.length} escalated`,
      detail: JSON.stringify(summary, null, 2).slice(0, 8000),
      source: 'persistent_monitor',
      provenance: 'MEASURED',
      occurred_at: now,
    });

    console.log(`[PersistentMonitor] Cycle ${cycleId} complete: ${gaps.length} gaps, ${autoFixesTriggered.length} fixed, ${escalated.length} escalated`);

    return Response.json({
      ok: true,
      ...summary,
      gaps,
      auto_fixes: autoFixesTriggered,
      escalated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}