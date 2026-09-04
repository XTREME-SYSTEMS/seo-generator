import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// EvolutionEngine — the learn-and-grow brain of the Vision Cortex. This is the
// core of the "ultimate vision" system. It:
// 1. GATHERS — collects system state (telemetry, reflections, gaps, methods, capabilities, ideas)
// 2. REFLECTS — identifies patterns in what worked vs what didn't
// 3. IDEATES — generates novel ideas to improve the system using LLM
// 4. SIMULATES — runs each idea through a simulated test
// 5. SCORES — ranks ideas by simulated impact, risk, and feasibility
// 6. PROMOTES — promotes high-scoring ideas to capabilities or methods
// 7. EVOLVES — logs everything as EvolutionIdea records
//
// This is the engine that makes the system "learn and grow" — it continuously
// finds new and improved ways to optimize search performance.
//
// Invoke: base44.functions.invoke('EvolutionEngine', { idea_count? })
// Returns: { ok, patterns, ideas_generated, ideas_promoted, ideas }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const now = new Date().toISOString();
    const body = await req.json().catch(() => ({}));
    const ideaCount = body.idea_count || 5;

    // ═══════════════════════════════════════════════
    // PHASE 1: GATHER — collect system state
    // ═══════════════════════════════════════════════
    console.log('[EvolutionEngine] Phase 1: Gathering system state...');

    const [telemetry, reflections, gaps, methods, capabilities, pastIdeas, suggestions, fixAttempts] = await Promise.all([
      svc.entities.RunTelemetry.list('-started_at', 30).catch(() => []),
      svc.entities.ReflectionRecord.list('-occurred_at', 20).catch(() => []),
      svc.entities.SystemGap.list('-logged_at', 15).catch(() => []),
      svc.entities.RankingMethod.list('-discovered_at', 20).catch(() => []),
      svc.entities.Capability.list('-impact_score', 50).catch(() => []),
      svc.entities.EvolutionIdea.list('-created_at', 20).catch(() => []),
      svc.entities.Suggestion.list('-created_at', 15).catch(() => []),
      svc.entities.FixAttempt.list('-created_at', 15).catch(() => []),
    ]);

    const systemState = {
      recent_runs: telemetry.slice(0, 10).map((t) => ({ type: t.run_type, status: t.status, message: t.message })),
      recent_reflections: reflections.slice(0, 10).map((r) => ({ phase: r.phase, status: r.validation_status, deployed: r.deployed, measured: r.measured })),
      open_gaps: gaps.slice(0, 10).map((g) => ({ gap: g.gap, severity: g.severity })),
      methods_count: methods.length,
      methods_validated: methods.filter((m) => m.status === 'validated').length,
      capabilities_implemented: capabilities.filter((c) => c.status === 'implemented').length,
      capabilities_remaining: capabilities.filter((c) => c.status !== 'implemented').length,
      past_ideas: pastIdeas.map((i) => ({ title: i.title, status: i.status, score: i.simulated_impact_score })),
      recent_fixes: fixAttempts.slice(0, 10).map((f) => ({ url: f.url, status: f.status, approach: f.approach })),
    };

    // ═══════════════════════════════════════════════
    // PHASE 2: REFLECT — identify patterns
    // ═══════════════════════════════════════════════
    console.log('[EvolutionEngine] Phase 2: Reflecting on patterns...');

    const reflectionRes = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the self-reflection engine of the Search Dominance OS. Analyze the system state and identify patterns.

SYSTEM STATE:
${JSON.stringify(systemState, null, 2)}

Identify:
1. PATTERNS — what recurring patterns do you see? (successes, failures, bottlenecks)
2. WORKING — what's clearly working well?
3. FAILING — what's consistently failing?
4. BIGGEST_OPPORTUNITY — what's the single biggest opportunity for improvement?
5. KNOWLEDGE_GAINED — what has the system learned that should be codified?

Return as JSON: {
  "patterns": ["..."],
  "working": ["..."],
  "failing": ["..."],
  "biggest_opportunity": "...",
  "knowledge_gained": ["..."]
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          patterns: { type: 'array', items: { type: 'string' } },
          working: { type: 'array', items: { type: 'string' } },
          failing: { type: 'array', items: { type: 'string' } },
          biggest_opportunity: { type: 'string' },
          knowledge_gained: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    const reflectionData = reflectionRes.data || reflectionRes;

    // Store reflection
    await svc.entities.ReflectionRecord.create({
      cycle_id: `evolution_${Date.now()}`,
      phase: 'self_reflect',
      deployed: 'EvolutionEngine self-reflection cycle',
      expected: 'Identify patterns and generate novel improvement ideas',
      measured: JSON.stringify(reflectionData).slice(0, 2000),
      validation_status: 'pass',
      provenance: 'INFERRED',
      occurred_at: now,
    }).catch(() => {});

    // ═══════════════════════════════════════════════
    // PHASE 3: IDEATE — generate novel ideas
    // ═══════════════════════════════════════════════
    console.log(`[EvolutionEngine] Phase 3: Generating ${ideaCount} novel ideas...`);

    const ideationRes = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the ideation engine of the Search Dominance OS. Based on the system's self-reflection, generate ${ideaCount} NOVEL ideas to improve the system.

SYSTEM REFLECTION:
${JSON.stringify(reflectionData, null, 2)}

EXISTING METHODS (do NOT duplicate these):
${JSON.stringify(methods.map((m) => m.name))}

EXISTING CAPABILITIES (do NOT duplicate these):
${JSON.stringify(capabilities.map((c) => c.name))}

PAST IDEAS (do NOT duplicate these):
${JSON.stringify(pastIdeas.map((i) => i.title))}

Generate ${ideaCount} genuinely novel ideas. Each idea should be:
- A NEW approach not already in the system
- Specific and actionable (not vague)
- Grounded in SEO/search science
- Different from the others (diverse categories)

For each idea:
- title: short, memorable name
- description: what it does (2-3 sentences)
- category: strategy | tactic | method | tool | improvement | paradigm
- implementation_plan: step-by-step how to build it
- why_novel: what makes this genuinely different from existing approaches

Return as JSON: { "ideas": [{ "title": "...", "description": "...", "category": "...", "implementation_plan": "...", "why_novel": "..." }] }`,
      response_json_schema: {
        type: 'object',
        properties: {
          ideas: { type: 'array', items: { type: 'object', properties: {
            title: { type: 'string' }, description: { type: 'string' }, category: { type: 'string' },
            implementation_plan: { type: 'string' }, why_novel: { type: 'string' },
          } } },
        },
      },
    });

    const ideasData = (ideationRes.data || ideationRes).ideas || [];

    // ═══════════════════════════════════════════════
    // PHASE 4 & 5: SIMULATE + SCORE each idea
    // ═══════════════════════════════════════════════
    console.log(`[EvolutionEngine] Phase 4-5: Simulating and scoring ${ideasData.length} ideas...`);

    const newIdeas = [];

    for (const idea of ideasData) {
      // Simulate the idea
      const simRes = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the simulation engine of the Search Dominance OS. Simulate the impact of this improvement idea on a managed URL portfolio.

IDEA: ${idea.title}
DESCRIPTION: ${idea.description}
IMPLEMENTATION: ${idea.implementation_plan}

Simulate:
1. If implemented, what ranking improvement would we see over 30/60/90 days?
2. What risks are involved? (algorithm penalty risk, technical complexity, resource cost)
3. What's the probability of success (0-100)?
4. What's the expected ranking delta (positions improved)?
5. What's the overall impact score (0-100)?

Be realistic and conservative. Ground your simulation in known SEO science.

Return as JSON: {
  "impact_score": 0-100,
  "risk_score": 0-100,
  "ranking_delta": number,
  "probability_success": 0-100,
  "simulation_30d": "...",
  "simulation_60d": "...",
  "simulation_90d": "...",
  "simulation_notes": "..."
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            impact_score: { type: 'number' }, risk_score: { type: 'number' },
            ranking_delta: { type: 'number' }, probability_success: { type: 'number' },
            simulation_30d: { type: 'string' }, simulation_60d: { type: 'string' },
            simulation_90d: { type: 'string' }, simulation_notes: { type: 'string' },
          },
        },
      });

      const simData = simRes.data || simRes;
      const impactScore = simData.impact_score || 0;
      const riskScore = simData.risk_score || 0;

      // ── STORE IDEA ──
      const ideaRecord = await svc.entities.EvolutionIdea.create({
        title: idea.title,
        description: idea.description,
        category: idea.category || 'improvement',
        source: 'self_reflection',
        simulated_impact_score: impactScore,
        simulated_risk_score: riskScore,
        simulated_ranking_delta: simData.ranking_delta || 0,
        simulation_results: JSON.stringify({
          probability_success: simData.probability_success,
          simulation_30d: simData.simulation_30d,
          simulation_60d: simData.simulation_60d,
          simulation_90d: simData.simulation_90d,
          notes: simData.simulation_notes,
        }).slice(0, 6000),
        implementation_plan: idea.implementation_plan,
        why_novel: idea.why_novel,
        status: 'tested',
        tags: [idea.category, `impact:${impactScore}`, `risk:${riskScore}`],
        created_at: now,
        simulated_at: now,
      });

      newIdeas.push({
        id: ideaRecord.id,
        title: idea.title,
        category: idea.category,
        impact_score: impactScore,
        risk_score: riskScore,
        ranking_delta: simData.ranking_delta || 0,
        probability_success: simData.probability_success || 0,
        status: 'tested',
      });
    }

    // ═══════════════════════════════════════════════
    // PHASE 6: PROMOTE — high-scoring ideas become capabilities
    // ═══════════════════════════════════════════════
    console.log('[EvolutionEngine] Phase 6: Promoting high-scoring ideas...');

    let promoted = 0;
    const promotionThreshold = 70;

    for (const idea of newIdeas) {
      if (idea.impact_score >= promotionThreshold && idea.risk_score < 60) {
        // Promote to Capability
        const cap = await svc.entities.Capability.create({
          category: 'autonomous',
          name: idea.title,
          description: `${idea.description} (Auto-generated by Evolution Engine. Impact: ${idea.impact_score}, Risk: ${idea.risk_score})`,
          status: 'available',
          impact_score: idea.impact_score,
          speed_tier: 'medium',
          delivery: 'ai_assisted',
          evidence_tier: 'T2_EXPERIMENT',
          automation: 'on_demand',
        }).catch(() => null);

        if (cap) {
          await svc.entities.EvolutionIdea.update(idea.id, {
            status: 'promoted',
            promoted_to_entity: 'Capability',
            promoted_to_id: cap.id,
            promoted_at: now,
          });
          promoted++;
          idea.status = 'promoted';
        }
      }
    }

    // ═══════════════════════════════════════════════
    // PHASE 7: LOG — record everything
    // ═══════════════════════════════════════════════
    console.log('[EvolutionEngine] Phase 7: Logging evolution cycle...');

    await svc.entities.RunTelemetry.create({
      run_type: 'evolution_engine', subsystem: 'autonomous', status: 'ok',
      started_at: now, records_written: newIdeas.length,
      message: `EvolutionEngine: ${newIdeas.length} ideas generated, ${promoted} promoted. Biggest opportunity: ${reflectionData.biggest_opportunity || 'n/a'}`,
    });

    await svc.entities.Receipt.create({
      kind: 'validation',
      summary: `EvolutionEngine: ${newIdeas.length} ideas generated, ${promoted} promoted to capabilities. Patterns: ${(reflectionData.patterns || []).length}. Knowledge: ${(reflectionData.knowledge_gained || []).length} items.`,
      detail: JSON.stringify({
        reflection: reflectionData,
        ideas: newIdeas,
        promoted,
      }, null, 2).slice(0, 12000),
      source: 'evolution_engine',
      provenance: 'INFERRED',
      occurred_at: now,
    });

    return Response.json({
      ok: true,
      patterns: reflectionData.patterns || [],
      working: reflectionData.working || [],
      failing: reflectionData.failing || [],
      biggest_opportunity: reflectionData.biggest_opportunity || '',
      knowledge_gained: reflectionData.knowledge_gained || [],
      ideas_generated: newIdeas.length,
      ideas_promoted: promoted,
      ideas: newIdeas,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}