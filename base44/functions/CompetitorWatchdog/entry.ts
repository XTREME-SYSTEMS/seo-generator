import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// CompetitorWatchdog — monitors competitor pages for changes (new content,
// schema, structure) and auto-responds by generating counter-suggestions.
// Fetches competitor URLs, compares with stored snapshots, detects changes.
//
// Invoke: base44.functions.invoke('CompetitorWatchdog', { limit? })
// Returns: { ok, checked, changes_detected, suggestions_generated }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const now = new Date().toISOString();
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 10;

    // ── LOAD COMPETITORS ──
    const competitors = await svc.entities.Competitor.list('-created_date', limit).catch(() => []);
    const twins = await svc.entities.CompetitorDigitalTwin.list('-captured_at', limit).catch(() => []);

    if (competitors.length === 0) {
      return Response.json({ ok: true, checked: 0, message: 'No competitors configured' });
    }

    console.log(`[CompetitorWatchdog] Watching ${competitors.length} competitors`);

    let changesDetected = 0;
    let suggestionsGenerated = 0;

    for (const comp of competitors) {
      const compUrl = comp.url || comp.domain;
      if (!compUrl) continue;

      // ── FETCH CURRENT PAGE CONTENT ──
      let currentContent = '';
      try {
        const res = await fetch(compUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
        currentContent = await res.text();
      } catch (e) {
        // Fallback: use LLM with web search
        const llmRes = await base44.integrations.Core.InvokeLLM({
          prompt: `Fetch and summarize the content of this competitor page: ${compUrl}. What's the page title, meta description, H1, word count, and schema markup?`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: {
            type: 'object',
            properties: {
              title: { type: 'string' }, meta_description: { type: 'string' }, h1: { type: 'string' },
              word_count: { type: 'number' }, has_schema: { type: 'boolean' }, content_summary: { type: 'string' },
            },
          },
        });
        currentContent = JSON.stringify(llmRes.data || llmRes);
      }

      // ── FIND LAST SNAPSHOT ──
      const lastTwin = twins.find((t) => t.competitor_id === comp.id || t.url === compUrl);
      const currentHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(currentContent)).then((h) => [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join(''));

      if (lastTwin && lastTwin.content_hash === currentHash) {
        continue; // No change
      }

      changesDetected++;

      // ── ANALYZE CHANGE ──
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `A competitor's page has changed. Analyze the new content and suggest counter-strategies.

Competitor: ${comp.name || compUrl}
New content summary: ${currentContent.slice(0, 3000)}

What did they likely change? What new content, schema, or structure did they add? How should we respond to maintain or improve our rankings?

Return as JSON: { "detected_changes": ["..."], "threat_level": "low|medium|high", "counter_strategy": "...", "suggested_actions": ["..."] }`,
        response_json_schema: {
          type: 'object',
          properties: {
            detected_changes: { type: 'array', items: { type: 'string' } },
            threat_level: { type: 'string' },
            counter_strategy: { type: 'string' },
            suggested_actions: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      const analysisData = analysis.data || analysis;

      // ── STORE SNAPSHOT ──
      await svc.entities.CompetitorDigitalTwin.create({
        competitor_id: comp.id,
        url: compUrl,
        content_hash: currentHash,
        content_snapshot: currentContent.slice(0, 8000),
        analysis: JSON.stringify(analysisData).slice(0, 4000),
        threat_level: analysisData.threat_level || 'medium',
        captured_at: now,
      }).catch(() => {});

      // ── GENERATE COUNTER-SUGGESTION ──
      await svc.entities.Suggestion.create({
        kind: 'gap_fill',
        surface: 'strategy',
        title: `Counter ${comp.name || compUrl}: ${analysisData.detected_changes?.[0] || 'competitor change detected'}`,
        rationale: `Competitor ${comp.name || compUrl} changed their page. Threat level: ${analysisData.threat_level || 'medium'}. Counter-strategy needed.`,
        treatment: analysisData.counter_strategy || 'Analyze competitor change and respond with improved content/structure',
        gap_type: 'AUTHORITY',
        evidence_tier: 'T3_OBSERVATIONAL',
        evidence_anchor: 'Competitor movement analysis',
        priority_score: analysisData.threat_level === 'high' ? 85 : 60,
        status: 'new',
        provenance: 'INFERRED',
        created_at: now,
      });

      suggestionsGenerated++;
    }

    // ── LOG ──
    await svc.entities.RunTelemetry.create({
      run_type: 'competitor_watchdog', subsystem: 'intelligence', status: 'ok',
      started_at: now, records_written: changesDetected,
      message: `CompetitorWatchdog: ${changesDetected} changes detected, ${suggestionsGenerated} counter-suggestions generated`,
    });
    await svc.entities.Receipt.create({
      kind: 'validation', summary: `CompetitorWatchdog: ${changesDetected} competitor changes detected, ${suggestionsGenerated} counter-suggestions generated`,
      detail: JSON.stringify({ checked: competitors.length, changes_detected: changesDetected, suggestions_generated: suggestionsGenerated }).slice(0, 4000),
      source: 'competitor_watchdog', provenance: 'MEASURED', occurred_at: now,
    });

    return Response.json({ ok: true, checked: competitors.length, changes_detected: changesDetected, suggestions_generated: suggestionsGenerated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}