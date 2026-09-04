import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// InternalLinkOptimizer — analyzes internal link structure across managed
// URLs and suggests internal links to distribute authority. Fetches page HTML,
// extracts internal links, maps the link graph, and identifies orphan pages
// and authority distribution gaps.
//
// Invoke: base44.functions.invoke('InternalLinkOptimizer', { domain?, limit? })
// Returns: { ok, pages_analyzed, links_found, orphan_pages, suggestions_generated }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const now = new Date().toISOString();
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 20;

    // ── LOAD URL INVENTORY ──
    let targets;
    if (body.domain) {
      targets = await svc.entities.UrlInventory.filter({ domain: body.domain }, '-priority', limit).catch(() => []);
    } else {
      targets = await svc.entities.UrlInventory.list('-priority', limit).catch(() => []);
    }

    if (targets.length === 0) {
      return Response.json({ ok: true, pages_analyzed: 0, message: 'No URLs to analyze' });
    }

    console.log(`[InternalLinkOptimizer] Analyzing ${targets.length} pages`);

    const linkGraph = {}; // url -> [internal links]
    const allUrls = new Set(targets.map((t) => t.url));
    let totalLinks = 0;

    // ── BUILD LINK GRAPH ──
    for (const target of targets) {
      const url = target.url;
      if (!url) continue;

      let html = '';
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
        html = await res.text();
      } catch (e) { continue; }

      // Extract internal links
      const linkMatches = html.match(/href=["']([^"']+)["']/gi) || [];
      const internalLinks = linkMatches
        .map((m) => m.match(/href=["']([^"']+)["']/i)?.[1])
        .filter((href) => href && !href.startsWith('http') || (href && allUrls.has(href)))
        .filter((href, idx, arr) => arr.indexOf(href) === idx);

      linkGraph[url] = internalLinks;
      totalLinks += internalLinks.length;
    }

    // ── FIND ORPHAN PAGES (no incoming links) ──
    const incomingLinks = {};
    for (const [sourceUrl, links] of Object.entries(linkGraph)) {
      for (const link of links) {
        incomingLinks[link] = (incomingLinks[link] || 0) + 1;
      }
    }

    const orphanPages = targets.filter((t) => t.url && !incomingLinks[t.url] && !linkGraph[t.url]?.length);
    const lowLinkPages = targets.filter((t) => t.url && (incomingLinks[t.url] || 0) < 2);

    let suggestionsGenerated = 0;

    // ── SUGGEST INTERNAL LINKS FOR ORPHANS ──
    for (const orphan of orphanPages.slice(0, 5)) {
      // Find high-authority pages that could link to this orphan
      const potentialLinkers = targets
        .filter((t) => t.url !== orphan.url && t.page_type === 'pillar')
        .slice(0, 3);

      for (const linker of potentialLinkers) {
        await svc.entities.Suggestion.create({
          url: linker.url, kind: 'enhancement', surface: 'sheet',
          title: `Add internal link to orphan page: ${orphan.url}`,
          rationale: `${orphan.url} has no internal links pointing to it. Adding a contextual link from ${linker.url} (pillar page) will distribute authority and improve crawlability.`,
          treatment: `Add a contextual internal link from ${linker.url} to ${orphan.url} using relevant anchor text`,
          gap_type: 'SEO',
          evidence_tier: 'T1_CONFIRMED_SYSTEM',
          evidence_anchor: 'Internal link distribution is a confirmed Google ranking factor (PageRank flow)',
          priority_score: 72,
          status: 'new',
          provenance: 'INFERRED',
          created_at: now,
        });
        suggestionsGenerated++;
      }
    }

    // ── SUGGEST LINKS FOR LOW-LINK PAGES ──
    for (const page of lowLinkPages.slice(0, 5)) {
      await svc.entities.Suggestion.create({
        url: page.url, kind: 'enhancement', surface: 'sheet',
        title: `Increase internal links to ${page.url} — only ${incomingLinks[page.url] || 0} incoming`,
        rationale: `This page has only ${incomingLinks[page.url] || 0} internal links. More internal links would improve its authority and rankings.`,
        treatment: 'Add 3-5 contextual internal links from related pages using varied anchor text',
        gap_type: 'SEO',
        evidence_tier: 'T1_CONFIRMED_SYSTEM',
        evidence_anchor: 'Internal link count correlates with rankings',
        priority_score: 65,
        status: 'new',
        provenance: 'INFERRED',
        created_at: now,
      });
      suggestionsGenerated++;
    }

    // ── LOG ──
    await svc.entities.RunTelemetry.create({
      run_type: 'internal_link_optimizer', subsystem: 'seo_technical', status: 'ok',
      started_at: now, records_written: totalLinks,
      message: `InternalLinkOptimizer: ${targets.length} pages, ${totalLinks} links, ${orphanPages.length} orphans, ${suggestionsGenerated} suggestions`,
    });
    await svc.entities.Receipt.create({
      kind: 'validation', summary: `InternalLinkOptimizer: ${orphanPages.length} orphan pages, ${lowLinkPages.length} low-link pages, ${suggestionsGenerated} suggestions`,
      detail: JSON.stringify({ pages: targets.length, links: totalLinks, orphans: orphanPages.length, suggestions: suggestionsGenerated }).slice(0, 4000),
      source: 'internal_link_optimizer', provenance: 'INFERRED', occurred_at: now,
    });

    return Response.json({
      ok: true, pages_analyzed: targets.length, links_found: totalLinks,
      orphan_pages: orphanPages.length, suggestions_generated: suggestionsGenerated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}