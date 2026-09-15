import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const variables = await base44.asServiceRole.entities.SystemVariable.list('-created_date', 500);

    let resolved = 0;
    let assumptions = 0;
    let unknown = 0;
    const impactGraph = {};

    for (const v of variables) {
      // Resolution logic: use resolved_value if set, otherwise default_value
      const value = v.resolved_value || v.default_value || '';
      const isAssumption = !v.resolved_source && !value;
      const confidence = v.resolved_source ? 'high' : (value ? 'medium' : 'unknown');

      if (v.resolved_source) resolved++;
      else if (isAssumption) { assumptions++; }
      else if (!value) unknown++;

      // Build impact graph
      if (v.impact_domains) {
        for (const domain of v.impact_domains) {
          if (!impactGraph[domain]) impactGraph[domain] = [];
          impactGraph[domain].push(v.variable_key);
        }
      }

      // Update the variable with resolved status if not yet resolved
      if (!v.resolved_value && value && !v.confidence) {
        await base44.asServiceRole.entities.SystemVariable.update(v.id, {
          resolved_value: value,
          resolved_source: v.resolved_source || 'default',
          confidence: confidence,
          is_assumption: isAssumption,
        });
      }
    }

    // Update validation score
    const validationScores = await base44.asServiceRole.entities.ValidationScore.filter({ domain: 'Variable registry' });
    if (validationScores.length > 0) {
      const allResolved = unknown === 0;
      await base44.asServiceRole.entities.ValidationScore.update(validationScores[0].id, {
        status: allResolved ? 'PASS' : 'PENDING',
        evidence: `${resolved}/${variables.length} resolved, ${assumptions} assumptions, ${unknown} unknown`,
        earned_score: allResolved ? validationScores[0].weight : Math.round((resolved / variables.length) * validationScores[0].weight),
        last_checked_at: new Date().toISOString(),
      });
    }

    await base44.asServiceRole.entities.Receipt.create({
      summary: `Variable resolution: ${resolved}/${variables.length} resolved, ${assumptions} assumptions, ${unknown} unknown`,
      source: 'ResolveVariables',
      occurred_at: new Date().toISOString(),
      proof_level: 1,
    });

    return Response.json({
      totalVariables: variables.length,
      resolved,
      assumptions,
      unknown,
      impactGraph,
      allResolved: unknown === 0,
    });
  } catch (error) {
    console.error('ResolveVariables error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}