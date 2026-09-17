import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// AuditQuestionable — Triggered during every system audit.
// Loads all items in the "questionable" folder, re-validates each with stricter criteria,
// and trashes any that still don't meet guidelines after audit.
//
// Invoke: POST /functions/AuditQuestionable with { strict_mode: boolean (default true) }
// Returns: { audited: number, promoted: number, trashed: number, still_questionable: number }

const SYSTEM_PROTOCOLS = [
  'Must not contain malicious code, payloads, or injection vectors',
  'Must not reference or exfiltrate secrets, API keys, or credentials',
  'Must not attempt to bypass authentication or authorization',
  'Must not modify system entities without explicit utility justification',
  'Must follow deterministic deep architecture: every action verifiable',
  'Must not introduce circular dependencies or infinite loops',
  'Must not create stubs, placeholders, or non-functional code',
  'Must respect tenant isolation and RLS boundaries',
];

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const now = new Date().toISOString();
    const body = await req.json().catch(() => ({}));
    const strictMode = body.strict_mode !== false; // default true

    // Load all questionable items
    const questionable = await svc.entities.IngestionItem.filter({ status: 'questionable' }, '-ingested_at', 500);

    if (questionable.length === 0) {
      return Response.json({ ok: true, audited: 0, promoted: 0, trashed: 0, still_questionable: 0, message: 'No questionable items to audit' });
    }

    let promoted = 0;
    let trashed = 0;
    let stillQuestionable = 0;
    const auditResults: any[] = [];

    for (const item of questionable) {
      // Re-run filters with stricter criteria
      const auditPrompt = `You are a strict system auditor re-validating a questionable ingestion item. This is audit #${item.audit_count + 1}. Be MORE strict than the initial filter. The item previously failed and was placed in the questionable folder.

ITEM:
- Source Type: ${item.source_type}
- Source Name: ${item.source_name}
- MIME Type: ${item.mime_type}
- Size: ${item.size_bytes} bytes
- Source URL: ${item.source_url || 'N/A'}
- Previous Failure Reason: ${item.questionable_reason || 'N/A'}
- Content Text: ${(item.content_text || '(binary file — no text)').slice(0, 30000)}

SYSTEM PROTOCOLS:
${SYSTEM_PROTOCOLS.map((p, i) => `${i + 1}. ${p}`).join('\n')}

STRICT AUDIT — Re-evaluate all 3 filters with higher scrutiny:
1. ACCURACY: Is this verifiably accurate? If you cannot verify, it FAILS.
2. HONESTY: Is this truthful with no hidden deception? If any doubt, it FAILS.
3. UTILITY: Does this verifiably fix/connect/heal/harden/optimize/evolve a specific system component? Vague or untargeted utility FAILS.
4. PROTOCOL: Does it comply with ALL ${SYSTEM_PROTOCOLS.length} protocols? Any violation FAILS.

Verdict rules:
- "promote": ALL 3 filters pass AND protocol compliant — item is genuinely useful and safe.
- "uphold": Item still fails but might be salvageable with fixes — keep in questionable.
- "trash": Item is definitively useless, deceptive, malicious, or protocol-violating — trash it.

Return JSON:
{
  "verdict": "promote" | "uphold" | "trash",
  "filter_accuracy": "pass" | "fail",
  "filter_honesty": "pass" | "fail",
  "filter_utility": "pass" | "fail",
  "protocol_compliance": true | false,
  "reason": "detailed explanation of the verdict",
  "utility_action": "fix" | "connect" | "heal" | "harden" | "optimize" | "evolve" | "none",
  "utility_target": "specific system component, if applicable"
}`;

      let auditResult: any = null;
      try {
        auditResult = await svc.integrations.Core.InvokeLLM({
          prompt: auditPrompt,
          model: 'gpt_5_6_luna',
          response_json_schema: {
            type: 'object',
            properties: {
              verdict: { type: 'string', enum: ['promote', 'uphold', 'trash'] },
              filter_accuracy: { type: 'string', enum: ['pass', 'fail'] },
              filter_honesty: { type: 'string', enum: ['pass', 'fail'] },
              filter_utility: { type: 'string', enum: ['pass', 'fail'] },
              protocol_compliance: { type: 'boolean' },
              reason: { type: 'string' },
              utility_action: { type: 'string', enum: ['fix', 'connect', 'heal', 'harden', 'optimize', 'evolve', 'none'] },
              utility_target: { type: 'string' },
            },
            required: ['verdict', 'filter_accuracy', 'filter_honesty', 'filter_utility', 'protocol_compliance'],
          },
        });
      } catch (llmErr: any) {
        // If audit LLM fails, uphold the item (don't trash on technical failure)
        auditResult = { verdict: 'uphold', reason: `Audit LLM failed: ${llmErr.message}` };
      }

      const newAuditCount = (item.audit_count || 0) + 1;

      if (auditResult.verdict === 'promote') {
        // All filters pass on re-audit → promote to approved
        await svc.entities.IngestionItem.update(item.id, {
          status: 'approved',
          filter_accuracy: auditResult.filter_accuracy,
          filter_honesty: auditResult.filter_honesty,
          filter_utility: auditResult.filter_utility,
          protocol_compliance: auditResult.protocol_compliance,
          utility_action: auditResult.utility_action || 'none',
          utility_target: auditResult.utility_target || '',
          audit_count: newAuditCount,
          last_audited_at: now,
          last_audit_verdict: 'promote',
          questionable_reason: '',
        });
        promoted++;
        auditResults.push({ id: item.id, name: item.source_name, verdict: 'promote', reason: auditResult.reason });
      } else if (auditResult.verdict === 'trash' || (strictMode && newAuditCount >= 3)) {
        // Trash it — either explicit trash verdict, or strict mode after 3 audits
        const trashReason = auditResult.verdict === 'trash'
          ? auditResult.reason
          : `Failed ${newAuditCount} consecutive audits without promotion — auto-trashed in strict mode`;
        await svc.entities.IngestionItem.update(item.id, {
          status: 'trashed',
          trashed_reason: trashReason.slice(0, 2000),
          trashed_at: now,
          audit_count: newAuditCount,
          last_audited_at: now,
          last_audit_verdict: 'trash',
        });
        trashed++;
        auditResults.push({ id: item.id, name: item.source_name, verdict: 'trash', reason: trashReason });
      } else {
        // Uphold — still questionable
        await svc.entities.IngestionItem.update(item.id, {
          audit_count: newAuditCount,
          last_audited_at: now,
          last_audit_verdict: 'uphold',
          questionable_reason: (item.questionable_reason + ' | Audit #' + newAuditCount + ': ' + auditResult.reason).slice(0, 2000),
        });
        stillQuestionable++;
        auditResults.push({ id: item.id, name: item.source_name, verdict: 'uphold', reason: auditResult.reason });
      }
    }

    // Log audit receipt
    await svc.entities.Receipt.create({
      kind: 'audit',
      summary: `Questionable folder audited: ${promoted} promoted, ${trashed} trashed, ${stillQuestionable} upheld (${questionable.length} total)`,
      detail: auditResults.map((r) => `${r.name}: ${r.verdict}`).join(', ').slice(0, 1000),
      source: 'AuditQuestionable',
      provenance: 'MEASURED',
      occurred_at: now,
    });

    return Response.json({
      ok: true,
      audited: questionable.length,
      promoted,
      trashed,
      still_questionable: stillQuestionable,
      results: auditResults,
    });
  } catch (error: any) {
    console.error('AuditQuestionable error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}