import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { validateDeploy, newCycleId, scoreFromRank } from '../../shared/are.js';

// ARE loop steps 5-6: snapshot last-known-good, deploy the highest-priority treatments,
// validate against the deploy guidelines, and write the reflection record the auditor reads.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const svc = base44.asServiceRole;
    const cycleId = body.cycle_id || newCycleId();
    const batchSize = Math.min(Number(body.batch_size) || 5, 20);

    const clients = body.client_id
      ? [await svc.entities.Client.get(body.client_id)]
      : await svc.entities.Client.list('created_date', 100);

    const results = [];

    for (const client of clients.filter(Boolean)) {
      const candidates = (await svc.entities.AreSheetRow.filter({ client_id: client.id }, '-priority_score', 200))
        .filter((r) => ['open', 'queued'].includes(r.status) && r.gap_type !== 'NONE' && !r.binding_constraint)
        .slice(0, batchSize);

      if (!candidates.length) { results.push({ client: client.name, deployed: 0, note: 'nothing eligible' }); continue; }

      for (const row of candidates) {
        // 1. Snapshot last-known-good BEFORE touching anything.
        const priorGood = await svc.entities.ModelSnapshot.filter(
          { client_id: client.id, url: row.url, is_last_known_good: true }, '-captured_at', 5,
        );
        if (priorGood.length) {
          await svc.entities.ModelSnapshot.bulkUpdate(priorGood.map((s) => ({ id: s.id, is_last_known_good: false })));
        }
        const snapshot = await svc.entities.ModelSnapshot.create({
          client_id: client.id,
          url: row.url,
          label: `pre-deploy ${row.gap_type} · ${row.query}`,
          cycle_id: cycleId,
          config: JSON.stringify({
            query: row.query,
            index_state: row.index_state,
            canonical_agrees: row.canonical_agrees,
            rank: row.rank,
            impressions: row.impressions,
            clicks: row.clicks,
            ctr: row.ctr,
            score: row.score,
            gap_type: row.gap_type,
            treatment: row.recommended_treatment,
          }),
          score_at_snapshot: row.score || 0,
          is_last_known_good: true,
          captured_at: new Date().toISOString(),
        });

        // 2. Validate against the deploy guidelines.
        const validation = validateDeploy(row, true);

        // 3. Deploy (or refuse and record why).
        const deployed = validation.passed;
        await svc.entities.AreSheetRow.update(row.id, {
          status: deployed ? 'deployed' : 'blocked',
          binding_constraint: deployed ? '' : `Deploy guidelines failed: ${validation.failed.join(', ')}`,
        });

        const expectedScore = Math.min(100, (row.score || 0) + expectedLift(row));

        await svc.entities.ReflectionRecord.create({
          client_id: client.id,
          cycle_id: cycleId,
          phase: deployed ? 'implement' : 'validate',
          url: row.url,
          query: row.query,
          deployed: deployed ? row.recommended_treatment : 'refused — guidelines not met',
          expected: deployed
            ? `${row.gap_type} treatment on ${row.targeted_system}; score ${row.score} -> ~${expectedScore}`
            : validation.failed.join(', '),
          expected_score: expectedScore,
          validation_status: deployed ? 'pending' : 'fail',
          failed_guidelines: validation.failed,
          rolled_back_to: '',
          provenance: 'MODELED',
          occurred_at: new Date().toISOString(),
        });

        await svc.entities.Receipt.create({
          client_id: client.id,
          kind: 'gate_decision',
          summary: deployed
            ? `Deployed ${row.gap_type} treatment · ${row.query}`
            : `Refused deploy · ${row.query} · ${validation.failed.join(', ')}`,
          detail: `${row.url} | snapshot=${snapshot.id} | cycle=${cycleId}`,
          source: 'AreImplement',
          provenance: 'MEASURED',
          occurred_at: new Date().toISOString(),
        });

        results.push({ client: client.name, url: row.url, query: row.query, deployed, failed: validation.failed });
      }
    }

    return Response.json({ ok: true, cycle_id: cycleId, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function expectedLift(row) {
  const base = { TECHNICAL: 22, CONTENT: 14, AUTHORITY: 9, SEO: 11, SURFACE: 5, AEO: 6, SAO: 5 };
  const lift = base[row.gap_type] || 4;
  const headroom = 100 - scoreFromRank(row.rank);
  return Math.round(Math.min(lift, headroom * 0.6) * 10) / 10;
}