import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// GenerateNearMeCandidates — exhaustively generates {service}nearme.com, {service}near.com,
// and {service}nearyou.com domain candidates from the NAICS industry universe.
// Uses InvokeLLM with web context to expand every NAICS subindustry into all possible
// service/product prefixes.
// Invoke: base44.functions.invoke('GenerateNearMeCandidates', { sectors?: string[] })

const NAICS_SECTORS = [
  { code: '23', sector: 'Construction', subs: ['roofing', 'hvac', 'plumbing', 'electrical', 'concrete polishing', 'epoxy flooring', 'flooring', 'fencing', 'deck building', 'siding', 'window replacement', 'door installation', 'insulation', 'waterproofing', 'mold remediation', 'fire damage restoration', 'water damage restoration', 'foundation repair', 'garage door repair', 'gutter installation', 'paving', 'landscaping', 'tree service', 'solar installation', 'drywall', 'painting', 'roof cleaning'] },
  { code: '56', sector: 'Admin & Waste', subs: ['pest control', 'junk removal', 'waste management', 'cleaning service', 'carpet cleaning', 'air duct cleaning', 'chimney sweep', 'gutter cleaning', 'pressure washing', 'window cleaning', 'crime scene cleanup'] },
  { code: '48-49', sector: 'Transportation', subs: ['towing', 'auto repair', 'auto detailing', 'truck repair', 'moving company', 'delivery service', 'limo service', 'taxi', 'airport shuttle'] },
  { code: '62', sector: 'Health Care', subs: ['emergency dentist', 'emergency vet', 'chiropractor', 'physical therapy', 'urgent care', 'optometrist', 'audiologist', 'podiatrist', 'dermatologist', 'pediatrician'] },
  { code: '81', sector: 'Other Services', subs: ['locksmith', 'hair salon', 'nail salon', 'massage therapy', 'spa', 'tattoo', 'barber', 'pet grooming', 'dog walking', 'tutoring', 'music lessons', 'dry cleaning', 'tailor', 'shoe repair'] },
  { code: '53', sector: 'Real Estate', subs: ['property management', 'home inspection', 'appraisal', 'real estate agent', 'mortgage broker', 'property appraiser'] },
  { code: '54', sector: 'Professional', subs: ['lawyer', 'accountant', 'tax preparer', 'marketing agency', 'web design', 'photographer', 'videographer', 'notary', 'consulting'] },
  { code: '72', sector: 'Accommodation & Food', subs: ['catering', 'event planning', 'restaurant', 'hotel', 'bakery', 'food truck', 'wedding planner'] },
  { code: '51', sector: 'Information', subs: ['it support', 'computer repair', 'data recovery', 'network installation', 'cybersecurity'] },
  { code: '52', sector: 'Finance & Insurance', subs: ['insurance agent', 'financial advisor', 'tax preparation', 'bookkeeping', 'loan officer'] },
  { code: '44-45', sector: 'Retail', subs: ['furniture store', 'mattress store', 'appliance repair', 'electronics repair', 'florist', 'gift shop'] },
  { code: '71', sector: 'Arts & Entertainment', subs: ['event venue', 'wedding photographer', 'dj service', 'band', 'entertainer', 'photo booth'] },
];

const PATTERNS = [
  { suffix: 'nearme.com', type: 'nearme' },
  { suffix: 'nearyou.com', type: 'nearyou' },
  { suffix: 'near.com', type: 'near' },
];

function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '');
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const sectorFilter = body.sectors;

    const sectors = sectorFilter && sectorFilter.length
      ? NAICS_SECTORS.filter(s => sectorFilter.includes(s.code))
      : NAICS_SECTORS;

    const expanded = [];
    for (const sector of sectors) {
      const llmRes = await svc.integrations.Core.InvokeLLM({
        model: 'gemini_3_1_pro',
        add_context_from_internet: true,
        prompt: `You are a domain investment analyst. For the NAICS sector "${sector.sector}" (${sector.code}), expand these seed subindustries into EVERY possible specific service or product that consumers search for with "near me" intent:

Seeds: ${sector.subs.join(', ')}

For each service/product, provide:
1. prefix — the slug to put in front of "nearme.com" (e.g. "plumber", "roofing", "emergencydentist"). Use the singular/most-searched form. No spaces, no hyphens, lowercase.
2. service_name — the human-readable service name (e.g. "Plumber", "Roofing Contractor")
3. search_volume — estimated US monthly search volume for "{prefix} near me" (number)
4. cpc — estimated cost per click in USD (number)
5. commercial_intent — "low" | "medium" | "high" | "critical"

Generate 15-30 service/product prefixes per sector. Include variations like:
- Emergency versions (emergency{service})
- Quote/estimate versions ({service}quote, {service}estimate)
- Pro/contractor versions ({service}pro, {service}contractor)
- Specific sub-services (e.g. for roofing: roofrepair, roofreplacement, roofleak, roofinspection)

Return JSON: { "services": [ { prefix, service_name, search_volume, cpc, commercial_intent } ] }`,
        response_json_schema: {
          type: 'object',
          properties: {
            services: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  prefix: { type: 'string' },
                  service_name: { type: 'string' },
                  search_volume: { type: 'number' },
                  cpc: { type: 'number' },
                  commercial_intent: { type: 'string' }
                }
              }
            }
          }
        }
      });

      const services = (llmRes && Array.isArray(llmRes.services)) ? llmRes.services : [];
      for (const svcItem of services) {
        const prefix = slugify(svcItem.prefix);
        if (!prefix || prefix.length < 3) continue;
        expanded.push({
          prefix,
          service_name: svcItem.service_name || prefix,
          naics_sector: sector.sector,
          naics_code: sector.code,
          search_volume: svcItem.search_volume || 0,
          cpc: svcItem.cpc || 0,
          commercial_intent: svcItem.commercial_intent || 'medium',
        });
      }
    }

    const candidates = [];
    const seen = new Set();
    for (const e of expanded) {
      for (const pat of PATTERNS) {
        const domain = `${e.prefix}${pat.suffix}`.replace(/\s/g, '');
        if (seen.has(domain)) continue;
        seen.add(domain);
        candidates.push({
          domain,
          niche: e.service_name,
          naics_sector: e.naics_sector,
          naics_code: e.naics_code,
          pattern_type: pat.type,
          search_volume_estimate: pat.type === 'nearme' ? e.search_volume : 0,
          cpc_estimate: e.cpc || 0,
          commercial_intent: e.commercial_intent,
          availability_status: 'unchecked',
        });
      }
    }

    const existing = await svc.entities.NearMeCandidate.list('-created_date', 500);
    const existingDomains = new Set(existing.map(c => c.domain.toLowerCase()));
    const novel = candidates.filter(c => !existingDomains.has(c.domain.toLowerCase()));

    let created = [];
    if (novel.length) {
      created = await svc.entities.NearMeCandidate.bulkCreate(novel);
    }

    await svc.entities.Receipt.create({
      summary: `NearMe candidate generation: ${created.length} domains from ${sectors.length} NAICS sectors`,
      source: 'GenerateNearMeCandidates',
      occurred_at: new Date().toISOString(),
      proof_level: 1
    });

    return Response.json({
      sectors_processed: sectors.length,
      prefixes_generated: expanded.length,
      candidates_generated: candidates.length,
      created: created.length,
      duplicates_skipped: candidates.length - novel.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}