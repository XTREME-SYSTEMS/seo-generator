import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const THROTTLE_MS = 60000;

async function hashPayload(payload) {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(JSON.stringify(payload)));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function probe(baseUrl, apiKey, path) {
  const started = Date.now();
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  try {
    const res = await fetch(url, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: AbortSignal.timeout(10000),
    });
    const latency = Date.now() - started;
    let json = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, latency, json };
  } catch (error) {
    return { ok: false, status: 0, latency: Date.now() - started, error: error.name === 'TimeoutError' ? 'timeout' : 'network_error', json: null };
  }
}

function classifyHost(host) {
  if (!host) return null;
  const isPreview = host.includes('preview-sandbox');
  const isAppFunctionHost = host.endsWith('.base44.app');
  return { isPreview, isAppFunctionHost };
}

async function attest(base44, label, baseUrl, apiKey) {
  if (!baseUrl) {
    return { engine_label: label, host: null, reachable: false, http_status: 0, state: 'MISCONFIGURED', liveness_ok: false, readiness_ok: false, findings: ['No URL configured for this engine slot'], latency_ms: 0 };
  }

  const host = baseUrl.replace(/^https?:\/\//, '').split('/')[0];
  const hostClass = classifyHost(host);
  const findings = [];

  const health = await probe(baseUrl, apiKey, '/health');
  const readiness = await probe(baseUrl, apiKey, '/readiness');
  const config = health.ok ? await probe(baseUrl, apiKey, '/config') : { ok: false, json: null };

  const healthJson = health.json || {};
  const readinessJson = readiness.json || {};
  const configJson = config.json || {};

  const livenessOk = Boolean(health.ok && (healthJson.ok === true || healthJson.status === 'ok' || healthJson.healthy === true || Object.keys(healthJson).length > 0));
  const readinessOk = Boolean(readiness.ok && (readinessJson.ok !== false));

  if (hostClass?.isPreview) findings.push('Configured host is a preview sandbox — preview hosts do not serve the published app and 404 outside the builder');
  if (health.status === 404) findings.push('Health endpoint returned 404 — this URL is not a browser engine');
  if (!health.ok) findings.push(`Engine unreachable (${health.error || `HTTP ${health.status}`})`);
  if (health.ok && !readiness.ok) findings.push(`Health responds but readiness fails (HTTP ${readiness.status})`);
  if (configJson.sttAvailable === false || configJson.stt === false) findings.push('Speech-to-text unavailable — audio captcha fallback will fail silently');

  const poolCapacity = Number(configJson.poolCapacity ?? configJson.pool_capacity ?? healthJson.poolCapacity ?? 0) || undefined;
  const poolSize = Number(configJson.poolSize ?? configJson.pool_size ?? healthJson.poolSize ?? 0) || undefined;
  if (poolCapacity && poolSize !== undefined && poolSize === 0) findings.push('Warm pool is empty — first session will pay cold-start latency');

  let state = 'HEALTHY';
  if (hostClass?.isPreview || health.status === 404) state = 'MISCONFIGURED';
  else if (!health.ok) state = 'UNREACHABLE';
  else if (!readinessOk || findings.length > 0) state = 'DEGRADED';

  const attested = {
    engine_label: label,
    host,
    reachable: health.ok,
    http_status: health.status,
    state,
    liveness_ok: livenessOk,
    readiness_ok: readinessOk,
    git_sha: String(configJson.gitSha || configJson.git_sha || healthJson.gitSha || '').slice(0, 80) || undefined,
    version: String(configJson.version || healthJson.version || '').slice(0, 40) || undefined,
    pool_capacity: poolCapacity,
    pool_size: poolSize,
    stt_available: configJson.sttAvailable ?? configJson.stt ?? undefined,
    latency_ms: health.latency,
    findings,
    checked_at: new Date().toISOString(),
  };
  attested.receipt_hash = await hashPayload(attested);
  return attested;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));

    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const last = await base44.asServiceRole.entities.EngineAttestation.list('-checked_at', 1);
    const lastRun = last?.[0]?.checked_at ? new Date(last[0].checked_at).getTime() : 0;
    const body = await req.json().catch(() => ({}));
    const force = body?.force === true;
    if (user && !force && Date.now() - lastRun < THROTTLE_MS) {
      return Response.json({ throttled: true, last: last[0], message: 'Attested less than a minute ago' });
    }

    const targets = [
      { label: 'primary', url: secrets.get('BROWSER_ENGINE_URL'), key: secrets.get('ENGINE_API_KEY') },
      { label: 'cloudbrowser', url: secrets.get('CLOUDBROWSER_ENGINE_URL'), key: secrets.get('CLOUDBROWSER_API_KEY') },
      { label: 'gateway', url: secrets.get('CLOUDBROWSER_GATEWAY_URL'), key: secrets.get('CLOUDBROWSER_API_KEY') },
    ];

    const seen = new Set();
    const results = [];
    for (const target of targets) {
      if (!target.url) continue;
      const key = target.url.replace(/\/$/, '');
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(await attest(base44, target.label, target.url, target.key));
    }

    if (results.length === 0) {
      return Response.json({ error: 'No engine URLs configured' }, { status: 400 });
    }

    const created = await base44.asServiceRole.entities.EngineAttestation.bulkCreate(results);
    const primary = results.find((r) => r.engine_label === 'primary') || results[0];
    const worst = !primary.liveness_ok ? 'UNREACHABLE'
      : results.some((r) => r.state !== 'HEALTHY') ? 'DEGRADED'
      : 'HEALTHY';

    return Response.json({ overall: worst, attestations: results.map((r) => ({ label: r.engine_label, host: r.host, state: r.state, latency_ms: r.latency_ms, findings: r.findings, receipt_hash: r.receipt_hash })), created: created?.length || results.length });
  } catch (error) {
    console.error('EngineAttestation failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}