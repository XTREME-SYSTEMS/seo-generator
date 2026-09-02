import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Vision Cortex — the Brain. Watches the entire SEO Generator system and surfaces
// the highest-leverage system-level enhancements to reach the top-3 ranking goal.
// Pattern ported from the Vision Cortex systemAnalyst archetype: snapshot the
// system → InvokeLLM (web-search-grounded) → persist ranked enhancements.

const CATEGORY_MAP = {
  feature: 'orchestration',
  hardening: 'validation',
  optimization: 'execution',
  healing: 'validation',
  doctrine: 'orchestration',
  integration: 'connectors',
  measurement: 'measurement',
  intelligence: 'intelligence',
  speed: 'speed',
  infrastructure: 'infrastructure',
  connectors: 'connectors',
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // Admin UI calls AND trusted workflow calls (no user token).
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const svc = base44.asServiceRole;

    // 1. Snapshot the system
    const [telemetry, tests, gaps, reflections, blockedRows, connectors, suggestions, serp, clients] = await Promise.all([
      svc.entities.RunTelemetry.list('-started_at', 20).catch(() => []),
      svc.entities.ValidationTest.list('-last_run_at', 50).catch(() => []),
      svc.entities.SystemGap.list('-logged_at', 30).catch(() => []),
      svc.entities.ReflectionRecord.list('-occurred_at', 20).catch(() => []),
      svc.entities.AreSheetRow.filter({ status: 'blocked' }, '-updated_date', 20).catch(() => []),
      svc.entities.ConnectorStatus.list('-updated_date', 20).catch(() => []),
      svc.entities.Suggestion.filter({ status: 'new' }, '-created_at', 20).catch(() => []),
      svc.entities.SerpMeasurement.list('-measured_at', 10).catch(() => []),
      svc.entities.Client.list('-updated_date', 20).catch(() => []),
    ]);

    const failingTests = tests.filter((t) => t.status === 'fail');
    const blockedTests = tests.filter((t) => t.status === 'blocked');
    const failedTelemetry = telemetry.filter((t) => t.status === 'failed');
    const regressions = reflections.filter((r) => r.validation_status === 'fail');
    const serpErrors = serp.filter((s) => !s.rank || s.rank === 0);

    const snapshot = {
      goal: 'Drive managed URLs to top-3 organic rankings via the Autonomous Ranking Engine (ARE) operating against a SERP Digital Twin. Four-system bottleneck model: Retrieval, Candidate Selection, Re-Ranking, Presentation.',
      clients: clients.map((c) => ({ name: c.name, domain: c.domain, status: c.status, industry: c.industry })),
      telemetry_failures: failedTelemetry.map((t) => ({ run_type: t.run_type, subsystem: t.subsystem, message: t.message })),
      validation: { total: tests.length, failing: failingTests.length, blocked: blockedTests.length, failing: failingTests.map((t) => t.name), blocked_gates: blockedTests.map((t) => t.name) },
      open_gaps: gaps.filter((g) => g.status === 'logged' || g.status === 'implementing').map((g) => ({ category: g.category, gap: g.gap, priority: g.priority, status: g.status })),
      regressions: regressions.map((r) => ({ url: r.url, expected: (r.expected || '').slice(0, 120), measured: (r.measured || '').slice(0, 120), binding_constraint: r.binding_constraint })),
      blocked_rows: blockedRows.map((r) => ({ url: r.url, query: r.query, binding_constraint: r.binding_constraint, gap_type: r.gap_type })),
      connectors: connectors.map((c) => ({ service: c.service, state: c.state, write_allowed: c.write_allowed, note: c.note })),
      pending_suggestions: suggestions.length,
      serp_measurement: { recent: serp.length, with_errors: serpErrors.length, recent_ranks: serp.filter((s) => s.rank > 0).map((s) => ({ query: s.query, rank: s.rank })) },
    };

    // 2. Run the brain — InvokeLLM with web search
    const prompt = `You are the Vision Cortex brain — the system-analysis agent watching the SEO Generator autonomous ranking platform. The system runs a four-system bottleneck model (Retrieval, Candidate Selection, Re-Ranking, Presentation) and an hourly ARE loop (reflect → suggest → implement → audit) against a SERP Digital Twin.

GOAL: drive managed URLs to top-3 organic rankings.

You are given a live snapshot of the system's state below. Identify the 5-8 highest-leverage SYSTEM-LEVEL constraints and enhancements that would most accelerate reaching the goal. Think like a principal staff engineer + SEO scientist: find the binding constraint, not symptoms. Ground every recommendation in the best known technical protocols (search the web for current best practice).

For each enhancement document:
1. existing_system — what exists now and how it works
2. downfall — what is wrong, missing, or suboptimal relative to the goal
3. recommended_enhancement — the specific, actionable fix
4. technical_protocols — the best protocols/frameworks/approaches found via web search
5. category — one of: measurement, intelligence, execution, orchestration, validation, speed, infrastructure, connectors
6. priority — critical|high|medium|low
7. binding_constraint — the single reason this is the bottleneck right now

SYSTEM SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}

Return the top 5-8 enhancements, ranked by impact on the goal. Then give a one-paragraph system_assessment of overall state vs goal.`;

    const llm = await svc.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          enhancements: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                existing_system: { type: 'string' },
                downfall: { type: 'string' },
                recommended_enhancement: { type: 'string' },
                technical_protocols: { type: 'array', items: { type: 'string' } },
                category: { type: 'string', enum: ['measurement', 'intelligence', 'execution', 'orchestration', 'validation', 'speed', 'infrastructure', 'connectors'] },
                priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                binding_constraint: { type: 'string' },
              },
              required: ['title', 'existing_system', 'downfall', 'recommended_enhancement', 'category', 'priority'],
            },
          },
          system_assessment: { type: 'string', description: 'One-paragraph overall assessment of system state vs the goal' },
        },
        required: ['enhancements'],
      },
    });

    const enhancements = llm.enhancements || [];
    const assessment = llm.system_assessment || '';

    // 3. Persist as SystemGap records (the optimization queue the ARE loop + operator act on)
    const now = new Date().toISOString();
    const created = [];
    for (const e of enhancements) {
      const cat = CATEGORY_MAP[e.category] || e.category || 'orchestration';
      const rec = await svc.entities.SystemGap.create({
        category: cat,
        gap: `${e.title} — ${e.downfall}`,
        recommendation: e.recommended_enhancement,
        priority: e.priority || 'high',
        phase: 1,
        status: 'logged',
        notes: `Vision Cortex brain · ${e.binding_constraint || ''} · protocols: ${(e.technical_protocols || []).join(' | ')}`.slice(0, 2000),
        logged_at: now,
      });
      created.push(rec.id);
    }

    await svc.entities.Receipt.create({
      kind: 'validation',
      summary: `Vision Cortex watch: ${enhancements.length} system enhancements identified`,
      detail: (assessment + '\n\n' + enhancements.map((e, i) => `${i + 1}. [${e.priority}] ${e.title}: ${e.recommended_enhancement}`).join('\n')).slice(0, 8000),
      source: 'vision_cortex_brain',
      provenance: 'INFERRED',
      occurred_at: now,
    });

    await svc.entities.RunTelemetry.create({
      run_type: 'vision_cortex_watch',
      subsystem: 'orchestration',
      status: 'ok',
      started_at: now,
      records_written: enhancements.length,
      message: (assessment || `${enhancements.length} enhancements`).slice(0, 180),
    });

    return Response.json({
      success: true,
      system_assessment: assessment,
      snapshot_summary: {
        clients: clients.length,
        failing_validations: failingTests.length,
        blocked_gates: blockedTests.length,
        failed_telemetry: failedTelemetry.length,
        open_gaps: snapshot.open_gaps.length,
        blocked_rows: blockedRows.length,
        regressions: regressions.length,
        pending_suggestions: suggestions.length,
        serp_with_errors: serpErrors.length,
      },
      enhancements,
      persisted_gap_ids: created,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}