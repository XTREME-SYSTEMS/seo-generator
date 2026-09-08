import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { prompt, model, system_prompt, response_json_schema, max_tokens, temperature } = body;

    if (!prompt) return Response.json({ error: 'Prompt required' }, { status: 400 });

    const vercelToken = secrets.get('VERCEL_API_TOKEN');
    const teamId = secrets.get('VERCEL_TEAM_ID');

    if (!vercelToken) return Response.json({ error: 'VERCEL_API_TOKEN not configured' }, { status: 500 });

    const messages = [];
    if (system_prompt) messages.push({ role: 'system', content: system_prompt });
    messages.push({ role: 'user', content: prompt });

    const gatewayBody = {
      model: model || 'openai/gpt-4o-mini',
      messages,
      max_tokens: max_tokens || 4096,
      temperature: temperature ?? 0.7,
    };

    if (response_json_schema) {
      gatewayBody.response_format = {
        type: 'json_schema',
        json_schema: { name: 'response', schema: response_json_schema, strict: false },
      };
    }

    const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gatewayBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      return Response.json(
        { error: 'AI Gateway error', status: response.status, detail: errText },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let result = content;
    if (response_json_schema && content) {
      try { result = JSON.parse(content); } catch { result = content; }
    }

    return Response.json({
      result,
      model: data.model,
      usage: data.usage,
      gateway: 'vercel-ai-gateway',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}