import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const now = new Date().toISOString();
    // Load concluded experiments and all ranking methods
    const experiments = await base44.asServiceRole.entities.Experiment.filter({ status: 'concluded' });
    const methods = await base44.asServiceRole.entities.RankingMethod.list('-discovered_at', 200);

    // Quantitative attribution: parse the measured score delta from each concluded
    // experiment and promote/demote ranking methods by category. Replaces the
    // dead-end regex ('lift'/'improved' keyword) approach with numeric comparison.
    const GAP_TO_CATEGORY = {
      TECHNICAL: 'technical', CONTENT: 'content', AUTHORITY: 'authority',
      SEO: 'content', SURFACE: 'ux', AEO: 'ai_search', SAO: 'ai_search',
      INTENT: 'content', SYSTEM: 'technical',
    };
    let promoted = 0, demoted = 0, unchanged = 0;
    for (const exp of experiments) {
      const m = (exp.result_summary || '').match(/lift ([+-]?[0-9.]+)/);
      if (!m) { unchanged++; continue; }
      const lift = Number(m[1]);
      const category = GAP_TO_CATEGORY[exp.method];
      if (!category) { unchanged++; continue; }
      const categoryMethods = methods.filter((mth) => mth.category === category);
      if (!categoryMethods.length) { unchanged++; continue; }
      for (const mth of categoryMethods) {
        if (lift >= 2) {
          const newLevel = Math.min(7, (mth.proof_level || 0) + 1);
          await base44.asServiceRole.entities.RankingMethod.update(mth.id, { proof_level: newLevel, status: 'validated' });
          promoted++;
        } else if (lift <= -2) {
          const newLevel = Math.max(0, (mth.proof_level || 0) - 1);
          await base44.asServiceRole.entities.RankingMethod.update(mth.id, { proof_level: newLevel, status: newLevel > 2 ? 'deprecated' : 'discovered' });
          demoted++;
        } else { unchanged++; }
      }
    }

    await base44.asServiceRole.entities.Receipt.create({
      kind: 'validation',
      summary: `Attribution loop: ${promoted} methods validated, ${demoted} demoted, ${unchanged} unchanged`,
      detail: `Correlated ${experiments.length} concluded experiments against ${methods.length} ranking methods`,
      source: 'MethodAttribution',
      provenance: 'INFERRED',
      occurred_at: now
    });
    await base44.asServiceRole.entities.RunTelemetry.create({
      run_type: 'validation', subsystem: 'experiment', status: 'ok',
      started_at: now, records_written: promoted + demoted,
      message: `${promoted} promoted, ${demoted} demoted`
    });

    return Response.json({ experiments_correlated: experiments.length, promoted, demoted, unchanged });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}