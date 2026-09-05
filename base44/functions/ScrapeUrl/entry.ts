import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { extractMeta, extractAll, safeUrl, fetchWithTimeout } from '../../shared/htmlUtils.ts';

// ScrapeUrl — scrapes a URL and extracts ALL structured data: SEO metadata,
// JSON-LD schema, content (headings, body), links (internal/external/social),
// images, contact info, and technical signals. The foundational data extraction
// tool used by many other functions.
//
// Invoke: base44.functions.invoke('ScrapeUrl', { url })
// Returns: { ok, data }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const url = String(body.url || '').trim();
    if (!url) return Response.json({ error: 'url is required' }, { status: 400 });

    const parsed = safeUrl(url);
    if (!parsed) return Response.json({ error: 'Invalid URL (only http/https allowed)' }, { status: 400 });

    const fetched = await fetchWithTimeout(url, 'SEOGenerator-Scraper/1.0');
    if ('error' in fetched) return Response.json({ error: fetched.error }, { status: 502 });
    const { resp, html, finalUrl } = fetched;

    const data = {
      url,
      finalUrl: finalUrl.href,
      statusCode: resp.status,

      // SEO Metadata
      seo: {
        title: extractMeta(html, /<title[^>]*>([^<]+)<\/title>/i),
        metaDescription: extractMeta(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i),
        metaKeywords: extractMeta(html, /<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i),
        canonical: extractMeta(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i),
        robotsTag: extractMeta(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i),
        ogTitle: extractMeta(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i),
        ogDescription: extractMeta(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i),
        ogImage: extractMeta(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i),
        ogUrl: extractMeta(html, /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i),
        ogType: extractMeta(html, /<meta[^>]+property=["']og:type["'][^>]+content=["']([^"']+)["']/i),
        twitterCard: extractMeta(html, /<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']+)["']/i),
        twitterTitle: extractMeta(html, /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i),
        twitterDescription: extractMeta(html, /<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["']/i),
        twitterImage: extractMeta(html, /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i),
      },

      // Structured Data
      structuredData: {
        jsonLd: extractAll(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
        microdata: (html.match(/itemtype=["']([^"']+)["']/gi) || []).map(m => m.match(/["']([^"']+)["']$/)?.[1]).filter(Boolean),
      },

      // Content
      content: {
        h1s: extractAll(html, /<h1[^>]*>([^<]+)<\/h1>/gi),
        h2s: extractAll(html, /<h2[^>]*>([^<]+)<\/h2>/gi),
        h3s: extractAll(html, /<h3[^>]*>([^<]+)<\/h3>/gi),
        h4s: extractAll(html, /<h4[^>]*>([^<]+)<\/h4>/gi),
        paragraphs: (html.match(/<p[^>]*>/gi) || []).length,
        wordCount: html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length,
      },

      // Links
      links: {
        internal: extractAll(html, /href=["'](\/[^"']*)["']/gi),
        external: extractAll(html, /href=["'](https?:\/\/[^"']+)["']/gi).filter(l => !l.includes(finalUrl.hostname)),
        social: extractAll(html, /href=["'](https?:\/\/(?:facebook|twitter|instagram|linkedin|youtube|tiktok)\.com[^"']*)["']/gi),
      },

      // Images
      images: {
        total: (html.match(/<img[^>]+src=/gi) || []).length,
        withoutAlt: (html.match(/<img(?![^>]*\salt=)[^>]*src=/gi) || []).length,
        srcs: extractAll(html, /<img[^>]+src=["']([^"']+)["']/gi).slice(0, 20),
        alts: extractAll(html, /<img[^>]+alt=["']([^"']+)["']/gi).slice(0, 20),
      },

      // Contact Info
      contact: {
        phones: (html.match(/tel:["']?([\d\s\-()]{10,})/gi) || []),
        emails: (html.match(/mailto:([^"'\s>]+)/gi) || []).map(e => e.replace('mailto:', '')),
      },

      // Technical
      technical: {
        hasViewport: /<meta[^>]+name=["']viewport["']/i.test(html),
        hasCharset: /<meta[^>]+charset/i.test(html),
        isHttps: finalUrl.protocol === 'https:',
        scriptCount: (html.match(/<script[^>]*>/gi) || []).length,
        styleCount: (html.match(/<link[^>]+rel=["']stylesheet["']/gi) || []).length,
        htmlSize: html.length,
      },
    };

    return Response.json({
      ok: true,
      data,
      scrapedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}