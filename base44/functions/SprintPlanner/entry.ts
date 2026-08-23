import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const clientId = body.client_id || null;
    const now = new Date().toISOString();

    // Select fastest, safe-to-moderate methods not yet deprecated
    const methods = await base44.asServiceRole.entities.RankingMethod.list('-discovered_at', 200);
    const speedRank = { instant: 0, fast: 1, medium: 2, slow: 3 };
    const eligible = methods
      .filter((m) => m.status !== 'deprecated' && ['safe', 'moderate'].includes(m.risk_level))
      .sort((a, b) => (speedRank[a.speed_tier] ?? 9) - (speedRank[b.speed_tier] ?? 9))
      .slice(0, 10);

    const jobs = eligible.map((m) => ({
      agent_id: 'sprint_runner',
      client_id: clientId,
      kind: `apply:${m.name}`,
      status: 'queued',
      requires_approval: true,
      queued_at: now
    }));

    let created = [];
    if (jobs.length) created = await base44.asServiceRole.entities.AgentJob.bulkCreate(jobs);

    await base44.asServiceRole.entities.Receipt.create({
      kind: 'gate_decision',
      summary: `7-day sprint planned${clientId ? ' for client ' + clientId : ''}: ${created.length} method applications queued`,
      detail: eligible.map((m) => `${m.name} (${m.speed_tier}, ${m.risk_level})`).join('; '),
      source: 'SprintPlanner',
      provenance: 'MODELED',
      occurred_at: now
    });

    return Response.json({ client_id: clientId, methods_selected: eligible.length, jobs_queued: created.length, plan: eligible.map((m) => ({ name: m.name, speed: m.speed_tier, risk: m.risk_level, mechanism: m.mechanism })) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}