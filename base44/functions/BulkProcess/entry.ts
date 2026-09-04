import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// BulkProcess — takes an array of URLs and runs the full autonomous audit +
// optimization cycle on each one. This is the bulk processing feature that
// lets the user select multiple URLs from the inventory and run everything
// at once: detect asymmetries → generate suggestions → deploy treatments →
// fix blocked rows → validate.
//
// Invoke: base44.functions.invoke('BulkProcess', { urls: [...], phases: ['detect','suggest','implement','fix','validate'] })
// Returns: { ok, processed, results: [{ url, phases_run, status, error }] }

const ALL_PHASES = ['detect', 'suggest', 'implement', 'fix', 'validate'];

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const urls: string[] = body.urls || [];
    const phases: string[] = body.phases || ALL_PHASES;
    const now = new Date().toISOString();

    if (!urls.length) {
      return Response.json({ error: 'No URLs provided. Pass { urls: [...] }' }, { status: 400 });
    }

    console.log(`[BulkProcess] Processing ${urls.length} URLs, phases: ${phases.join(', ')}`);

    const results = [];
    let processed = 0;

    // ── PHASE 1: DETECT ASYMMETRIES (batch) ──
    if (phases.includes('detect')) {
      try {
        await svc.functions.invoke('DetectAsymmetries', { urls });
        console.log('[BulkProcess] Detect phase complete');
      } catch (e) {
        console.error('[BulkProcess] Detect failed:', e.message);
      }
    }

    // ── PHASE 2: SUGGEST (batch) ──
    if (phases.includes('suggest')) {
      try {
        await svc.functions.invoke('AreSuggest', { urls });
        console.log('[BulkProcess] Suggest phase complete');
      } catch (e) {
        console.error('[BulkProcess] Suggest failed:', e.message);
      }
    }

    // ── PHASE 3-5: PER-URL PROCESSING ──
    for (const url of urls) {
      const urlResult = { url, phases_run: [], status: 'ok', error: null };

      // IMPLEMENT
      if (phases.includes('implement')) {
        try {
          await svc.functions.invoke('AreImplement', { url });
          urlResult.phases_run.push('implement');
        } catch (e) {
          urlResult.error = e.message;
          urlResult.status = 'degraded';
        }
      }

      // FIX
      if (phases.includes('fix')) {
        try {
          await svc.functions.invoke('FixEngine', { url, max_attempts: 3 });
          urlResult.phases_run.push('fix');
        } catch (e) {
          urlResult.error = e.message;
          urlResult.status = 'degraded';
        }
      }

      // VALIDATE
      if (phases.includes('validate')) {
        try {
          await svc.functions.invoke('ValidateSystem', { url });
          urlResult.phases_run.push('validate');
        } catch (e) {
          urlResult.error = e.message;
          urlResult.status = 'degraded';
        }
      }

      results.push(urlResult);
      processed++;
      console.log(`[BulkProcess] ${processed}/${urls.length}: ${url} → ${urlResult.status}`);
    }

    // ── LOG ──
    await svc.entities.RunTelemetry.create({
      run_type: 'bulk_process',
      subsystem: 'orchestration',
      status: 'ok',
      started_at: now,
      records_written: processed,
      message: `BulkProcess: ${processed} URLs processed across phases [${phases.join(', ')}]`,
    });

    await svc.entities.Receipt.create({
      kind: 'validation',
      summary: `BulkProcess: ${processed} URLs audited and optimized`,
      detail: JSON.stringify({ urls: urls.length, phases, processed, results: results.slice(0, 50) }, null, 2).slice(0, 8000),
      source: 'bulk_process',
      provenance: 'MEASURED',
      occurred_at: now,
    });

    return Response.json({
      ok: true,
      processed,
      phases,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}