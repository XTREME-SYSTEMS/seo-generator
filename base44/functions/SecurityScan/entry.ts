import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// SecurityScan — scans a URL for exposed API keys, tokens, secrets in HTML+JS,
// and checks security headers (CSP, X-Frame, X-Content-Type, HSTS, Referrer-Policy).
//
// Invoke: base44.functions.invoke('SecurityScan', { url })
// Returns: { ok, url, score, exposedSecrets, missingHeaders, recommendations }

const SECRET_PATTERNS = [
  { pattern: /(?:api[_-]?key|apikey)["'\s:=]+["']([A-Za-z0-9_\-]{32,})["']/gi, type: 'API Key' },
  { pattern: /(?:secret|client[_-]?secret)["'\s:=]+["']([A-Za-z0-9_\-]{32,})["']/gi, type: 'Secret' },
  { pattern: /(?:token|access[_-]?token|auth[_-]?token)["'\s:=]+["']([A-Za-z0-9_\-\.]{32,})["']/gi, type: 'Token' },
  { pattern: /(?:password|passwd|pwd)["'\s:=]+["']([^"'\s]{8,})["']/gi, type: 'Password' },
  { pattern: /sk_live_[A-Za-z0-9]{24,}/g, type: 'Stripe Secret Key' },
  { pattern: /pk_live_[A-Za-z0-9]{24,}/g, type: 'Stripe Publishable Key' },
  { pattern: /AIza[0-9A-Za-z_\-]{35}/g, type: 'Google API Key' },
  { pattern: /ghp_[A-Za-z0-9]{36}/g, type: 'GitHub Token' },
  { pattern: /gho_[A-Za-z0-9]{36}/g, type: 'GitHub OAuth Token' },
  { pattern: /xox[baprs]-[A-Za-z0-9\-]{10,}/g, type: 'Slack Token' },
  { pattern: /eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}/g, type: 'JWT Token' },
  { pattern: /AKIA[A-Z0-9]{16}/g, type: 'AWS Access Key' },
];

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const url = String(body.url || '').trim();
    if (!url) return Response.json({ error: 'url is required' }, { status: 400 });

    let parsed;
    try { parsed = new URL(url); } catch { return Response.json({ error: 'Invalid URL' }, { status: 400 }); }

    // Fetch page
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let resp;
    try {
      resp = await fetch(url, { headers: { 'User-Agent': 'SEOGenerator-SecurityScan/1.0' }, redirect: 'follow', signal: controller.signal });
    } catch (e) {
      clearTimeout(timeout);
      return Response.json({ error: 'Fetch failed: ' + (e?.message || 'unknown') }, { status: 502 });
    }
    clearTimeout(timeout);
    const html = await resp.text();
    const headers = resp.headers;

    // ── SCAN FOR EXPOSED SECRETS ──
    const exposedSecrets = [];
    for (const { pattern, type } of SECRET_PATTERNS) {
      const matches = html.match(pattern) || [];
      for (const match of matches.slice(0, 5)) {
        // Mask the secret — only show first 8 chars
        const masked = match.substring(0, 8) + '...[REDACTED]';
        exposedSecrets.push({ type, preview: masked, severity: 'critical' });
      }
    }

    // ── CHECK SECURITY HEADERS ──
    const securityHeaders = {
      csp: headers.get('content-security-policy'),
      xFrame: headers.get('x-frame-options'),
      xContentType: headers.get('x-content-type-options'),
      hsts: headers.get('strict-transport-security'),
      referrerPolicy: headers.get('referrer-policy'),
      xXssProtection: headers.get('x-xss-protection'),
      permissionsPolicy: headers.get('permissions-policy'),
    };

    const missingHeaders = [];
    if (!securityHeaders.csp) missingHeaders.push({ header: 'Content-Security-Policy', severity: 'high', fix: 'Add CSP to prevent XSS and injection attacks' });
    if (!securityHeaders.xFrame) missingHeaders.push({ header: 'X-Frame-Options', severity: 'medium', fix: 'Add X-Frame-Options: DENY or SAMEORIGIN to prevent clickjacking' });
    if (!securityHeaders.xContentType) missingHeaders.push({ header: 'X-Content-Type-Options', severity: 'medium', fix: 'Add X-Content-Type-Options: nosniff to prevent MIME sniffing' });
    if (!securityHeaders.hsts && parsed.protocol === 'https:') missingHeaders.push({ header: 'Strict-Transport-Security', severity: 'high', fix: 'Add HSTS to enforce HTTPS' });
    if (!securityHeaders.referrerPolicy) missingHeaders.push({ header: 'Referrer-Policy', severity: 'low', fix: 'Add Referrer-Policy: strict-origin-when-cross-origin' });
    if (!securityHeaders.permissionsPolicy) missingHeaders.push({ header: 'Permissions-Policy', severity: 'low', fix: 'Add Permissions-Policy to restrict features' });

    // ── CHECK FOR MIXED CONTENT ──
    const hasMixedContent = parsed.protocol === 'https:' && /src=["']http:\/\//i.test(html);
    if (hasMixedContent) missingHeaders.push({ header: 'Mixed Content', severity: 'high', fix: 'Fix mixed content — load all resources over HTTPS' });

    // ── SCORE ──
    const secretPenalty = exposedSecrets.length * 30;
    const headerPenalty = missingHeaders.reduce((s, h) => s + (h.severity === 'high' ? 10 : h.severity === 'medium' ? 5 : 2), 0);
    const mixedPenalty = hasMixedContent ? 15 : 0;
    const score = Math.max(0, 100 - secretPenalty - headerPenalty - mixedPenalty);

    // Log
    await svc.entities.Receipt.create({
      type: 'security_scan',
      url,
      summary: `Security scan: score ${score}/100, ${exposedSecrets.length} exposed secrets, ${missingHeaders.length} missing headers`,
      details: JSON.stringify({ score, exposedSecrets: exposedSecrets.length, missingHeaders: missingHeaders.length }),
      provenance: 'MEASURED',
      occurred_at: new Date().toISOString(),
    }).catch(() => {});

    return Response.json({
      ok: true,
      url,
      score,
      exposedSecrets,
      missingHeaders,
      securityHeaders: Object.fromEntries(Object.entries(securityHeaders).map(([k, v]) => [k, v ? 'present' : 'missing'])),
      hasMixedContent,
      scannedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}