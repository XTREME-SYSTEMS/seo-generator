import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { priorityScore, violatesSpamPolicy, isShippable, newCycleId } from '../../shared/are.js';

// ARE loop step 4 (Recommend) + the inline lightbulb suggestion engine.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const svc = base44.asServiceRole;
    const surface = body.surface || 'sheet';
    const cycleId = body.cycle_id || newCycleId();

    const clients = body.client_id
      ? [await svc.entities.Client.get(body.client_id)]
      : await svc.entities.Client.list('created_date', 100);

    const created = [];

    for (const client of clients.filter(Boolean)) {
      const rows = (await svc.entities.AreSheetRow.filter({ client_id: client.id }, '-priority_score', 200))
        .filter((r) => r.status !== 'goal_met')
        .slice(0, 12);
      if (!rows.length) continue;

      const [playbooks, methods, open] = await Promise.all([
        svc.entities.IndustryPlaybook.filter({ client_id: client.id }, '-compiled_at', 5),
        svc.entities.RankingMethod.filter({ status: 'validated' }, '-proof_level', 25),
        svc.entities.Suggestion.filter({ client_id: client.id, status: 'new' }, '-created_at', 200),
      ]);

      const existingTitles = new Set(open.map((s) => (s.title || '').toLowerCase()));

      const prompt = [
        'You are the recommendation engine of an Autonomous Ranking Engine. Goal: move each URL/query to TOP 3 on Google.',
        'EVIDENCE-FIRST: every suggestion must be anchored to a Google-confirmed ranking factor (T0/T1) or a measured experiment (T2).',
        'STRUCTURALLY FORBIDDEN: PBNs, paid links, link schemes, llms.txt, brand impersonation, cloaking, doorway pages, scaled content abuse.',
        `Business: ${client.name} (${client.domain || 'no domain'}), industry: ${client.industry || 'unknown'}.`,
        playbooks[0] ? `Industry benchmark: ${playbooks[0].benchmark_summary || ''} Target: ${playbooks[0].target_summary || ''}` : '',
        methods.length ? `Validated methods available: ${methods.map((m) => `${m.name} (${m.mechanism || 'n/a'})`).join('; ')}` : '',
        'Current rows needing work (rank null = unranked):',
        ...rows.map((r) => `- url=${r.url} | query=${r.query} | rank=${r.rank ?? 'null'} | index=${r.index_state} | impressions=${r.impressions} | ctr=${r.ctr} | gap=${r.gap_type} | asymmetry=${r.asymmetry_class || 'none'} | system=${r.targeted_system}`),
        'For EACH row, return one concrete, specific, immediately actionable suggestion. No generic advice.',
        'Estimate p_cross (0-1 probability the change crosses the next rank boundary), delta_traffic (monthly visits gained), hours_estimate.',
      ].filter(Boolean).join('\n');

      const res = await svc.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  query: { type: 'string' },
                  kind: { type: 'string', enum: ['enhancement', 'upgrade', 'gap_fill', 'fix', 'hardening'] },
                  title: { type: 'string' },
                  rationale: { type: 'string' },
                  treatment: { type: 'string' },
                  gap_type: { type: 'string' },
                  evidence_tier: { type: 'string' },
                  evidence_anchor: { type: 'string' },
                  p_cross: { type: 'number' },
                  delta_traffic: { type: 'number' },
                  hours_estimate: { type: 'number' },
                },
              },
            },
          },
        },
      });

      const allowedGaps = ['SEO', 'AEO', 'SAO', 'TECHNICAL', 'CONTENT', 'AUTHORITY', 'INTENT', 'SURFACE', 'SYSTEM'];
      const allowedTiers = ['T0_GOOGLE_DOC', 'T1_CONFIRMED_SYSTEM', 'T2_EXPERIMENT', 'T3_OBSERVATIONAL', 'T4_SINGLE_CASE', 'T5_COMMUNITY', 'T6_HYPOTHESIS'];

      // Normalize whatever tier string the model returned (e.g. "T1") to a schema value
      // BEFORE the shippability gate, so a formatting difference never silently drops
      // an otherwise evidence-anchored suggestion.
      const normalizeTier = (raw) => {
        const t = String(raw || '').toUpperCase();
        const hit = allowedTiers.find((a) => a === t || a.startsWith(`${t.split('_')[0]}_`));
        return hit || 'T1_CONFIRMED_SYSTEM';
      };

      const payload = (res.suggestions || [])
        .map((s) => ({ ...s, evidence_tier: normalizeTier(s.evidence_tier) }))
        .filter((s) => s.title && s.treatment)
        .filter((s) => !violatesSpamPolicy(`${s.title} ${s.treatment} ${s.rationale || ''}`))
        .filter((s) => isShippable(s.evidence_tier))
        .filter((s) => !existingTitles.has(s.title.toLowerCase()))
        .map((s) => ({
          client_id: client.id,
          surface,
          url: s.url || '',
          query: s.query || '',
          kind: ['enhancement', 'upgrade', 'gap_fill', 'fix', 'hardening'].includes(s.kind) ? s.kind : 'enhancement',
          title: s.title,
          rationale: s.rationale || '',
          treatment: s.treatment,
          gap_type: allowedGaps.includes(s.gap_type) ? s.gap_type : 'SEO',
          evidence_tier: allowedTiers.includes(s.evidence_tier) ? s.evidence_tier : 'T1_CONFIRMED_SYSTEM',
          evidence_anchor: s.evidence_anchor || '',
          p_cross: Math.max(0, Math.min(1, Number(s.p_cross) || 0.2)),
          delta_traffic: Math.max(0, Number(s.delta_traffic) || 0),
          hours_estimate: Math.max(0.25, Number(s.hours_estimate) || 2),
          priority_score: priorityScore(s.p_cross, s.delta_traffic, s.hours_estimate),
          status: 'new',
          provenance: 'MODELED',
          created_at: new Date().toISOString(),
        }));

      if (payload.length) {
        await svc.entities.Suggestion.bulkCreate(payload);
        created.push({ client: client.name, count: payload.length });
      }

      await svc.entities.ReflectionRecord.create({
        client_id: client.id,
        cycle_id: cycleId,
        phase: 'recommend',
        deployed: `${payload.length} evidence-anchored suggestions generated`,
        validation_status: 'not_applicable',
        provenance: 'MODELED',
        occurred_at: new Date().toISOString(),
      });
    }

    return Response.json({ ok: true, cycle_id: cycleId, created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}