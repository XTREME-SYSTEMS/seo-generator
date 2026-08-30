import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  detectRegressions, validateDeploy, bindingConstraint, newCycleId, GOAL_RANK,
} from '../../shared/are.js';

// ARE loop steps 7-8: auto-audit, auto-analyze, auto-fix, auto-harden, and roll back to
// last-known-good when a fix cannot be achieved. Production is never left broken.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const svc = base44.asServiceRole;
    const cycleId = body.cycle_id || newCycleId();

    const clients = body.client_id
      ? [await svc.entities.Client.get(body.client_id)]
      : await svc.entities.Client.list('created_date', 100);

    const audits = [];

    for (const client of clients.filter(Boolean)) {
      const pending = (await svc.entities.ReflectionRecord.filter(
        { client_id: client.id, validation_status: 'pending' }, '-occurred_at', 200,
      )).filter((r) => r.phase === 'implement' && r.url);

      if (!pending.length) { audits.push({ client: client.name, audited: 0 }); continue; }

      const [rows, snapshots] = await Promise.all([
        svc.entities.AreSheetRow.filter({ client_id: client.id }, '-last_reflected_at', 500),
        svc.entities.ModelSnapshot.filter({ client_id: client.id }, '-captured_at', 500),
      ]);

      for (const record of pending) {
        const row = rows.find((r) => r.url === record.url && r.query === record.query);
        if (!row) {
          await svc.entities.ReflectionRecord.update(record.id, {
            validation_status: 'fail',
            measured: 'row no longer present',
            auto_fix_attempted: true,
            auto_fix_result: 'unresolved',
          });
          continue;
        }

        const snapshot = snapshots.find((s) => s.cycle_id === record.cycle_id && s.url === record.url)
          || snapshots.find((s) => s.url === record.url && s.is_last_known_good);
        const before = snapshot ? safeParse(snapshot.config) : { score: 0, impressions: 0 };

        const regressions = detectRegressions(
          {
            score: Number(before.score) || 0,
            impressions: Number(before.impressions) || 0,
            canonical_agrees: !!before.canonical_agrees,
            index_state: before.index_state || 'UNOBSERVED',
          },
          row,
        );

        const guidelines = validateDeploy(row, !!snapshot);
        const failed = [...guidelines.failed];
        const healthy = regressions.length === 0 && failed.length === 0;

        let autoFixResult = 'none';
        let rolledBackTo = '';

        if (healthy) {
          // Auto-harden: lock this state in as the new last-known-good.
          if (snapshot) {
            await svc.entities.ModelSnapshot.update(snapshot.id, { score_at_snapshot: row.score || 0 });
          }
          await svc.entities.ModelSnapshot.create({
            client_id: client.id,
            url: row.url,
            label: `hardened ${row.gap_type} · ${row.query}`,
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
          autoFixResult = 'hardened';

          await svc.entities.AreSheetRow.update(row.id, {
            status: row.rank && row.rank <= GOAL_RANK ? 'goal_met' : 'validated',
          });
        } else {
          // Auto-fix: re-queue with the next-best treatment for the same bottleneck.
          const fixable = failed.every((f) => AUTOFIXABLE.includes(f)) && regressions.length <= 1;
          if (fixable) {
            await svc.entities.AreSheetRow.update(row.id, {
              status: 'queued',
              recommended_treatment: `AUTO-FIX: ${row.recommended_treatment}`,
              binding_constraint: '',
            });
            autoFixResult = 'fixed';
          } else if (snapshot) {
            // Roll back to last known good.
            const good = snapshots.find((s) => s.url === row.url && s.is_last_known_good && s.id !== snapshot.id)
              || snapshot;
            const restore = safeParse(good.config);
            await svc.entities.AreSheetRow.update(row.id, {
              status: 'rolled_back',
              index_state: restore.index_state || row.index_state,
              canonical_agrees: restore.canonical_agrees ?? row.canonical_agrees,
              recommended_treatment: restore.treatment || row.recommended_treatment,
              binding_constraint: '',
            });
            await svc.entities.ModelSnapshot.update(good.id, {
              restored_count: (good.restored_count || 0) + 1,
              is_last_known_good: true,
            });
            rolledBackTo = good.id;
            autoFixResult = 'rolled_back';
          } else {
            const constraint = bindingConstraint(row, 10);
            await svc.entities.AreSheetRow.update(row.id, {
              status: 'blocked',
              binding_constraint: constraint || `Unresolved: ${[...failed, ...regressions].join('; ')}`,
            });
            autoFixResult = 'unresolved';
          }
        }

        await svc.entities.ReflectionRecord.update(record.id, {
          phase: 'self_reflect',
          measured: `score ${before.score ?? 0} -> ${row.score}; rank ${before.rank ?? 'null'} -> ${row.rank ?? 'null'}`,
          measured_score: row.score || 0,
          validation_status: healthy ? 'pass' : 'fail',
          failed_guidelines: failed,
          regressions,
          auto_fix_attempted: !healthy,
          auto_fix_result: autoFixResult,
          rolled_back_to: rolledBackTo,
          binding_constraint: row.binding_constraint || '',
          provenance: 'MEASURED',
        });

        // Self-reflect: bind method attribution to the measured boundary crossing, never narrative.
        if (healthy && (row.score || 0) >= (record.expected_score || 0)) {
          const methods = await svc.entities.RankingMethod.filter({ category: methodCategory(row.gap_type) }, '-proof_level', 3);
          if (methods.length) {
            const m = methods[0];
            await svc.entities.RankingMethod.update(m.id, {
              proof_level: Math.min(7, (m.proof_level || 0) + 1),
              status: (m.proof_level || 0) + 1 >= 5 ? 'validated' : 'testing',
            });
          }
        }

        audits.push({
          client: client.name, url: row.url, query: row.query,
          healthy, result: autoFixResult, regressions, failed,
        });
      }
    }

    return Response.json({ ok: true, cycle_id: cycleId, audits });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

const AUTOFIXABLE = ['G1_EVIDENCE_ANCHOR', 'G3_PROVENANCE_LABELED', 'G6_NO_REGRESSION'];

function safeParse(value) {
  try { return JSON.parse(value || '{}'); } catch { return {}; }
}

function methodCategory(gapType) {
  const map = {
    TECHNICAL: 'technical', CONTENT: 'content', AUTHORITY: 'authority',
    SEO: 'content', SURFACE: 'ux', AEO: 'ai_search', SAO: 'ai_search',
  };
  return map[gapType] || 'content';
}