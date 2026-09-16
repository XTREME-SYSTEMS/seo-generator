import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { target_id, url } = body;

    if (!url) return Response.json({ error: 'URL required' }, { status: 400 });

    const mcpUrl = secrets.get('CLOUDBROWSER_MCP_URL');
    const apiKey = secrets.get('CLOUDBROWSER_API_KEY');

    if (!mcpUrl || !apiKey) {
      return Response.json({ error: 'CloudBrowser MCP not configured' }, { status: 500 });
    }

    // Start a browser session
    const startRes = await fetch(mcpUrl + '/api/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!startRes.ok) {
      return Response.json({ error: 'Failed to start browser session' }, { status: 500 });
    }

    const session = await startRes.json();
    const sessionId = session.id || session.sessionId;

    // Extract requirements from the page
    const extractRes = await fetch(mcpUrl + '/api/sessions/' + sessionId + '/extract', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instruction: 'Extract all submission requirements, listing guidelines, content policies, verification steps, and compliance rules for getting listed or submitting to this site. Include any API documentation links, rate limits, data format requirements, and authentication requirements.',
        schema: {
          type: 'object',
          properties: {
            requirements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  requirement_type: { type: 'string' },
                  requirement_text: { type: 'string' },
                  action_needed: { type: 'string' },
                },
              },
            },
            compliance_notes: { type: 'string' },
            api_available: { type: 'boolean' },
            api_endpoint: { type: 'string' },
            api_docs_url: { type: 'string' },
          },
        },
      }),
    });

    let extracted = { requirements: [], compliance_notes: '', api_available: false };
    if (extractRes.ok) {
      extracted = await extractRes.json();
    }

    // End the session
    await fetch(mcpUrl + '/api/sessions/' + sessionId, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + apiKey },
    });

    // Save compliance requirements
    const reqs = extracted.requirements || [];
    const records = reqs.map(r => ({
      target_id: target_id || '',
      site_name: new URL(url).hostname,
      requirement_type: r.requirement_type || 'other',
      requirement_text: r.requirement_text || '',
      action_needed: r.action_needed || '',
      compliance_status: 'pending',
      scraped_at: new Date().toISOString(),
    }));

    let created = [];
    if (records.length > 0) {
      created = await base44.asServiceRole.entities.ComplianceRequirement.bulkCreate(records);
    }

    // Update the submission target if target_id provided
    if (target_id) {
      await base44.asServiceRole.entities.SubmissionTarget.update(target_id, {
        submission_requirements: extracted.compliance_notes || '',
        compliance_notes: extracted.compliance_notes || '',
        api_endpoint: extracted.api_endpoint || '',
        api_docs_url: extracted.api_docs_url || '',
        submission_status: 'requirements_scraped',
        last_scraped_at: new Date().toISOString(),
      });
    }

    await base44.asServiceRole.entities.Receipt.create({
      kind: 'ingestion',
      summary: `Scraped requirements from ${url}: ${created.length} found`,
      detail: `URL: ${url}, Requirements: ${created.length}`,
      provenance: 'MEASURED',
    });

    return Response.json({
      status: 'success',
      url,
      requirements_found: created.length,
      compliance_notes: extracted.compliance_notes,
      api_available: extracted.api_available,
      api_endpoint: extracted.api_endpoint,
      api_docs_url: extracted.api_docs_url,
    });
  } catch (error) {
    console.error('IngestComplianceRequirements error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}