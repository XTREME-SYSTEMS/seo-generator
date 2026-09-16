import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { cloneSite, getEngineConfig, type CloneTarget } from '../../shared/cloneEngine.ts';

// Clone Top Niches — finds the top 5 highest-rated websites in a given niche
// using LLM + web search, then clones each one via the DETERMINISTIC clone engine:
//   1. Creates a browser session (1440px desktop, captcha auto-solve)
//   2. Navigates, scrolls to trigger lazy images, captures screenshot
//   3. Extracts full rendered HTML
//   4. Re-hosts ALL assets (images, CSS, fonts) to our public storage
//   5. Inlines all external CSS into the HTML
//   6. Strips heavy Next.js data blobs
//   7. Injects a form handler (forms post to our CaptureLead)
//   8. Stores a self-contained ClonedTemplate with deterministic parity score
//
// Invoke: base44.functions.invoke('CloneTopNiches', { niche: 'plumbing' })
//   or:  base44.functions.invoke('CloneTopNiches', { niches: ['plumbing','roofing'] })

const DEFAULT_NICHES = [
  'plumbing', 'water damage restoration', 'locksmith', 'towing', 'roofing',
  'HVAC', 'electrical', 'pest control', 'tree service', 'junk removal',
  'concrete polishing', 'epoxy flooring', 'garage door repair', 'fence installation',
  'landscaping', 'solar installation', 'waterproofing', 'mold remediation',
  'emergency dentist', 'emergency vet', 'emergency plumber', 'fire damage restoration',
  'carpet cleaning', 'air duct cleaning', 'chimney sweep', 'gutter cleaning',
  'window replacement', 'siding contractor', 'deck builder', 'paver installation',
];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { niche, niches, limit = 5 } = body;

    const nichesToProcess = niches || (niche ? [niche] : []);
    if (nichesToProcess.length === 0) {
      return Response.json({ error: 'Provide niche or niches parameter' }, { status: 400 });
    }

    const { engineUrl, apiKey } = getEngineConfig();
    if (!engineUrl || !apiKey) {
      return Response.json({ error: 'CloudBrowser engine not configured — set CLOUDBROWSER_ENGINE_URL and ENGINE_API_KEY' }, { status: 500 });
    }

    const sitesPerNiche = Math.min(limit, 5);
    const allResults = [];

    for (const currentNiche of nichesToProcess) {
      console.log(`[CloneTopNiches] Processing niche: ${currentNiche}`);

      // 1. Find top 5 highest-rated websites for this niche
      let topSites: any[] = [];
      try {
        topSites = await findTopSites(base44, currentNiche, sitesPerNiche);
        console.log(`[CloneTopNiches] Found ${topSites.length} sites for ${currentNiche}`);
      } catch (err) {
        console.error(`[CloneTopNiches] Failed to find sites for ${currentNiche}: ${err.message}`);
        allResults.push({ niche: currentNiche, status: 'failed', error: 'Site discovery failed: ' + err.message });
        continue;
      }

      // 2. Clone each site deterministically
      for (let i = 0; i < topSites.length; i++) {
        const site = topSites[i];
        const rank = i + 1;
        try {
          const clone = await cloneSite(base44, engineUrl, apiKey, {
            niche: currentNiche,
            site: {
              url: site.url,
              name: site.name || site.url,
              rating: site.rating || '',
              rank,
              strengths: site.strengths || [],
              weaknesses: site.weaknesses || [],
            } as CloneTarget,
            rank,
          });
          allResults.push(clone);
        } catch (err) {
          console.error(`[CloneTopNiches] Clone failed for ${site.url}: ${err.message}`);
          try {
            await base44.asServiceRole.entities.ClonedTemplate.create({
              niche: currentNiche,
              source_url: site.url,
              site_name: site.name || site.url,
              rating: site.rating || '',
              rank,
              status: 'failed',
              clone_error: err.message.slice(0, 500),
              strengths: site.strengths || [],
              weaknesses: site.weaknesses || [],
              cloned_at: new Date().toISOString(),
            });
          } catch {}
          allResults.push({ niche: currentNiche, url: site.url, site_name: site.name, status: 'failed', error: err.message });
        }
      }
    }

    const succeeded = allResults.filter(r => r.status === 'cloned').length;
    const failed = allResults.filter(r => r.status === 'failed').length;

    await base44.asServiceRole.entities.Receipt.create({
      kind: 'clone_top_niches',
      summary: `Cloned ${succeeded} sites across ${nichesToProcess.length} niche(s) (${failed} failed)`,
      detail: allResults.map(r => `${r.niche}/${r.site_name || r.url}: ${r.status} (${r.visual_parity_score || 0}%, ${r.assets_rehosted || 0} assets)`).join('; '),
      source: 'CloneTopNiches',
      provenance: 'MEASURED',
      occurred_at: new Date().toISOString(),
    });

    return Response.json({
      ok: true,
      niches_processed: nichesToProcess.length,
      total_sites: allResults.length,
      succeeded,
      failed,
      results: allResults,
    });
  } catch (error) {
    console.error('[CloneTopNiches] Fatal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ── Find top N highest-rated websites for a niche via LLM + web search ──
async function findTopSites(base44: any, niche: string, limit: number) {
  const prompt = `Research the top ${limit} highest-rated, most popular websites for "${niche}" services in the United States.
Focus on actual service provider websites (not directories like Yelp, Angi, HomeAdvisor, or Google Maps listings).
For each site provide:
1. name: the company/website name
2. url: the full URL including https://
3. rating: their reputation/rating if known (e.g. "4.8/5" or "Highly rated")
4. strengths: array of 3-5 design/content strengths
5. weaknesses: array of 2-4 weaknesses or gaps
6. value_proposition: their main value proposition in one sentence

Return exactly ${limit} sites, ranked from highest rated to lowest.`;

  const res = await base44.integrations.Core.InvokeLLM({
    prompt,
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
              rating: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              value_proposition: { type: 'string' },
            },
          },
        },
      },
    },
  });

  return (res.sites || [])
    .filter((s: any) => s.url && s.url.startsWith('http'))
    .slice(0, limit)
    .map((s: any) => ({
      name: s.name || s.url,
      url: s.url,
      rating: s.rating || '',
      strengths: s.strengths || [],
      weaknesses: s.weaknesses || [],
      value_proposition: s.value_proposition || '',
    }));
}