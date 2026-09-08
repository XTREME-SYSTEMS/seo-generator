import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

const INTEGRATION_TYPES = [
  'supabase',
  'googledrive',
  'googledocs',
  'googlesheets',
  'googlecalendar',
  'googletasks',
  'gmail',
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'status': {
        const vercelToken = secrets.get('VERCEL_API_TOKEN');
        const teamId = secrets.get('VERCEL_TEAM_ID');

        let vercel = { available: false };
        let aiGateway = { available: false };

        if (vercelToken && teamId) {
          try {
            const projectRes = await fetch(
              `https://api.vercel.com/v9/projects/seo-cron-runner?teamId=${teamId}`,
              { headers: { 'Authorization': `Bearer ${vercelToken}` } }
            );
            const project = await projectRes.json();

            const cronRes = await fetch(
              `https://api.vercel.com/v9/projects/seo-cron-runner/crons?teamId=${teamId}`,
              { headers: { 'Authorization': `Bearer ${vercelToken}` } }
            );
            const cronData = await cronRes.json();

            vercel = {
              available: true,
              project: {
                id: project.id,
                name: project.name,
                ready: project.targets?.production?.readyState,
                url: project.targets?.production?.alias?.[0],
              },
              crons: cronData.crons?.length || 0,
            };

            const aiRes = await fetch('https://ai-gateway.vercel.sh/v1/models', {
              headers: { 'Authorization': `Bearer ${vercelToken}` },
            });
            if (aiRes.ok) {
              const aiData = await aiRes.json();
              aiGateway = { available: true, models: aiData.data?.length || 0 };
            }
          } catch (e) {
            vercel = { available: false, error: e.message };
          }
        }

        const connectors = {};
        for (const name of INTEGRATION_TYPES) {
          try {
            const { accessToken } = await base44.asServiceRole.connectors.getConnection(name);
            connectors[name] = { connected: !!accessToken };
          } catch {
            connectors[name] = { connected: false };
          }
        }

        return Response.json({ vercel, aiGateway, connectors });
      }

      case 'test-connector': {
        const { connector } = body;
        if (!INTEGRATION_TYPES.includes(connector)) {
          return Response.json({ error: 'Unknown connector' }, { status: 400 });
        }

        try {
          const { accessToken } = await base44.asServiceRole.connectors.getConnection(connector);
          return Response.json({ connected: true, has_token: !!accessToken });
        } catch (err) {
          return Response.json({ connected: false, error: err.message });
        }
      }

      case 'test-ai-gateway': {
        const vercelToken = secrets.get('VERCEL_API_TOKEN');
        if (!vercelToken) return Response.json({ error: 'VERCEL_API_TOKEN not set' }, { status: 500 });

        const aiRes = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: 'Say "AI Gateway connected" in 3 words.' }],
            max_tokens: 20,
          }),
        });

        if (!aiRes.ok) {
          const errText = await aiRes.text();
          return Response.json({ connected: false, status: aiRes.status, detail: errText.substring(0, 500) });
        }

        const data = await aiRes.json();
        return Response.json({
          connected: true,
          response: data.choices?.[0]?.message?.content,
          model: data.model,
        });
      }

      default:
        return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}