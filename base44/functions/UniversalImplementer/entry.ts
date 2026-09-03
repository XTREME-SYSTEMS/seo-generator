import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Universal autonomous implementer: given a URL + business + industry, builds the
// perfect step-by-step implementation plan (ordered by fastest-greatest impact),
// persists it as ImplementationStep records, and executes the first N steps inline.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const svc = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const { url, business, industry, client_id } = body;
    const executeSteps = Math.min(Number(body.execute_steps) || 5, 8);
    if (!url && !industry) return Response.json({ error: 'url or industry required' }, { status: 400 });

    const runId = 'run_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    // Payload builders per implement_function — each function gets the shape it expects.
    const payloadFor = (fn) => {
      switch (fn) {
        case 'SyncSearchConsole': return { action: 'sync', limit: 50 };
        case 'SearchConsoleIndex': return { action: 'submit_all_sitemaps' };
        case 'DetectAsymmetries': return { client_id, url };
        case 'AreSuggest': return { client_id, surface: 'sheet' };
        case 'AreBenchmark': return { client_id, url };
        case 'AreTwinOptimizer': return { client_id, url };
        case 'FixEngine': return { url, max_attempts: 2 };
        case 'SerpMeasurement': return { url };
        case 'AreReflect': return { client_id };
        case 'AreAudit': return { client_id };
        case 'AreImplement': return { client_id };
        case 'GenerateRankingMethods': return {};
        case 'VisionCortexWatch': return {};
        case 'AlgorithmUpdateMonitor': return {};
        case 'OnboardClient': return { url, industry, business };
        case 'UrlInventorySync': return {};
        case 'ValidateSystem': return {};
        case 'MethodAttribution': return {};
        case 'SprintPlanner': return { client_id };
        case 'TractionScanner': return { url, industry };
        default: return null;
      }
    };

    const speedWeight = { instant: 4, fast: 3, medium: 2, slow: 1 };
    const caps = await svc.entities.Capability.list('-impact_score', 500);
    const plan = caps
      .filter((c) => c.status === 'implemented' || c.status === 'available')
      .filter((c) => payloadFor(c.implement_function) !== null)
      .map((c) => ({
        ...c,
        priority_score: (c.impact_score || 50) * (speedWeight[c.speed_tier] || 2),
      }))
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, 20);

    const nowIso = new Date().toISOString();
    const steps = [];
    for (let i = 0; i < plan.length; i++) {
      const c = plan[i];
      const step = await svc.entities.ImplementationStep.create({
        run_id: runId,
        url: url || null,
        business: business || null,
        industry: industry || null,
        client_id: client_id || null,
        step_number: i + 1,
        capability_name: c.name,
        category: c.category,
        impact_score: c.impact_score || 50,
        speed_tier: c.speed_tier,
        delivery: c.delivery,
        priority_score: c.priority_score,
        status: 'pending',
      });
      steps.push(step);
    }

    // Execute the first N steps inline (time budget). Remaining stay pending for the next run / ARE loop.
    const executed = [];
    for (let i = 0; i < Math.min(executeSteps, steps.length); i++) {
      const step = steps[i];
      const cap = plan[i];
      const startedAt = new Date().toISOString();
      await svc.entities.ImplementationStep.update(step.id, { status: 'running', started_at: startedAt });
      try {
        const payload = payloadFor(cap.implement_function);
        const result = await base44.functions.invoke(cap.implement_function, payload);
        const summary = typeof result === 'string' ? result : (result?.ok ? `ok — ${JSON.stringify(result).slice(0, 200)}` : JSON.stringify(result).slice(0, 300));
        await svc.entities.ImplementationStep.update(step.id, { status: 'done', result: summary, completed_at: new Date().toISOString() });
        executed.push({ step: step.step_number, capability: cap.name, status: 'done' });
      } catch (e) {
        await svc.entities.ImplementationStep.update(step.id, { status: 'failed', result: e.message, completed_at: new Date().toISOString() });
        executed.push({ step: step.step_number, capability: cap.name, status: 'failed', error: e.message });
      }
    }

    await svc.entities.Receipt.create({
      kind: 'gate_decision',
      summary: `UniversalImplementer — run ${runId} — ${steps.length} steps planned, ${executed.length} executed`,
      detail: JSON.stringify(executed).slice(0, 4000),
      source: 'universal_implementer',
      provenance: 'MODELED',
      occurred_at: nowIso,
    });

    return Response.json({ ok: true, run_id: runId, planned: steps.length, executed: executed.length, steps: executed, remaining_pending: Math.max(0, steps.length - executeSteps) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}