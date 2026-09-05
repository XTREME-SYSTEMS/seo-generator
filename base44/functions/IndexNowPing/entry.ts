import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// IndexNowPing — pings IndexNow (free public API by Microsoft/Bing) to request
// instant indexing of URLs. Works with Bing, Yandex, Naver, Seznam, Yep.
// The key file must be hosted at https://{host}/{key}.txt containing the key.
//
// Invoke: base44.functions.invoke('IndexNowPing', { urls, host, key? })
// Returns: { ok, host, urlsSubmitted, httpStatus, status }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const urls = Array.isArray(body.urls) ? body.urls.map(u => String(u).trim()).filter(Boolean) : [];
    const host = String(body.host || '').trim();
    if (!urls.length || !host) return Response.json({ error: 'urls (array) and host are required' }, { status: 400 });

    // Generate a simple key (IndexNow accepts any key; the key file must be hosted at the site)
    const key = body.key || Array.from({ length: 16 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
    const keyLocation = `https://${host}/${key}.txt`;

    const payload = { host, key, key_location: keyLocation, url_list: urls.slice(0, 10000) };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let resp;
    try {
      resp = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timeout);
      return Response.json({ error: 'IndexNow ping failed: ' + (e?.message || 'unknown') }, { status: 502 });
    }
    clearTimeout(timeout);

    // Log
    await svc.entities.Receipt.create({
      type: 'indexnow_ping',
      url: `https://${host}`,
      summary: `IndexNow pinged ${urls.length} URLs, status ${resp.status}`,
      details: JSON.stringify({ host, urlsSubmitted: urls.length, httpStatus: resp.status }),
      provenance: 'MEASURED',
      occurred_at: new Date().toISOString(),
    }).catch(() => {});

    return Response.json({
      ok: true,
      host,
      key,
      keyLocation,
      urlsSubmitted: urls.length,
      httpStatus: resp.status,
      status: resp.status === 200 ? 'accepted' : resp.status === 202 ? 'queued' : 'check-key-file',
      note: `Ensure the key file is hosted at ${keyLocation} containing the key: ${key}`,
      pingedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}