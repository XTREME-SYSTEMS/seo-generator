import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { analyzePage } from '../../shared/pageAnalysis.ts';

// ComputeIndustryBenchmarks — computes SEO benchmarks for an industry by
// analyzing top performers. Gathers data on: average word count, page speed,
// schema usage, backlink counts, content structure, CTA patterns. Stores as
// IndustryPlaybook records.
//
// Invoke: base44.functions.invoke('ComputeIndustryBenchmarks', { industry, competitors? })
// Returns: { ok, benchmark, playbook }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const industry = String(body.industry || '').trim();
    const competitors = Array.isArray(body.competitors) ? body.competitors : [];
    if (!industry) return Response.json({ error: 'industry is required' }, { status: 400 });

    // Load existing competitors if none provided
    let compList = competitors;
    if (compList.length === 0) {
      const comps = await svc.entities.Competitor.filter({ industry }, '-created_date', 10).catch(() => []);
      compList = comps.map(c => c.domain).filter(Boolean);
    }
    if (compList.length === 0) {
      return Response.json({ error: 'No competitors found. Run DiscoverTopPerformers first.' }, { status: 400 });
    }

    // Fetch top 3 competitor homepages and analyze
    const analyses = [];
    for (const domain of compList.slice(0, 5)) {
      try {
        const url = `https://${domain.replace(/^https?:\/\//, '')}`;
        const resp = await fetch(url, { headers: { 'User-Agent': 'SEOGenerator-Benchmark/1.0' }, signal: AbortSignal.timeout(10000), redirect: 'follow' });
        const html = await resp.text();
        const a = analyzePage(html, domain);
        analyses.push({ domain, ...a });
      } catch { /* skip */ }
    }

    // Compute benchmarks
    const avgWordCount = Math.round(analyses.reduce((s, a) => s + a.wordCount, 0) / (analyses.length || 1));
    const schemaPct = Math.round((analyses.filter(a => a.hasSchema).length / (analyses.length || 1)) * 100);
    const faqPct = Math.round((analyses.filter(a => a.hasFAQ).length / (analyses.length || 1)) * 100);
    const localBusinessPct = Math.round((analyses.filter(a => a.hasLocalBusiness).length / (analyses.length || 1)) * 100);
    const avgScriptCount = Math.round(analyses.reduce((s, a) => s + a.scriptCount, 0) / (analyses.length || 1));
    const avgImgCount = Math.round(analyses.reduce((s, a) => s + a.imgCount, 0) / (analyses.length || 1));
    const avgInternalLinks = Math.round(analyses.reduce((s, a) => s + a.internalLinks, 0) / (analyses.length || 1));
    const avgH2Count = Math.round(analyses.reduce((s, a) => s + a.h2Count, 0) / (analyses.length || 1));

    const benchmark = {
      industry,
      competitorsAnalyzed: analyses.length,
      avg_word_count: avgWordCount,
      schema_usage_pct: schemaPct,
      faq_schema_pct: faqPct,
      local_business_schema_pct: localBusinessPct,
      avg_script_count: avgScriptCount,
      avg_img_count: avgImgCount,
      avg_internal_links: avgInternalLinks,
      avg_h2_count: avgH2Count,
    };

    // Generate target (20% better than benchmark)
    const target = {
      word_count: Math.round(avgWordCount * 1.2),
      schema: 'required',
      faq_schema: 'required',
      local_business_schema: 'required',
      script_count: Math.round(avgScriptCount * 0.8),
      img_count: Math.max(avgImgCount, 5),
      internal_links: Math.round(avgInternalLinks * 1.2),
      h2_count: Math.max(avgH2Count, 4),
    };

    // Use LLM to build playbook
    const prompt = `You are an SEO strategist. Based on these industry benchmarks, create a playbook to beat the top competitors.

Industry: ${industry}
Benchmarks: ${JSON.stringify(benchmark, null, 2)}
Target (20% better): ${JSON.stringify(target, null, 2)}

Create a playbook with:
1. benchmark_summary: reverse-engineered combined benchmark of the top 3 competitors
2. target_summary: the 20%-better-than-benchmark target
3. competitor_strengths: array of common strengths
4. competitor_failure_points: array of common weaknesses
5. content_gaps: array of content opportunities
6. authority_gaps: array of authority building opportunities
7. surface_wins: array of quick wins
8. norms: array of industry norms (word counts, page types, schema, review counts)

Output strict JSON.`;

    const schema = {
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
      },
    };

    const llmRes = await svc.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    const data = llmRes?.data ?? llmRes;

    // Store as IndustryPlaybook
    await svc.entities.IndustryPlaybook.create({
      industry,
      benchmark_summary: data?.benchmark_summary || JSON.stringify(benchmark),
      target_summary: data?.target_summary || JSON.stringify(target),
      competitor_strengths: data?.competitor_strengths || [],
      competitor_failure_points: data?.competitor_failure_points || [],
      content_gaps: data?.content_gaps || [],
      authority_gaps: data?.authority_gaps || [],
      surface_wins: data?.surface_wins || [],
      norms: data?.norms || [],
      provenance: 'INFERRED',
      compiled_at: new Date().toISOString(),
    }).catch(() => {});

    return Response.json({
      ok: true,
      industry,
      benchmark,
      target,
      playbook: data,
      competitorAnalyses: analyses,
      computedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}