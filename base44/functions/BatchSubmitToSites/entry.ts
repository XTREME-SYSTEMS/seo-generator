import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { job_name, target_ids, company_data } = body;

    if (!target_ids || !target_ids.length) {
      return Response.json({ error: 'target_ids required' }, { status: 400 });
    }

    const companyJson = JSON.stringify(company_data || {});

    // Create a batch job
    const job = await base44.asServiceRole.entities.BatchSubmissionJob.create({
      job_name: job_name || `Batch ${new Date().toISOString()}`,
      target_ids,
      total_targets: target_ids.length,
      submitted_count: 0,
      verified_count: 0,
      failed_count: 0,
      company_data: companyJson,
      status: 'running',
      started_at: new Date().toISOString(),
    });

    const mcpUrl = secrets.get('CLOUDBROWSER_MCP_URL');
    const apiKey = secrets.get('CLOUDBROWSER_API_KEY');

    // Get the targets
    const targets = await base44.asServiceRole.entities.SubmissionTarget.filter({
      _id: { $in: target_ids },
    });

    let submitted = 0;
    let failed = 0;
    const results = [];

    for (const target of targets) {
      try {
        if (target.submission_type === 'api_submit' && target.api_endpoint) {
          // Submit via API
          const apiRes = await fetch(target.api_endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: companyJson,
          });
          if (apiRes.ok) {
            submitted++;
            results.push({ target_id: target.id, site_name: target.site_name, status: 'submitted', method: 'api' });
            await base44.asServiceRole.entities.SubmissionTarget.update(target.id, {
              submission_status: 'submitted',
              last_submitted_at: new Date().toISOString(),
            });
          } else {
            failed++;
            results.push({ target_id: target.id, site_name: target.site_name, status: 'failed', error: `API ${apiRes.status}` });
          }
        } else if (mcpUrl && apiKey && target.submission_type === 'manual_form') {
          // Submit via CloudBrowser
          const startRes = await fetch(mcpUrl + '/api/sessions', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: target.url }),
          });

          if (startRes.ok) {
            const session = await startRes.json();
            const sessionId = session.id || session.sessionId;

            // Use AI to fill and submit the form
            const actRes = await fetch(mcpUrl + '/api/sessions/' + sessionId + '/act', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                instruction: `Fill out the submission form on this page with the following company data and submit it: ${companyJson}. Fill in business name, URL, description, category, contact email, and any other required fields. Then click the submit button.`,
              }),
            });

            if (actRes.ok) {
              submitted++;
              results.push({ target_id: target.id, site_name: target.site_name, status: 'submitted', method: 'browser' });
              await base44.asServiceRole.entities.SubmissionTarget.update(target.id, {
                submission_status: 'submitted',
                last_submitted_at: new Date().toISOString(),
              });
            } else {
              failed++;
              results.push({ target_id: target.id, site_name: target.site_name, status: 'failed', error: 'Browser action failed' });
            }

            // End session
            await fetch(mcpUrl + '/api/sessions/' + sessionId, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + apiKey },
            });
          } else {
            failed++;
            results.push({ target_id: target.id, site_name: target.site_name, status: 'failed', error: 'Session start failed' });
          }
        } else {
          // Mark as needing manual submission
          results.push({ target_id: target.id, site_name: target.site_name, status: 'manual_required' });
        }
      } catch (e) {
        failed++;
        results.push({ target_id: target.id, site_name: target.site_name, status: 'failed', error: e.message });
      }
    }

    // Update job
    await base44.asServiceRole.entities.BatchSubmissionJob.update(job.id, {
      submitted_count: submitted,
      failed_count: failed,
      status: failed === targets.length ? 'failed' : 'completed',
      completed_at: new Date().toISOString(),
      results: JSON.stringify(results),
    });

    await base44.asServiceRole.entities.Receipt.create({
      action: 'batch_submit_to_sites',
      status: 'success',
      details: `Batch submission: ${submitted} submitted, ${failed} failed out of ${targets.length} targets`,
      proof_level: '1',
    });

    return Response.json({
      status: 'success',
      job_id: job.id,
      total: targets.length,
      submitted,
      failed,
      results: results.slice(0, 50),
    });
  } catch (error) {
    console.error('BatchSubmitToSites error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}