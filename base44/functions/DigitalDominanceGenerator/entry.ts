import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { DOMINANCE_CATALOG } from '../../shared/dominanceCatalog.ts';

// Digital Dominance Generator — the unified system for flooding every digital
// space with your business information. Enter your business profile ONCE, then:
//
//   1. DISCOVER: Seeds the comprehensive catalog (80+ targets) into SubmissionTarget
//      records, then uses LLM + web search to discover additional niche-specific
//      submission sites.
//
//   2. SUBMIT: Uses the CloudBrowser engine to navigate to each target, extract
//      the form structure, use LLM to map business-profile fields → form fields,
//      fill the form, and submit. Captures a screenshot of the result.
//
//   3. STATUS: Returns the current job progress (submitted / verified / failed).
//
// Invoke:
//   base44.functions.invoke('DigitalDominanceGenerator', { action: 'discover', business_profile: {...}, categories: [...] })
//   base44.functions.invoke('DigitalDominanceGenerator', { action: 'submit', job_id: '...', batch_size: 10 })
//   base44.functions.invoke('DigitalDominanceGenerator', { action: 'status', job_id: '...' })

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === 'discover') return await discover(base44, body);
    if (action === 'submit') return await submit(base44, body);
    if (action === 'status') return await status(base44, body);

    return Response.json({ error: 'Provide action: discover | submit | status' }, { status: 400 });
  } catch (error) {
    console.error('[DigitalDominance] Fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DISCOVER — seed catalog + LLM discovery of niche-specific targets
// ═══════════════════════════════════════════════════════════════════════════

async function discover(base44: any, body: any) {
  const { business_profile, categories } = body;
  const profile = business_profile || {};
  const selectedCategories = categories || Object.keys(DOMINANCE_CATALOG.reduce((acc: any, e: any) => { acc[e.category] = true; return acc; }, {}));

  console.log(`[DigitalDominance] Discovering targets for ${profile.name || 'unnamed business'}`);

  // 1. Seed catalog targets into SubmissionTarget records (skip existing)
  let seeded = 0;
  let skipped = 0;
  for (const entry of DOMINANCE_CATALOG) {
    if (!selectedCategories.includes(entry.category)) continue;
    // Check if already exists
    const existing = await base44.asServiceRole.entities.SubmissionTarget.filter({ url: entry.url });
    if (existing.length > 0) { skipped++; continue; }
    await base44.asServiceRole.entities.SubmissionTarget.create({
      site_name: entry.site_name,
      url: entry.url,
      category: entry.category,
      submission_type: entry.submission_type,
      requires_api_key: false,
      requires_verification: entry.requires_verification,
      is_free: entry.is_free,
      domain_authority: entry.domain_authority,
      estimated_seo_value: entry.estimated_seo_value,
      submission_status: 'identified',
      description: entry.description,
    });
    seeded++;
  }
  console.log(`[DigitalDominance] Seeded ${seeded} catalog targets (${skipped} already existed)`);

  // 2. Use LLM to discover additional niche-specific targets
  let discovered = 0;
  try {
    const niche = profile.category || profile.industry || 'general business';
    const llmRes = await base44.integrations.Core.InvokeLLM({
      prompt: `Find 20 additional websites where a "${niche}" business in the US should list/submit their business for maximum online visibility and SEO.
Focus on niche-specific directories, industry associations, local chambers, trade publications, and platforms NOT in this list: Google, Bing, Apple, Yelp, Facebook, LinkedIn, Twitter, Instagram, TikTok, YouTube, Pinterest, Nextdoor, BBB, Trustpilot, Yellow Pages, Whitepages, Superpages, MerchantCircle, Manta, Foursquare, MapQuest, Angi, HomeAdvisor, Thumbtack, Houzz, Porch, Crunchbase, Glassdoor, Indeed, G2, Capterra, Product Hunt, PR Newswire, Reddit, Quora, Medium.

For each site provide: name, url (full https://), category, why it matters for SEO, and whether it requires verification.
Return exactly 20 sites as JSON.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          sites: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                url: { type: 'string' },
                category: { type: 'string' },
                why_it_matters: { type: 'string' },
                requires_verification: { type: 'boolean' },
              },
            },
          },
        },
      },
    });

    for (const site of (llmRes.sites || [])) {
      if (!site.url || !site.url.startsWith('http')) continue;
      const existing = await base44.asServiceRole.entities.SubmissionTarget.filter({ url: site.url });
      if (existing.length > 0) continue;
      await base44.asServiceRole.entities.SubmissionTarget.create({
        site_name: site.name || site.url,
        url: site.url,
        category: site.category || 'directory',
        submission_type: 'form',
        requires_verification: site.requires_verification || false,
        is_free: true,
        domain_authority: 50,
        estimated_seo_value: 'medium',
        submission_status: 'identified',
        description: site.why_it_matters || '',
      });
      discovered++;
    }
    console.log(`[DigitalDominance] LLM discovered ${discovered} additional targets`);
  } catch (e) {
    console.error(`[DigitalDominance] LLM discovery failed: ${e.message}`);
  }

  // 3. Create a BatchSubmissionJob to track the campaign
  const allTargets = await base44.asServiceRole.entities.SubmissionTarget.filter({
    submission_status: 'identified',
  });
  const targetIds = allTargets
    .filter((t: any) => selectedCategories.includes(t.category))
    .map((t: any) => t.id);

  const job = await base44.asServiceRole.entities.BatchSubmissionJob.create({
    job_name: `Digital Dominance — ${profile.name || 'Campaign'} — ${new Date().toISOString().slice(0, 10)}`,
    target_ids: targetIds,
    total_targets: targetIds.length,
    submitted_count: 0,
    verified_count: 0,
    failed_count: 0,
    company_data: JSON.stringify(profile),
    status: 'queued',
    started_at: new Date().toISOString(),
  });

  await base44.asServiceRole.entities.Receipt.create({
    kind: 'digital_dominance_discover',
    summary: `Discovered ${seeded + discovered + skipped} targets (${seeded} new, ${discovered} LLM-found, ${skipped} existing)`,
    detail: `Business: ${profile.name || 'N/A'} | Niche: ${profile.category || 'N/A'} | Job: ${job.id}`,
    source: 'DigitalDominanceGenerator',
    provenance: 'MEASURED',
    occurred_at: new Date().toISOString(),
  });

  return Response.json({
    ok: true,
    action: 'discover',
    job_id: job.id,
    seeded,
    discovered,
    skipped,
    total_targets: targetIds.length,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBMIT — use CloudBrowser to auto-fill + submit forms on target sites
// ═══════════════════════════════════════════════════════════════════════════

async function submit(base44: any, body: any) {
  const { job_id, batch_size = 5 } = body;
  if (!job_id) return Response.json({ error: 'job_id required' }, { status: 400 });

  const job = await base44.asServiceRole.entities.BatchSubmissionJob.get(job_id);
  if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

  const profile = JSON.parse(job.company_data || '{}');
  const engineUrl = (process.env.CLOUDBROWSER_ENGINE_URL || process.env.BROWSER_ENGINE_URL || '').replace(/\/$/, '');
  const apiKey = process.env.ENGINE_API_KEY || process.env.CLOUDBROWSER_API_KEY;
  if (!engineUrl || !apiKey) {
    return Response.json({ error: 'CloudBrowser engine not configured' }, { status: 500 });
  }

  // Get pending targets from the job
  const targets = await base44.asServiceRole.entities.SubmissionTarget.filter({
    submission_status: 'identified',
  });
  const jobTargetIds = job.target_ids || [];
  const pending = targets.filter((t: any) => jobTargetIds.includes(t.id));
  const batch = pending.slice(0, batch_size);

  console.log(`[DigitalDominance] Submitting to ${batch.length} targets (batch)`);

  await base44.asServiceRole.entities.BatchSubmissionJob.update(job_id, { status: 'running' });

  const results = [];
  for (const target of batch) {
    try {
      const result = await submitToTarget(base44, engineUrl, apiKey, target, profile);
      results.push({ target_id: target.id, site_name: target.site_name, ...result });

      // Update target status
      await base44.asServiceRole.entities.SubmissionTarget.update(target.id, {
        submission_status: result.status,
        last_submitted_at: new Date().toISOString(),
        scrape_error: result.error || '',
      });
    } catch (e) {
      console.error(`[DigitalDominance] Submit failed for ${target.site_name}: ${e.message}`);
      results.push({ target_id: target.id, site_name: target.site_name, status: 'failed', error: e.message });
      await base44.asServiceRole.entities.SubmissionTarget.update(target.id, {
        submission_status: 'failed',
        scrape_error: e.message.slice(0, 500),
        last_submitted_at: new Date().toISOString(),
      });
    }
  }

  // Update job counts
  const submitted = results.filter(r => r.status === 'submitted' || r.status === 'verified').length;
  const failed = results.filter(r => r.status === 'failed').length;
  await base44.asServiceRole.entities.BatchSubmissionJob.update(job_id, {
    submitted_count: (job.submitted_count || 0) + submitted,
    failed_count: (job.failed_count || 0) + failed,
    results: JSON.stringify([...(JSON.parse(job.results || '[]')), ...results]),
    status: 'running',
  });

  // Check if all done
  const updatedJob = await base44.asServiceRole.entities.BatchSubmissionJob.get(job_id);
  if (updatedJob.submitted_count + updatedJob.failed_count >= updatedJob.total_targets) {
    await base44.asServiceRole.entities.BatchSubmissionJob.update(job_id, {
      status: updatedJob.failed_count > updatedJob.submitted_count ? 'partial' : 'completed',
      completed_at: new Date().toISOString(),
    });
  }

  return Response.json({
    ok: true,
    action: 'submit',
    job_id,
    batch_results: results,
    submitted_this_batch: submitted,
    failed_this_batch: failed,
    total_submitted: updatedJob.submitted_count,
    total_failed: updatedJob.failed_count,
    total_targets: updatedJob.total_targets,
  });
}

// ── Submit to a single target via CloudBrowser ──
async function submitToTarget(base44: any, engineUrl: string, apiKey: string, target: any, profile: any) {
  const headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey };
  console.log(`[DigitalDominance] Submitting to ${target.site_name} (${target.url})`);

  // 1. Create session
  const sessRes = await fetch(`${engineUrl}/sessions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ viewport: { width: 1440, height: 900 }, solveCaptcha: true, blockAds: true }),
  });
  if (!sessRes.ok) throw new Error(`Session creation failed (${sessRes.status})`);
  const session = await sessRes.json();
  const sessionId = session.sessionId || session.id || session.session_id;
  if (!sessionId) throw new Error('No session ID returned');

  try {
    // 2. Navigate to target
    await engineExec(engineUrl, headers, sessionId, { action_type: 'goto', value: target.url });
    await engineExec(engineUrl, headers, sessionId, { action_type: 'wait_for_load_state', value: 'networkidle' }).catch(() => {});
    await engineExec(engineUrl, headers, sessionId, { action_type: 'wait_for_timeout', value: 3000 }).catch(() => {});

    // 3. Extract all form fields from the page
    const formExtractExpr = `JSON.stringify((function(){
      var fields = [];
      document.querySelectorAll('form input, form textarea, form select').forEach(function(el) {
        if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button' || el.type === 'image') return;
        var label = '';
        if (el.id) { var l = document.querySelector('label[for="' + el.id + '"]'); if (l) label = l.textContent.trim(); }
        if (!label && el.placeholder) label = el.placeholder;
        if (!label && el.name) label = el.name.replace(/[_-]/g, ' ');
        if (!label && el.getAttribute('aria-label')) label = el.getAttribute('aria-label');
        fields.push({
          selector: el.tagName.toLowerCase() + (el.name ? '[name="' + el.name + '"]' : el.id ? '#' + el.id : ''),
          type: el.type || el.tagName.toLowerCase(),
          label: label,
          placeholder: el.placeholder || '',
          required: el.required,
          name: el.name || '',
          id: el.id || ''
        });
      });
      return fields;
    })())`;

    const formData = await engineExec(engineUrl, headers, sessionId, { action_type: 'evaluate', value: formExtractExpr });
    const formFieldsRaw = formData?.data || formData?.value || formData?.result || '[]';
    let formFields: any[] = [];
    try { formFields = JSON.parse(formFieldsRaw); } catch {}

    if (formFields.length === 0) {
      // No form found — might need login or different page
      const screenshot = await engineExec(engineUrl, headers, sessionId, { action_type: 'screenshot', options: { fullPage: false } });
      return { status: 'failed', error: 'No submission form found on page (may require login/OAuth)', form_fields: 0 };
    }

    console.log(`[DigitalDominance] Found ${formFields.length} form fields on ${target.site_name}`);

    // 4. Use LLM to map business profile → form fields
    const mappingRes = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a form-filling assistant. Map business profile data to form fields.

FORM FIELDS (from ${target.site_name}):
${JSON.stringify(formFields, null, 2)}

BUSINESS PROFILE:
${JSON.stringify({
  name: profile.name,
  url: profile.url,
  description: profile.description,
  phone: profile.phone,
  email: profile.email,
  address: profile.address,
  city: profile.city,
  state: profile.state,
  zip: profile.zip,
  category: profile.category,
  services: profile.services,
  hours: profile.hours,
  logo_url: profile.logo_url,
}, null, 2)}

Return a JSON object mapping each field SELECTOR to the value to fill in. Only include fields you can confidently fill based on the business profile. Skip fields like password, captcha, agree-to-terms, login, signup, newsletter, etc. If a field doesn't match any profile data, skip it.

Example: {"input[name='business_name']": "Acme Plumbing", "input[name='website']": "https://acmeplumbing.com"}`,
      response_json_schema: {
        type: 'object',
        properties: {
          field_mapping: { type: 'object', additionalProperties: true },
        },
      },
    });

    const fieldMapping = mappingRes.field_mapping || {};
    const filledCount = Object.keys(fieldMapping).length;
    console.log(`[DigitalDominance] LLM mapped ${filledCount} fields for ${target.site_name}`);

    if (filledCount === 0) {
      return { status: 'failed', error: 'LLM could not map any form fields to business profile', form_fields: formFields.length };
    }

    // 5. Fill the form using evaluate (React-compatible native setter)
    const fillExpr = `(function(){
      var mapping = ${JSON.stringify(fieldMapping)};
      var filled = 0;
      for (var selector in mapping) {
        try {
          var el = document.querySelector(selector);
          if (!el) continue;
          var value = mapping[selector];
          if (el.tagName === 'SELECT') {
            el.value = value;
            el.dispatchEvent(new Event('change', { bubbles: true }));
          } else if (el.type === 'checkbox' || el.type === 'radio') {
            el.checked = (value === true || value === 'true' || value === 'yes' || value === '1');
            el.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value') ||
                         Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
            if (setter && setter.set) setter.set.call(el, value);
            else el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
          filled++;
        } catch(e) {}
      }
      return filled;
    })()`;

    const fillResult = await engineExec(engineUrl, headers, sessionId, { action_type: 'evaluate', value: fillExpr });
    const filled = fillResult?.data || fillResult?.value || 0;
    console.log(`[DigitalDominance] Filled ${filled} fields on ${target.site_name}`);

    // 6. Click submit button
    const submitExpr = `(function(){
      var btn = document.querySelector('button[type="submit"], input[type="submit"], button:not([type])');
      if (btn) { btn.click(); return true; }
      var btns = document.querySelectorAll('button, a.btn, input[type="button"]');
      for (var b of btns) {
        var text = (b.textContent || b.value || '').toLowerCase();
        if (text.includes('submit') || text.includes('sign up') || text.includes('create') || text.includes('add') || text.includes('register') || text.includes('continue')) {
          b.click(); return true;
        }
      }
      return false;
    })()`;

    const submitResult = await engineExec(engineUrl, headers, sessionId, { action_type: 'evaluate', value: submitExpr });
    const submitted = submitResult?.data || submitResult?.value || false;

    // 7. Wait + screenshot
    await engineExec(engineUrl, headers, sessionId, { action_type: 'wait_for_timeout', value: 3000 }).catch(() => {});
    const screenshotData = await engineExec(engineUrl, headers, sessionId, { action_type: 'screenshot', options: { fullPage: false } });

    // 8. Upload screenshot
    let screenshotUrl = '';
    const screenshotBase64 = screenshotData?.base64 || screenshotData?.data || '';
    if (screenshotBase64 && typeof screenshotBase64 === 'string' && screenshotBase64.length > 100) {
      try {
        const clean = screenshotBase64.replace(/^data:image\/\w+;base64,/, '');
        const bin = atob(clean);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const file = new File([bytes], `submission-${target.site_name}.png`, { type: 'image/png' });
        const uploadRes = await base44.asServiceRole.integrations.Core.UploadPublicFile({ file });
        screenshotUrl = uploadRes.file_url || '';
      } catch {}
    }

    return {
      status: submitted ? 'submitted' : 'failed',
      form_fields_found: formFields.length,
      fields_filled: filled,
      fields_mapped: filledCount,
      submit_clicked: submitted,
      screenshot_url: screenshotUrl,
      error: submitted ? '' : 'Could not find/click submit button',
    };
  } finally {
    await fetch(`${engineUrl}/sessions/${sessionId}`, { method: 'DELETE', headers: { 'x-api-key': apiKey } }).catch(() => {});
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS — return job progress
// ═══════════════════════════════════════════════════════════════════════════

async function status(base44: any, body: any) {
  const { job_id } = body;
  if (!job_id) return Response.json({ error: 'job_id required' }, { status: 400 });

  const job = await base44.asServiceRole.entities.BatchSubmissionJob.get(job_id);
  if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

  // Get per-category breakdown
  const allTargets = await base44.asServiceRole.entities.SubmissionTarget.list('-created_date', 200);
  const jobTargetIds = job.target_ids || [];
  const jobTargets = allTargets.filter((t: any) => jobTargetIds.includes(t.id));

  const byCategory: Record<string, { total: number; submitted: number; failed: number; identified: number }> = {};
  for (const t of jobTargets) {
    const cat = t.category || 'other';
    if (!byCategory[cat]) byCategory[cat] = { total: 0, submitted: 0, failed: 0, identified: 0 };
    byCategory[cat].total++;
    if (t.submission_status === 'submitted' || t.submission_status === 'verified') byCategory[cat].submitted++;
    else if (t.submission_status === 'failed') byCategory[cat].failed++;
    else byCategory[cat].identified++;
  }

  return Response.json({
    ok: true,
    job: {
      id: job.id,
      name: job.job_name,
      status: job.status,
      total_targets: job.total_targets,
      submitted: job.submitted_count,
      verified: job.verified_count,
      failed: job.failed_count,
      remaining: (job.total_targets || 0) - (job.submitted_count || 0) - (job.failed_count || 0),
      started_at: job.started_at,
      completed_at: job.completed_at,
    },
    by_category: byCategory,
  });
}

// ── Helper: execute CloudBrowser action ──
async function engineExec(engineUrl: string, headers: any, sessionId: string, action: any) {
  const res = await fetch(`${engineUrl}/sessions/${sessionId}/execute`, {
    method: 'POST',
    headers,
    body: JSON.stringify(action),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    throw new Error(`Action ${action.action_type} failed (${res.status}): ${errText.slice(0, 200)}`);
  }
  return await res.json().catch(() => ({}));
}