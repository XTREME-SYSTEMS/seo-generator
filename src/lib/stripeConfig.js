// Stripe product/price IDs for Xtreme SEO Optimizer
// Created via Stripe API — do not change these IDs

export const STRIPE_PRICES = {
  starter: 'price_1UDBxyCX3kMA1WDRw3U1Z0sW',
  professional: 'price_1UDBxyCX3kMA1WDRcfVXLJ6x',
  elite: 'price_1UDBxzCX3kMA1WDRFclC6Crw',
  enterprise: 'price_1UDBxzCX3kMA1WDR4kz56LxF',
};

export const STRIPE_UPGRADE_PRICES = {
  competitor_intelligence: 'price_1UDBy0CX3kMA1WDRuL1WDVpq',
  ai_search_visibility: 'price_1UDBy0CX3kMA1WDRFunvSa9I',
  content_generator_pro: 'price_1UDBy1CX3kMA1WDRkabYvsya',
  backlink_tracker: 'price_1UDBy1CX3kMA1WDRugySfyg5',
  core_web_vitals: 'price_1UDBy2CX3kMA1WDRtpW9tARk',
  vision_cortex_link: 'price_1UDBy2CX3kMA1WDRmqI7yjYE',
};

export const PLAN_FEATURES = {
  starter: {
    name: 'Starter',
    price: 299,
    url_limit: 5,
    features: [
      '5 URLs under autonomous optimization',
      'Daily Google ranking tracking',
      'Basic SEO audit & technical fixes',
      'AI content generation (meta tags, schema)',
      'Google Search Console integration',
      'Weekly performance digest',
      'Email support',
    ],
  },
  professional: {
    name: 'Professional',
    price: 799,
    url_limit: 25,
    features: [
      '25 URLs under autonomous optimization',
      'Full SEO + AEO + AI search optimization',
      'Competitor intelligence scraping & discovery',
      'Agent builder system',
      'AI copilot assistant',
      'Daily ranking progress dashboard',
      'Content generator (pages, FAQs, blogs)',
      'Backlink tracking & outreach',
      'Core Web Vitals monitoring',
      'Priority email support',
    ],
  },
  elite: {
    name: 'Elite',
    price: 1999,
    url_limit: 100,
    features: [
      '100 URLs under autonomous optimization',
      'Full autonomous system (SEO + AEO + SERP + AI search)',
      'AI copilot with web scraping & system control',
      'Custom agent builder with persistent agents',
      'Vision Cortex brain integration',
      'Competitor intelligence with counter-strategy',
      'Multi-platform social sync',
      'Google Business Profile sync',
      'Anomaly detection & auto-healing',
      'Predictive ranking model',
      'Dedicated support channel',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 4999,
    url_limit: 9999,
    features: [
      'Unlimited URLs',
      'Dedicated AI agent council (8 agents)',
      'Full API access with API key generator',
      'Vision Cortex full sync & control',
      'Custom agent development',
      'White-label dashboard option',
      'Dedicated infrastructure',
      'SLA guarantee',
      'Phone + priority support',
      'Custom integrations',
    ],
  },
};

export const UPGRADE_FEATURES = {
  competitor_intelligence: { name: 'Competitor Intelligence Pack', price: 199 },
  ai_search_visibility: { name: 'AI Search Visibility (AEO)', price: 149 },
  content_generator_pro: { name: 'Content Generator Pro', price: 99 },
  backlink_tracker: { name: 'Backlink Tracker', price: 79 },
  core_web_vitals: { name: 'Core Web Vitals Monitor', price: 49 },
  vision_cortex_link: { name: 'Vision Cortex Brain Link', price: 299 },
};