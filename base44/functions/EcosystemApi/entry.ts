import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Ecosystem API gateway — lets external systems read capabilities/URLs/gaps
// and trigger fixes + syncs via API key auth.
// Actions: list_capabilities | list_urls | get_url_gaps | fix_url | sync | create_key | list_keys | revoke_key
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list_capabilities';
    const nowIso = new Date().toISOString();

    // --- Key management actions (require app user auth, not API key) ---
    if (action === 'create_key') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const label = body.label || 'Ecosystem Key';
      const scopes = Array.isArray(body.scopes) ? body.scopes : ['read', 'fix', 'sync'];
      const raw = 'sk_' + cryptoRandom(32);
      const key_hash = await sha256(raw);
      const rec = await svc.entities.ApiKey.create({
        label,
        key_prefix: raw.slice(0, 11),
        key_hash,
        scopes,
        status: 'active',
        created_at: nowIso,
      });
      return Response.json({ ok: true, key: raw, id: rec.id, label, scopes, key_prefix: rec.key_prefix });
    }

    if (action === 'list_keys') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const keys = await svc.entities.ApiKey.filter({ status: 'active' }, '-created_at', 100);
      return Response.json({ keys: keys.map((k) => ({ id: k.id, label: k.label, key_prefix: k.key_prefix, scopes: k.scopes, created_at: k.created_at, last_used_at: k.last_used_at })) });
    }

    if (action === 'revoke_key') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      await svc.entities.ApiKey.update(body.key_id, { status: 'revoked' });
      return Response.json({ ok: true });
    }

    // --- All other actions require a valid API key ---
    const suppliedKey = body.api_key || req.headers.get('x-api-key') || '';
    if (!suppliedKey) return Response.json({ error: 'api_key required (pass api_key in body or x-api-key header)' }, { status: 401 });
    const keyHash = await sha256(suppliedKey);
    const keyRecs = await svc.entities.ApiKey.filter({ key_hash: keyHash, status: 'active' }, '-created_at', 5);
    const keyRec = keyRecs[0];
    if (!keyRec) return Response.json({ error: 'Invalid or revoked API key' }, { status: 403 });
    await svc.entities.ApiKey.update(keyRec.id, { last_used_at: nowIso });
    const scopes = keyRec.scopes || [];

    if (action === 'list_capabilities') {
      const caps = await svc.entities.Capability.list('-category', 500);
      return Response.json({ capabilities: caps });
    }

    if (action === 'list_urls') {
      const urls = await svc.entities.UrlTarget.list('-created_date', body.limit || 500);
      const sheets = await svc.entities.AreSheetRow.list('-priority_score', 500);
      const byUrl = new Map();
      for (const s of sheets) if (s.url) byUrl.set(s.url, s);
      return Response.json({ urls: urls.map((u) => ({ ...u, score: byUrl.get(u.url)?.score ?? null, gap_type: byUrl.get(u.url)?.gap_type ?? null, status: byUrl.get(u.url)?.status ?? null })) });
    }

    if (action === 'get_url_gaps') {
      const url = body.url;
      if (!url) return Response.json({ error: 'url required' }, { status: 400 });
      const [asyms, diags, attempts] = await Promise.all([
        svc.entities.Asymmetry.filter({ url }, '-detected_at', 50),
        svc.entities.SystemDiagnosis.filter({ url }, '-diagnosed_at', 50),
        svc.entities.FixAttempt.filter({ url }, '-created_at', 50),
      ]);
      return Response.json({ url, asymmetries: asyms, diagnoses: diags, fix_attempts: attempts });
    }

    if (action === 'fix_url') {
      if (!scopes.includes('fix')) return Response.json({ error: 'scope "fix" required' }, { status: 403 });
      // Delegate to FixEngine by re-running its logic inline is heavy; instead trigger via invoke.
      const fixRes = await base44.functions.invoke('FixEngine', { url: body.url, gap_id: body.gap_id, gap_type: body.gap_type, max_attempts: body.max_attempts || 3 });
      return Response.json({ ok: true, result: fixRes });
    }

    if (action === 'sync') {
      if (!scopes.includes('sync')) return Response.json({ error: 'scope "sync" required' }, { status: 403 });
      const syncRes = await base44.functions.invoke('SyncSearchConsole', { action: 'sync', limit: body.limit || 100 });
      return Response.json({ ok: true, result: syncRes });
    }

    return Response.json({ error: `unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function sha256(str) {
  const data = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function cryptoRandom(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => chars[b % chars.length]).join('');
}