import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { violatesSpamPolicy } from '../../shared/are.js';

// Onboarding + strategy engine: reverse-engineer the top competitors for a vertical,
// build the combined benchmark and a 20%-better target, and model partner authority.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    if (!body.client_id) return Response.json({ error: 'client_id is required' }, { status: 400 });

    const svc = base44.asServiceRole;
    const client = await svc.entities.Client.get(body.client_id);
    if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });

    const industry = body.industry || client.industry || 'local services';
    const subIndustry = body.sub_industry || '';
    const queries = (body.queries || []).filter(Boolean);
    const competitors = (body.competitors || []).filter(Boolean);
    const partners = (body.partner_domains || []).filter(Boolean);

    const prompt = [
      'You are the benchmark reverse-engineering engine of an Autonomous Ranking Engine.',
      'Task: reverse-engineer what it takes to hold TOP 3 on Google for this vertical, then define a target 20% stronger than the combined benchmark of the current top 3.',
      'EVIDENCE-FIRST: anchor everything to Google-confirmed ranking factors or observable competitor facts.',
      'STRUCTURALLY FORBIDDEN: PBNs, paid links, link schemes, llms.txt, brand impersonation, cloaking, scaled content abuse.',
      `Business: ${client.name}${client.domain ? ` (${client.domain})` : ''}.`,
      `Industry: ${industry}${subIndustry ? ` / ${subIndustry}` : ''}.`,
      body.service_area ? `Service area: ${body.service_area}.` : '',
      queries.length ? `Primary money queries: ${queries.join('; ')}.` : '',
      competitors.length ? `Known competitors: ${competitors.join('; ')}.` : 'Identify the current top competitors yourself.',
      partners.length ? `Partner / authority domains available to this business: ${partners.join('; ')}.` : '',
      'Return: the combined benchmark, the 20%-better target, competitor strengths, competitor failure points, content gaps, authority gaps, surface wins (local pack vs organic vs AI overview), and concrete industry norms (typical word counts, page types, schema, review counts, page speed).',
      partners.length ? 'Also propose the single highest-value legitimate, earned link deliverable from each partner domain (e.g. an Authorized Installer / dealer-locator listing with a contextual link) and estimate its modeled uplift to the probability of crossing a rank boundary (0 to 0.35).' : '',
    ].filter(Boolean).join('\n');

    const res = await svc.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          benchmark_summary: { type: 'string' },
          target_summary: { type: 'string' },
          competitor_strengths: { type: 'array', items: { type: 'string' } },
          competitor_failure_points: { type: 'array', items: { type: 'string' } },
          content_gaps: { type: 'array', items: { type: 'string' } },
          authority_gaps: { type: 'array', items: { type: 'string' } },
          surface_wins: { type: 'array', items: { type: 'string' } },
          norms: { type: 'array', items: { type: 'string' } },
          top_competitors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                domain: { type: 'string' },
                authority_signal: { type: 'number' },
                weakness: { type: 'string' },
              },
            },
          },
          partner_deliverables: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                partner_domain: { type: 'string' },
                deliverable: { type: 'string' },
                asset_type: { type: 'string' },
                target_url: { type: 'string' },
                modeled_p_cross_boost: { type: 'number' },
              },
            },
          },
        },
      },
    });

    const clean = (arr) => (arr || []).filter((s) => s && !violatesSpamPolicy(s)).slice(0, 12);
    const boost = Math.max(0, Math.min(0.35, (res.partner_deliverables || [])
      .reduce((a, d) => a + (Number(d.modeled_p_cross_boost) || 0), 0)));

    const existing = await svc.entities.IndustryPlaybook.filter({ client_id: client.id, industry }, '-compiled_at', 1);
    const payload = {
      client_id: client.id,
      industry,
      sub_industry: subIndustry,
      benchmark_summary: res.benchmark_summary || '',
      target_summary: res.target_summary || '',
      competitor_strengths: clean(res.competitor_strengths),
      competitor_failure_points: clean(res.competitor_failure_points),
      content_gaps: clean(res.content_gaps),
      authority_gaps: clean(res.authority_gaps),
      surface_wins: clean(res.surface_wins),
      norms: clean(res.norms),
      partner_authority_domains: partners,
      partner_p_cross_boost: Math.round(boost * 100) / 100,
      provenance: 'INFERRED',
      compiled_at: new Date().toISOString(),
    };
    const playbook = existing.length
      ? await svc.entities.IndustryPlaybook.update(existing[0].id, payload)
      : await svc.entities.IndustryPlaybook.create(payload);

    // Seed the competitor set (top 5).
    const known = await svc.entities.Competitor.filter({ client_id: client.id }, '-created_date', 200);
    const knownDomains = new Set(known.map((c) => (c.domain || '').toLowerCase()));
    const newCompetitors = (res.top_competitors || [])
      .filter((c) => c.name && !knownDomains.has((c.domain || '').toLowerCase()))
      .slice(0, 5)
      .map((c) => ({
        client_id: client.id,
        name: c.name,
        domain: c.domain || '',
        authority_signal: Number(c.authority_signal) || 0,
        authority_provenance: 'INFERRED',
        twin_provenance: 'INFERRED',
        shared_query_count: queries.length,
        last_observed_at: new Date().toISOString(),
      }));
    if (newCompetitors.length) await svc.entities.Competitor.bulkCreate(newCompetitors);

    // Authority deliverables — earned links only, tracked as concrete work items.
    const deliverables = (res.partner_deliverables || [])
      .filter((d) => d.partner_domain && d.deliverable && !violatesSpamPolicy(d.deliverable))
      .slice(0, 8)
      .map((d) => ({
        client_id: client.id,
        partner_domain: d.partner_domain,
        target_url: d.target_url || client.domain || '',
        deliverable: d.deliverable,
        asset_type: ['directory_listing', 'case_study', 'co_marketing_page', 'resource_page', 'spec_document'].includes(d.asset_type)
          ? d.asset_type : 'other',
        modeled_p_cross_boost: Math.max(0, Math.min(0.35, Number(d.modeled_p_cross_boost) || 0)),
        status: 'identified',
        provenance: 'MODELED',
      }));
    if (deliverables.length) await svc.entities.AuthorityDeliverable.bulkCreate(deliverables);

    await svc.entities.Receipt.create({
      client_id: client.id,
      kind: 'ingestion',
      summary: `Benchmark reverse-engineered for ${industry}`,
      detail: `${newCompetitors.length} competitors seeded, ${deliverables.length} authority deliverables identified`,
      source: 'AreBenchmark',
      provenance: 'INFERRED',
      occurred_at: new Date().toISOString(),
    });

    return Response.json({
      ok: true,
      playbook_id: playbook.id,
      competitors_seeded: newCompetitors.length,
      deliverables: deliverables.length,
      partner_p_cross_boost: payload.partner_p_cross_boost,
      benchmark: payload,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}