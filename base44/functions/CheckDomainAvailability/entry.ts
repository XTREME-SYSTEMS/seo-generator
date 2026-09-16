import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';

// CheckDomainAvailability — batch checks domain availability via Vercel Domains API
// and GoDaddy API. Vercel is checked first; GoDaddy is used as cross-check for
// unavailable/uncertain results and for pricing.
// Invoke: base44.functions.invoke('CheckDomainAvailability', { limit?: number, domain?: string })

async function checkVercel(domain, token, teamId) {
  const qs = teamId ? `?teamId=${teamId}` : '';
  const r = await fetch(`https://api.vercel.com/v1/registrar/domains/${domain}/availability${qs}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!r.ok) return { available: null, error: r.status };
  const data = await r.json();
  return { available: !!data.available, price: data.price || 0 };
}

async function checkGoDaddy(domain, key, secret) {
  const r = await fetch(`https://api.godaddy.com/v1/domains/available?domain=${domain}`, {
    headers: { 'Authorization': `sso-key ${key}:${secret}` }
  });
  if (!r.ok) return { available: null, error: r.status };
  const data = await r.json();
  // GoDaddy price is in micro-units (millionths of currency unit)
  const price = data.price ? data.price / 1000000 : 0;
  return { available: !!data.available, price };
}

async function batchProcess(items, fn, concurrency = 10) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const vercelToken = secrets.get('VERCEL_API_TOKEN');
    const teamId = secrets.get('VERCEL_TEAM_ID');
    const godaddyKey = secrets.get('GODADDY_API_KEY');
    const godaddySecret = secrets.get('GODADDY_SECRET_KEY');

    if (!vercelToken) return Response.json({ error: 'VERCEL_API_TOKEN not set' }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 100;
    const singleDomain = body.domain;

    // Load unchecked candidates (or a single domain)
    let candidates;
    if (singleDomain) {
      candidates = await svc.entities.NearMeCandidate.filter({ domain: singleDomain }, '-created_date', 1);
    } else {
      candidates = await svc.entities.NearMeCandidate.filter({ availability_status: 'unchecked' }, '-created_date', limit);
    }

    if (!candidates.length) return Response.json({ message: 'No unchecked candidates found', checked: 0 });

    // Check each domain via Vercel first
    const checkOne = async (c) => {
      try {
        const v = await checkVercel(c.domain, vercelToken, teamId);

        // If Vercel says available, mark available
        if (v.available === true) {
          return { id: c.id, domain: c.domain, status: 'available', source: 'vercel', price: v.price || 0 };
        }

        // If Vercel says unavailable OR uncertain, cross-check with GoDaddy
        if (godaddyKey && godaddySecret) {
          const g = await checkGoDaddy(c.domain, godaddyKey, godaddySecret);
          if (g.available === true) {
            const status = g.price > 500 ? 'premium' : 'available';
            return { id: c.id, domain: c.domain, status, source: 'godaddy', price: g.price };
          } else if (g.available === false) {
            return { id: c.id, domain: c.domain, status: 'unavailable', source: 'both', price: 0 };
          }
        }

        // GoDaddy unavailable or not configured — trust Vercel
        if (v.available === false) {
          return { id: c.id, domain: c.domain, status: 'unavailable', source: 'vercel', price: 0 };
        }

        // Uncertain
        return { id: c.id, domain: c.domain, status: 'error', source: 'none', price: 0 };
      } catch (e) {
        return { id: c.id, domain: c.domain, status: 'error', source: 'none', price: 0, error: e.message };
      }
    };

    const results = await batchProcess(candidates, checkOne, 10);

    // Bulk update candidates with availability results
    const updates = results.map(r => ({
      id: r.id,
      availability_status: r.status,
      availability_source: r.source,
      registration_price: r.price,
      checked_at: new Date().toISOString()
    }));

    if (updates.length) {
      await svc.entities.NearMeCandidate.bulkUpdate(updates);
    }

    const available = results.filter(r => r.status === 'available').length;
    const unavailable = results.filter(r => r.status === 'unavailable').length;
    const premium = results.filter(r => r.status === 'premium').length;

    await svc.entities.Receipt.create({
      summary: `Domain availability check: ${results.length} checked, ${available} available, ${premium} premium, ${unavailable} unavailable`,
      source: 'CheckDomainAvailability',
      occurred_at: new Date().toISOString(),
      proof_level: 1
    });

    return Response.json({
      checked: results.length,
      available,
      unavailable,
      premium,
      errors: results.filter(r => r.status === 'error').length,
      results: results.map(r => ({ domain: r.domain, status: r.status, price: r.price, source: r.source }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}