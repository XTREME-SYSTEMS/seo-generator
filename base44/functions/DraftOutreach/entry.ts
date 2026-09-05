import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// DraftOutreach — drafts personalized outreach emails for backlink building,
// guest posts, partnership requests, and link reclamation. Uses LLM to craft
// compelling, personalized emails based on target site + value proposition.
//
// Invoke: base44.functions.invoke('DraftOutreach', { target_domain, target_name?, our_domain, value_prop, outreach_type, business_name? })
// Returns: { ok, emails }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const targetDomain = String(body.target_domain || '').trim();
    const targetName = String(body.target_name || '').trim();
    const ourDomain = String(body.our_domain || '').trim();
    const valueProp = String(body.value_prop || '').trim();
    const outreachType = String(body.outreach_type || 'backlink').trim(); // backlink, guest_post, partnership, link_reclamation
    const businessName = String(body.business_name || '').trim();
    if (!targetDomain || !ourDomain) return Response.json({ error: 'target_domain and our_domain are required' }, { status: 400 });

    const prompt = `You are an expert outreach copywriter. Draft 3 personalized outreach email variants for a ${outreachType} request.

Target: ${targetName || 'Website Owner'} at ${targetDomain}
Our site: ${ourDomain}
${businessName ? `Our business: ${businessName}` : ''}
Value proposition: ${valueProp || 'We create high-quality content that their audience would find valuable.'}

Rules:
- Subject line < 60 chars, compelling, not spammy
- Personalized opening (reference their site/content)
- Clear value proposition (what's in it for them)
- Specific ask (one clear CTA)
- Professional but warm tone
- Short (under 150 words)
- No generic templates — make each unique

Outreach type: ${outreachType}
- backlink: request a link to our content
- guest_post: pitch a guest post
- partnership: propose a content partnership
- link_reclamation: request fixing a broken link to our site

Output strict JSON: { emails: [{ subject, body, tone, approach, predicted_response_rate (0-100) }] }`;

    const schema = {
      type: 'object',
      properties: {
        emails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subject: { type: 'string' },
              body: { type: 'string' },
              tone: { type: 'string' },
              approach: { type: 'string' },
              predicted_response_rate: { type: 'number' },
            },
          },
        },
      },
    };

    const llmRes = await svc.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    const data = llmRes?.data ?? llmRes;
    if (!data?.emails) return Response.json({ error: 'AI did not return emails' }, { status: 502 });

    return Response.json({
      ok: true,
      targetDomain,
      ourDomain,
      outreachType,
      emails: data.emails,
      draftedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}