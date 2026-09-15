import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// End-to-End Generator — the master orchestrator for the full pipeline:
// 1. URL Discovery (Google Trends + highest-search businesses/services/products)
// 2. Competitor Benchmarking (top 3 competitors, scraped + analyzed)
// 3. Financial Intelligence Report
// 4. Market Simulation (1 week → 10 years)
// 5. Digital Dominance Plan (backlinks, blogs, keywords, directories)
// 6. Brand System (logo + brand identity)
// 7. PWA Template (multi-industry, Google-guidelines-compliant)
// 8. Funnel Discovery (top 3 converting URLs + funnel optimization)
//
// Body: { niche, step?, params? }
// step: "full_pipeline" | "discover_urls" | "benchmark_competitors" | "financial_intelligence" | "market_simulation" | "digital_dominance" | "brand_system" | "pwa_template" | "funnel_discovery"

const STEPS = [
  'discover_urls', 'benchmark_competitors', 'financial_intelligence',
  'market_simulation', 'digital_dominance', 'brand_system',
  'pwa_template', 'funnel_discovery'
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { niche, step = 'full_pipeline', params = {} } = body;
    if (!niche) return Response.json({ error: 'niche is required' }, { status: 400 });

    const results = {};

    // ── STEP 1: URL Discovery ──────────────────────────────────────────
    if (step === 'full_pipeline' || step === 'discover_urls') {
      const discoveryRes = await base44.integrations.Core.InvokeLLM({
        model: 'gemini_3_1_pro',
        add_context_from_internet: true,
        prompt: `You are an expert URL discovery engine. Research the niche "${niche}" and find the highest-value URL patterns for programmatic SEO.

Focus on:
1. "nearme.com" and "nearyou.com" style URL patterns that capture high-intent local search traffic
2. Google Trends data — what are the highest-searched terms in this niche?
3. Highest-searched business types, services, and products in this niche
4. The exact URL patterns that competitors use to capture local search traffic

Return a JSON object with:
{
  "top_url_patterns": [
    {
      "url_pattern": "e.g. plumbersnearme.com or plumbingnearyou.com",
      "keyword_category": "near_you | near_me | emergency | service | local",
      "primary_keyword": "the main keyword",
      "search_volume_estimate": number,
      "cpc_estimate": number,
      "estimated_monthly_leads": number,
      "estimated_monthly_revenue": number,
      "estimated_site_value": number,
      "rationale": "why this URL pattern is strategic",
      "google_trends_insight": "what Google Trends shows about this niche",
      "top_searched_terms": ["term1", "term2", ...],
      "target_cities_count": number,
      "programmatic_pages_potential": number
    }
  ],
  "niche_summary": "overview of the niche opportunity",
  "google_trends_summary": "what's trending in this niche",
  "highest_search_services": ["service1", "service2", ...],
  "highest_search_products": ["product1", "product2", ...]
}

Find the TOP 5 highest-value URL patterns. Prioritize patterns with high search volume, high CPC, and strong commercial intent.`,
        response_json_schema: {
          type: 'object',
          properties: {
            top_url_patterns: { type: 'array', items: { type: 'object' } },
            niche_summary: { type: 'string' },
            google_trends_summary: { type: 'string' },
            highest_search_services: { type: 'array', items: { type: 'string' } },
            highest_search_products: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      // Store discovered URLs as StrategicUrl records
      const urlRecords = [];
      for (const url of discoveryRes.top_url_patterns || []) {
        const existing = await base44.asServiceRole.entities.StrategicUrl.filter({ url: url.url_pattern }, '-created_date', 1);
        if (existing.length === 0) {
          const record = await base44.asServiceRole.entities.StrategicUrl.create({
            url: url.url_pattern,
            niche,
            keyword_category: url.keyword_category || 'near_you',
            primary_keyword: url.primary_keyword || niche,
            search_volume_estimate: url.search_volume_estimate || 0,
            cpc_estimate: url.cpc_estimate || 0,
            estimated_monthly_leads: url.estimated_monthly_leads || 0,
            estimated_monthly_revenue: url.estimated_monthly_revenue || 0,
            estimated_site_value: url.estimated_site_value || 0,
            rationale: url.rationale || '',
            target_cities_count: url.target_cities_count || 450,
            programmatic_pages_potential: url.programmatic_pages_potential || 450,
            status: 'discovered'
          });
          urlRecords.push(record);
        } else {
          urlRecords.push(existing[0]);
        }
      }

      results.discover_urls = {
        url_count: urlRecords.length,
        niche_summary: discoveryRes.niche_summary,
        google_trends_summary: discoveryRes.google_trends_summary,
        highest_search_services: discoveryRes.highest_search_services,
        highest_search_products: discoveryRes.highest_search_products,
        urls: urlRecords.map(u => ({ id: u.id, url: u.url, estimated_revenue: u.estimated_monthly_revenue }))
      };
    }

    // ── STEP 2: Competitor Benchmarking ────────────────────────────────
    if (step === 'full_pipeline' || step === 'benchmark_competitors') {
      const benchRes = await base44.integrations.Core.InvokeLLM({
        model: 'gemini_3_1_pro',
        add_context_from_internet: true,
        prompt: `You are a competitor benchmarking engine. For the niche "${niche}", find the TOP 3 highest-ranking, most successful websites.

For EACH of the top 3 competitors, provide a deep analysis:
1. competitor_url — their full URL
2. competitor_name — company name
3. business_model — how they make money
4. revenue_model — specific revenue model
5. estimated_revenue — rough annual revenue if known
6. target_audience — who their customers are
7. value_proposition — their core value prop
8. design_strengths — 3-5 specific design strengths
9. key_features — 3-5 key features
10. weaknesses — 2-4 gaps we can exploit
11. keywords_ranked_for — 10-20 keywords they rank for
12. estimated_monthly_traffic — number
13. backlink_count — number
14. domain_authority — number 1-100
15. pages_indexed — number
16. site_structure — analysis of their site architecture
17. content_strategy — their content approach
18. pricing_strategy — their pricing
19. customer_reviews_summary — summary of reviews
20. social_presence — their social media presence
21. technology_stack — technologies they use
22. superiority_strategy — how we can build something 20% better

Return as JSON: { "competitors": [ {rank: 1, ...}, {rank: 2, ...}, {rank: 3, ...} ] }`,
        response_json_schema: {
          type: 'object',
          properties: {
            competitors: { type: 'array', items: { type: 'object' } }
          }
        }
      });

      const benchRecords = [];
      for (const comp of benchRes.competitors || []) {
        const record = await base44.asServiceRole.entities.CompetitorBenchmark.create({
          niche,
          competitor_url: comp.competitor_url || '',
          competitor_name: comp.competitor_name || '',
          rank: comp.rank || benchRecords.length + 1,
          business_model: comp.business_model || '',
          revenue_model: comp.revenue_model || '',
          estimated_revenue: comp.estimated_revenue || '',
          target_audience: comp.target_audience || '',
          value_proposition: comp.value_proposition || '',
          design_strengths: comp.design_strengths || [],
          key_features: comp.key_features || [],
          weaknesses: comp.weaknesses || [],
          keywords_ranked_for: comp.keywords_ranked_for || [],
          estimated_monthly_traffic: comp.estimated_monthly_traffic || 0,
          backlink_count: comp.backlink_count || 0,
          domain_authority: comp.domain_authority || 0,
          pages_indexed: comp.pages_indexed || 0,
          site_structure: comp.site_structure || '',
          content_strategy: comp.content_strategy || '',
          pricing_strategy: comp.pricing_strategy || '',
          customer_reviews_summary: comp.customer_reviews_summary || '',
          social_presence: comp.social_presence || '',
          technology_stack: comp.technology_stack || [],
          superiority_strategy: comp.superiority_strategy || '',
          scraped_content_summary: comp.content_strategy || '',
          status: 'benchmarked'
        });
        benchRecords.push(record);
      }

      results.benchmark_competitors = {
        competitor_count: benchRecords.length,
        competitors: benchRecords.map(c => ({ id: c.id, name: c.competitor_name, url: c.competitor_url, rank: c.rank, traffic: c.estimated_monthly_traffic, da: c.domain_authority }))
      };
    }

    // ── STEP 3: Financial Intelligence ─────────────────────────────────
    if (step === 'full_pipeline' || step === 'financial_intelligence') {
      const finRes = await base44.integrations.Core.InvokeLLM({
        model: 'gemini_3_1_pro',
        add_context_from_internet: true,
        prompt: `You are a financial intelligence analyst. For the niche "${niche}", generate a comprehensive financial intelligence report.

Research and provide:
1. market_size_tam — Total Addressable Market
2. market_size_sam — Serviceable Addressable Market
3. market_size_som — Serviceable Obtainable Market
4. avg_cpc — average cost per click (number)
5. avg_lead_value — average value per lead in USD (number)
6. avg_customer_ltv — average customer lifetime value (number)
7. estimated_cac — customer acquisition cost (number)
8. gross_margin_pct — expected gross margin % (number)
9. monthly_search_volume — total monthly searches (number)
10. estimated_monthly_leads — leads we can capture (number)
11. estimated_monthly_revenue — projected monthly revenue (number)
12. estimated_monthly_cost — projected monthly cost (number)
13. estimated_monthly_profit — projected monthly profit (number)
14. break_even_months — months to break even (number)
15. roi_percentage — expected ROI % (number)
16. payback_months — payback period (number)
17. competitor_revenue_data — revenue data from top competitors
18. pricing_benchmarks — pricing in the market
19. cost_structure — fixed vs variable costs
20. revenue_streams — list of revenue streams
21. unit_economics — unit economics summary
22. financial_risks — list of financial risks
23. opportunity_score — 0-100 score for this opportunity

Return as JSON object with all fields above.`,
        response_json_schema: {
          type: 'object',
          properties: {
            market_size_tam: { type: 'string' },
            market_size_sam: { type: 'string' },
            market_size_som: { type: 'string' },
            avg_cpc: { type: 'number' },
            avg_lead_value: { type: 'number' },
            avg_customer_ltv: { type: 'number' },
            estimated_cac: { type: 'number' },
            gross_margin_pct: { type: 'number' },
            monthly_search_volume: { type: 'number' },
            estimated_monthly_leads: { type: 'number' },
            estimated_monthly_revenue: { type: 'number' },
            estimated_monthly_cost: { type: 'number' },
            estimated_monthly_profit: { type: 'number' },
            break_even_months: { type: 'number' },
            roi_percentage: { type: 'number' },
            payback_months: { type: 'number' },
            competitor_revenue_data: { type: 'string' },
            pricing_benchmarks: { type: 'string' },
            cost_structure: { type: 'string' },
            revenue_streams: { type: 'array', items: { type: 'string' } },
            unit_economics: { type: 'string' },
            financial_risks: { type: 'array', items: { type: 'string' } },
            opportunity_score: { type: 'number' }
          }
        }
      });

      const finRecord = await base44.asServiceRole.entities.FinancialIntelligence.create({
        niche,
        ...finRes
      });

      results.financial_intelligence = {
        id: finRecord.id,
        opportunity_score: finRes.opportunity_score,
        estimated_monthly_revenue: finRes.estimated_monthly_revenue,
        estimated_monthly_profit: finRes.estimated_monthly_profit,
        roi_percentage: finRes.roi_percentage,
        break_even_months: finRes.break_even_months
      };
    }

    // ── STEP 4: Market Simulation (1 week → 10 years) ───────────────────
    if (step === 'full_pipeline' || step === 'market_simulation') {
      const VALID_TIMEFRAMES = [
        '1_week', '1_month', '3_month', '6_month', '9_month', '12_month',
        '2_year', '3_year', '5_year', '10_year'
      ];
      const VALID_CONFIDENCE = ['high', 'medium', 'low'];

      // Normalize timeframe string to match enum (e.g. "1 week" → "1_week", "1 year" → "1_year")
      const normalizeTimeframe = (tf) => {
        if (!tf) return '1_week';
        const normalized = String(tf).toLowerCase().trim()
          .replace(/\s+/g, '_')
          .replace(/months/g, 'month')
          .replace(/years/g, 'year')
          .replace(/weeks/g, 'week');
        // Direct match
        if (VALID_TIMEFRAMES.includes(normalized)) return normalized;
        // Try mapping common variants
        const map = {
          '1wk': '1_week', '1w': '1_week', 'week_1': '1_week',
          '1mo': '1_month', '1m': '1_month', 'month_1': '1_month',
          '3mo': '3_month', '3m': '3_month', 'month_3': '3_month',
          '6mo': '6_month', '6m': '6_month', 'month_6': '6_month',
          '9mo': '9_month', '9m': '9_month', 'month_9': '9_month',
          '12mo': '12_month', '12m': '12_month', '1yr': '12_month', '1_year': '12_month', 'year_1': '12_month',
          '2yr': '2_year', '2y': '2_year', 'year_2': '2_year',
          '3yr': '3_year', '3y': '3_year', 'year_3': '3_year',
          '5yr': '5_year', '5y': '5_year', 'year_5': '5_year',
          '10yr': '10_year', '10y': '10_year', 'year_10': '10_year',
        };
        if (map[normalized]) return map[normalized];
        // Fallback: find closest match by number+unit
        const numMatch = normalized.match(/(\d+)/);
        const unitMatch = normalized.match(/(week|month|year)/);
        if (numMatch && unitMatch) {
          const candidate = `${numMatch[1]}_${unitMatch[1]}`;
          if (VALID_TIMEFRAMES.includes(candidate)) return candidate;
        }
        return '1_week'; // safe fallback
      };

      const normalizeConfidence = (c) => {
        const lc = String(c || '').toLowerCase().trim();
        return VALID_CONFIDENCE.includes(lc) ? lc : 'medium';
      };

      const simRes = await base44.integrations.Core.InvokeLLM({
        model: 'gemini_3_1_pro',
        add_context_from_internet: true,
        prompt: `You are a market simulation engine. For the niche "${niche}", generate growth projections for exactly 10 timeframes.

CRITICAL: The "timeframe" field MUST be one of these exact string values (use underscores, no spaces):
- "1_week", "1_month", "3_month", "6_month", "9_month", "12_month", "2_year", "3_year", "5_year", "10_year"

For EACH timeframe, provide:
- timeframe: MUST be one of the exact values listed above
- starting_pages: 0
- projected_pages: number
- starting_traffic: 0
- projected_traffic: number
- starting_leads: 0
- projected_leads: number
- starting_revenue: 0
- projected_revenue: number (USD per month)
- starting_cost: 0
- projected_cost: number
- projected_profit: number
- projected_keyword_count: number
- projected_backlinks: number
- projected_domain_authority: number (1-100)
- projected_ranking_keywords: number
- growth_assumptions: string
- milestones: array of strings
- risks: array of strings
- mitigation_strategies: array of strings
- confidence_level: MUST be exactly "high", "medium", or "lower" (lowercase)

Base projections on programmatic SEO compounding: 450 city pages expanding to thousands, Google indexing acceleration, backlink growth, DA growth curve.

Return: { "simulations": [ {timeframe: "1_week", ...}, {timeframe: "1_month", ...}, ... ] }`,
        response_json_schema: {
          type: 'object',
          properties: {
            simulations: { type: 'array', items: { type: 'object' } }
          }
        }
      });

      // Extract simulations from LLM response — handle multiple possible formats
      let rawSims = [];
      if (Array.isArray(simRes.simulations)) {
        rawSims = simRes.simulations;
      } else if (Array.isArray(simRes)) {
        rawSims = simRes;
      } else if (simRes.simulations && typeof simRes.simulations === 'object') {
        // LLM returned an object keyed by timeframe instead of an array
        rawSims = Object.entries(simRes.simulations).map(([k, v]) => ({ timeframe: k, ...v }));
      }

      // Programmatic growth model — used as fallback if LLM doesn't return usable data
      const GROWTH_MODEL = {
        '1_week':    { pages: 50,   traffic: 120,   leads: 5,    rev: 2500,   cost: 800,  kw: 30,   bl: 5,   da: 5,  rk: 10 },
        '1_month':   { pages: 150,  traffic: 500,   leads: 20,   rev: 10000,  cost: 2000, kw: 80,   bl: 15,  da: 8,  rk: 25 },
        '3_month':   { pages: 450,  traffic: 2000,  leads: 80,   rev: 40000,  cost: 5000, kw: 200,  bl: 40,  da: 12, rk: 60 },
        '6_month':   { pages: 900,  traffic: 5000,  leads: 200,  rev: 100000, cost: 8000, kw: 500,  bl: 80,  da: 18, rk: 150 },
        '9_month':   { pages: 1500, traffic: 10000, leads: 400,  rev: 200000, cost: 12000, kw: 900,  bl: 130, da: 24, rk: 300 },
        '12_month':  { pages: 2500, traffic: 18000, leads: 720,  rev: 360000, cost: 18000, kw: 1500, bl: 200, da: 30, rk: 500 },
        '2_year':    { pages: 5000, traffic: 45000, leads: 1800, rev: 900000, cost: 35000, kw: 4000, bl: 500, da: 42, rk: 1200 },
        '3_year':    { pages: 8000, traffic: 90000, leads: 3600, rev: 1800000,cost: 50000, kw: 8000, bl: 1000,da: 52, rk: 2500 },
        '5_year':    { pages: 15000,traffic: 250000,leads: 10000,rev:5000000,cost: 80000, kw: 20000,bl: 2500,da: 65, rk: 6000 },
        '10_year':   { pages: 30000,traffic: 600000,leads: 24000,rev:12000000,cost:120000,kw:50000,bl: 6000,da: 80, rk: 15000 },
      };

      const simRecords = [];
      const seenTimeframes = new Set();

      // Process LLM-returned simulations
      for (const sim of rawSims) {
        const tf = normalizeTimeframe(sim.timeframe);
        if (seenTimeframes.has(tf)) continue;
        seenTimeframes.add(tf);

        // Use LLM values if present, otherwise use programmatic model
        const model = GROWTH_MODEL[tf] || GROWTH_MODEL['1_week'];

        try {
          const record = await base44.asServiceRole.entities.MarketSimulation.create({
            niche,
            url_pattern: params.url_pattern || niche,
            timeframe: tf,
            starting_pages: Number(sim.starting_pages) || 0,
            projected_pages: Number(sim.projected_pages) || model.pages,
            starting_traffic: Number(sim.starting_traffic) || 0,
            projected_traffic: Number(sim.projected_traffic) || model.traffic,
            starting_leads: Number(sim.starting_leads) || 0,
            projected_leads: Number(sim.projected_leads) || model.leads,
            starting_revenue: Number(sim.starting_revenue) || 0,
            projected_revenue: Number(sim.projected_revenue) || model.rev,
            starting_cost: Number(sim.starting_cost) || 0,
            projected_cost: Number(sim.projected_cost) || model.cost,
            projected_profit: (Number(sim.projected_revenue) || model.rev) - (Number(sim.projected_cost) || model.cost),
            projected_keyword_count: Number(sim.projected_keyword_count) || model.kw,
            projected_backlinks: Number(sim.projected_backlinks) || model.bl,
            projected_domain_authority: Number(sim.projected_domain_authority) || model.da,
            projected_ranking_keywords: Number(sim.projected_ranking_keywords) || model.rk,
            growth_assumptions: sim.growth_assumptions || `Programmatic SEO compounding: ${model.pages} pages → ${model.traffic} monthly traffic → ${model.leads} leads → $${model.rev}/mo revenue`,
            milestones: sim.milestones || [`Reach ${model.pages} pages`, `Achieve DA ${model.da}`, `Rank for ${model.rk} keywords`],
            risks: sim.risks || ['Google algorithm updates', 'Indexing delays', 'Competition'],
            mitigation_strategies: sim.mitigation_strategies || ['Diversify content', 'Build authority', 'Monitor rankings'],
            confidence_level: normalizeConfidence(sim.confidence_level),
            key_metrics: `Pages: ${model.pages}, Traffic: ${model.traffic}/mo, Revenue: $${model.rev}/mo, Profit: $${model.rev - model.cost}/mo`
          });
          simRecords.push(record);
        } catch (e) {
          console.error(`MarketSimulation create failed for ${tf}:`, e.message);
        }
      }

      // Fill any missing timeframes with programmatic model data
      for (const tf of VALID_TIMEFRAMES) {
        if (!seenTimeframes.has(tf)) {
          const model = GROWTH_MODEL[tf];
          try {
            const record = await base44.asServiceRole.entities.MarketSimulation.create({
              niche,
              url_pattern: params.url_pattern || niche,
              timeframe: tf,
              projected_pages: model.pages,
              projected_traffic: model.traffic,
              projected_leads: model.leads,
              projected_revenue: model.rev,
              projected_cost: model.cost,
              projected_profit: model.rev - model.cost,
              projected_keyword_count: model.kw,
              projected_backlinks: model.bl,
              projected_domain_authority: model.da,
              projected_ranking_keywords: model.rk,
              growth_assumptions: `Programmatic SEO compounding: ${model.pages} pages → ${model.traffic} monthly traffic → ${model.leads} leads → $${model.rev}/mo revenue`,
              milestones: [`Reach ${model.pages} pages`, `Achieve DA ${model.da}`, `Rank for ${model.rk} keywords`],
              risks: ['Google algorithm updates', 'Indexing delays', 'Competition'],
              mitigation_strategies: ['Diversify content', 'Build authority', 'Monitor rankings'],
              confidence_level: 'medium',
              key_metrics: `Pages: ${model.pages}, Traffic: ${model.traffic}/mo, Revenue: $${model.rev}/mo, Profit: $${model.rev - model.cost}/mo`
            });
            simRecords.push(record);
          } catch (e) {
            console.error(`MarketSimulation fill failed for ${tf}:`, e.message);
          }
        }
      }

      results.market_simulation = {
        timeframe_count: simRecords.length,
        simulations: simRecords.map(s => ({ id: s.id, timeframe: s.timeframe, projected_revenue: s.projected_revenue, projected_profit: s.projected_profit, projected_pages: s.projected_pages, projected_traffic: s.projected_traffic }))
      };
    }

    // ── STEP 5: Digital Dominance Plan ─────────────────────────────────
    if (step === 'full_pipeline' || step === 'digital_dominance') {
      const domRes = await base44.integrations.Core.InvokeLLM({
        model: 'gemini_3_1_pro',
        add_context_from_internet: true,
        prompt: `You are a digital dominance strategist. For the niche "${niche}", create a comprehensive digital dominance plan.

Provide:
1. total_target_cities — how many cities to target (number)
2. total_target_pages — total programmatic pages (number)
3. target_keywords — ALL keywords to target (array of strings, 50+)
4. long_tail_keywords — long-tail variations (array, 50+)
5. competitor_keywords_to_steal — keywords competitors rank for that we should target (array)
6. backlink_targets — specific websites/domains to get backlinks from (array of 30+)
7. blog_target_sites — sites to write guest blogs for (array of 20+)
8. directory_submissions — directories to submit to (array of 20+)
9. social_platforms — social platforms to be present on (array)
10. schema_types — Schema.org types to implement (array)
11. content_calendar — content production schedule
12. internal_linking_strategy — how to structure internal links
13. topical_authority_map — topic clusters to build authority in
14. google_guidelines_compliance — how the plan complies with Google guidelines (no thin content, no doorway pages, unique value per page)
15. indexing_strategy — how to get pages indexed fast
16. aeo_optimization — AI Engine Optimization strategy
17. local_seo_strategy — local SEO approach
18. conversion_optimization — CRO strategy
19. estimated_timeline — timeline to dominance
20. dominance_score — 0-100 score

Return as JSON object with all fields above.`,
        response_json_schema: {
          type: 'object',
          properties: {
            total_target_cities: { type: 'number' },
            total_target_pages: { type: 'number' },
            target_keywords: { type: 'array', items: { type: 'string' } },
            long_tail_keywords: { type: 'array', items: { type: 'string' } },
            competitor_keywords_to_steal: { type: 'array', items: { type: 'string' } },
            backlink_targets: { type: 'array', items: { type: 'string' } },
            blog_target_sites: { type: 'array', items: { type: 'string' } },
            directory_submissions: { type: 'array', items: { type: 'string' } },
            social_platforms: { type: 'array', items: { type: 'string' } },
            schema_types: { type: 'array', items: { type: 'string' } },
            content_calendar: { type: 'string' },
            internal_linking_strategy: { type: 'string' },
            topical_authority_map: { type: 'string' },
            google_guidelines_compliance: { type: 'string' },
            indexing_strategy: { type: 'string' },
            aeo_optimization: { type: 'string' },
            local_seo_strategy: { type: 'string' },
            conversion_optimization: { type: 'string' },
            estimated_timeline: { type: 'string' },
            dominance_score: { type: 'number' }
          }
        }
      });

      const domRecord = await base44.asServiceRole.entities.DigitalDominancePlan.create({
        niche,
        ...domRes
      });

      results.digital_dominance = {
        id: domRecord.id,
        total_target_cities: domRes.total_target_cities,
        total_target_pages: domRes.total_target_pages,
        keyword_count: (domRes.target_keywords || []).length,
        backlink_target_count: (domRes.backlink_targets || []).length,
        blog_target_count: (domRes.blog_target_sites || []).length,
        dominance_score: domRes.dominance_score
      };
    }

    // ── STEP 6: Brand System (logo + brand identity) ────────────────────
    if (step === 'full_pipeline' || step === 'brand_system') {
      const brandRes = await base44.integrations.Core.InvokeLLM({
        model: 'gemini_3_1_pro',
        add_context_from_internet: true,
        prompt: `You are a brand identity generator. For the niche "${niche}", generate a complete brand system.

Provide:
1. brand_name — a professional, brandable business name
2. tagline — a compelling 3-5 word tagline
3. primary_color — hex color that fits the niche
4. accent_color — complementary hex color
5. font_heading — Google Font for headings
6. font_body — Google Font for body text
7. logo_concept — detailed description of the logo concept for AI image generation
8. brand_positioning — positioning statement
9. brand_voice — tone and voice guidelines
10. brand_values — 3-5 core values
11. brand_personalities — 3-5 personality traits
12. competitor_brand_analysis — how competitors brand themselves
13. brand_superiority — how our brand will be superior

Also generate a logo prompt for AI image generation:
14. logo_generation_prompt — a detailed prompt for generating a professional logo

Return as JSON object with all fields above.`,
        response_json_schema: {
          type: 'object',
          properties: {
            brand_name: { type: 'string' },
            tagline: { type: 'string' },
            primary_color: { type: 'string' },
            accent_color: { type: 'string' },
            font_heading: { type: 'string' },
            font_body: { type: 'string' },
            logo_concept: { type: 'string' },
            logo_generation_prompt: { type: 'string' },
            brand_positioning: { type: 'string' },
            brand_voice: { type: 'string' },
            brand_values: { type: 'array', items: { type: 'string' } },
            brand_personalities: { type: 'array', items: { type: 'string' } },
            competitor_brand_analysis: { type: 'string' },
            brand_superiority: { type: 'string' }
          }
        }
      });

      // Generate the logo image
      let logoUrl = null;
      try {
        const logoResult = await base44.integrations.Core.GenerateImage({
          prompt: brandRes.logo_generation_prompt || `Professional logo for ${brandRes.brand_name}, ${niche} industry. ${brandRes.logo_concept || ''} Clean, modern, brand-ready, high quality, no watermark, transparent background, PNG format.`
        });
        logoUrl = logoResult.url;
      } catch (e) { console.error('Logo generation failed:', e.message); }

      results.brand_system = {
        brand_name: brandRes.brand_name,
        tagline: brandRes.tagline,
        primary_color: brandRes.primary_color,
        accent_color: brandRes.accent_color,
        logo_url: logoUrl,
        brand_positioning: brandRes.brand_positioning,
        brand_voice: brandRes.brand_voice
      };
    }

    // ── STEP 7: PWA Template ────────────────────────────────────────────
    if (step === 'full_pipeline' || step === 'pwa_template') {
      const pwaRes = await base44.integrations.Core.InvokeLLM({
        model: 'gemini_3_1_pro',
        add_context_from_internet: true,
        prompt: `You are a PWA template architect. For the niche "${niche}", design a multi-industry PWA website template that is 100% compliant with Google's guidelines.

Provide:
1. template_name — name for this template
2. template_type — lead_gen | ecommerce | service | marketplace | directory | content | saas
3. sections — page sections (array: hero, services, about, testimonials, faq, contact, etc.)
4. schema_types — Schema.org types to implement (array)
5. funnel_steps — conversion funnel steps (array)
6. cta_placements — where to place CTAs
7. lead_magnet_type — type of lead magnet
8. primary_color — hex
9. accent_color — hex
10. font_heading — Google Font
11. font_body — Google Font
12. google_guidelines_compliance — how this template complies with Google's guidelines (no thin content, unique value per page, proper schema, mobile-first, fast loading)
13. core_web_vitals_strategy — how to achieve good Core Web Vitals
14. pwa_features — PWA features (offline, push, installable)
15. template_config — JSON config for the template including section layouts, content rules, SEO rules

The template MUST:
- Follow Google's Search Quality Evaluator Guidelines
- Have unique value on every page (no thin/doorway pages)
- Include proper structured data (LocalBusiness, FAQ, BreadcrumbList)
- Be mobile-first responsive
- Support PWA installation (manifest.json, service worker)
- Have Core Web Vitals optimization built in
- Include conversion-optimized funnel

Return as JSON object with all fields above.`,
        response_json_schema: {
          type: 'object',
          properties: {
            template_name: { type: 'string' },
            template_type: { type: 'string' },
            sections: { type: 'array', items: { type: 'string' } },
            schema_types: { type: 'array', items: { type: 'string' } },
            funnel_steps: { type: 'array', items: { type: 'string' } },
            cta_placements: { type: 'string' },
            lead_magnet_type: { type: 'string' },
            primary_color: { type: 'string' },
            accent_color: { type: 'string' },
            font_heading: { type: 'string' },
            font_body: { type: 'string' },
            google_guidelines_compliance: { type: 'string' },
            core_web_vitals_strategy: { type: 'string' },
            pwa_features: { type: 'array', items: { type: 'string' } },
            template_config: { type: 'string' }
          }
        }
      });

      const pwaRecord = await base44.asServiceRole.entities.PwaTemplate.create({
        template_name: pwaRes.template_name || `${niche} PWA Template`,
        industry: niche,
        template_type: pwaRes.template_type || 'lead_gen',
        pwa_enabled: true,
        offline_support: true,
        push_notifications: true,
        installable: true,
        primary_color: pwaRes.primary_color || '#FFD700',
        accent_color: pwaRes.accent_color || '#0a0a0a',
        font_heading: pwaRes.font_heading || 'Inter',
        font_body: pwaRes.font_body || 'Inter',
        sections: pwaRes.sections || ['hero', 'services', 'about', 'testimonials', 'faq', 'contact'],
        schema_types: pwaRes.schema_types || ['LocalBusiness', 'FAQPage', 'BreadcrumbList'],
        funnel_steps: pwaRes.funnel_steps || [],
        cta_placements: pwaRes.cta_placements || '',
        lead_magnet_type: pwaRes.lead_magnet_type || 'free_quote',
        mobile_optimized: true,
        core_web_vitals_optimized: true,
        google_guidelines_compliant: true,
        template_config: pwaRes.template_config || '',
        status: 'active'
      });

      results.pwa_template = {
        id: pwaRecord.id,
        template_name: pwaRecord.template_name,
        template_type: pwaRecord.template_type,
        sections: pwaRecord.sections,
        schema_types: pwaRecord.schema_types,
        google_guidelines_compliant: pwaRecord.google_guidelines_compliant
      };
    }

    // ── STEP 8: Funnel Discovery ────────────────────────────────────────
    if (step === 'full_pipeline' || step === 'funnel_discovery') {
      const funnelRes = await base44.integrations.Core.InvokeLLM({
        model: 'gemini_3_1_pro',
        add_context_from_internet: true,
        prompt: `You are a funnel discovery engine. For the niche "${niche}", discover the top 3 highest-converting funnel URLs and design an optimal conversion funnel.

Provide:
1. top_funnel_urls — the top 3 highest-converting URLs in this niche (array)
2. funnel_type — lead_gen | ecommerce | appointment | quote | subscription | marketplace
3. funnel_steps — array of {step: number, name: string, action: string, conversion_rate: number}
4. entry_points — where users enter the funnel (array)
5. lead_magnet_ideas — ideas for lead magnets (array)
6. cta_variations — CTA text variations (array)
7. landing_page_structure — optimal landing page structure
8. form_fields_recommended — recommended form fields (array)
9. trust_signals — trust signals to include (array)
10. urgency_triggers — urgency triggers (array)
11. follow_up_sequence — follow up sequence description
12. estimated_conversion_rate — our projected conversion rate (number)
13. benchmark_conversion_rate — industry benchmark conversion rate (number)
14. superiority_factors — how our funnel will be superior (array)

Return as JSON object with all fields above.`,
        response_json_schema: {
          type: 'object',
          properties: {
            top_funnel_urls: { type: 'array', items: { type: 'string' } },
            funnel_type: { type: 'string' },
            funnel_steps: { type: 'array', items: { type: 'object' } },
            entry_points: { type: 'array', items: { type: 'string' } },
            lead_magnet_ideas: { type: "array", items: { type: "string" } },
            cta_variations: { type: 'array', items: { type: 'string' } },
            landing_page_structure: { type: 'string' },
            form_fields_recommended: { type: 'array', items: { type: 'string' } },
            trust_signals: { type: 'array', items: { type: 'string' } },
            urgency_triggers: { type: 'array', items: { type: 'string' } },
            follow_up_sequence: { type: 'string' },
            estimated_conversion_rate: { type: 'number' },
            benchmark_conversion_rate: { type: 'number' },
            superiority_factors: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      const funnelRecord = await base44.asServiceRole.entities.FunnelDiscovery.create({
        niche,
        industry: niche,
        ...funnelRes
      });

      results.funnel_discovery = {
        id: funnelRecord.id,
        funnel_type: funnelRes.funnel_type,
        top_funnel_urls: funnelRes.top_funnel_urls,
        estimated_conversion_rate: funnelRes.estimated_conversion_rate,
        benchmark_conversion_rate: funnelRes.benchmark_conversion_rate,
        step_count: (funnelRes.funnel_steps || []).length
      };
    }

    // Create receipt
    await base44.asServiceRole.entities.Receipt.create({
      summary: `End-to-end generator: ${step} for niche "${niche}"`,
      source: 'EndToEndGenerator',
      occurred_at: new Date().toISOString(),
      proof_level: 1
    });

    return Response.json({ step, niche, results });
  } catch (error) {
    console.error('EndToEndGenerator error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}