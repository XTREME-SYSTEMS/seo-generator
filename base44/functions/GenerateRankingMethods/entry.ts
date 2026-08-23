import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Allow admin UI calls (require admin) AND trusted workflow calls (no user token).
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const industry = body.industry || 'any';
    const runId = body.run_id || ('gen_' + Date.now());
    const now = new Date().toISOString();

    // Existing method names for dedup (cap to keep prompt small)
    const existing = await base44.asServiceRole.entities.RankingMethod.list('-discovered_at', 200);
    const existingNames = existing.map((m) => (m.name || '').toLowerCase());
    const knownList = existingNames.slice(0, 60).join(', ');

    const prompt = `You are an autonomous SEO research engine operating in ${new Date().getFullYear()}. Search the LIVE web for the ABSOLUTE FASTEST, most current SEO ranking methods, tricks, and hacks that work RIGHT NOW.

Mine these sources specifically:
- Google's official Search blog + Search Engine Journal + Search Engine Land (latest core updates, NavBoost, helpful content system)
- The leaked Google API documentation (NavBoost clickstream: goodClicks, badClicks, lastLongestClicks, unicorn clicks; Chrome data; E-E-A-T signals)
- Reddit threads: r/SEO, r/seogrowth, r/juststart, r/DigitalMarketing, r/localseo
- LinkedIn SEO posts and X/Twitter SEO threads from the last 90 days
- YouTube SEO channels (James Dooley, Sterling Sky, etc.)
- Programmatic SEO strategies that survived the March 2026 scaled-content crackdown

${industry !== 'any' ? `Tailor every method specifically to the industry/sub-industry: ${industry}.` : 'Make methods applicable to ANY business, any industry, or any sub-industry.'}

For each method return: a short punchy name, category, speed_tier (how fast it impacts rankings: instant/fast/medium/slow), the SPECIFIC Google algorithm mechanism or signal it exploits, concrete numbered implementation steps, expected impact, honest risk level, where it was found, and a source URL.

Return the 8 FASTEST, highest-leverage, NOVEL methods. Do NOT duplicate anything already in this list: ${knownList || '(none yet)'}

Prioritize: speed of impact, novelty (newly discovered in the last 90 days), and leverage. Be honest about risk — label black-hat methods as black_hat. Exclude nothing useful, but never present a risky tactic as safe.`;

    const schema = {
      type: 'object',
      properties: {
        methods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string', enum: ['technical', 'content', 'authority', 'ai_search', 'local', 'programmatic', 'ux', 'link_building', 'brand', 'social', 'measurement'] },
              speed_tier: { type: 'string', enum: ['instant', 'fast', 'medium', 'slow'] },
              industry_scope: { type: 'string' },
              mechanism: { type: 'string' },
              implementation_steps: { type: 'array', items: { type: 'string' } },
              expected_impact: { type: 'string' },
              risk_level: { type: 'string', enum: ['safe', 'moderate', 'aggressive', 'black_hat'] },
              source: { type: 'string' },
              source_url: { type: 'string' }
            },
            required: ['name', 'category', 'speed_tier', 'mechanism', 'implementation_steps', 'risk_level']
          }
        }
      },
      required: ['methods']
    };

    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: schema
    });

    const candidates = (llmRes && Array.isArray(llmRes.methods)) ? llmRes.methods : [];
    const known = new Set(existingNames);
    const novel = candidates
      .filter((m) => m.name && !known.has(m.name.toLowerCase()))
      .map((m) => ({
        name: m.name,
        category: m.category || 'content',
        speed_tier: m.speed_tier || 'fast',
        industry_scope: m.industry_scope || 'all',
        mechanism: m.mechanism || '',
        implementation_steps: m.implementation_steps || [],
        expected_impact: m.expected_impact || '',
        risk_level: m.risk_level || 'safe',
        source: m.source || 'web_research',
        source_url: m.source_url || '',
        proof_level: 0,
        status: 'discovered',
        discovered_at: now,
        generator_run_id: runId
      }));

    let created = [];
    if (novel.length) {
      created = await base44.asServiceRole.entities.RankingMethod.bulkCreate(novel);
    }

    await base44.asServiceRole.entities.Receipt.create({
      kind: 'ingestion',
      summary: `Autonomous SEO generator run ${runId}: ${created.length} new methods`,
      detail: `Live-web research${industry !== 'any' ? ' for ' + industry : ''}. ${candidates.length} candidates, ${novel.length} novel after dedup.`,
      source: 'GenerateRankingMethods',
      provenance: 'INFERRED',
      occurred_at: now
    });
    await base44.asServiceRole.entities.RunTelemetry.create({
      run_type: 'research',
      subsystem: 'search',
      status: 'ok',
      started_at: now,
      records_written: created.length,
      message: `${created.length} new ranking methods`
    });

    return Response.json({ run_id: runId, discovered: candidates.length, created: created.length, methods: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}