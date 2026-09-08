import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// ManageApiKey — Generate, revoke, update, and list API keys.
// Supports three access levels: read, write, admin.
//
// Invoke: base44.functions.invoke('ManageApiKey', { action, ... })
// Actions:
//   generate  { label, level } → { api_key, id } (full key shown ONCE)
//   list      {} → [ { id, label, level, key_prefix, status, created_at, last_used_at } ]
//   update    { id, label, level } → { ok }
//   revoke    { id } → { ok }

const LEVEL_SCOPES = {
  read: ['entities:read', 'functions:read'],
  write: ['entities:read', 'entities:write', 'functions:read', 'functions:invoke'],
  admin: ['entities:read', 'entities:write', 'entities:delete', 'functions:read', 'functions:invoke', 'admin:all'],
};

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'xsk_';
  for (let i = 0; i < 48; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    if (action === 'generate') {
      const label = body.label || 'Untitled Key';
      const level = body.level || 'read';
      const fullKey = generateApiKey();
      const keyHash = await sha256(fullKey);
      const keyPrefix = fullKey.slice(0, 12);

      const record = await svc.entities.ApiKey.create({
        label,
        level,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        scopes: LEVEL_SCOPES[level] || LEVEL_SCOPES.read,
        status: 'active',
        created_at: new Date().toISOString(),
      });

      return Response.json({
        ok: true,
        api_key: fullKey,
        id: record.id,
        label,
        level,
        key_prefix: keyPrefix,
      });
    }

    if (action === 'list') {
      const keys = await svc.entities.ApiKey.list('-created_date', 100);
      return Response.json({ ok: true, keys });
    }

    if (action === 'update') {
      const updates = {};
      if (body.label) updates.label = body.label;
      if (body.level) {
        updates.level = body.level;
        updates.scopes = LEVEL_SCOPES[body.level] || LEVEL_SCOPES.read;
      }
      await svc.entities.ApiKey.update(body.id, updates);
      return Response.json({ ok: true });
    }

    if (action === 'revoke') {
      await svc.entities.ApiKey.update(body.id, { status: 'revoked' });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
  } catch (error) {
    console.error('[ManageApiKey] Error:', error.message);
    return Response.json({ error: error.message, ok: false }, { status: 500 });
  }
}