import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// MultiPlatformSocialSync — generates optimized social media content for
// Facebook, Instagram, TikTok, and YouTube based on managed URL content.
// Uses LLM to create platform-specific posts with hashtags and CTAs.
// Note: Direct posting requires social platform API access. This function
// generates the content; deployment can be done via CloudBrowser.
//
// Invoke: base44.functions.invoke('MultiPlatformSocialSync', { url?, limit? })
// Returns: { ok, posts_generated, platforms: { facebook, instagram, tiktok, youtube } }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const now = new Date().toISOString();
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 5;

    // ── LOAD TARGETS ──
    let targets;
    if (body.url) {
      targets = await svc.entities.UrlInventory.filter({ url: body.url }, '-priority', 1).catch(() => []);
    } else {
      targets = await svc.entities.UrlInventory.filter({ page_type: 'blog_resource' }, '-priority', limit).catch(() => []);
      if (targets.length === 0) targets = await svc.entities.UrlInventory.list('-priority', limit).catch(() => []);
    }

    if (targets.length === 0) {
      return Response.json({ ok: true, posts_generated: 0, message: 'No URLs to promote' });
    }

    console.log(`[MultiPlatformSocialSync] Generating social content for ${targets.length} URLs`);

    let postsGenerated = 0;
    const platformCounts = { facebook: 0, instagram: 0, tiktok: 0, youtube: 0 };

    for (const target of targets) {
      const url = target.url;
      const query = target.top_query || '';
      const industry = target.industry || 'General';

      // ── GENERATE MULTI-PLATFORM CONTENT ──
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Create social media posts for this URL across 4 platforms. Each post should drive traffic to the URL and be optimized for that platform's algorithm.

URL: ${url}
Topic: ${query}
Industry: ${industry}

Create:
1. Facebook post (max 500 chars, engaging, with link)
2. Instagram caption (max 2200 chars, 15-20 hashtags, visual description)
3. TikTok script (15-30 sec, trending format, hook + value + CTA)
4. YouTube description (max 5000 chars, SEO-optimized, timestamps)

Return as JSON: {
  "facebook": { "content": "...", "hashtags": ["..."] },
  "instagram": { "caption": "...", "hashtags": ["..."] },
  "tiktok": { "script": "...", "hashtags": ["..."] },
  "youtube": { "title": "...", "description": "...", "tags": ["..."] }
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            facebook: { type: 'object', properties: { content: { type: 'string' }, hashtags: { type: 'array', items: { type: 'string' } } } },
            instagram: { type: 'object', properties: { caption: { type: 'string' }, hashtags: { type: 'array', items: { type: 'string' } } } },
            tiktok: { type: 'object', properties: { script: { type: 'string' }, hashtags: { type: 'array', items: { type: 'string' } } } },
            youtube: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } } },
          },
        },
      });

      const content = res.data || res;

      // ── STORE AS SUGGESTIONS ──
      for (const [platform, data] of Object.entries(content)) {
        if (!data) continue;
        const text = data.content || data.caption || data.script || data.description || '';
        if (!text) continue;

        await svc.entities.Suggestion.create({
          url, kind: 'enhancement', surface: 'strategy',
          title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} post for ${query}`,
          rationale: `Social signals from ${platform} contribute to brand authority and referral traffic. Regular posting improves search visibility.`,
          treatment: text.slice(0, 4000),
          gap_type: 'AUTHORITY',
          evidence_tier: 'T3_OBSERVATIONAL',
          evidence_anchor: 'Social signals correlate with search rankings via brand authority',
          priority_score: 55,
          status: 'new',
          provenance: 'MODELED',
          created_at: now,
        });

        postsGenerated++;
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      }
    }

    // ── LOG ──
    await svc.entities.RunTelemetry.create({
      run_type: 'social_sync', subsystem: 'ecosystem', status: 'ok',
      started_at: now, records_written: postsGenerated,
      message: `MultiPlatformSocialSync: ${postsGenerated} posts generated across 4 platforms`,
    });
    await svc.entities.Receipt.create({
      kind: 'validation', summary: `MultiPlatformSocialSync: ${postsGenerated} social posts generated`,
      detail: JSON.stringify({ urls: targets.length, posts: postsGenerated, platforms: platformCounts }).slice(0, 4000),
      source: 'social_sync', provenance: 'MODELED', occurred_at: now,
    });

    return Response.json({ ok: true, posts_generated: postsGenerated, platforms: platformCounts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}