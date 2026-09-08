import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, ...params } = body;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');

    switch (action) {
      case 'list-projects': {
        const res = await fetch('https://api.supabase.com/v1/projects', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        const data = await res.json();
        return Response.json({
          projects: (data || []).map(p => ({
            id: p.id,
            ref: p.ref,
            name: p.name,
            status: p.status,
            region: p.region,
          })),
        });
      }

      case 'list-tables': {
        const { project_ref } = params;
        const res = await fetch(
          `https://api.supabase.com/v1/projects/${project_ref}/database/query/read-only`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
            }),
          }
        );
        const data = await res.json();
        return Response.json({ tables: data });
      }

      case 'sync-entity': {
        const { entity_name, table_name, project_ref } = params;

        const records = await base44.asServiceRole.entities[entity_name].list();

        const keysRes = await fetch(`https://api.supabase.com/v1/projects/${project_ref}/api-keys`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        const keys = await keysRes.json();
        const serviceKey = keys.find(k => k.name === 'service_role')?.api_key;

        if (!serviceKey) return Response.json({ error: 'Could not get service role key' }, { status: 500 });

        const upsertRes = await fetch(`https://${project_ref}.supabase.co/rest/v1/${table_name}`, {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(records),
        });
        const upsertData = await upsertRes.json();

        return Response.json({ synced: records.length, result: upsertData });
      }

      case 'run-sql': {
        const { project_ref, query } = params;
        const res = await fetch(`https://api.supabase.com/v1/projects/${project_ref}/database/query`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        const data = await res.json();
        return Response.json({ result: data });
      }

      case 'create-table': {
        const { project_ref, table_name, columns } = params;
        const colDefs = columns.map(c => `"${c.name}" ${c.type}`).join(', ');
        const query = `CREATE TABLE IF NOT EXISTS public."${table_name}" (${colDefs});`;
        const res = await fetch(`https://api.supabase.com/v1/projects/${project_ref}/database/query`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        const data = await res.json();
        return Response.json({ result: data, query });
      }

      default:
        return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}