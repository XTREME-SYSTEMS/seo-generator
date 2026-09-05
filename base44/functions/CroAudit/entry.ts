import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// CroAudit — Conversion Rate Optimization audit. Fetches a URL and analyzes
// conversion elements: CTAs, forms, phone numbers, trust signals, social proof,
// urgency, above-the-fold, mobile UX, page speed indicators.
//
// Invoke: base44.functions.invoke('CroAudit', { url })
// Returns: { ok, url, score, findings, recommendations }

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
      resp = await fetch(url, { headers: { 'User-Agent': 'SEOGenerator-CroAudit/1.0' }, redirect: 'follow', signal: controller.signal });
    } catch (e) {
      clearTimeout(timeout);
      return Response.json({ error: 'Fetch failed: ' + (e?.message || 'unknown') }, { status: 502 });
    }
    clearTimeout(timeout);
    const html = await resp.text();

    // ── CRO ELEMENTS ──
    const findings = [];

    // CTA analysis
    const ctaPatterns = /(?:call now|get quote|free estimate|book now|contact us|schedule|get started|request a quote)/gi;
    const ctaMatches = html.match(ctaPatterns) || [];
    if (ctaMatches.length === 0) findings.push({ severity: 'critical', element: 'CTA', issue: 'No clear call-to-action found', fix: 'Add prominent CTAs (Call Now, Get Quote, Free Estimate)' });
    else if (ctaMatches.length < 2) findings.push({ severity: 'medium', element: 'CTA', issue: `Only ${ctaMatches.length} CTA found`, fix: 'Add CTAs above the fold, mid-page, and at the bottom' });

    // Form analysis
    const hasForm = /<form[^>]*>/i.test(html);
    const formInputs = (html.match(/<input[^>]+type=["'](?:text|email|tel|number)["']/gi) || []).length;
    if (!hasForm) findings.push({ severity: 'critical', element: 'Form', issue: 'No contact form found', fix: 'Add a lead capture form with name, phone, and service fields' });
    else if (formInputs < 3) findings.push({ severity: 'medium', element: 'Form', issue: `Form has only ${formInputs} fields`, fix: 'Add name, phone, email, and service type fields' });

    // Phone number
    const hasPhone = /tel:["']?[\d\s\-()]{10,}/i.test(html);
    const phoneMatches = html.match(/\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/g) || [];
    if (!hasPhone) findings.push({ severity: 'high', element: 'Phone', issue: 'No clickable phone number found', fix: 'Add tel: links for mobile click-to-call' });

    // Trust signals
    const hasReviews = /(?:review|testimonial|rating|stars?|google reviews)/i.test(html);
    const hasBadges = /(?:licensed|insured|bonded|certified|guarantee|warranty)/i.test(html);
    const hasYears = /(?:\d+\+?\s*years|since\s+\d{4}|established)/i.test(html);
    if (!hasReviews) findings.push({ severity: 'high', element: 'Social Proof', issue: 'No reviews or testimonials found', fix: 'Add customer reviews and star ratings' });
    if (!hasBadges) findings.push({ severity: 'medium', element: 'Trust Badges', issue: 'No trust badges (licensed, insured, guaranteed)', fix: 'Add trust badges: Licensed, Insured, Guaranteed' });
    if (!hasYears) findings.push({ severity: 'low', element: 'Experience', issue: 'No years in business mentioned', fix: 'Add "X+ years in business" for credibility' });

    // Urgency / Scarcity
    const hasUrgency = /(?:limited time|today only|act now|expires|deadline|hurry|limited spots)/i.test(html);
    if (!hasUrgency) findings.push({ severity: 'low', element: 'Urgency', issue: 'No urgency or scarcity elements', fix: 'Add limited-time offers or availability indicators' });

    // Above-the-fold (check if CTA is in first 2000 chars)
    const firstChunk = html.substring(0, 3000);
    const ctaAboveFold = /(?:call|quote|estimate|book|contact|schedule)/i.test(firstChunk);
    if (!ctaAboveFold) findings.push({ severity: 'high', element: 'Above Fold', issue: 'No CTA above the fold', fix: 'Move primary CTA above the fold' });

    // Mobile
    const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    if (!hasViewport) findings.push({ severity: 'critical', element: 'Mobile', issue: 'Missing viewport meta tag', fix: 'Add viewport meta tag for mobile responsiveness' });

    // Speed indicators
    const scriptCount = (html.match(/<script[^>]*>/gi) || []).length;
    const cssCount = (html.match(/<link[^>]+rel=["']stylesheet["']/gi) || []).length;
    if (scriptCount > 10) findings.push({ severity: 'medium', element: 'Speed', issue: `${scriptCount} scripts may slow page`, fix: 'Minimize and defer non-critical JavaScript' });
    if (cssCount > 5) findings.push({ severity: 'low', element: 'Speed', issue: `${cssCount} stylesheets may slow page`, fix: 'Combine and minify CSS' });

    const critical = findings.filter(f => f.severity === 'critical').length;
    const high = findings.filter(f => f.severity === 'high').length;
    const medium = findings.filter(f => f.severity === 'medium').length;
    const low = findings.filter(f => f.severity === 'low').length;
    const score = Math.max(0, 100 - (critical * 25 + high * 10 + medium * 5 + low * 2));

    // Log
    await svc.entities.Receipt.create({
      type: 'cro_audit',
      url,
      summary: `CRO audit: score ${score}/100, ${findings.length} findings`,
      details: JSON.stringify({ score, critical, high, medium, low }),
      provenance: 'MEASURED',
      occurred_at: new Date().toISOString(),
    }).catch(() => {});

    return Response.json({
      ok: true,
      url,
      score,
      findings,
      summary: { critical, high, medium, low, total: findings.length },
      elements: { ctaCount: ctaMatches.length, hasForm, formInputs, hasPhone, phoneCount: phoneMatches.length, hasReviews, hasBadges, hasYears, hasUrgency, ctaAboveFold, hasViewport, scriptCount, cssCount },
      auditedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}