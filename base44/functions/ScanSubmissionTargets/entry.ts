import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { niche, categories, limit } = body;

    if (!niche) return Response.json({ error: 'Niche required' }, { status: 400 });

    const categoryList = categories || [
      'directory', 'api_provider', 'api_consumer', 'review_site',
      'social_platform', 'business_listing', 'press_release', 'forum',
      'blog_network', 'podcast_directory', 'app_store', 'saas_marketplace',
      'industry_specific', 'government'
    ];

    // Use LLM with web search to identify submission targets
    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a digital visibility scanner. For the niche "${niche}", identify every website, directory, API, and platform where a business can:
1. Submit their website/company to get listed
2. Get an API to connect with
3. Submit an API to be consumed by others
4. Connect via OAuth/integration
5. Get backlinks from

Search the web thoroughly. For each target, provide:
- site_name: The name of the site/platform
- url: The direct submission/listing URL
- category: One of: ${categoryList.join(', ')}
- submission_type: How to submit (api_submit, api_get, manual_form, oauth_connect, email, csv_upload, webhook)
- api_endpoint: API endpoint if available (or empty)
- api_docs_url: API documentation URL if available (or empty)
- requires_api_key: true/false
- requires_verification: true/false
- is_free: true/false
- domain_authority: Estimated DA 0-100
- estimated_seo_value: critical/high/medium/low
- submission_requirements: Brief description of what's needed to get listed
- description: What this site does and why it matters for ${niche}

Find at least ${limit || 50} targets. Focus on sites that provide real SEO value, API access, or backlink opportunities for a ${niche} business.

Return as JSON array.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          targets: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                site_name: { type: 'string' },
                url: { type: 'string' },
                category: { type: 'string' },
                submission_type: { type: 'string' },
                api_endpoint: { type: 'string' },
                api_docs_url: { type: 'string' },
                requires_api_key: { type: 'boolean' },
                requires_verification: { type: 'boolean' },
                is_free: { type: 'boolean' },
                domain_authority: { type: 'number' },
                estimated_seo_value: { type: 'string' },
                submission_requirements: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const targets = llmRes.targets || [];

    // Save to SubmissionTarget entity
    const records = targets.map(t => ({
      site_name: t.site_name,
      url: t.url,
      category: t.category || 'directory',
      submission_type: t.submission_type || 'manual_form',
      api_endpoint: t.api_endpoint || '',
      api_docs_url: t.api_docs_url || '',
      requires_api_key: t.requires_api_key || false,
      requires_verification: t.requires_verification || false,
      is_free: t.is_free !== false,
      domain_authority: t.domain_authority || 0,
      estimated_seo_value: t.estimated_seo_value || 'medium',
      submission_requirements: t.submission_requirements || '',
      description: t.description || '',
      submission_status: 'identified',
    }));

    let created = [];
    if (records.length > 0) {
      created = await base44.asServiceRole.entities.SubmissionTarget.bulkCreate(records);
    }

    // Record receipt
    await base44.asServiceRole.entities.Receipt.create({
      action: 'scan_submission_targets',
      status: 'success',
      details: `Scanned ${niche}: found ${created.length} submission targets`,
      proof_level: '1',
    });

    return Response.json({
      status: 'success',
      niche,
      found: targets.length,
      created: created.length,
      targets: created.slice(0, 20).map(t => ({ id: t.id, site_name: t.site_name, url: t.url, category: t.category })),
    });
  } catch (error) {
    console.error('ScanSubmissionTargets error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}