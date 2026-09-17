import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// DeepIngestion — Deterministic deep architecture ingestion pipeline.
// Accepts ANY file type (image, prompt, voice, video, url, folder, file, document, code, data, config, archive)
// with NO file size restriction. Runs 3 filters: Accuracy, Honesty, Utility.
// Items that fail any filter are moved to the "questionable" folder for audit.
// Items that pass all 3 filters and protocol compliance are "approved" for application.
//
// Invoke: POST /functions/DeepIngestion with multipart/form-data:
//   - source_type: one of image|prompt|voice|video|url|folder|file|document|code|data|config|archive
//   - source_name: label for the item
//   - source_url: (optional) URL if ingesting from web
//   - content_text: (optional) text content for prompts/code/documents
//   - file: (optional) the uploaded file blob — any type, any size
//   - metadata: (optional) JSON string of extra metadata

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

function detectMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4', flac: 'audio/flac', webm: 'audio/webm',
    mp4: 'video/mp4', avi: 'video/x-msvideo', mov: 'video/quicktime', mkv: 'video/x-matroska', webm: 'video/webm',
    txt: 'text/plain', md: 'text/markdown', json: 'application/json', csv: 'text/csv', xml: 'application/xml', yaml: 'text/yaml', yml: 'text/yaml',
    js: 'text/javascript', ts: 'text/typescript', jsx: 'text/jsx', tsx: 'text/tsx', py: 'text/x-python', sh: 'application/x-sh',
    html: 'text/html', css: 'text/css', pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    zip: 'application/zip', rar: 'application/x-rar', '7z': 'application/x-7z-compressed', tar: 'application/x-tar', gz: 'application/gzip',
    env: 'application/x-env', key: 'application/x-pem-key', pem: 'application/x-pem-key', crt: 'application/x-x509-ca-cert',
  };
  return map[ext] || 'application/octet-stream';
}

function inferSourceType(filename: string, mime: string, explicit?: string): string {
  if (explicit) return explicit;
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['png','jpg','jpeg','gif','webp','svg','bmp'].includes(ext) || mime.startsWith('image/')) return 'image';
  if (['mp3','wav','ogg','m4a','flac'].includes(ext) || mime.startsWith('audio/')) return 'voice';
  if (['mp4','avi','mov','mkv','webm'].includes(ext) || mime.startsWith('video/')) return 'video';
  if (['js','ts','jsx','tsx','py','sh','html','css'].includes(ext)) return 'code';
  if (['json','csv','xml','yaml','yml'].includes(ext)) return 'data';
  if (['env','key','pem','crt'].includes(ext)) return 'config';
  if (['zip','rar','7z','tar','gz'].includes(ext) || mime.includes('zip') || mime.includes('compressed')) return 'archive';
  if (['txt','md','pdf','doc','docx','xls','xlsx'].includes(ext)) return 'document';
  return 'file';
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const now = new Date().toISOString();

    // Parse multipart form data (supports large files)
    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return Response.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const sourceType = String(formData.get('source_type') || '').trim();
    const sourceName = String(formData.get('source_name') || '').trim();
    const sourceUrl = String(formData.get('source_url') || '').trim();
    const contentText = String(formData.get('content_text') || '').trim();
    const metadataStr = String(formData.get('metadata') || '').trim();
    const file = formData.get('file') as File | null;

    if (!sourceName) {
      return Response.json({ error: 'source_name is required' }, { status: 400 });
    }

    // Determine source type
    let finalSourceType = sourceType;
    let mimeType = '';
    let sizeBytes = 0;
    let fileUri = '';
    let extractedText = contentText;

    if (file && file.size > 0) {
      mimeType = file.type || detectMimeType(file.name);
      sizeBytes = file.size;
      finalSourceType = inferSourceType(file.name, mimeType, sourceType);

      // Upload to private storage — no size restriction (private storage handles large files)
      try {
        const uploadRes = await svc.integrations.Core.UploadPrivateFile({ file });
        fileUri = (uploadRes as any).file_uri || '';
      } catch (uploadErr: any) {
        // If private upload fails, try public as fallback for non-sensitive types
        if (['image','video','voice','document'].includes(finalSourceType)) {
          try {
            const pubRes = await svc.integrations.Core.UploadPublicFile({ file });
            fileUri = (pubRes as any).file_url || '';
          } catch {}
        }
      }

      // Extract text from text-based files
      if (['text/','application/json','application/xml','text/yaml','text/markdown','text/javascript','text/typescript'].some(t => mimeType.includes(t)) || ['txt','md','json','csv','xml','yaml','yml','js','ts','jsx','tsx','py','sh','html','css','env'].some(ext => file.name.endsWith(ext))) {
        try {
          extractedText = await file.text();
          if (extractedText.length > 50000) extractedText = extractedText.slice(0, 50000) + '\n...[truncated for filter analysis]';
        } catch {}
      }
    } else if (sourceUrl) {
      finalSourceType = sourceType || 'url';
      mimeType = 'text/html';
    } else if (!contentText) {
      return Response.json({ error: 'Either a file, source_url, or content_text is required' }, { status: 400 });
    }

    // Create the ingestion record with pending filters
    const item = await svc.entities.IngestionItem.create({
      source_type: finalSourceType as any,
      source_name: sourceName.slice(0, 300),
      source_url: sourceUrl.slice(0, 500),
      file_uri: fileUri,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      content_text: extractedText.slice(0, 50000),
      raw_metadata: metadataStr.slice(0, 5000),
      status: 'filtering',
      filter_accuracy: 'pending',
      filter_honesty: 'pending',
      filter_utility: 'pending',
      protocol_compliance: false,
      ingested_at: now,
    });

    // ── Run 3 filters via LLM (deterministic structured output) ──
    const filterPrompt = `You are a deterministic deep architecture ingestion filter system. Analyze the following ingested item and run exactly 3 filters. Be strict, truthful, and verifiable.

ITEM:
- Source Type: ${finalSourceType}
- Source Name: ${sourceName}
- MIME Type: ${mimeType}
- Size: ${sizeBytes} bytes
- Source URL: ${sourceUrl || 'N/A'}
- Content Text (first 50000 chars): ${extractedText || '(binary file — no text extracted)'}

SYSTEM PROTOCOLS (the item must comply with ALL):
${SYSTEM_PROTOCOLS.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Run these 3 filters:

FILTER 1 — ACCURACY: Is the content factually accurate, verifiable, and free of hallucinated or fabricated claims? For binary files (images, videos, archives), assess whether the metadata and source are accurate and verifiable. For text/code, verify factual claims are grounded.

FILTER 2 — HONESTY: Is the content truthful and non-deceptive? It must not contain misleading information, fake claims, phishing links, social engineering, or disguised malicious content. For code/config, it must not hide backdoors, obfuscated payloads, or credential exfiltration.

FILTER 3 — UTILITY: Does this item VERIFIABLY fix, connect, heal, harden, optimize, or evolve something in the system? It must have a concrete, identifiable system target (an entity, function, page, workflow, or integration). "Fix" = repairs broken functionality. "Connect" = links two system components. "Heal" = restores failed system state. "Harden" = improves security. "Optimize" = improves performance. "Evolve" = adds new capability. If the item has no clear system utility, it FAILS this filter.

Also check PROTOCOL COMPLIANCE against the ${SYSTEM_PROTOCOLS.length} protocols listed above.

Return JSON with this exact schema:
{
  "filter_accuracy": "pass" | "fail",
  "filter_accuracy_reason": "string explaining the verdict",
  "filter_honesty": "pass" | "fail",
  "filter_honesty_reason": "string explaining the verdict",
  "filter_utility": "pass" | "fail",
  "filter_utility_reason": "string explaining the verdict",
  "utility_action": "fix" | "connect" | "heal" | "harden" | "optimize" | "evolve" | "none",
  "utility_target": "specific system component this targets",
  "utility_verification": "how the utility claim can be verified",
  "protocol_compliance": true | false,
  "protocol_violations": ["list of violated protocols, empty if none"],
  "content_summary": "2-3 sentence summary of what this item is"
}`;

    let filterResults: any = null;
    try {
      const llmRes = await svc.integrations.Core.InvokeLLM({
        prompt: filterPrompt,
        model: 'gpt_5_6_luna',
        response_json_schema: {
          type: 'object',
          properties: {
            filter_accuracy: { type: 'string', enum: ['pass', 'fail'] },
            filter_accuracy_reason: { type: 'string' },
            filter_honesty: { type: 'string', enum: ['pass', 'fail'] },
            filter_honesty_reason: { type: 'string' },
            filter_utility: { type: 'string', enum: ['pass', 'fail'] },
            filter_utility_reason: { type: 'string' },
            utility_action: { type: 'string', enum: ['fix', 'connect', 'heal', 'harden', 'optimize', 'evolve', 'none'] },
            utility_target: { type: 'string' },
            utility_verification: { type: 'string' },
            protocol_compliance: { type: 'boolean' },
            protocol_violations: { type: 'array', items: { type: 'string' } },
            content_summary: { type: 'string' },
          },
          required: ['filter_accuracy', 'filter_honesty', 'filter_utility', 'protocol_compliance'],
        },
      });
      filterResults = llmRes;
    } catch (llmErr: any) {
      // If LLM fails, mark as questionable for safety
      await svc.entities.IngestionItem.update(item.id, {
        status: 'questionable',
        questionable_reason: `Filter LLM invocation failed: ${llmErr.message}. Held for audit.`,
        filter_accuracy: 'fail',
        filter_accuracy_reason: 'LLM filter unavailable',
        filter_honesty: 'fail',
        filter_honesty_reason: 'LLM filter unavailable',
        filter_utility: 'fail',
        filter_utility_reason: 'LLM filter unavailable',
      });
      return Response.json({ ok: true, itemId: item.id, status: 'questionable', reason: 'Filter LLM failed — held for audit' });
    }

    const allPass = filterResults.filter_accuracy === 'pass' &&
                    filterResults.filter_honesty === 'pass' &&
                    filterResults.filter_utility === 'pass' &&
                    filterResults.protocol_compliance === true;

    if (allPass) {
      // All 3 filters passed + protocol compliant → approved
      await svc.entities.IngestionItem.update(item.id, {
        status: 'approved',
        filter_accuracy: filterResults.filter_accuracy,
        filter_accuracy_reason: filterResults.filter_accuracy_reason,
        filter_honesty: filterResults.filter_honesty,
        filter_honesty_reason: filterResults.filter_honesty_reason,
        filter_utility: filterResults.filter_utility,
        filter_utility_reason: filterResults.filter_utility_reason,
        utility_action: filterResults.utility_action || 'none',
        utility_target: filterResults.utility_target || '',
        utility_verification: filterResults.utility_verification || '',
        protocol_compliance: true,
        protocol_violations: filterResults.protocol_violations || [],
        content_summary: filterResults.content_summary || '',
      });

      await svc.entities.Receipt.create({
        kind: 'ingestion',
        summary: `Ingestion APPROVED: ${sourceName} (${finalSourceType}) — ${filterResults.utility_action} → ${filterResults.utility_target}`,
        detail: `Accuracy: pass, Honesty: pass, Utility: pass (${filterResults.utility_action}), Protocol: compliant`,
        source: 'DeepIngestion',
        provenance: 'MEASURED',
        occurred_at: now,
      });

      return Response.json({ ok: true, itemId: item.id, status: 'approved', filters: filterResults });
    } else {
      // One or more filters failed → questionable folder
      const failedFilters: string[] = [];
      if (filterResults.filter_accuracy === 'fail') failedFilters.push('accuracy');
      if (filterResults.filter_honesty === 'fail') failedFilters.push('honesty');
      if (filterResults.filter_utility === 'fail') failedFilters.push('utility');
      if (!filterResults.protocol_compliance) failedFilters.push('protocol');

      const reason = `Failed filters: ${failedFilters.join(', ')}. ${filterResults.filter_accuracy_reason || ''} ${filterResults.filter_honesty_reason || ''} ${filterResults.filter_utility_reason || ''}`.trim();

      await svc.entities.IngestionItem.update(item.id, {
        status: 'questionable',
        questionable_reason: reason.slice(0, 2000),
        filter_accuracy: filterResults.filter_accuracy || 'fail',
        filter_accuracy_reason: filterResults.filter_accuracy_reason || '',
        filter_honesty: filterResults.filter_honesty || 'fail',
        filter_honesty_reason: filterResults.filter_honesty_reason || '',
        filter_utility: filterResults.filter_utility || 'fail',
        filter_utility_reason: filterResults.filter_utility_reason || '',
        utility_action: filterResults.utility_action || 'none',
        utility_target: filterResults.utility_target || '',
        utility_verification: filterResults.utility_verification || '',
        protocol_compliance: filterResults.protocol_compliance || false,
        protocol_violations: filterResults.protocol_violations || [],
        content_summary: filterResults.content_summary || '',
      });

      await svc.entities.Receipt.create({
        kind: 'ingestion',
        summary: `Ingestion QUESTIONABLE: ${sourceName} (${finalSourceType}) — ${failedFilters.join(', ')} failed`,
        detail: reason.slice(0, 500),
        source: 'DeepIngestion',
        provenance: 'MEASURED',
        occurred_at: now,
      });

      return Response.json({ ok: true, itemId: item.id, status: 'questionable', failedFilters, filters: filterResults });
    }
  } catch (error: any) {
    console.error('DeepIngestion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}