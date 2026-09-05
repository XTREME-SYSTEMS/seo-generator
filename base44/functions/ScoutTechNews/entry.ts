import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// ScoutTechNews — scouts the web for the latest tech news, Google algorithm
// updates, AI search changes, and SEO industry developments. Uses web search
// to find news, then summarizes and stores as ResearchFinding records.
//
// Invoke: base44.functions.invoke('ScoutTechNews', { count? })
// Returns: { ok, newsFound, news }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const count = Math.min(body.count || 10, 20);

    const prompt = `You are a tech news scout. Search the web for the latest news about:
1. Google algorithm updates (core updates, helpful content, spam updates)
2. Google Search Console changes and new features
3. AI search developments (Google SGE, ChatGPT search, Perplexity, Claude search)
4. SEO industry news (new tools, studies, ranking factor changes)
5. Google Ads changes (if relevant to organic)
6. Schema.org updates
7. Core Web Vitals changes
8. Google Business Profile updates

Find ${count} recent news items from the last 30 days.

For each news item:
- title: headline
- summary: 2-3 sentence summary
- category: algorithm_update / ai_search / gsc / seo_industry / schema / core_web_vitals / gbp / other
- impact: high/medium/low (how much it affects SEO strategy)
- action_required: what SEOs should do in response
- source_url: URL to the news article
- date: publication date if available

Output strict JSON: { news: [{ title, summary, category, impact, action_required, source_url, date }] }`;

    const schema = {
      type: 'object',
      properties: {
        news: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              summary: { type: 'string' },
              category: { type: 'string' },
              impact: { type: 'string' },
              action_required: { type: 'string' },
              source_url: { type: 'string' },
              date: { type: 'string' },
            },
          },
        },
      },
    };

    const llmRes = await svc.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
    });
    const data = llmRes?.data ?? llmRes;
    if (!data?.news) return Response.json({ error: 'AI did not return news' }, { status: 502 });

    // Store as ResearchFinding records
    let stored = 0;
    for (const n of data.news) {
      await svc.entities.ResearchFinding.create({
        topic: `tech_news: ${n.category}`,
        finding: `${n.title}: ${n.summary}`,
        source: n.source_url || '',
        provenance: 'INFERRED',
        observed_at: new Date().toISOString(),
      }).catch(() => {});
      stored++;
    }

    return Response.json({
      ok: true,
      newsFound: data.news.length,
      newsStored: stored,
      news: data.news,
      scoutedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}