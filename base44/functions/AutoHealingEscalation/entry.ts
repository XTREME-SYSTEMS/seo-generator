import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// AutoHealingEscalation — when FixEngine fails, escalates through a hierarchy
// of increasingly aggressive approaches. Level 1: retry same approach. Level 2:
// try alternative approach. Level 3: simplify treatment. Level 4: escalate to
// human review (create a blocked record with detailed diagnosis).
//
// Invoke: base44.functions.invoke('AutoHealingEscalation', { max_attempts? })
// Returns: { ok, escalated, resolved, exhausted, details }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const now = new Date().toISOString();
    const body = await req.json().catch(() => ({}));
    const maxAttempts = body.max_attempts || 4;

    // ── LOAD FAILED FIX ATTEMPTS ──
    const failedFixes = await svc.entities.FixAttempt.filter({ status: 'failed' }, '-created_at', 20).catch(() => []);

    if (failedFixes.length === 0) {
      return Response.json({ ok: true, escalated: 0, message: 'No failed fixes to escalate' });
    }

    console.log(`[AutoHealingEscalation] Escalating ${failedFixes.length} failed fixes`);

    let resolved = 0, exhausted = 0;
    const details = [];

    for (const fix of failedFixes) {
      const attemptNum = (fix.attempt || 1) + 1;

      // ── DETERMINE ESCALATION LEVEL ──
      let approach = '';
      let treatment = '';

      if (attemptNum <= 1) {
        // Level 1: retry same approach
        approach = `Retry: ${fix.approach || 'original approach'}`;
        treatment = fix.treatment || fix.diagnosis || 'Retry the original fix';
      } else if (attemptNum === 2) {
        // Level 2: try alternative approach
        const altRes = await base44.integrations.Core.InvokeLLM({
          prompt: `A fix attempt failed. Generate an ALTERNATIVE approach.

URL: ${fix.url}
Original approach: ${fix.approach}
Diagnosis: ${fix.diagnosis}
Error: ${fix.error}

What's a completely different way to fix this? Think outside the box.

Return as JSON: { "alternative_approach": "...", "alternative_treatment": "..." }`,
          response_json_schema: {
            type: 'object',
            properties: {
              alternative_approach: { type: 'string' },
              alternative_treatment: { type: 'string' },
            },
          },
        });
        const altData = altRes.data || altRes;
        approach = `Alternative: ${altData.alternative_approach}`;
        treatment = altData.alternative_treatment;
      } else if (attemptNum === 3) {
        // Level 3: simplify
        approach = `Simplified: break the fix into smaller, safer steps`;
        treatment = `Break down the original treatment into minimal, incremental changes. Apply one change at a time, validate each before proceeding.`;
      } else {
        // Level 4: exhausted — mark as blocked with diagnosis
        approach = 'Exhausted — escalate to human review';
        treatment = `All ${attemptNum - 1} automated fix attempts failed. Requires manual investigation.`;

        await svc.entities.AreSheetRow.filter({ url: fix.url }, '-priority_score', 1).then((rows) => {
          if (rows.length > 0) {
            return svc.entities.AreSheetRow.update(rows[0].id, {
              status: 'blocked',
              binding_constraint: `Auto-healing exhausted after ${attemptNum - 1} attempts. Last error: ${fix.error || 'unknown'}`,
            });
          }
        }).catch(() => {});

        exhausted++;
        details.push({ url: fix.url, level: 4, status: 'exhausted', error: fix.error });
        continue;
      }

      // ── CREATE NEW FIX ATTEMPT ──
      await svc.entities.FixAttempt.create({
        url: fix.url,
        gap_id: fix.gap_id,
        gap_type: fix.gap_type,
        asymmetry_class: fix.asymmetry_class,
        attempt: attemptNum,
        approach,
        diagnosis: fix.diagnosis,
        treatment,
        status: 'pending',
        created_at: now,
      });

      resolved++;
      details.push({ url: fix.url, level: attemptNum, status: 'retried', approach });
    }

    // ── LOG ──
    await svc.entities.RunTelemetry.create({
      run_type: 'auto_healing_escalation', subsystem: 'autonomous', status: 'ok',
      started_at: now, records_written: failedFixes.length,
      message: `AutoHealingEscalation: ${resolved} retried, ${exhausted} exhausted`,
    });
    await svc.entities.Receipt.create({
      kind: 'validation', summary: `AutoHealingEscalation: ${resolved} fixes escalated, ${exhausted} exhausted to human review`,
      detail: JSON.stringify({ failed: failedFixes.length, resolved, exhausted, details: details.slice(0, 20) }).slice(0, 6000),
      source: 'auto_healing_escalation', provenance: 'MEASURED', occurred_at: now,
    });

    return Response.json({ ok: true, escalated: failedFixes.length, resolved, exhausted, details });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}