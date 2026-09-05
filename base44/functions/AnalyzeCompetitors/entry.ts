import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { safeUrl, fetchWithTimeout } from '../../shared/htmlUtils.ts';
import { analyzePage } from '../../shared/pageAnalysis.ts';

// AnalyzeCompetitors — deep competitor analysis. Fetches multiple competitor
// URLs, extracts their SEO strategies, content structure, schema, keywords,
// and uses LLM to generate a competitive intelligence report with actionable
// insights and counter-strategies.
//
// Invoke: base44.functions.invoke('AnalyzeCompetitors', { urls, industry? })
// Returns: { ok, analysis, counterStrategy }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const urls = Array.isArray(body.urls) ? body.urls.map(u => String(u).trim()).filter(Boolean) : [];
    const industry = String(body.industry || '').trim();
    if (!urls.length) return Response.json({ error: 'urls (array) is required' }, { status: 400 });

    // Analyze each competitor
    const analyses = [];
    for (const url of urls.slice(0, 10)) {
      const parsed = safeUrl(url);
      if (!parsed) continue;
      const fetched = await fetchWithTimeout(url, 'SEOGenerator-CompetitorAnalysis/1.0');
      if ('error' in fetched) { analyses.push({ url, error: fetched.error }); continue; }
      const { html, finalUrl } = fetched;
      const a = analyzePage(html, finalUrl.hostname);
      analyses.push({ url: finalUrl.href, domain: finalUrl.hostname, ...a });
    }

    // Use LLM to generate competitive intelligence report
    const prompt = `You are a competitive intelligence analyst. Analyze these competitor analyses and generate a strategic report.

${industry ? `Industry: ${industry}` : ''}
Competitor Analyses: ${JSON.stringify(analyses, null, 2)}

Generate:
1. competitive_landscape: summary of the competitive landscape
2. average_seo_score: average SEO score across competitors
3. common_strengths: array of common SEO strengths
4. common_weaknesses: array of common SEO weaknesses
5. content_gaps: array of content opportunities they're missing
6. schema_gaps: array of schema opportunities
7. counter_strategy: array of specific actions to outperform them
8. quick_wins: array of quick wins to gain advantage
9. long_term_play: array of long-term strategies for dominance

Output strict JSON.`;

    const schema = {
      type: 'object',
      properties: {
        competitive_landscape: { type: 'string' },
        average_seo_score: { type: 'number' },
        common_strengths: { type: 'array', items: { type: 'string' } },
        common_weaknesses: { type: 'array', items: { type: 'string' } },
        content_gaps: { type: 'array', items: { type: 'string' } },
        schema_gaps: { type: 'array', items: { type: 'string' } },
        counter_strategy: { type: 'array', items: { type: 'string' } },
        quick_wins: { type: 'array', items: { type: 'string' } },
        long_term_play: { type: 'array', items: { type: 'string' } },
      },
    };

    const llmRes = await svc.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    const data = llmRes?.data ?? llmRes;

    // Store as ResearchFinding
    await svc.entities.ResearchFinding.create({
      topic: `competitor_analysis: ${industry || 'general'}`,
      finding: data?.competitive_landscape || 'Competitor analysis completed',
      source: urls.join(', '),
      provenance: 'INFERRED',
      observed_at: new Date().toISOString(),
    }).catch(() => {});

    return Response.json({
      ok: true,
      industry,
      competitorCount: analyses.length,
      analyses,
      counterStrategy: data,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}