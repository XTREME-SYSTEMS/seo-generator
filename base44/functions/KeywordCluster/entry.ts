import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// KeywordCluster — clusters keywords by search intent and builds topic clusters
// for topical authority. Uses LLM to group keywords into 5-8 clusters with
// recommended page types and title suggestions.
//
// Invoke: base44.functions.invoke('KeywordCluster', { keywords, business_name? })
// Returns: { ok, clusters, inputCount }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const keywords = Array.isArray(body.keywords) ? body.keywords.map(k => String(k).trim()).filter(Boolean) : [];
    const businessName = String(body.business_name || '').trim();
    if (!keywords.length) return Response.json({ error: 'keywords (array) is required' }, { status: 400 });

    const prompt = `You are an SEO keyword strategist. Cluster these keywords by search intent and topic.
${businessName ? `Business: ${businessName}.` : ''}
Keywords: ${keywords.join(', ')}

Group into 5-8 clusters. Each cluster: cluster_name, intent (informational/commercial/transactional/navigational/local), keywords (array), recommended_page_type (service/blog/faq/landing/location), priority (high/medium/low based on traffic potential), and a title_suggestion optimized for SEO. Output strict JSON.`;

    const schema = {
      type: 'object',
      properties: {
        clusters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cluster_name: { type: 'string' },
              intent: { type: 'string' },
              keywords: { type: 'array', items: { type: 'string' } },
              recommended_page_type: { type: 'string' },
              priority: { type: 'string' },
              title_suggestion: { type: 'string' },
            },
          },
        },
      },
    };

    const llmRes = await svc.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    const data = llmRes?.data ?? llmRes;
    if (!data?.clusters) return Response.json({ error: 'AI did not return clusters' }, { status: 502 });

    // Store clusters as TractionKeyword records for each cluster
    for (const cluster of data.clusters) {
      for (const kw of cluster.keywords) {
        await svc.entities.TractionKeyword.create({
          keyword: kw,
          type: cluster.intent === 'informational' ? 'question' : cluster.intent === 'local' ? 'local_modifier' : 'long_tail',
          intent: cluster.intent,
          rationale: `Cluster: ${cluster.cluster_name} → ${cluster.recommended_page_type}`,
          scanned_at: new Date().toISOString(),
        }).catch(() => {});
      }
    }

    return Response.json({
      ok: true,
      clusters: data.clusters,
      business_name: businessName,
      inputCount: keywords.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}