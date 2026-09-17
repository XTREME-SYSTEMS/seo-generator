// Brand Intelligence engine — unified discovery pipeline.
// Runs 5 intelligence streams in parallel using InvokeLLM with web search.
// Ported from xtremeaibuilder3 and generalized for any industry.

export const HIGH_VALUE_NICHES = [
  { service: "epoxy flooring", lead_value: 400, cpc: 15 },
  { service: "polished concrete", lead_value: 350, cpc: 12 },
  { service: "concrete coatings", lead_value: 400, cpc: 14 },
  { service: "stamped concrete", lead_value: 300, cpc: 10 },
  { service: "roofing", lead_value: 500, cpc: 18 },
  { service: "hvac", lead_value: 450, cpc: 16 },
  { service: "plumbing", lead_value: 350, cpc: 14 },
  { service: "electrical", lead_value: 400, cpc: 15 },
  { service: "pest control", lead_value: 250, cpc: 9 },
  { service: "landscaping", lead_value: 300, cpc: 11 },
  { service: "cleaning services", lead_value: 200, cpc: 8 },
  { service: "general contractor", lead_value: 600, cpc: 20 },
];

function loc(input) {
  return [input.city, input.zip && `ZIP ${input.zip}`].filter(Boolean).join(", ");
}

export function buildIndustryIntelPrompt(input) {
  const industry = input.industry || "home services";
  return `You are an industry intelligence analyst for the ${industry} trade${loc(input) ? ` in ${loc(input)}` : ""}.
Use web search to research the current state of the ${industry} industry for a ${input.strategy || "landing"} website.
Return: a concise summary, the top 5 current trends, 5 market opportunities a new business could capture,
the key services every serious ${industry} business must offer, insights about the target customer
(${input.audience || "homeowners and commercial property managers"}), and seasonality patterns.
Be specific and factual — cite real services and real market dynamics, not generic advice.`;
}

export const industryIntelSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    trends: { type: "array", items: { type: "string" } },
    opportunities: { type: "array", items: { type: "string" } },
    keyServices: { type: "array", items: { type: "string" } },
    audienceInsights: { type: "string" },
    seasonality: { type: "string" },
  },
};

export function buildCompetitorPrompt(input) {
  const industry = input.industry || "home services";
  const q = loc(input) ? `${industry} near ${input.city}` : industry;
  return `Search Google for "${q}" and analyze the top 10 organic results.
Return the 3 most valuable sites to clone for SEO intelligence as "topSitesToClone"
(each with url, domain, title, siteType one of direct_competitor|authority_site|directory|local_pack,
and why it is valuable to model a new ${industry} website after).
Also return "competitors" — the top 5 direct competitors (name, url, strengths[], weaknesses[],
services[], pricingModel, differentiator). Use real URLs from the actual search results.`;
}

export const competitorSchema = {
  type: "object",
  properties: {
    topSitesToClone: {
      type: "array",
      items: {
        type: "object",
        properties: {
          url: { type: "string" },
          domain: { type: "string" },
          title: { type: "string" },
          siteType: { type: "string" },
          why: { type: "string" },
        },
      },
    },
    competitors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          url: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          weaknesses: { type: "array", items: { type: "string" } },
          services: { type: "array", items: { type: "string" } },
          pricingModel: { type: "string" },
          differentiator: { type: "string" },
        },
      },
    },
  },
};

export function buildFinancialIntelPrompt(input) {
  const industry = input.industry || "home services";
  return `You are a financial intelligence analyst for the ${industry} industry${loc(input) ? ` in ${loc(input)}` : ""}.
Research and return:
- averageLeadValue: the typical lead value in dollars
- averageCpc: the average cost per click for Google Ads
- averageMonthlyRevenue: typical monthly revenue for an established ${industry} business
- profitMargins: typical profit margin percentage
- customerLifetimeValue: typical LTV
- customerAcquisitionCost: typical CAC
- topRevenueStreams: the 3-4 most profitable services
- pricingModels: common pricing models used in the industry
Be specific and factual — use real market data.`;
}

export const financialIntelSchema = {
  type: "object",
  properties: {
    averageLeadValue: { type: "number" },
    averageCpc: { type: "number" },
    averageMonthlyRevenue: { type: "number" },
    profitMargins: { type: "number" },
    customerLifetimeValue: { type: "number" },
    customerAcquisitionCost: { type: "number" },
    topRevenueStreams: { type: "array", items: { type: "string" } },
    pricingModels: { type: "array", items: { type: "string" } },
  },
};

export function buildDomainDiscoveryPrompt(input) {
  const industry = input.industry || "home services";
  return `You are a domain acquisition strategist. For a ${industry} business${loc(input) ? ` in ${loc(input)}` : ""},
research and recommend 10 available domain name ideas that would be excellent for local SEO.
For each domain: the name, why it's good for SEO, whether it includes a city/region keyword,
and an estimated value. Prioritize .com domains with the city name + service keyword pattern.`;
}

export const domainDiscoverySchema = {
  type: "object",
  properties: {
    domains: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          seoReason: { type: "string" },
          hasCityKeyword: { type: "boolean" },
          estimatedValue: { type: "string" },
        },
      },
    },
  },
};

export function buildBusinessNamePrompt(input) {
  const industry = input.industry || "home services";
  return `You are a brand naming expert. Generate 10 business name ideas for a ${industry} company${loc(input) ? ` in ${loc(input)}` : ""}.
Each name should be: memorable, professional, easy to spell, available as a .com domain (likely),
and convey trust and expertise. For each: the name, a tagline, and why it works.`;
}

export const businessNameSchema = {
  type: "object",
  properties: {
    names: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          tagline: { type: "string" },
          why: { type: "string" },
        },
      },
    },
  },
};

// Run all 5 intelligence streams in parallel
export async function runFullBrandIntelligence(base44, input) {
  const [industryRes, competitorRes, financialRes, domainRes, nameRes] = await Promise.allSettled([
    base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildIndustryIntelPrompt(input),
      add_context_from_internet: true,
      response_json_schema: industryIntelSchema,
    }),
    base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildCompetitorPrompt(input),
      add_context_from_internet: true,
      response_json_schema: competitorSchema,
    }),
    base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildFinancialIntelPrompt(input),
      add_context_from_internet: true,
      response_json_schema: financialIntelSchema,
    }),
    base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildDomainDiscoveryPrompt(input),
      add_context_from_internet: true,
      response_json_schema: domainDiscoverySchema,
    }),
    base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildBusinessNamePrompt(input),
      add_context_from_internet: true,
      response_json_schema: businessNameSchema,
    }),
  ]);

  return {
    industry: industryRes.status === "fulfilled" ? industryRes.value : null,
    competitors: competitorRes.status === "fulfilled" ? competitorRes.value : null,
    financial: financialRes.status === "fulfilled" ? financialRes.value : null,
    domains: domainRes.status === "fulfilled" ? domainRes.value : null,
    names: nameRes.status === "fulfilled" ? nameRes.value : null,
  };
}