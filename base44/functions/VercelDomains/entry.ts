import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const token = secrets.get('VERCEL_API_TOKEN');
    if (!token) return Response.json({ error: 'VERCEL_API_TOKEN not set — add it in Settings → Secrets' }, { status: 500 });
    const teamId = secrets.get('VERCEL_TEAM_ID');
    const defaultProject = secrets.get('VERCEL_PROJECT_ID');
    const qs = teamId ? `?teamId=${teamId}` : '';
    const h = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list_domains';
    const projectId = body.project_id || defaultProject;

    if (action === 'list_projects') {
      const r = await fetch(`https://api.vercel.com/v9/projects${qs}`, { headers: h });
      const data = await r.json();
      if (!r.ok) return Response.json({ error: data.error?.message || 'list_projects failed', status: r.status }, { status: r.status });
      return Response.json({ projects: (data.projects || []).map((p) => ({ id: p.id, name: p.name })) });
    }

    if (action === 'list_domains') {
      if (!projectId) return Response.json({ error: 'project_id required (or set VERCEL_PROJECT_ID secret)' }, { status: 400 });
      const r = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains${qs}`, { headers: h });
      const data = await r.json();
      if (!r.ok) return Response.json({ error: data.error?.message || 'list_domains failed', status: r.status }, { status: r.status });
      return Response.json({ domains: data.domains || [] });
    }

    if (action === 'add_domain') {
      const { name } = body;
      if (!name || !projectId) return Response.json({ error: 'name and project_id required' }, { status: 400 });
      const r = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains${qs}`, {
        method: 'POST', headers: h, body: JSON.stringify({ name })
      });
      const data = await r.json();
      if (!r.ok) return Response.json({ error: data.error?.message || 'add_domain failed', status: r.status }, { status: r.status });
      return Response.json({ domain: data });
    }

    if (action === 'get_domain') {
      const { name } = body;
      if (!name || !projectId) return Response.json({ error: 'name and project_id required' }, { status: 400 });
      const r = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains/${name}${qs}`, { headers: h });
      const data = await r.json();
      if (!r.ok) return Response.json({ error: data.error?.message || 'get_domain failed', status: r.status }, { status: r.status });
      return Response.json({ domain: data });
    }

    if (action === 'remove_domain') {
      const { name } = body;
      if (!name || !projectId) return Response.json({ error: 'name and project_id required' }, { status: 400 });
      const r = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains/${name}${qs}`, { method: 'DELETE', headers: h });
      return Response.json({ ok: r.ok, status: r.status });
    }

    return Response.json({ error: `unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}