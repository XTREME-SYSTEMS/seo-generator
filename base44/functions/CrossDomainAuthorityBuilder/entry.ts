import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// CrossDomainAuthorityBuilder — analyzes all owned domains and suggests
// cross-linking strategies to distribute authority across the domain portfolio.
// Identifies topical relevance between domains and generates internal linking
// suggestions.
//
// Invoke: base44.functions.invoke('CrossDomainAuthorityBuilder', {})
// Returns: { ok, domains_analyzed, cross_links_suggested }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const now = new Date().toISOString();

    // ── LOAD ALL CLIENTS (OWNED DOMAINS) ──
    const clients = await svc.entities.Client.list().catch(() => []);
    const ownedClients = clients.filter((c) => c.domain && c.status !== 'non_production_pilot');

    if (ownedClients.length < 2) {
      return Response.json({ ok: true, domains_analyzed: 0, message: 'Need at least 2 owned domains for cross-linking' });
    }

    console.log(`[CrossDomainAuthorityBuilder] Analyzing ${ownedClients.length} owned domains`);

    let crossLinksSuggested = 0;

    // ── ANALYZE TOPICAL RELEVANCE BETWEEN DOMAINS ──
    for (let i = 0; i < ownedClients.length; i++) {
      for (let j = i + 1; j < ownedClients.length; j++) {
        const clientA = ownedClients[i];
        const clientB = ownedClients[j];

        // ── LOAD URLS FOR EACH DOMAIN ──
        const [urlsA, urlsB] = await Promise.all([
          svc.entities.UrlInventory.filter({ client_id: clientA.id }, '-priority', 10).catch(() => []),
          svc.entities.UrlInventory.filter({ client_id: clientB.id }, '-priority', 10).catch(() => []),
        ]);

        if (urlsA.length === 0 || urlsB.length === 0) continue;

        // ── FIND TOPICALLY RELEVANT URL PAIRS ──
        const relevanceRes = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze topical relevance between two domains and suggest cross-linking opportunities.

Domain A: ${clientA.name} (${clientA.domain})
Industry A: ${clientA.industry}
Top URLs A: ${urlsA.map((u) => `${u.url} (${u.page_type}, ${u.top_query || 'n/a'})`).join('\n')}

Domain B: ${clientB.name} (${clientB.domain})
Industry B: ${clientB.industry}
Top URLs B: ${urlsB.map((u) => `${u.url} (${u.page_type}, ${u.top_query || 'n/a'})`).join('\n')}

Find 3-5 pairs of URLs that are topically related and would benefit from cross-linking. Each link should be contextual and natural.

Return as JSON: { "cross_links": [{ "source_url": "...", "target_url": "...", "anchor_text": "...", "relevance_reason": "..." }] }`,
          response_json_schema: {
            type: 'object',
            properties: {
              cross_links: { type: 'array', items: { type: 'object', properties: {
                source_url: { type: 'string' }, target_url: { type: 'string' },
                anchor_text: { type: 'string' }, relevance_reason: { type: 'string' },
              } } },
            },
          },
        });

        const relevanceData = relevanceRes.data || relevanceRes;

        // ── CREATE SUGGESTIONS ──
        for (const link of (relevanceData.cross_links || [])) {
          await svc.entities.Suggestion.create({
            url: link.source_url, kind: 'enhancement', surface: 'strategy',
            title: `Cross-domain link: ${link.source_url} → ${link.target_url}`,
            rationale: `Cross-linking between owned domains distributes authority. Relevance: ${link.relevance_reason}`,
            treatment: `Add a contextual link from ${link.source_url} to ${link.target_url} with anchor text "${link.anchor_text}"`,
            gap_type: 'AUTHORITY',
            evidence_tier: 'T2_EXPERIMENT',
            evidence_anchor: 'Cross-domain linking distributes PageRank across owned properties',
            priority_score: 65,
            status: 'new',
            provenance: 'INFERRED',
            created_at: now,
          });
          crossLinksSuggested++;
        }
      }
    }

    // ── LOG ──
    await svc.entities.RunTelemetry.create({
      run_type: 'cross_domain_authority', subsystem: 'authority', status: 'ok',
      started_at: now, records_written: crossLinksSuggested,
      message: `CrossDomainAuthorityBuilder: ${crossLinksSuggested} cross-links suggested across ${ownedClients.length} domains`,
    });
    await svc.entities.Receipt.create({
      kind: 'validation', summary: `CrossDomainAuthorityBuilder: ${crossLinksSuggested} cross-domain links suggested across ${ownedClients.length} domains`,
      detail: JSON.stringify({ domains: ownedClients.length, cross_links: crossLinksSuggested }).slice(0, 4000),
      source: 'cross_domain_authority', provenance: 'INFERRED', occurred_at: now,
    });

    return Response.json({ ok: true, domains_analyzed: ownedClients.length, cross_links_suggested: crossLinksSuggested });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}