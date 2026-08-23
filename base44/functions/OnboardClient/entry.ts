import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const name = (body.name || '').trim();
    const domain = (body.domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const industry = (body.industry || '').trim();
    const targetQueries = Array.isArray(body.target_queries) ? body.target_queries.filter((q) => q && q.trim()) : [];
    const competitors = Array.isArray(body.competitors) ? body.competitors.filter((c) => c.name && c.name.trim()) : [];
    const monthlyPaidSpend = Number(body.monthly_paid_spend) || 0;
    const goal = body.goal || 'rank_for_targets';
    const now = new Date().toISOString();

    if (!name) return Response.json({ error: 'Business name is required' }, { status: 400 });
    if (!industry) return Response.json({ error: 'Industry is required' }, { status: 400 });

    // 1. Create the client project
    const client = await base44.asServiceRole.entities.Client.create({
      name,
      domain,
      industry,
      status: 'non_production_pilot',
      monthly_paid_spend: monthlyPaidSpend,
      spend_provenance: monthlyPaidSpend > 0 ? 'OPERATOR_ESTIMATE' : 'UNKNOWN',
      revenue_provenance: 'UNKNOWN',
      notes: `Onboarded via SEO Generator questionnaire. Goal: ${goal}`
    });

    const clientId = client.id;

    // 2. Seed competitors
    if (competitors.length) {
      await base44.asServiceRole.entities.Competitor.bulkCreate(
        competitors.map((c) => ({
          client_id: clientId,
          name: c.name.trim(),
          domain: (c.domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, ''),
          authority_provenance: 'UNKNOWN',
          twin_provenance: 'INFERRED',
          last_observed_at: now
        }))
      );
    }

    // 3. Seed opportunities from target queries
    if (targetQueries.length) {
      await base44.asServiceRole.entities.Opportunity.bulkCreate(
        targetQueries.map((q) => ({
          client_id: clientId,
          query: q.trim(),
          intent: 'unknown',
          rank_provenance: 'UNKNOWN',
          volume_provenance: 'UNKNOWN',
          difficulty_provenance: 'UNKNOWN',
          cpc_provenance: 'UNKNOWN',
          router_decision: 'pending',
          fastpath_stage: 'none'
        }))
      );
    }

    await base44.asServiceRole.entities.Receipt.create({
      kind: 'ingestion',
      summary: `Onboarded ${name} (${industry}) — ${competitors.length} competitors, ${targetQueries.length} target queries`,
      detail: `Project seeded. Background workflows (Autonomous SEO Generator + Ranking Loop) will operate on this data.`,
      source: 'OnboardClient',
      provenance: 'MEASURED',
      occurred_at: now
    });

    return Response.json({
      client_id: clientId,
      client_name: name,
      industry,
      competitors_seeded: competitors.length,
      queries_seeded: targetQueries.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}