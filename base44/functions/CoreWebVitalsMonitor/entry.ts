import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// CoreWebVitalsMonitor — fetches managed URLs, analyzes page HTML for Core Web
// Vitals issues (render-blocking resources, large images, missing lazy-load,
// layout shift risks), and generates technical SEO suggestions.
//
// Invoke: base44.functions.invoke('CoreWebVitalsMonitor', { url?, limit? })
// Returns: { ok, checked, issues_found, suggestions_generated }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const now = new Date().toISOString();
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 10;

    // ── LOAD TARGETS ──
    let targets;
    if (body.url) {
      targets = await svc.entities.UrlInventory.filter({ url: body.url }, '-priority', 1).catch(() => []);
    } else {
      targets = await svc.entities.UrlInventory.list('-priority', limit).catch(() => []);
    }

    if (targets.length === 0) {
      targets = await svc.entities.AreSheetRow.list('-priority_score', limit).catch(() => []);
    }

    if (targets.length === 0) {
      return Response.json({ ok: true, checked: 0, message: 'No URLs to check' });
    }

    console.log(`[CoreWebVitalsMonitor] Checking ${targets.length} URLs`);

    let issuesFound = 0;
    let suggestionsGenerated = 0;

    for (const target of targets) {
      const url = target.url;
      if (!url) continue;

      let html = '';
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
        html = await res.text();
      } catch (e) {
        continue; // Skip if can't fetch
      }

      // ── ANALYZE FOR CWV ISSUES ──
      const issues = [];

      // Render-blocking scripts
      const scriptMatches = html.match(/<script[^>]*src=[^>]*>(?![^<]*defer)(?![^<]*async)/gi) || [];
      if (scriptMatches.length > 3) issues.push(`${scriptMatches.length} potentially render-blocking scripts`);

      // Large images without dimensions
      const imgMatches = html.match(/<img[^>]*>/gi) || [];
      const imgsWithoutDims = imgMatches.filter((img) => !img.includes('width=') || !img.includes('height='));
      if (imgsWithoutDims.length > 0) issues.push(`${imgsWithoutDims.length} images without width/height attributes (CLS risk)`);

      // Missing lazy-load
      const imgsWithoutLazy = imgMatches.filter((img) => !img.includes('loading=') && !img.includes('loading="lazy"'));
      if (imgsWithoutLazy.length > 2) issues.push(`${imgsWithoutLazy.length} images without lazy loading`);

      // Inline styles
      const inlineStyles = (html.match(/style=/gi) || []).length;
      if (inlineStyles > 20) issues.push(`${inlineStyles} inline styles (render-blocking risk)`);

      // Large HTML payload
      if (html.length > 500000) issues.push(`Large page size: ${(html.length / 1024).toFixed(0)}KB`);

      // Missing viewport
      if (!html.includes('viewport')) issues.push('Missing viewport meta tag');

      // No preconnect/preload
      if (!html.includes('preconnect') && !html.includes('preload')) issues.push('No resource hints (preconnect/preload)');

      if (issues.length === 0) continue;

      issuesFound += issues.length;

      // ── GENERATE SUGGESTION ──
      await svc.entities.Suggestion.create({
        url, kind: 'fix', surface: 'sheet',
        title: `Core Web Vitals: ${issues.length} issues on ${url}`,
        rationale: `Core Web Vitals are a confirmed Google ranking factor. ${issues.join('; ')}`,
        treatment: `Fix: ${issues.map((i) => i.replace(/\d+ /, '')).join('; ')}`,
        gap_type: 'TECHNICAL',
        evidence_tier: 'T1_CONFIRMED_SYSTEM',
        evidence_anchor: 'Core Web Vitals (LCP, CLS, INP) are confirmed Google ranking factors',
        priority_score: 70,
        status: 'new',
        provenance: 'MEASURED',
        created_at: now,
      });

      suggestionsGenerated++;
    }

    // ── LOG ──
    await svc.entities.RunTelemetry.create({
      run_type: 'core_web_vitals', subsystem: 'measurement', status: 'ok',
      started_at: now, records_written: issuesFound,
      message: `CoreWebVitalsMonitor: ${issuesFound} issues found across ${targets.length} URLs, ${suggestionsGenerated} suggestions`,
    });
    await svc.entities.Receipt.create({
      kind: 'validation', summary: `CoreWebVitalsMonitor: ${issuesFound} CWV issues found, ${suggestionsGenerated} suggestions generated`,
      detail: JSON.stringify({ checked: targets.length, issues_found: issuesFound, suggestions: suggestionsGenerated }).slice(0, 4000),
      source: 'core_web_vitals', provenance: 'MEASURED', occurred_at: now,
    });

    return Response.json({ ok: true, checked: targets.length, issues_found: issuesFound, suggestions_generated: suggestionsGenerated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}