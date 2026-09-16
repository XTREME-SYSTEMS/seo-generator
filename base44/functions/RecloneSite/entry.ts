import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { cloneSite, getEngineConfig, type CloneTarget } from '../../shared/cloneEngine.ts';

// RecloneSite — re-clones a single specific website by URL.
// Takes either a template_id (to look up the existing record) or direct
// niche + url + site_name + rank parameters.
// Optionally deletes the old template record after a successful re-clone.
//
// Invoke: base44.functions.invoke('RecloneSite', { template_id: 'abc123' })
//   or:  base44.functions.invoke('RecloneSite', { niche: 'plumbing', url: 'https://...', site_name: '...', rank: 1 })

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { template_id, niche, url, site_name, rank, replace_old } = body;

    // Resolve the target site to clone
    let target: CloneTarget;
    let oldTemplateId: string | null = null;

    if (template_id) {
      // Look up the existing ClonedTemplate record
      const existing = await base44.asServiceRole.entities.ClonedTemplate.get(template_id);
      if (!existing) return Response.json({ error: 'Template not found' }, { status: 404 });
      target = {
        niche: existing.niche,
        url: existing.source_url,
        name: existing.site_name || existing.source_url,
        rating: existing.rating || '',
        rank: existing.rank || 0,
        strengths: existing.strengths || [],
        weaknesses: existing.weaknesses || [],
      };
      oldTemplateId = template_id;
    } else if (niche && url) {
      target = {
        niche,
        url,
        name: site_name || url,
        rank: rank || 0,
      };
    } else {
      return Response.json({ error: 'Provide template_id or (niche + url)' }, { status: 400 });
    }

    const { engineUrl, apiKey } = getEngineConfig();
    if (!engineUrl || !apiKey) {
      return Response.json({ error: 'CloudBrowser engine not configured' }, { status: 500 });
    }

    console.log(`[RecloneSite] Re-cloning ${target.url} (${target.niche})`);

    // Clone the single site
    const result = await cloneSite(base44, engineUrl, apiKey, {
      niche: target.niche,
      site: target,
      rank: target.rank || 1,
    });

    // Optionally delete the old template record
    if (replace_old !== false && oldTemplateId) {
      try {
        await base44.asServiceRole.entities.ClonedTemplate.delete(oldTemplateId);
        console.log(`[RecloneSite] Deleted old template ${oldTemplateId}`);
      } catch (e) {
        console.error(`[RecloneSite] Failed to delete old template: ${e.message}`);
      }
    }

    await base44.asServiceRole.entities.Receipt.create({
      kind: 'reclone_site',
      summary: `Re-cloned ${target.name} (${result.visual_parity_score}% parity)`,
      detail: `URL: ${target.url} | Niche: ${target.niche} | New template: ${result.template_id}`,
      source: 'RecloneSite',
      provenance: 'MEASURED',
      occurred_at: new Date().toISOString(),
    });

    return Response.json({
      ok: true,
      ...result,
      old_template_deleted: replace_old !== false && !!oldTemplateId,
    });
  } catch (error) {
    console.error('[RecloneSite] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}