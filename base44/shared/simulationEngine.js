// Shared Monte Carlo simulation engine for strategy modeling.
// Runs hundreds of probability iterations to project realistic outcomes.

export function runMonteCarlo(config) {
  const {
    iterations = 500,
    initialCapital = 10000,
    monthlyContribution = 5000,
    automationLevel = 0.7, // 0-1
    autonomyLevel = 0.6, // 0-1
    marketVolatility = 0.3, // 0-1
    strategyEfficiency = 0.75, // 0-1
    timeHorizonMonths = 36,
  } = config;

  const results = [];
  let bestCase = null;
  let worstCase = null;
  let sumRevenue = 0;
  let sumROI = 0;
  let successCount = 0;

  for (let i = 0; i < iterations; i++) {
    let capital = initialCapital;
    let monthlyRevenue = 0;
    let totalInvested = initialCapital;
    const monthlyData = [];

    for (let m = 0; m < timeHorizonMonths; m++) {
      // Base growth rate influenced by strategy efficiency and automation
      const baseGrowth = strategyEfficiency * (0.08 + automationLevel * 0.12 + autonomyLevel * 0.10);
      // Volatility introduces randomness
      const randomFactor = 1 + (Math.random() - 0.5) * marketVolatility * 2;
      const monthlyReturn = baseGrowth * randomFactor;
      
      capital += capital * monthlyReturn;
      capital += monthlyContribution;
      totalInvested += monthlyContribution;
      
      // Revenue scales with capital and automation
      monthlyRevenue = capital * (0.05 + automationLevel * 0.08) * randomFactor;
      monthlyData.push({ month: m + 1, capital: Math.round(capital), revenue: Math.round(monthlyRevenue) });
    }

    const totalRevenue = monthlyData.reduce((s, d) => s + d.revenue, 0);
    const roi = ((capital - totalInvested) / totalInvested) * 100;
    const success = roi > 50;

    const result = {
      iteration: i,
      finalCapital: Math.round(capital),
      totalRevenue: Math.round(totalRevenue),
      totalInvested: Math.round(totalInvested),
      roi: Math.round(roi * 10) / 10,
      success,
      monthlyData,
    };

    results.push(result);
    sumRevenue += totalRevenue;
    sumROI += roi;
    if (success) successCount++;

    if (!bestCase || roi > bestCase.roi) bestCase = result;
    if (!worstCase || roi < worstCase.roi) worstCase = result;
  }

  // Calculate percentiles
  const sortedROI = results.map(r => r.roi).sort((a, b) => a - b);
  const percentile = (p) => sortedROI[Math.floor(sortedROI.length * p)];

  return {
    iterations,
    avgRevenue: Math.round(sumRevenue / iterations),
    avgROI: Math.round((sumROI / iterations) * 10) / 10,
    successRate: Math.round((successCount / iterations) * 100),
    bestCase: { roi: bestCase.roi, finalCapital: bestCase.finalCapital, totalRevenue: bestCase.totalRevenue },
    worstCase: { roi: worstCase.roi, finalCapital: worstCase.finalCapital, totalRevenue: worstCase.totalRevenue },
    medianROI: percentile(0.5),
    p25ROI: percentile(0.25),
    p75ROI: percentile(0.75),
    p90ROI: percentile(0.9),
    p10ROI: percentile(0.1),
    projectedMonthly: bestCase.monthlyData.filter((_, i) => i % 3 === 0).map(d => ({
      month: d.month,
      capital: d.capital,
      revenue: d.revenue,
    })),
  };
}

export const STRATEGY_ARCHETYPES = [
  { id: 1, name: 'Autonomous SEO Empire', endResult: 'Top-3 Google rankings across 10,000+ programmatic pages', efficiency: 0.85, volatility: 0.2 },
  { id: 2, name: 'Lead Generation Machine', endResult: '500+ qualified leads/month across 5 verticals', efficiency: 0.80, volatility: 0.25 },
  { id: 3, name: 'Digital Asset Portfolio', endResult: '$50K/month passive income from 20 monetized sites', efficiency: 0.75, volatility: 0.35 },
  { id: 4, name: 'AI Agent Workforce', endResult: '24/7 autonomous operations replacing 10 FTEs', efficiency: 0.90, volatility: 0.15 },
  { id: 5, name: 'Programmatic SEO Network', endResult: '1M+ indexed pages generating 100K monthly visitors', efficiency: 0.82, volatility: 0.22 },
  { id: 6, name: 'Multi-Platform Content Engine', endResult: 'Omnichannel presence across Google, AI search, and social', efficiency: 0.78, volatility: 0.28 },
  { id: 7, name: 'Competitor Intelligence System', endResult: 'Real-time market dominance with automated counter-strategies', efficiency: 0.83, volatility: 0.18 },
  { id: 8, name: 'Domain Authority Builder', endResult: 'DA 70+ network with 500K backlinks auto-generated', efficiency: 0.72, volatility: 0.40 },
  { id: 9, name: 'Vercel-Powered SaaS Suite', endResult: '10 deployed SaaS products with recurring revenue', efficiency: 0.80, volatility: 0.30 },
  { id: 10, name: 'Full-Stack Autonomy Platform', endResult: 'Complete business automation from lead to cash to delivery', efficiency: 0.88, volatility: 0.16 },
];