import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Target domains from known issues — unverified or missing from GSC
const TARGET_DOMAINS = [
  { domain: 'strategicmindsadvisory.com', issue: 'unverified', expected_property: 'sc-domain:strategicmindsadvisory.com' },
  { domain: 'epoxygaragefloorestimate.com', issue: 'unverified', expected_property: 'sc-domain:epoxygaragefloorestimate.com' },
  { domain: 'xtremepolishingsystems.com', issue: 'missing_access', expected_property: 'sc-domain:xtremepolishingsystems.com' },
  { domain: 'nationalconcretepolishing.net', issue: 'missing_access', expected_property: 'sc-domain:nationalconcretepolishing.net' },
  { domain: 'epoxyquotenearme.com', issue: 'missing_access', expected_property: 'sc-domain:epoxyquotenearme.com' },
  { domain: 'leadgennearyou.com', issue: 'duplicate_alternate', expected_property: 'sc-domain:leadgennearyou.com' },
];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'check_all';

    // Get GSC connector token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // List all current GSC properties
    const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', { headers });
    const sitesData = await sitesRes.json();
    if (!sitesRes.ok) {
      return Response.json({ error: sitesData.error?.message || 'Failed to list GSC sites', status: sitesRes.status }, { status: sitesRes.status });
    }

    const currentSites = (sitesData.siteEntry || []).map((s) => ({
      url: s.siteUrl,
      permission: s.permissionLevel,
    }));

    // Build a map of current properties
    const currentMap = new Map(currentSites.map((s) => [s.url.toLowerCase(), s]));

    // Analyze each target domain
    const report = [];
    for (const target of TARGET_DOMAINS) {
      const propKey = target.expected_property.toLowerCase();
      const existing = currentMap.get(propKey);

      const status = !existing
        ? 'missing'
        : existing.permission === 'siteUnverifiedUser'
        ? 'unverified'
        : existing.permission === 'siteOwner'
        ? 'verified_owner'
        : existing.permission === 'siteRestrictedUser'
        ? 'restricted'
        : 'verified';

      // Generate verification instructions for missing/unverified domains
      const instructions = (status === 'missing' || status === 'unverified')
        ? generateVerificationInstructions(target.domain)
        : null;

      report.push({
        domain: target.domain,
        known_issue: target.issue,
        gsc_status: status,
        gsc_property: existing?.url || target.expected_property,
        permission_level: existing?.permission || null,
        verification_instructions: instructions,
      });
    }

    // Try to attempt verification for missing domains (if action is 'attempt_verification')
    let verificationAttempts = [];
    if (action === 'attempt_verification') {
      for (const target of TARGET_DOMAINS) {
        const propKey = target.expected_property.toLowerCase();
        const existing = currentMap.get(propKey);
        if (!existing || existing.permission === 'siteUnverifiedUser') {
          // Try to add the site to GSC — this triggers Google to check verification
          try {
            const addRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(target.expected_property)}`, {
              method: 'PUT',
              headers,
            });
            const addData = await addRes.json().catch(() => ({}));
            verificationAttempts.push({
              domain: target.domain,
              action: 'add_to_gsc',
              success: addRes.ok,
              status: addRes.status,
              message: addRes.ok
                ? 'Added to GSC — Google will check verification status. If DNS TXT is in place, verification will complete.'
                : (addData.error?.message || 'Failed to add'),
            });
          } catch (e) {
            verificationAttempts.push({
              domain: target.domain,
              action: 'add_to_gsc',
              success: false,
              message: e.message,
            });
          }
        }
      }
    }

    // Submit sitemaps for all verified properties
    let sitemapResults = [];
    if (action === 'submit_sitemaps' || action === 'check_all') {
      for (const site of currentSites) {
        if (site.permission === 'siteOwner' || site.permission === 'siteFullUser') {
          let sitemapUrl;
          if (site.url.startsWith('sc-domain:')) {
            sitemapUrl = `https://${site.url.slice('sc-domain:'.length)}/sitemap.xml`;
          } else {
            const base = site.url.endsWith('/') ? site.url : site.url + '/';
            sitemapUrl = base + 'sitemap.xml';
          }
          try {
            const smRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site.url)}/sitemaps/${encodeURIComponent(sitemapUrl)}`, {
              method: 'PUT',
              headers,
            });
            sitemapResults.push({
              site: site.url,
              sitemap: sitemapUrl,
              success: smRes.ok,
              status: smRes.status,
            });
          } catch (e) {
            sitemapResults.push({ site: site.url, sitemap: sitemapUrl, success: false, error: e.message });
          }
        }
      }
    }

    // Save report as a Receipt for audit trail
    const svc = base44.asServiceRole;
    await svc.entities.Receipt.create({
      kind: 'gsc_verification',
      summary: `GSC verification check — ${report.length} domains, ${report.filter((r) => r.gsc_status === 'verified' || r.gsc_status === 'verified_owner').length} verified`,
      detail: JSON.stringify(report).slice(0, 4000),
      source: 'google_search_console',
      provenance: 'MEASURED',
      occurred_at: new Date().toISOString(),
    });

    return Response.json({
      checked: report.length,
      verified: report.filter((r) => r.gsc_status === 'verified' || r.gsc_status === 'verified_owner').length,
      missing: report.filter((r) => r.gsc_status === 'missing').length,
      unverified: report.filter((r) => r.gsc_status === 'unverified').length,
      report,
      verification_attempts: verificationAttempts,
      sitemap_submissions: sitemapResults,
      current_properties: currentSites,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function generateVerificationInstructions(domain) {
  return {
    method_dns_txt: {
      steps: [
        `1. Go to Google Search Console: https://search.google.com/search-console`,
        `2. Click "Add property" → Enter ${domain} → Continue`,
        `3. Choose "Domain" (recommended — covers www, non-www, http, https, and subdomains)`,
        `4. Google will show a DNS TXT record like: google-site-verification=XXXXXXXXXXXXXX`,
        `5. Add that TXT record to your DNS provider:`,
        `   - Type: TXT`,
        `   - Name/Host: @ (or leave blank)`,
        `   - Value: google-site-verification=XXXXXXXXXXXXXX`,
        `   - TTL: 3600 (or default)`,
        `6. Wait for DNS propagation (5 min to 48 hours)`,
        `7. Click "Verify" in Google Search Console`,
      ],
      dns_provider_links: {
        cloudflare: 'https://dash.cloudflare.com → DNS → Records',
        godaddy: 'https://dcc.godaddy.com/manage/dns',
        namecheap: 'https://ap.www.namecheap.com/Domains/DomainList',
        vercel: 'https://vercel.com/dashboard → Project → Settings → Domains → DNS',
      },
    },
    method_html_file: {
      steps: [
        `1. In GSC, choose "URL prefix" method instead of "Domain"`,
        `2. Download the HTML verification file Google provides`,
        `3. Upload it to your site's root directory (accessible at https://${domain}/google-XXXXX.html)`,
        `4. Click "Verify" in Google Search Console`,
      ],
    },
    method_meta_tag: {
      steps: [
        `1. In GSC, choose "HTML tag" method`,
        `2. Copy the meta tag: <meta name="google-site-verification" content="XXXXX" />`,
        `3. Add it to the <head> of your site's homepage`,
        `4. Click "Verify" in Google Search Console`,
      ],
    },
    after_verification: [
      'Submit your sitemap: https://{domain}/sitemap.xml',
      'Request indexing for key pages via URL Inspection',
      'Connect the property to this app via the GSC connector (already connected)',
    ],
  };
}