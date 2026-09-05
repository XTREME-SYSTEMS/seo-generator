import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// GenerateHeadlines — generates A/B headline variants for a page section.
// Uses LLM to produce 5-10 headline variants optimized for CTR + SEO.
//
// Invoke: base44.functions.invoke('GenerateHeadlines', { topic, keyword, business_name?, count? })
// Returns: { ok, headlines }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const topic = String(body.topic || '').trim();
    const keyword = String(body.keyword || '').trim();
    const businessName = String(body.business_name || '').trim();
    const count = Math.min(body.count || 5, 10);
    if (!topic) return Response.json({ error: 'topic is required' }, { status: 400 });

    const prompt = `You are an expert headline copywriter. Generate ${count} A/B headline variants for the following:
Topic: ${topic}
${keyword ? `Target keyword: ${keyword}` : ''}
${businessName ? `Business: ${businessName}` : ''}

Rules:
- Each headline <60 chars for SEO title tags
- Include emotional triggers (curiosity, urgency, benefit)
- Vary approaches: question, how-to, list, benefit-driven, fear-of-missing-out, social-proof
- Include the target keyword naturally in most variants
- Make them click-worthy but not clickbait

Output strict JSON: { headlines: [{ text, angle, char_count, predicted_ctr_score (0-100) }] }`;

    const schema = {
      type: 'object',
      properties: {
        headlines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              angle: { type: 'string' },
              char_count: { type: 'number' },
              predicted_ctr_score: { type: 'number' },
            },
          },
        },
      },
    };

    const llmRes = await svc.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    const data = llmRes?.data ?? llmRes;
    if (!data?.headlines) return Response.json({ error: 'AI did not return headlines' }, { status: 502 });

    return Response.json({
      ok: true,
      topic,
      keyword,
      headlines: data.headlines,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}