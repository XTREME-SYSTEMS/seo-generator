// Domain registry for programmatic SEO lead-gen sites
// ADD A NEW LEAD-GEN SITE = add an entry here + point DNS to Base44
// Each domain shares the same 450 city routes but gets unique branding, services, and FAQs
// The same codebase serves all domains — zero new code per domain

export const LEAD_GEN_DOMAINS = {
  'leadgennearyou.com': {
    brandName: 'Lead Gen',
    brandAccent: 'Near You',
    tagline: 'Get Free Quotes from Local Pros Near You',
    subtitle: 'Connect with top-rated, verified local service providers across the US. Get up to 3 free quotes — no obligation, fast response.',
    heroBadge: '450+ Cities Covered',
    leadValue: 35,
    services: [
      { name: 'Home Improvement', slug: 'home-improvement', desc: 'Roofing, siding, windows, doors, painting' },
      { name: 'Flooring & Epoxy', slug: 'flooring-epoxy', desc: 'Epoxy garage floors, concrete polishing, tile' },
      { name: 'HVAC', slug: 'hvac', desc: 'AC, heating, ventilation installation & repair' },
      { name: 'Plumbing', slug: 'plumbing', desc: 'Repairs, installations, water heaters' },
      { name: 'Electrical', slug: 'electrical', desc: 'Wiring, panel upgrades, lighting' },
      { name: 'Roofing', slug: 'roofing', desc: 'Roof repair, replacement, inspection' },
      { name: 'Landscaping', slug: 'landscaping', desc: 'Lawn care, hardscaping, tree services' },
      { name: 'Pest Control', slug: 'pest-control', desc: 'Termite, rodent, insect extermination' },
      { name: 'Solar', slug: 'solar', desc: 'Solar panel installation, battery storage' },
      { name: 'Concrete & Masonry', slug: 'concrete-masonry', desc: 'Driveways, patios, foundations' },
    ],
    generateFaqs: (city) => [
      { q: `How do I find local service providers in ${city.cityName}, ${city.stateCode}?`, a: `Lead Gen Near You connects you with verified, top-rated local service providers in ${city.cityName}, ${city.stateName}. Fill out our quick form and we'll match you with up to 3 qualified professionals — free, no obligation.` },
      { q: `Is the lead generation service free for homeowners in ${city.cityName}?`, a: `Yes. Our service is 100% free for homeowners in ${city.cityName}, ${city.stateCode}. We're paid by the service providers, so you never pay a dime. Get free quotes with zero commitment.` },
      { q: `How quickly will I get quotes from ${city.cityName} contractors?`, a: `Most ${city.cityName} residents receive their first quote within 24 hours. Our network of local providers responds fast, and you can compare up to 3 quotes side-by-side.` },
      { q: `What services can I find leads for in ${city.cityName}?`, a: `We connect ${city.cityName} residents with providers for home improvement, flooring, HVAC, plumbing, electrical, landscaping, pest control, solar, roofing, and more.` },
      { q: `Are the ${city.cityName} service providers licensed and insured?`, a: `Yes. Every provider in our ${city.cityName} network is verified, licensed where required by ${city.stateName} law, and carries insurance. We vet each contractor before they join.` },
    ],
    metaDescription: (city) => `Find top-rated local service providers in ${city.cityName}, ${city.stateName}. Get free instant quotes, compare pros, and connect with leads near you. No obligation, fast response.`,
    pageTitle: (city) => `Lead Gen Near Me ${city.cityName}, ${city.stateCode} | Free Local Lead Quotes`,
  },

  'lawyersnearme.com': {
    brandName: 'Lawyers',
    brandAccent: 'Near Me',
    tagline: 'Find Top-Rated Attorneys Near You',
    subtitle: 'Connect with experienced, verified local lawyers for any legal matter. Free case evaluations, no obligation.',
    heroBadge: 'Free Case Evaluations',
    leadValue: 150,
    services: [
      { name: 'Personal Injury', slug: 'personal-injury', desc: 'Auto accidents, slip & fall, wrongful death' },
      { name: 'Family Law', slug: 'family-law', desc: 'Divorce, custody, child support, adoption' },
      { name: 'Criminal Defense', slug: 'criminal-defense', desc: 'DUI, drug charges, assault, theft' },
      { name: 'Bankruptcy', slug: 'bankruptcy', desc: 'Chapter 7, Chapter 13, debt relief' },
      { name: 'Estate Planning', slug: 'estate-planning', desc: 'Wills, trusts, probate, power of attorney' },
      { name: 'Immigration', slug: 'immigration', desc: 'Visas, green cards, citizenship, deportation' },
      { name: 'Employment Law', slug: 'employment-law', desc: 'Wrongful termination, discrimination, wages' },
      { name: 'Real Estate Law', slug: 'real-estate-law', desc: 'Property disputes, contracts, closings' },
      { name: 'Business Law', slug: 'business-law', desc: 'Formation, contracts, litigation, IP' },
      { name: 'Social Security Disability', slug: 'ssd', desc: 'SSDI, SSI claims, appeals' },
    ],
    generateFaqs: (city) => [
      { q: `How do I find a good lawyer in ${city.cityName}, ${city.stateCode}?`, a: `Lawyers Near Me connects you with experienced, verified attorneys in ${city.cityName}, ${city.stateName}. Fill out our free case evaluation form and we'll match you with up to 3 qualified lawyers who handle your type of case.` },
      { q: `Is the attorney consultation free in ${city.cityName}?`, a: `Yes. Our service is 100% free for clients in ${city.cityName}, ${city.stateCode}. The initial case evaluation is free, and many attorneys work on contingency — you pay nothing unless you win your case.` },
      { q: `How quickly will a ${city.cityName} lawyer contact me?`, a: `Most ${city.cityName} residents receive a call from an attorney within 24 hours of submitting the form. Our network of local lawyers responds fast, especially for time-sensitive cases.` },
      { q: `What types of legal cases can I find a lawyer for in ${city.cityName}?`, a: `We connect ${city.cityName} residents with attorneys for personal injury, family law, criminal defense, bankruptcy, estate planning, immigration, employment law, real estate, business law, and Social Security disability.` },
      { q: `Are the ${city.cityName} attorneys licensed and in good standing?`, a: `Yes. Every attorney in our ${city.cityName} network is licensed to practice in ${city.stateName}, in good standing with the state bar, and verified by our team before they join.` },
    ],
    metaDescription: (city) => `Find top-rated attorneys in ${city.cityName}, ${city.stateName}. Get free case evaluations from experienced local lawyers. Personal injury, family law, criminal defense, and more.`,
    pageTitle: (city) => `Lawyers Near Me ${city.cityName}, ${city.stateCode} | Free Attorney Case Evaluations`,
  },

  'insurancequotesnearme.com': {
    brandName: 'Insurance Quotes',
    brandAccent: 'Near Me',
    tagline: 'Compare Insurance Quotes Near You',
    subtitle: 'Get free, instant insurance quotes from top-rated local agents. Compare rates, save money, no obligation.',
    heroBadge: 'Save Up to 40%',
    leadValue: 50,
    services: [
      { name: 'Auto Insurance', slug: 'auto-insurance', desc: 'Car, truck, motorcycle, RV coverage' },
      { name: 'Home Insurance', slug: 'home-insurance', desc: 'Homeowners, renters, condo coverage' },
      { name: 'Life Insurance', slug: 'life-insurance', desc: 'Term, whole, universal life policies' },
      { name: 'Health Insurance', slug: 'health-insurance', desc: 'Individual, family, ACA marketplace plans' },
      { name: 'Business Insurance', slug: 'business-insurance', desc: 'General liability, workers comp, BOP' },
      { name: 'Motorcycle Insurance', slug: 'motorcycle-insurance', desc: 'Street, cruiser, sport bike coverage' },
      { name: 'Boat Insurance', slug: 'boat-insurance', desc: 'Boats, yachts, jet skis, watercraft' },
      { name: 'Flood Insurance', slug: 'flood-insurance', desc: 'FEMA, private flood coverage' },
      { name: 'Medicare', slug: 'medicare', desc: 'Medicare Advantage, supplement, Part D' },
      { name: 'Pet Insurance', slug: 'pet-insurance', desc: 'Dogs, cats, exotic pet coverage' },
    ],
    generateFaqs: (city) => [
      { q: `How do I get insurance quotes in ${city.cityName}, ${city.stateCode}?`, a: `Insurance Quotes Near Me connects you with top-rated local insurance agents in ${city.cityName}, ${city.stateName}. Fill out our quick form and get up to 3 free quotes — compare rates and save.` },
      { q: `Is the insurance quote service free in ${city.cityName}?`, a: `Yes. Getting quotes is 100% free for ${city.cityName} residents. You compare rates from multiple insurers with zero obligation. You only pay if you choose to buy a policy.` },
      { q: `How much can I save on insurance in ${city.cityName}?`, a: `${city.cityName} residents who compare quotes typically save up to 40% on their insurance premiums. Rates vary by insurer, so comparing multiple quotes is the best way to find the lowest price.` },
      { q: `What types of insurance can I get quotes for in ${city.cityName}?`, a: `We connect ${city.cityName} residents with agents for auto, home, life, health, business, motorcycle, boat, flood, Medicare, and pet insurance — plus many more.` },
      { q: `Are the ${city.cityName} insurance agents licensed?`, a: `Yes. Every insurance agent in our ${city.cityName} network is licensed to sell insurance in ${city.stateName} and verified by our team before they join.` },
    ],
    metaDescription: (city) => `Compare insurance quotes in ${city.cityName}, ${city.stateName}. Get free instant quotes from top-rated local agents. Auto, home, life, health, and more. Save up to 40%.`,
    pageTitle: (city) => `Insurance Quotes Near Me ${city.cityName}, ${city.stateCode} | Compare & Save Up to 40%`,
  },

  'moversnearme.com': {
    brandName: 'Movers',
    brandAccent: 'Near Me',
    tagline: 'Find Top-Rated Movers Near You',
    subtitle: 'Get free moving quotes from verified, licensed local moving companies. Compare rates, no obligation.',
    heroBadge: 'Licensed & Insured Movers',
    leadValue: 45,
    services: [
      { name: 'Local Moving', slug: 'local-moving', desc: 'Same-city, apartment, home moves' },
      { name: 'Long Distance Moving', slug: 'long-distance-moving', desc: 'State-to-state, cross-country moves' },
      { name: 'Commercial Moving', slug: 'commercial-moving', desc: 'Office, business, equipment relocation' },
      { name: 'Packing Services', slug: 'packing-services', desc: 'Full packing, partial packing, supplies' },
      { name: 'Storage', slug: 'storage', desc: 'Short-term, long-term, climate-controlled' },
      { name: 'Piano Moving', slug: 'piano-moving', desc: 'Upright, grand, baby grand pianos' },
      { name: 'Appliance Moving', slug: 'appliance-moving', desc: 'Refrigerators, washers, dryers, safes' },
      { name: 'Furniture Moving', slug: 'furniture-moving', desc: 'Single items, large furniture, assembly' },
      { name: 'Senior Moving', slug: 'senior-moving', desc: 'Downsizing, retirement, assisted living' },
      { name: 'Junk Removal', slug: 'junk-removal', desc: 'Furniture, appliances, debris haul-away' },
    ],
    generateFaqs: (city) => [
      { q: `How do I find reliable movers in ${city.cityName}, ${city.stateCode}?`, a: `Movers Near Me connects you with verified, licensed moving companies in ${city.cityName}, ${city.stateName}. Fill out our form and get up to 3 free moving quotes — compare rates and choose the best mover.` },
      { q: `Is the moving quote service free in ${city.cityName}?`, a: `Yes. Getting moving quotes is 100% free for ${city.cityName} residents. You compare rates from multiple moving companies with zero obligation. You only pay if you hire a mover.` },
      { q: `How quickly will I get moving quotes in ${city.cityName}?`, a: `Most ${city.cityName} residents receive their first moving quote within 24 hours. Our network of local movers responds fast, especially for upcoming move dates.` },
      { q: `What types of moving services can I find in ${city.cityName}?`, a: `We connect ${city.cityName} residents with movers for local, long distance, commercial, packing, storage, piano, appliance, furniture, senior moving, and junk removal.` },
      { q: `Are the ${city.cityName} movers licensed and insured?`, a: `Yes. Every moving company in our ${city.cityName} network is licensed, insured, and verified by our team before they join. We check USDOT numbers and insurance coverage.` },
    ],
    metaDescription: (city) => `Find top-rated movers in ${city.cityName}, ${city.stateName}. Get free moving quotes from licensed, insured local moving companies. Compare rates, no obligation.`,
    pageTitle: (city) => `Movers Near Me ${city.cityName}, ${city.stateCode} | Free Moving Quotes from Local Movers`,
  },
};

// Domain aliases (www. + alternate spellings)
const DOMAIN_ALIASES = {
  'www.leadgennearyou.com': 'leadgennearyou.com',
  'leadgennearme.com': 'leadgennearyou.com',
  'www.leadgennearme.com': 'leadgennearyou.com',
  'www.lawyersnearme.com': 'lawyersnearme.com',
  'www.insurancequotesnearme.com': 'insurancequotesnearme.com',
  'www.moversnearme.com': 'moversnearme.com',
};

export function getDomainConfig(hostname) {
  const cleanHost = (hostname || '').replace(/^www\./, '');
  const resolved = DOMAIN_ALIASES[cleanHost] || cleanHost;
  return LEAD_GEN_DOMAINS[resolved] || null;
}

export function isLeadGenDomain(hostname) {
  return getDomainConfig(hostname) !== null;
}

export function getAllLeadGenDomains() {
  return Object.entries(LEAD_GEN_DOMAINS).map(([domain, config]) => ({
    domain,
    brandName: config.brandName,
    brandAccent: config.brandAccent,
    leadValue: config.leadValue,
    servicesCount: config.services.length,
  }));
}