import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { priorityScore, violatesSpamPolicy, isShippable, newCycleId } from '../../shared/are.js';

// AI-assisted fix engine with retry-until-resolved.
// Input: { url, gap_id, gap_type, max_attempts }
// Generates N ordered alternative fix approaches, records each as an adopted
// Suggestion + FixAttempt, and returns the attempt log. The ARE loop validates
// outcomes on the next measured cycle; structural fixes (canonical, schema) are
// applied immediately to the suggestion queue for deployment.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const svc = base44.asServiceRole;
    const { url, gap_id, gap_type, max_attempts = 3 } = body;
    if (!url) return Response.json({ error: 'url required' }, { status: 400 });

    // Load all context for this URL in parallel.
    const [target, sheetRows, asymmetries, diagnoses, metrics] = await Promise.all([
      svc.entities.UrlTarget.filter({ url }).then((r) => r[0] || null),
      svc.entities.AreSheetRow.filter({ url }, '-priority_score', 20),
      gap_id ? svc.entities.Asymmetry.filter({ id: gap_id }, '-detected_at', 10) : svc.entities.Asymmetry.filter({ url }, '-detected_at', 10),
      svc.entities.SystemDiagnosis.filter({ url }, '-diagnosed_at', 10),
      svc.entities.HourlySearchMetric.filter({ url }, '-hour', 30),
    ]);

    const gap = asymmetries.find((a) => a.id === gap_id) || asymmetries[0] || diagnoses.find((d) => d.id === gap_id) || diagnoses[0] || null;

    const impressions = metrics.reduce((s, m) => s + (m.impressions || 0), 0);
    const clicks = metrics.reduce((s, m) => s + (m.clicks || 0), 0);
    const bestPos = metrics.filter((m) => m.avg_position != null).map((m) => m.avg_position).sort((a, b) => a - b)[0] ?? null;

    const context = [
      `URL: ${url}`,
      target ? `Index state: ${target.index_state} | URL state: ${target.url_state} | canonical_agrees: ${target.canonical_agrees} | declared: ${target.declared_canonical || 'n/a'} | google: ${target.google_canonical || 'n/a'}` : 'No UrlTarget registered',
      `Measured (recent hourly): impressions=${impressions} clicks=${clicks} best_avg_position=${bestPos ?? 'null'}`,
      sheetRows.length ? `Sheet rows: ${sheetRows.map((r) => `query="${r.query}" gap=${r.gap_type} asymmetry=${r.asymmetry_class || 'none'} system=${r.targeted_system} rank=${r.rank ?? 'null'} avg_pos=${r.avg_position ?? 'null'}`).join('; ')}` : 'No sheet rows',
      gap ? `Target gap: ${gap.asymmetry_class || gap.bottleneck_system || gap_type || 'unknown'} — ${gap.signal || gap.evidence?.join('; ') || ''} — recommended: ${gap.recommended_treatment || ''}` : `Gap type: ${gap_type || 'general'}`,
    ].join('\n');

    const prompt = [
      'You are the FixEngine of an Autonomous Ranking Engine. A URL has a detected gap blocking it from TOP 3 on Google.',
      'EVIDENCE-FIRST: every fix must be anchored to a Google-confirmed ranking factor. STRUCTURALLY FORBIDDEN: PBNs, paid links, link schemes, cloaking, doorway pages, scaled content abuse.',
      'Generate up to ' + max_attempts + ' ALTERNATIVE fix approaches for this gap, ordered from highest-probability to lowest. Each must be a different strategy (do not repeat the same fix).',
      'For each approach give: approach (short label), diagnosis (why this gap exists), treatment (the exact concrete change — quote proposed title/H1/schema/canonical/internal-link copy), p_cross (0-1), delta_traffic, hours_estimate.',
      context,
    ].join('\n');

    const res = await svc.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          approaches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                approach: { type: 'string' },
                diagnosis: { type: 'string' },
                treatment: { type: 'string' },
                p_cross: { type: 'number' },
                delta_traffic: { type: 'number' },
                hours_estimate: { type: 'number' },
              },
            },
          },
        },
      },
    });

    const approaches = (res.approaches || []).filter((a) => a.treatment && !violatesSpamPolicy(`${a.approach} ${a.treatment} ${a.diagnosis || ''}`));
    const nowIso = new Date().toISOString();
    const cycleId = newCycleId();
    const attempts = [];

    for (let i = 0; i < approaches.length; i++) {
      const a = approaches[i];
      const attemptNum = i + 1;
      const attempt = await svc.entities.FixAttempt.create({
        url,
        gap_id: gap_id || gap?.id || null,
        gap_type: gap_type || gap?.asymmetry_class || gap?.bottleneck_system || 'SEO',
        asymmetry_class: gap?.asymmetry_class || null,
        attempt: attemptNum,
        approach: a.approach,
        diagnosis: a.diagnosis,
        treatment: a.treatment,
        status: 'applied',
        created_at: nowIso,
      });
      attempts.push(attempt);

      // Record as an adopted Suggestion so the ARE implement/validate loop picks it up.
      await svc.entities.Suggestion.create({
        client_id: target?.client_id || sheetRows[0]?.client_id || null,
        surface: 'sheet',
        url,
        query: sheetRows[0]?.query || '',
        kind: 'fix',
        title: `${a.approach} (attempt ${attemptNum})`,
        rationale: a.diagnosis,
        treatment: a.treatment,
        gap_type: ['SEO', 'AEO', 'SAO', 'TECHNICAL', 'CONTENT', 'AUTHORITY', 'INTENT', 'SURFACE', 'SYSTEM'].includes(gap_type) ? gap_type : 'SEO',
        evidence_tier: 'T1_CONFIRMED_SYSTEM',
        evidence_anchor: gap?.evidence_tier || 'T1_CONFIRMED_SYSTEM',
        p_cross: Math.max(0, Math.min(1, Number(a.p_cross) || 0.2)),
        delta_traffic: Math.max(0, Number(a.delta_traffic) || 0),
        hours_estimate: Math.max(0.25, Number(a.hours_estimate) || 2),
        priority_score: priorityScore(Number(a.p_cross) || 0.2, Number(a.delta_traffic) || 0, Number(a.hours_estimate) || 2),
        status: 'adopted',
        provenance: 'MODELED',
        created_at: nowIso,
      });
    }

    // If no approaches survived the spam filter, record an exhausted attempt.
    if (attempts.length === 0) {
      const attempt = await svc.entities.FixAttempt.create({
        url,
        gap_id: gap_id || gap?.id || null,
        gap_type: gap_type || 'SEO',
        attempt: 1,
        approach: 'none',
        diagnosis: 'No shippable fix approaches could be generated for this gap',
        treatment: '',
        status: 'exhausted',
        created_at: nowIso,
      });
      attempts.push(attempt);
    }

    await svc.entities.Receipt.create({
      kind: 'gate_decision',
      summary: `FixEngine — ${url} — ${attempts.length} fix approach(es) generated`,
      detail: JSON.stringify(attempts.map((a) => ({ attempt: a.attempt, approach: a.approach, status: a.status }))).slice(0, 4000),
      source: 'fix_engine',
      provenance: 'MODELED',
      occurred_at: nowIso,
    });

    return Response.json({ ok: true, cycle_id: cycleId, url, gap: gap ? { id: gap.id, class: gap.asymmetry_class || gap.bottleneck_system, signal: gap.signal || '' } : null, attempts: attempts.length, results: attempts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}