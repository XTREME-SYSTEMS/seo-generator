import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// AISearchVisibility — checks whether managed URLs appear in AI search engine
// answers (ChatGPT, Perplexity, Google AI Overviews). This closes the AEO/SAO
// gap — the system tracks SEO rankings but not AI search visibility.
//
// For each managed URL's top queries, it invokes an LLM with web search to ask
// the same question and checks if the URL or domain appears in the answer.
// Results are stored as AIAnswerObservation records.
//
// Invoke: base44.functions.invoke('AISearchVisibility', { limit?, domain? })
// Returns: { ok, checked, found_in_ai, observations }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const svc = base44.asServiceRole;
    const now = new Date().toISOString();
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 20;
    const targetDomain = body.domain;

    // ── LOAD QUERIES TO CHECK ──
    const sheetRows = await svc.entities.AreSheetRow.list('-priority_score', limit).catch(() => []);
    const toCheck = sheetRows.filter((r) => r.url && r.query).slice(0, limit);

    if (toCheck.length === 0) {
      return Response.json({ ok: true, checked: 0, found_in_ai: 0, message: 'No URLs with queries to check' });
    }

    console.log(`[AISearchVisibility] Checking ${toCheck.length} URLs across AI search engines`);

    const observations = [];
    let foundInAI = 0;

    // ── CHECK EACH URL/QUERY IN AI SEARCH ──
    for (const row of toCheck) {
      const domain = targetDomain || (() => { try { return new URL(row.url).hostname; } catch { return ''; } })();

      // Ask the LLM the same query with web search enabled — simulates what
      // ChatGPT/Perplexity/Google AI Overviews would return
      try {
        const aiRes = await base44.integrations.Core.InvokeLLM({
          prompt: `Search the web for: "${row.query}"\n\nReturn the top sources and URLs cited in the answer. List every URL mentioned in the response. If ${domain} or any page from ${domain} appears in the answer, highlight it specifically.\n\nFormat as JSON: { "sources": [{"url": "...", "title": "...", "mentions_target_domain": true/false}], "answer_summary": "..." }`,
          add_context_from_internet: true,
          response_json_schema: {
            type: 'object',
            properties: {
              sources: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    url: { type: 'string' },
                    title: { type: 'string' },
                    mentions_target_domain: { type: 'boolean' },
                  },
                },
              },
              answer_summary: { type: 'string' },
            },
          },
          model: 'gemini_3_flash',
        });

        const aiData = aiRes.data || aiRes;
        const sources = aiData.sources || [];
        const mentions = sources.filter((s) => s.mentions_target_domain || (s.url && s.url.includes(domain)));
        const isFound = mentions.length > 0;

        if (isFound) foundInAI++;

        // ── STORE OBSERVATION ──
        await svc.entities.AIAnswerObservation.create({
          engine: 'other',
          prompt: `${row.query} — checking visibility of ${row.url}`,
          cited: isFound,
          citation_urls: mentions.map((m) => m.url).slice(0, 10),
          source_domains: [domain],
          competitors_cited: sources.filter((s) => !s.mentions_target_domain).map((s) => { try { return new URL(s.url).hostname; } catch { return s.url; } }).slice(0, 10),
          provenance: 'MEASURED',
          evidence_uri: row.url,
          observed_at: now,
        });

        observations.push({
          url: row.url,
          query: row.query,
          appears_in_ai: isFound,
          citation_count: mentions.length,
        });
      } catch (e) {
        console.error(`[AISearchVisibility] Failed for ${row.url}:`, e.message);
      }
    }

    // ── LOG ──
    await svc.entities.RunTelemetry.create({
      run_type: 'ai_search_visibility',
      subsystem: 'measurement',
      status: 'ok',
      started_at: now,
      records_written: observations.length,
      message: `AISearchVisibility: ${foundInAI}/${observations.length} URLs found in AI answers`,
    });

    await svc.entities.Receipt.create({
      kind: 'validation',
      summary: `AISearchVisibility: checked ${observations.length} queries, ${foundInAI} found in AI search answers`,
      detail: JSON.stringify({ checked: observations.length, found_in_ai: foundInAI, observations: observations.slice(0, 20) }, null, 2).slice(0, 8000),
      source: 'ai_search_visibility',
      provenance: 'MEASURED',
      occurred_at: now,
    });

    return Response.json({
      ok: true,
      checked: observations.length,
      found_in_ai: foundInAI,
      observations,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}