import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// DeepDiscoveryScan — performs a deep discovery scan of a competitor or target
// URL. Fetches the page, extracts ALL structured data: SEO meta, schema, links,
// images, contact info, tech stack, content structure, CTAs, forms. More
// comprehensive than a basic scrape — this is a full forensic extraction.
//
// Invoke: base44.functions.invoke('DeepDiscoveryScan', { url })
// Returns: { ok, discovery }

function extractMeta(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

function extractAll(html, re) {
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1] || m[0]);
  return out;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const url = String(body.url || '').trim();
    if (!url) return Response.json({ error: 'url is required' }, { status: 400 });

    let parsed;
    try { parsed = new URL(url); } catch { return Response.json({ error: 'Invalid URL' }, { status: 400 }); }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let resp;
    try {
      resp = await fetch(url, { headers: { 'User-Agent': 'SEOGenerator-DeepDiscovery/1.0' }, redirect: 'follow', signal: controller.signal });
    } catch (e) {
      clearTimeout(timeout);
      return Response.json({ error: 'Fetch failed: ' + (e?.message || 'unknown') }, { status: 502 });
    }
    clearTimeout(timeout);
    const html = await resp.text();
    const finalUrl = (() => { try { return new URL(resp.url || url); } catch { return parsed; } })();

    // ── FULL EXTRACTION ──
    const discovery = {
      url,
      finalUrl: finalUrl.href,
      statusCode: resp.status,
      redirected: resp.url !== url,

      // SEO Meta
      seo: {
        title: extractMeta(html, /<title[^>]*>([^<]+)<\/title>/i),
        metaDescription: extractMeta(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i),
        canonical: extractMeta(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i),
        robotsTag: extractMeta(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i),
        ogTitle: extractMeta(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i),
        ogDescription: extractMeta(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i),
        ogImage: extractMeta(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i),
        ogUrl: extractMeta(html, /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i),
        twitterCard: extractMeta(html, /<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']+)["']/i),
      },

      // Schema
      schema: {
        jsonLdBlocks: extractAll(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
        microdata: (html.match(/itemtype=["']([^"']+)["']/gi) || []).map(m => m.match(/["']([^"']+)["']$/)?.[1]).filter(Boolean),
      },

      // Content Structure
      content: {
        h1s: extractAll(html, /<h1[^>]*>([^<]+)<\/h1>/gi),
        h2s: extractAll(html, /<h2[^>]*>([^<]+)<\/h2>/gi),
        h3s: extractAll(html, /<h3[^>]*>([^<]+)<\/h3>/gi),
        wordCount: html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length,
        paragraphs: (html.match(/<p[^>]*>/gi) || []).length,
        lists: (html.match(/<[ou]l[^>]*>/gi) || []).length,
        tables: (html.match(/<table[^>]*>/gi) || []).length,
      },

      // Links
      links: {
        internal: extractAll(html, /href=["'](\/[^"']*)["']/gi).map(l => finalUrl.origin + l),
        external: extractAll(html, /href=["'](https?:\/\/[^"']+)["']/gi).filter(l => !l.includes(finalUrl.hostname)),
        social: extractAll(html, /href=["'](https?:\/\/(?:facebook|twitter|instagram|linkedin|youtube|tiktok)\.com[^"']*)["']/gi),
      },

      // Images
      images: {
        total: (html.match(/<img[^>]+src=/gi) || []).length,
        withoutAlt: (html.match(/<img(?![^>]*\salt=)[^>]*src=/gi) || []).length,
        srcs: extractAll(html, /<img[^>]+src=["']([^"']+)["']/gi).slice(0, 20),
      },

      // Contact
      contact: {
        phones: (html.match(/tel:["']?([\d\s\-()]{10,})/gi) || []),
        emails: (html.match(/mailto:([^"'\s>]+)/gi) || []).map(e => e.replace('mailto:', '')),
        address: extractMeta(html, /<meta[^>]+name=["']geo\.placename["'][^>]+content=["']([^"']+)["']/i),
      },

      // Tech Stack Detection
      techStack: {
        wordpress: /wp-content|wp-includes/i.test(html),
        shopify: /cdn\.shopify\.com/i.test(html),
        wix: /wix\.com|wixstatic/i.test(html),
        squarespace: /squarespace/i.test(html),
        react: /react|_next|__NEXT/i.test(html),
        vue: /vue|__vue/i.test(html),
        angular: /angular|ng-/i.test(html),
        jquery: /jquery/i.test(html),
        bootstrap: /bootstrap/i.test(html),
        tailwind: /tailwind/i.test(html),
      },

      // Conversion Elements
      conversion: {
        forms: (html.match(/<form[^>]*>/gi) || []).length,
        ctas: (html.match(/(?:call|quote|estimate|book|contact|schedule|get started)/gi) || []).length,
        phoneLinks: (html.match(/tel:/gi) || []).length,
        buttons: (html.match(/<button[^>]*>/gi) || []).length,
      },

      // Performance Signals
      performance: {
        scriptCount: (html.match(/<script[^>]*>/gi) || []).length,
        styleCount: (html.match(/<link[^>]+rel=["']stylesheet["']/gi) || []).length,
        inlineStyles: (html.match(/style=["']/gi) || []).length,
        totalHtmlSize: html.length,
      },
    };

    // Store as CompetitorDigitalTwin
    await svc.entities.CompetitorDigitalTwin.create({
      domain: finalUrl.hostname,
      url: finalUrl.href,
      snapshot: JSON.stringify(discovery).substring(0, 10000),
      seo_score: discovery.seo.title && discovery.seo.metaDescription && discovery.schema.jsonLdBlocks.length > 0 ? 80 : 50,
      captured_at: new Date().toISOString(),
    }).catch(() => {});

    return Response.json({
      ok: true,
      discovery,
      scannedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}