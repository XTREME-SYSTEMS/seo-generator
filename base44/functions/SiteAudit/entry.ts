import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// SiteAudit — the master audit orchestrator. Fetches a URL, runs technical SEO
// + content + structure + conversion analysis, scores every axis 0-100, and
// produces a prioritized remediation plan to drive the site to 100/100.
//
// Invoke: base44.functions.invoke('SiteAudit', { url })
// Returns: { ok, url, overallScore, axes, remediationPlan }

const AXES = ['Technical', 'Content', 'Structure', 'SEO', 'AEO', 'Conversion', 'Security', 'Authority'];

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const url = String(body.url || '').trim();
    if (!url) return Response.json({ error: 'url is required' }, { status: 400 });

    let parsed;
    try { parsed = new URL(url); } catch { return Response.json({ error: 'Invalid URL' }, { status: 400 }); }

    // Fetch the page
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let resp;
    try {
      resp = await fetch(url, { headers: { 'User-Agent': 'SEOGenerator-SiteAudit/1.0' }, redirect: 'follow', signal: controller.signal });
    } catch (e) {
      clearTimeout(timeout);
      return Response.json({ error: 'Fetch failed: ' + (e?.message || 'unknown') }, { status: 502 });
    }
    clearTimeout(timeout);
    const html = await resp.text();

    // ── TECHNICAL AXIS ──
    const hasTitle = /<title[^>]*>[^<]+<\/title>/i.test(html);
    const hasMetaDesc = /<meta[^>]+name=["']description["']/i.test(html);
    const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
    const hasOG = /<meta[^>]+property=["']og:/i.test(html);
    const hasJsonLd = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
    const hasH1 = /<h1[^>]*>[^<]+<\/h1>/i.test(html);
    const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    const hasHttps = parsed.protocol === 'https:';
    const technicalScore = [hasTitle, hasMetaDesc, hasCanonical, hasOG, hasJsonLd, hasH1, hasViewport, hasHttps].filter(Boolean).length * 12.5;

    // ── CONTENT AXIS ──
    const wordCount = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    const hasH2 = /<h2[^>]*>[^<]+<\/h2>/i.test(html);
    const hasLists = /<[ou]l[^>]*>/i.test(html);
    const hasImages = /<img[^>]+src=/i.test(html);
    const contentScore = Math.min(100, (wordCount / 500) * 40 + (hasH2 ? 20 : 0) + (hasLists ? 20 : 0) + (hasImages ? 20 : 0));

    // ── STRUCTURE AXIS ──
    const hasNav = /<nav[^>]*>/i.test(html);
    const hasHeader = /<header[^>]*>/i.test(html);
    const hasFooter = /<footer[^>]*>/i.test(html);
    const hasMain = /<main[^>]*>/i.test(html);
    const internalLinks = (html.match(/href=["']\/[^"']*["']/gi) || []).length;
    const structureScore = Math.min(100, (hasNav ? 25 : 0) + (hasHeader ? 20 : 0) + (hasFooter ? 20 : 0) + (hasMain ? 20 : 0) + Math.min(15, internalLinks * 1.5));

    // ── SEO AXIS ──
    const seoScore = Math.min(100, (hasTitle ? 20 : 0) + (hasMetaDesc ? 20 : 0) + (hasCanonical ? 15 : 0) + (hasJsonLd ? 25 : 0) + (hasH1 ? 20 : 0));

    // ── AEO AXIS ──
    const hasFAQ = /<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*FAQPage/i.test(html);
    const hasQnA = /<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*QAPage/i.test(html);
    const hasQuestionHeadings = /<h[2-3][^>]*>[^<]*(?:FAQ|Questions?|Answers?)[^<]*<\/h/i.test(html);
    const aeoScore = Math.min(100, (hasFAQ ? 40 : 0) + (hasQnA ? 30 : 0) + (hasQuestionHeadings ? 30 : 0));

    // ── CONVERSION AXIS ──
    const hasCTA = /(?:call|contact|quote|book|schedule|get started|free estimate)/i.test(html);
    const hasForm = /<form[^>]*>/i.test(html);
    const hasPhone = /tel:["']?[\d\s\-()]+/i.test(html);
    const hasButton = /<button[^>]*>[^<]+<\/button>/i.test(html) || /<a[^>]+class=["'][^"']*btn/i.test(html);
    const conversionScore = (hasCTA ? 25 : 0) + (hasForm ? 30 : 0) + (hasPhone ? 25 : 0) + (hasButton ? 20 : 0);

    // ── SECURITY AXIS ──
    const hasCSP = /<meta[^>]+http-equiv=["']Content-Security-Policy["']/i.test(html);
    const hasXFrame = /<meta[^>]+http-equiv=["']X-Frame-Options["']/i.test(html);
    const hasXContentType = /<meta[^>]+http-equiv=["']X-Content-Type-Options["']/i.test(html);
    const securityScore = (hasHttps ? 40 : 0) + (hasCSP ? 25 : 0) + (hasXFrame ? 20 : 0) + (hasXContentType ? 15 : 0);

    // ── AUTHORITY AXIS ──
    const externalLinks = (html.match(/href=["']https?:\/\/(?!${parsed.hostname})[^"']*["']/gi) || []).length;
    const authorityScore = Math.min(100, externalLinks * 10);

    const axes = {
      Technical: Math.round(technicalScore),
      Content: Math.round(contentScore),
      Structure: Math.round(structureScore),
      SEO: Math.round(seoScore),
      AEO: Math.round(aeoScore),
      Conversion: Math.round(conversionScore),
      Security: Math.round(securityScore),
      Authority: Math.round(authorityScore),
    };

    const overallScore = Math.round(Object.values(axes).reduce((s, v) => s + v, 0) / AXES.length);
    const weakestAxis = Object.entries(axes).sort((a, b) => a[1] - b[1])[0];

    // ── REMEDIATION PLAN ──
    const remediationPlan = [];
    if (axes.Technical < 100) remediationPlan.push({ axis: 'Technical', priority: 'critical', action: 'Fix missing title, meta, canonical, OG, schema, H1, viewport, HTTPS' });
    if (axes.Content < 80) remediationPlan.push({ axis: 'Content', priority: 'high', action: `Expand content from ${wordCount} to 500+ words with H2s, lists, images` });
    if (axes.Structure < 80) remediationPlan.push({ axis: 'Structure', priority: 'high', action: 'Add semantic HTML: nav, header, footer, main + internal links' });
    if (axes.SEO < 100) remediationPlan.push({ axis: 'SEO', priority: 'critical', action: 'Add missing SEO elements: title, meta, canonical, schema, H1' });
    if (axes.AEO < 60) remediationPlan.push({ axis: 'AEO', priority: 'high', action: 'Add FAQPage + QAPage JSON-LD schema for AI search visibility' });
    if (axes.Conversion < 80) remediationPlan.push({ axis: 'Conversion', priority: 'high', action: 'Add CTA, contact form, phone number, buttons' });
    if (axes.Security < 80) remediationPlan.push({ axis: 'Security', priority: 'medium', action: 'Add CSP, X-Frame-Options, X-Content-Type-Options headers' });
    if (axes.Authority < 50) remediationPlan.push({ axis: 'Authority', priority: 'medium', action: `Build external links (currently ${externalLinks})` });

    // Log
    await svc.entities.Receipt.create({
      type: 'site_audit',
      url,
      summary: `Site audit: ${overallScore}/100, weakest axis: ${weakestAxis[0]} (${weakestAxis[1]})`,
      details: JSON.stringify({ axes, overallScore, remediationPlan: remediationPlan.length }),
      provenance: 'MEASURED',
      occurred_at: new Date().toISOString(),
    }).catch(() => {});

    return Response.json({
      ok: true,
      url,
      overallScore,
      axes,
      weakestAxis: { name: weakestAxis[0], score: weakestAxis[1] },
      remediationPlan,
      wordCount,
      auditedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}