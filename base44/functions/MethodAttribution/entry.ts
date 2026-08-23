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
    const methodByName = new Map(methods.map((m) => [m.name.toLowerCase(), m]));

    let promoted = 0, demoted = 0, unchanged = 0;
    for (const exp of experiments) {
      // Match experiment to a ranking method via treatment / method / name fields
      const key = (exp.method || exp.treatment || exp.name || '').toLowerCase();
      const m = methodByName.get(key);
      if (!m) { unchanged++; continue; }
      const liftText = exp.result_summary || '';
      const positive = /lift|increase|improved|positive|gained|up|rose/i.test(liftText);
      const negative = /drop|decrease|declined|negative|fell|lost|down/i.test(liftText);
      if (positive && !negative) {
        const newLevel = Math.min(7, (m.proof_level || 0) + 2);
        await base44.asServiceRole.entities.RankingMethod.update(m.id, { proof_level: newLevel, status: 'validated' });
        promoted++;
      } else if (negative && !positive) {
        const newLevel = Math.max(0, (m.proof_level || 0) - 1);
        await base44.asServiceRole.entities.RankingMethod.update(m.id, { proof_level: newLevel, status: m.proof_level > 2 ? 'deprecated' : 'discovered' });
        demoted++;
      } else {
        unchanged++;
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