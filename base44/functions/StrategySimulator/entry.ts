import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { runMonteCarlo, STRATEGY_ARCHETYPES } from '../../shared/simulationEngine.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { strategyId, vision, automationMode, autonomyMode, simulateMode, customParams } = body || {};

    const archetype = STRATEGY_ARCHETYPES.find(s => s.id === strategyId) || STRATEGY_ARCHETYPES[0];

    const simConfig = {
      iterations: simulateMode ? 500 : 200,
      initialCapital: customParams?.initialCapital || 10000,
      monthlyContribution: customParams?.monthlyContribution || 5000,
      automationLevel: automationMode ? 0.9 : 0.5,
      autonomyLevel: autonomyMode ? 0.85 : 0.4,
      marketVolatility: archetype.volatility,
      strategyEfficiency: archetype.efficiency,
      timeHorizonMonths: customParams?.timeHorizonMonths || 36,
    };

    const simulation = runMonteCarlo(simConfig);

    // Use LLM to generate strategic analysis and recommendations
    let analysis = null;
    try {
      const llmResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an elite business strategist. Analyze this strategy simulation and provide actionable intelligence.

Strategy: ${archetype.name}
End Result: ${archetype.endResult}
User's Vision: ${vision || 'Not specified'}
Automation Mode: ${automationMode ? 'Enabled' : 'Disabled'}
Autonomy Mode: ${autonomyMode ? 'Enabled' : 'Disabled'}

Simulation Results (500 iterations):
- Average ROI: ${simulation.avgROI}%
- Success Rate: ${simulation.successRate}%
- Average Revenue: $${simulation.avgRevenue.toLocaleString()}
- Best Case ROI: ${simulation.bestCase.roi}%
- Worst Case ROI: ${simulation.worstCase.roi}%
- Median ROI: ${simulation.medianROI}%
- P75 ROI: ${simulation.p75ROI}%
- P90 ROI: ${simulation.p90ROI}%

Provide a JSON response with:
1. "summary": Executive summary of the strategy (2-3 sentences)
2. "keyRisks": Array of 3-5 key risks
3. "keyOpportunities": Array of 3-5 key opportunities
4. "recommendations": Array of 5-7 specific actionable recommendations
5. "gaps": Array of 3-5 gaps or problems in the strategy
6. "qaNotes": Array of 3-5 QA validation notes
7. "enhancedStrategy": A paragraph describing how to enhance this strategy for maximum results
8. "autoRecommendations": Array of 5 auto-recommended next actions`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            keyRisks: { type: 'array', items: { type: 'string' } },
            keyOpportunities: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } },
            gaps: { type: 'array', items: { type: 'string' } },
            qaNotes: { type: 'array', items: { type: 'string' } },
            enhancedStrategy: { type: 'string' },
            autoRecommendations: { type: 'array', items: { type: 'string' } },
          },
        },
      });
      analysis = llmResponse;
    } catch (e) {
      console.error('LLM analysis failed:', e.message);
    }

    return Response.json({
      strategy: archetype,
      simulation,
      analysis,
      config: simConfig,
    });
  } catch (error) {
    console.error('StrategySimulator error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}