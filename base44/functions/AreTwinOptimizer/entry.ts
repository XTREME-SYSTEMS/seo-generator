import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { scoreFromRank, RANK_FLOOR, GOAL_RANK, newCycleId } from '../../shared/are.js';

// Rubik's-cube mode: run thousands of config mutations against the SERP digital twin,
// log every move, and queue the winning config for deployment through the guarded loop.
const MODULES = ['technical', 'content', 'intent', 'authority', 'presentation', 'aeo', 'sao', 'entity'];
const WEIGHTS = { technical: 0.22, content: 0.24, intent: 0.14, authority: 0.26, presentation: 0.08, aeo: 0.12, sao: 0.10, entity: 0.09 };
const EXPERIMENTAL = ['aeo', 'sao', 'entity'];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    if (!body.client_id || !body.url) {
      return Response.json({ error: 'client_id and url are required' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const sessionId = body.session_id || newCycleId();
    const generations = Math.min(Number(body.generations) || 6, 12);
    const populationSize = Math.min(Number(body.population) || 220, 400);

    const rows = (await svc.entities.AreSheetRow.filter({ client_id: body.client_id, url: body.url }, '-priority_score', 100))
      .filter((r) => !body.query || r.query === body.query);
    if (!rows.length) return Response.json({ error: 'No sheet rows for this URL yet — run a reflect pass first.' }, { status: 400 });

    const target = rows[0];
    const startRank = Number(target.rank) || RANK_FLOOR;

    const twins = await svc.entities.SerpDigitalTwin.filter({ client_id: body.client_id, query: target.query }, '-snapshot_at', 1);
    const churn = twins.length ? Number(twins[0].churn_score) || 0.3 : 0.3;
    const difficulty = Math.max(0.15, Math.min(0.95, 0.4 + churn * 0.4 + (startRank > 50 ? 0.2 : 0)));

    let best = null;
    let population = Array.from({ length: populationSize }, () => randomConfig());
    let evaluated = 0;

    for (let gen = 1; gen <= generations; gen += 1) {
      const scored = population.map((config) => {
        const predictedRank = predictRank(startRank, config, difficulty);
        return { config, predictedRank, predictedDelta: Math.round((startRank - predictedRank) * 10) / 10 };
      }).sort((a, b) => a.predictedRank - b.predictedRank);

      evaluated += scored.length;
      if (!best || scored[0].predictedRank < best.predictedRank) best = { ...scored[0], generation: gen };

      // Log a representative slice of every generation (full population is logged in aggregate).
      const slice = scored.slice(0, 6).map((s) => ({
        client_id: body.client_id,
        session_id: sessionId,
        url: body.url,
        query: target.query,
        generation: gen,
        config: JSON.stringify(s.config),
        modules: MODULES.filter((m) => s.config[m] >= 60),
        predicted_rank: s.predictedRank,
        predicted_delta: s.predictedDelta,
        is_winner: false,
        provenance: 'MODELED',
        created_at: new Date().toISOString(),
      }));
      await svc.entities.TwinMutation.bulkCreate(slice);

      const elite = scored.slice(0, Math.max(8, Math.floor(scored.length * 0.15)));
      population = elite.map((e) => e.config).concat(
        Array.from({ length: populationSize - elite.length }, () => mutate(elite[Math.floor(Math.random() * elite.length)].config)),
      );
    }

    const winner = await svc.entities.TwinMutation.create({
      client_id: body.client_id,
      session_id: sessionId,
      url: body.url,
      query: target.query,
      generation: best.generation,
      config: JSON.stringify(best.config),
      modules: MODULES.filter((m) => best.config[m] >= 60),
      predicted_rank: best.predictedRank,
      predicted_delta: best.predictedDelta,
      is_winner: true,
      provenance: 'MODELED',
      created_at: new Date().toISOString(),
    });

    // Queue the winning config through the guarded deploy path — never a direct write.
    const focusModules = MODULES.filter((m) => best.config[m] >= 65);
    await svc.entities.AreSheetRow.update(target.id, {
      status: 'queued',
      recommended_treatment: `TWIN-OPTIMIZED (${focusModules.join(', ') || 'balanced'}): ${target.recommended_treatment}`,
      priority_score: Math.max(target.priority_score || 0, best.predictedDelta * 10),
    });

    await svc.entities.Receipt.create({
      client_id: body.client_id,
      kind: 'model_routing',
      summary: `Twin optimizer: ${evaluated} mutations, winner predicts rank ${best.predictedRank}`,
      detail: `${body.url} | ${target.query} | session=${sessionId} | modules=${focusModules.join(',')}`,
      source: 'AreTwinOptimizer',
      provenance: 'MODELED',
      occurred_at: new Date().toISOString(),
    });

    return Response.json({
      ok: true,
      session_id: sessionId,
      url: body.url,
      query: target.query,
      start_rank: startRank,
      mutations_evaluated: evaluated,
      generations,
      difficulty: Math.round(difficulty * 100) / 100,
      winner: {
        id: winner.id,
        predicted_rank: best.predictedRank,
        predicted_delta: best.predictedDelta,
        predicted_score: scoreFromRank(best.predictedRank),
        modules: focusModules,
        config: best.config,
      },
      goal_reached_in_twin: best.predictedRank <= GOAL_RANK,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function randomConfig() {
  return MODULES.reduce((acc, m) => ({ ...acc, [m]: Math.floor(Math.random() * 101) }), {});
}

function mutate(config) {
  const next = { ...config };
  const count = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i += 1) {
    const m = MODULES[Math.floor(Math.random() * MODULES.length)];
    next[m] = Math.max(0, Math.min(100, next[m] + Math.round((Math.random() - 0.5) * 50)));
  }
  return next;
}

function predictRank(startRank, config, difficulty) {
  let effort = 0;
  let weightSum = 0;
  MODULES.forEach((m) => {
    const conf = EXPERIMENTAL.includes(m) ? 0.55 : 1;
    effort += (config[m] / 100) * WEIGHTS[m] * conf;
    weightSum += WEIGHTS[m];
  });
  const normalized = weightSum ? effort / weightSum : 0;
  // Diminishing returns: piling every module to 100 does not linearly buy rank.
  const yieldFactor = Math.pow(normalized, 0.75) / (0.45 + difficulty * 0.75);
  const span = Math.max(0, startRank - GOAL_RANK);
  const closed = span * Math.min(1, yieldFactor);
  return Math.max(GOAL_RANK, Math.round((startRank - closed) * 10) / 10);
}