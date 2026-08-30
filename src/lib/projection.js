// Client-side projection math for the Growth Simulator. Provenance is always MODELED.

export const GOAL_RANK = 3;
export const RANK_FLOOR = 101;
export const HORIZONS = [1, 3, 7, 15, 30, 45, 60, 90];

export function scoreFromRank(rank) {
  if (rank === null || rank === undefined || Number.isNaN(Number(rank))) return 0;
  const r = Number(rank);
  if (r <= GOAL_RANK) return 100;
  if (r >= RANK_FLOOR) return 0;
  return Math.round(((RANK_FLOOR - r) / (RANK_FLOOR - GOAL_RANK)) * 1000) / 10;
}

// Strategy modules. `proven` modules are anchored to Google-confirmed factors (T0/T1);
// `experimental` ones are graduating through measured experiment and carry a confidence haircut.
export const MODULES = [
  { key: 'technical', label: 'Technical / Retrieval', tier: 'proven', weight: 0.22, latency: 'fast', default: 60 },
  { key: 'content', label: 'Content Depth & Coverage', tier: 'proven', weight: 0.24, latency: 'medium', default: 60 },
  { key: 'intent', label: 'Intent Match', tier: 'proven', weight: 0.14, latency: 'fast', default: 50 },
  { key: 'authority', label: 'Earned Authority', tier: 'proven', weight: 0.26, latency: 'slow', default: 40 },
  { key: 'presentation', label: 'Presentation / CTR', tier: 'proven', weight: 0.08, latency: 'fast', default: 50 },
  { key: 'aeo', label: 'Answer-Engine (AEO)', tier: 'experimental', weight: 0.12, latency: 'medium', default: 35 },
  { key: 'sao', label: 'Search-AI (SAO)', tier: 'experimental', weight: 0.10, latency: 'medium', default: 30 },
  { key: 'entity', label: 'Entity Consolidation', tier: 'experimental', weight: 0.09, latency: 'slow', default: 30 },
];

const LATENCY_DAYS = { fast: 6, medium: 21, slow: 55 };

// Composite effort 0..1 from slider values, with an experimental confidence haircut.
export function compositeEffort(values) {
  let total = 0;
  let weightSum = 0;
  MODULES.forEach((m) => {
    const v = (Number(values[m.key] ?? m.default) / 100);
    const conf = m.tier === 'experimental' ? 0.55 : 1;
    total += v * m.weight * conf;
    weightSum += m.weight;
  });
  return weightSum ? total / weightSum : 0;
}

// Saturating accrual curve: each module contributes on its own latency clock.
function progressAtDay(values, day, partnerBoost = 0) {
  let progress = 0;
  MODULES.forEach((m) => {
    const v = Number(values[m.key] ?? m.default) / 100;
    const conf = m.tier === 'experimental' ? 0.55 : 1;
    const tau = LATENCY_DAYS[m.latency];
    const accrued = 1 - Math.exp(-day / tau);
    progress += v * m.weight * conf * accrued;
  });
  return Math.min(1, progress * (1 + partnerBoost));
}

export function projectCurve({ currentRank, targetRank = GOAL_RANK, values, difficulty = 0.5, partnerBoost = 0 }) {
  const start = Number(currentRank) || RANK_FLOOR;
  const target = Math.max(1, Number(targetRank) || GOAL_RANK);
  const span = Math.max(0, start - target);
  const resistance = 0.45 + difficulty * 0.75; // harder queries close a smaller share of the gap

  return HORIZONS.map((day) => {
    const p = progressAtDay(values, day, partnerBoost);
    const closed = span * Math.min(1, p / resistance);
    const rank = Math.max(target, Math.round((start - closed) * 10) / 10);
    return {
      day,
      label: `D${day}`,
      rank,
      score: scoreFromRank(rank),
      confidence: Math.round(Math.max(0.25, 0.9 - day / 220) * 100),
    };
  });
}

export function daysToTarget(curve, targetRank = GOAL_RANK) {
  const hit = curve.find((p) => p.rank <= targetRank);
  return hit ? hit.day : null;
}

export function defaultValues() {
  return MODULES.reduce((acc, m) => ({ ...acc, [m.key]: m.default }), {});
}