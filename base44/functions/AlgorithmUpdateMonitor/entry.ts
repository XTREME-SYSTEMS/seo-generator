import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const now = new Date().toISOString();
    const prompt = `You are an autonomous SEO algorithm-update monitor operating in ${new Date().getFullYear()}. Search the LIVE web for Google search algorithm updates and ranking-system changes from the LAST 45 DAYS.

Sources to mine: Google Search Central blog, Search Engine Journal, Search Engine Land, SEMrush/Ahrefs/Sistrix update trackers, Reddit r/SEO, X/Twitter SEO community.

For each update return: the update name, the date it was confirmed, which ranking signals/systems it changed (NavBoost, helpful content, spam, core, reviews, link spam, AI overviews, etc.), which SEO tactics it BOOSTS, which tactics it now PENALIZES or deprecates, and a source URL.

Return up to 6 of the most recent, most impactful updates. Be specific and cite real sources.`;

    const schema = {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              confirmed_date: { type: 'string' },
              systems_changed: { type: 'array', items: { type: 'string' } },
              boosts: { type: 'array', items: { type: 'string' } },
              penalizes: { type: 'array', items: { type: 'string' } },
              source: { type: 'string' },
              source_url: { type: 'string' }
            },
            required: ['name', 'systems_changed']
          }
        }
      },
      required: ['updates']
    };

    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: schema
    });

    const updates = (llmRes && Array.isArray(llmRes.updates)) ? llmRes.updates : [];
    const findings = updates.map((u) => ({
      topic: `Algorithm update: ${u.name}`,
      finding: `${u.name} (${u.confirmed_date || 'recent'}). Systems: ${(u.systems_changed || []).join(', ')}. Boosts: ${(u.boosts || []).join(', ')}. Penalizes: ${(u.penalizes || []).join(', ')}.`,
      source: u.source || 'web_research',
      provenance: 'INFERRED',
      value_score: 8,
      readiness_score: 7,
      risk_score: 5,
      competitive_advantage: 6,
      observed_at: now
    }));

    let created = [];
    if (findings.length) created = await base44.asServiceRole.entities.ResearchFinding.bulkCreate(findings);

    // Tag affected methods: penalize matches -> mark deprecated; boost matches -> bump status to testing
    const allMethods = await base44.asServiceRole.entities.RankingMethod.list('-discovered_at', 200);
    const penalizedTerms = updates.flatMap((u) => (u.penalizes || []).map((s) => s.toLowerCase()));
    const boostTerms = updates.flatMap((u) => (u.boosts || []).map((s) => s.toLowerCase()));
    let deprecated = 0, boosted = 0;
    for (const m of allMethods) {
      const hay = `${m.name} ${m.mechanism || ''} ${m.expected_impact || ''}`.toLowerCase();
      if (penalizedTerms.some((t) => t && hay.includes(t))) {
        await base44.asServiceRole.entities.RankingMethod.update(m.id, { status: 'deprecated', notes: `Deprecated by algorithm update ${new Date().toISOString()}` });
        deprecated++;
      } else if (boostTerms.some((t) => t && hay.includes(t)) && m.status === 'discovered') {
        await base44.asServiceRole.entities.RankingMethod.update(m.id, { status: 'testing' });
        boosted++;
      }
    }

    await base44.asServiceRole.entities.Receipt.create({
      kind: 'ingestion',
      summary: `Algorithm update monitor: ${created.length} updates logged, ${deprecated} methods deprecated, ${boosted} promoted to testing`,
      detail: JSON.stringify(updates.map((u) => u.name)),
      source: 'AlgorithmUpdateMonitor',
      provenance: 'INFERRED',
      occurred_at: now
    });
    await base44.asServiceRole.entities.RunTelemetry.create({
      run_type: 'research', subsystem: 'search', status: 'ok',
      started_at: now, records_written: created.length,
      message: `${created.length} algorithm updates; ${deprecated} deprecated, ${boosted} boosted`
    });

    return Response.json({ updates_found: updates.length, findings_created: created.length, methods_deprecated: deprecated, methods_promoted: boosted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}