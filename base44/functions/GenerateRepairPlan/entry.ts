import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// GenerateRepairPlan — takes audit results (from SiteAudit, TechnicalSeoAudit,
// CroAudit, SecurityScan) and generates a prioritized, step-by-step repair plan
// with effort estimates, impact scores, and implementation instructions.
//
// Invoke: base44.functions.invoke('GenerateRepairPlan', { url, auditResults? })
// Returns: { ok, repairPlan, totalEffort, priorityOrder }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const url = String(body.url || '').trim();
    if (!url) return Response.json({ error: 'url is required' }, { status: 400 });

    // If audit results provided, use them; otherwise, run a quick site audit
    let auditData = body.auditResults;
    if (!auditData) {
      // Quick fetch + audit
      let parsed;
      try { parsed = new URL(url); } catch { return Response.json({ error: 'Invalid URL' }, { status: 400 }); }
      const resp = await fetch(url, { headers: { 'User-Agent': 'SEOGenerator-RepairPlan/1.0' }, signal: AbortSignal.timeout(12000), redirect: 'follow' });
      const html = await resp.text();
      auditData = {
        hasTitle: /<title[^>]*>[^<]+<\/title>/i.test(html),
        hasMetaDesc: /<meta[^>]+name=["']description["']/i.test(html),
        hasCanonical: /<link[^>]+rel=["']canonical["']/i.test(html),
        hasH1: /<h1[^>]*>[^<]+<\/h1>/i.test(html),
        hasSchema: /<script[^>]+type=["']application\/ld\+json["']/i.test(html),
        hasFAQ: /FAQPage/i.test(html),
        hasForm: /<form[^>]*>/i.test(html),
        hasCTA: /(?:call|quote|estimate|book|contact)/i.test(html),
        hasPhone: /tel:/i.test(html),
        hasViewport: /<meta[^>]+name=["']viewport["']/i.test(html),
        wordCount: html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length,
        https: parsed.protocol === 'https:',
      };
    }

    const prompt = `You are an SEO repair planner. Given the following audit results for ${url}, create a prioritized repair plan.

Audit Results: ${JSON.stringify(auditData, null, 2)}

Create a repair plan with:
1. Each repair task ordered by priority (critical first, then high, medium, low)
2. For each task: task_name, severity, effort_hours, impact_score (0-100), step_by_step_instructions, expected_outcome
3. Group tasks by category: Technical, Content, Conversion, Security, AEO
4. Total estimated effort (hours)
5. Expected overall score improvement after all repairs

Output strict JSON: { repairPlan: [{ task_name, category, severity, effort_hours, impact_score, instructions, expected_outcome }], totalEffort, expectedScoreImprovement }`;

    const schema = {
      type: 'object',
      properties: {
        repairPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task_name: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string' },
              effort_hours: { type: 'number' },
              impact_score: { type: 'number' },
              instructions: { type: 'string' },
              expected_outcome: { type: 'string' },
            },
          },
        },
        totalEffort: { type: 'number' },
        expectedScoreImprovement: { type: 'number' },
      },
    };

    const llmRes = await svc.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    const data = llmRes?.data ?? llmRes;
    if (!data?.repairPlan) return Response.json({ error: 'AI did not return a repair plan' }, { status: 502 });

    // Store as Suggestions
    for (const task of data.repairPlan) {
      await svc.entities.Suggestion.create({
        title: task.task_name,
        url,
        kind: task.severity === 'critical' ? 'fix' : 'enhancement',
        gap_type: task.category?.toUpperCase() === 'TECHNICAL' ? 'TECHNICAL' : task.category?.toUpperCase() === 'CONTENT' ? 'CONTENT' : 'SEO',
        treatment: task.instructions,
        rationale: task.expected_outcome,
        hours_estimate: task.effort_hours,
        priority_score: task.impact_score,
        evidence_tier: 'T1_CONFIRMED_SYSTEM',
        provenance: 'MODELED',
        status: 'new',
        created_at: new Date().toISOString(),
      }).catch(() => {});
    }

    return Response.json({
      ok: true,
      url,
      repairPlan: data.repairPlan,
      totalEffort: data.totalEffort,
      expectedScoreImprovement: data.expectedScoreImprovement,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}