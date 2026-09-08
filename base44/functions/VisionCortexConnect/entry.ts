import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// VisionCortexConnect — Manage the Vision Cortex brain connection.
// Stores endpoint + API key in ConnectorStatus, tests connectivity, returns status.
//
// Actions:
//   status → { connected, endpoint, state, last_sync_at }
//   save   { endpoint, apiKey } → { ok, state }
//   test   { endpoint, apiKey } → { ok, state, detail }

async function testEndpoint(endpoint: string, apiKey: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const url = endpoint.replace(/\/$/, '') + '/health';
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return { ok: true, detail: 'Connection successful' };
    return { ok: false, detail: `Endpoint returned ${res.status}` };
  } catch (e) {
    return { ok: false, detail: e.message || 'Connection failed' };
  }
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'status';

    // Find existing VC config record
    const existing = await svc.entities.ConnectorStatus.filter({ service: 'vision_cortex' });
    const record = existing[0];

    if (action === 'status') {
      return Response.json({
        ok: true,
        connected: record?.state === 'authorized',
        endpoint: record?.note ? JSON.parse(record.note).endpoint || '' : '',
        state: record?.state || 'disabled',
        last_sync_at: record?.last_sync_at || null,
      });
    }

    if (action === 'save') {
      const { endpoint, apiKey } = body;
      if (!endpoint || !apiKey) return Response.json({ error: 'Endpoint and API key required' }, { status: 400 });

      const test = await testEndpoint(endpoint, apiKey);
      const state = test.ok ? 'authorized' : 'degraded';
      const config = JSON.stringify({ endpoint, api_key: apiKey });

      if (record) {
        await svc.entities.ConnectorStatus.update(record.id, {
          state,
          note: config,
          last_sync_at: new Date().toISOString(),
        });
      } else {
        await svc.entities.ConnectorStatus.create({
          service: 'vision_cortex',
          purpose: 'Vision Cortex brain connection for autonomous system control',
          state,
          write_allowed: true,
          provides: ['system_control', 'healing', 'sync', 'monitoring'],
          note: config,
          last_sync_at: new Date().toISOString(),
        });
      }

      return Response.json({ ok: true, state, detail: test.detail, connected: test.ok });
    }

    if (action === 'test') {
      const { endpoint, apiKey } = body;
      if (!endpoint || !apiKey) return Response.json({ error: 'Endpoint and API key required' }, { status: 400 });
      const test = await testEndpoint(endpoint, apiKey);
      return Response.json({ ok: test.ok, detail: test.detail, state: test.ok ? 'authorized' : 'degraded' });
    }

    if (action === 'disconnect') {
      if (record) {
        await svc.entities.ConnectorStatus.update(record.id, { state: 'disabled', note: '', last_sync_at: new Date().toISOString() });
      }
      return Response.json({ ok: true, connected: false });
    }

    return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
  } catch (error) {
    console.error('[VisionCortexConnect] Error:', error.message);
    return Response.json({ error: error.message, ok: false }, { status: 500 });
  }
}