import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// GenerateCopyVariants — generates multiple copy variants for a page section
// (hero, about, CTA, etc.) for A/B testing. Uses LLM to produce 5-10 variants
// with different angles, tones, and lengths.
//
// Invoke: base44.functions.invoke('GenerateCopyVariants', { section_type, topic, keyword, business_name?, count? })
// Returns: { ok, variants }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const sectionType = String(body.section_type || 'hero').trim();
    const topic = String(body.topic || '').trim();
    const keyword = String(body.keyword || '').trim();
    const businessName = String(body.business_name || '').trim();
    const count = Math.min(body.count || 5, 10);
    if (!topic) return Response.json({ error: 'topic is required' }, { status: 400 });

    const prompt = `You are an expert direct-response copywriter. Generate ${count} copy variants for a ${sectionType} section.
Topic: ${topic}
${keyword ? `Target keyword: ${keyword}` : ''}
${businessName ? `Business: ${businessName}` : ''}

Each variant should use a different copywriting angle:
1. Problem-agitate-solve
2. Story-driven
3. Benefit-first
4. Social proof
5. Urgency-driven
6. Question-led
7. Statistic-led
8. Comparison
9. Before/after
10. FAQ-style

Output strict JSON: { variants: [{ text, angle, word_count, tone, predicted_conversion_score (0-100) }] }`;

    const schema = {
      type: 'object',
      properties: {
        variants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              angle: { type: 'string' },
              word_count: { type: 'number' },
              tone: { type: 'string' },
              predicted_conversion_score: { type: 'number' },
            },
          },
        },
      },
    };

    const llmRes = await svc.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    const data = llmRes?.data ?? llmRes;
    if (!data?.variants) return Response.json({ error: 'AI did not return variants' }, { status: 502 });

    return Response.json({
      ok: true,
      sectionType,
      topic,
      variants: data.variants,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}