// Industry-standard URL classification: pillar/cluster architecture, funnel stage,
// search intent, brand and sub-industry mapping for the epoxy / decorative / polished
// concrete vertical. Heuristic seeds only — operators can override any field in the workbook.

const SUB_INDUSTRY_RULES = [
  { re: /epoxy|garage.?floor|floor.?coating|metallic/i, label: 'Epoxy Coatings' },
  { re: /polish|grind|densif/i, label: 'Polished Concrete' },
  { re: /overlay|underlayment|micro.?topping|self.?level|resurfac/i, label: 'Concrete Overlayment' },
  { re: /stain|dye|stamp|decorative|acid/i, label: 'Decorative Concrete' },
  { re: /grinder|diamond|tooling|abrasive|equipment|machine|blade|pad/i, label: 'Equipment & Tooling' },
  { re: /training|class|course|academy|certif/i, label: 'Training & Education' }
];

const US_STATE = /\b(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new.?hampshire|new.?jersey|new.?mexico|new.?york|north.?carolina|north.?dakota|ohio|oklahoma|oregon|pennsylvania|rhode.?island|south.?carolina|south.?dakota|tennessee|texas|utah|vermont|virginia|washington|west.?virginia|wisconsin|wyoming)\b/i;

export function classifyUrl(url) {
  let path = '';
  try { path = new URL(url).pathname.toLowerCase(); } catch { path = String(url).toLowerCase(); }
  const segs = path.split('/').filter(Boolean);
  const p = path;

  // page_type
  let page_type = 'other';
  if (segs.length === 0) page_type = 'home';
  else if (/privacy|terms|policy|legal|accessibility|sitemap/.test(p)) page_type = 'legal';
  else if (/contact|quote|estimate|book|schedule|demo|apply|cart|checkout/.test(p)) page_type = 'conversion';
  else if (/about|team|reviews|testimonials|warranty|financing|careers/.test(p)) page_type = 'about_trust';
  else if (/faq|questions/.test(p)) page_type = 'faq';
  else if (/blog|news|article|resource|guide|how-to|learn|tips/.test(p)) page_type = 'blog_resource';
  else if (/location|store|near-me|city|xps-xpress/.test(p) || US_STATE.test(p)) page_type = 'location';
  else if (/product|shop|item|sku|collection/.test(p)) page_type = segs.length > 2 ? 'product' : 'category';
  else if (/service|installation|repair|removal|coating|polishing|flooring|epoxy|concrete/.test(p)) {
    page_type = segs.length <= 1 ? 'pillar' : 'cluster';
  } else if (segs.length === 1) page_type = 'pillar';
  else page_type = 'cluster';

  // funnel stage + intent
  let funnel_stage = 'tofu';
  let search_intent = 'informational';
  if (page_type === 'conversion') { funnel_stage = 'bofu'; search_intent = 'transactional'; }
  else if (page_type === 'location') { funnel_stage = 'bofu'; search_intent = 'local'; }
  else if (page_type === 'product' || page_type === 'category') { funnel_stage = 'bofu'; search_intent = 'transactional'; }
  else if (page_type === 'service' || page_type === 'pillar' || page_type === 'cluster') { funnel_stage = 'mofu'; search_intent = 'commercial'; }
  else if (page_type === 'about_trust') { funnel_stage = 'mofu'; search_intent = 'navigational'; }
  else if (page_type === 'home') { funnel_stage = 'mofu'; search_intent = 'navigational'; }
  else if (page_type === 'faq' || page_type === 'blog_resource') { funnel_stage = 'tofu'; search_intent = 'informational'; }

  // sub-industry
  let sub_industry = '';
  for (const rule of SUB_INDUSTRY_RULES) {
    if (rule.re.test(p)) { sub_industry = rule.label; break; }
  }

  // topic cluster = first meaningful path segment
  const topic_cluster = segs[0] ? segs[0].replace(/[-_]+/g, ' ') : 'homepage';

  return { page_type, funnel_stage, search_intent, sub_industry, topic_cluster };
}

export function classifyBrand(domain) {
  const d = String(domain || '').toLowerCase();
  if (d.includes('xtremepolishingsystems')) return 'xtreme_polishing_systems';
  if (d.includes('xpsxpress') || d.includes('xps-xpress')) return 'xps_xpress';
  if (d.includes('leadgen') || d.includes('nearme') || d.includes('near-me') || d.includes('estimate') || d.includes('quote')) return 'lead_gen';
  return 'other';
}

export function domainFromProperty(prop) {
  const s = String(prop || '');
  if (s.startsWith('sc-domain:')) return s.slice(10);
  try { return new URL(s).hostname.replace(/^www\./, ''); } catch { return s; }
}