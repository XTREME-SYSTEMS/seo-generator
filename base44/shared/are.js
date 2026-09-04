// Autonomous Ranking Engine — shared spine.
// Every module here is imported by ARE backend functions. Never duplicate this logic.

export const GOAL_RANK = 3;
export const RANK_FLOOR = 101; // unranked / beyond top 100

// Composite score = rank progress toward top 3. Simplest metric for the engine to read
// and to automate enhancements from: rank 3 or better => 100, unranked => 0.
export function scoreFromRank(rank) {
  if (rank === null || rank === undefined || Number.isNaN(Number(rank))) return 0;
  const r = Number(rank);
  if (r <= GOAL_RANK) return 100;
  if (r >= RANK_FLOOR) return 0;
  return Math.round(((RANK_FLOOR - r) / (RANK_FLOOR - GOAL_RANK)) * 1000) / 10;
}

export function weekStart(date = new Date()) {
  const d = new Date(date);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export function growthPct(current, previous) {
  if (!previous || previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// Evidence-first: only Google-confirmed (T0/T1) factors or measured experiments may ship.
export const SHIPPABLE_TIERS = ['T0_GOOGLE_DOC', 'T1_CONFIRMED_SYSTEM', 'T2_EXPERIMENT'];

export function isShippable(evidenceTier, proofLevel = 0) {
  return SHIPPABLE_TIERS.includes(evidenceTier) || Number(proofLevel) >= 5;
}

// Structural exclusion — these can never enter the recommendation queue.
export const SPAM_EXCLUSIONS = [
  'pbn', 'private blog network', 'llms.txt', 'paid link', 'link buying', 'link farm',
  'cloaking', 'doorway page', 'brand impersonation', 'expired domain abuse',
  'scaled content abuse', 'article spinning', 'comment spam', 'negative seo',
];

export function violatesSpamPolicy(text = '') {
  const t = String(text).toLowerCase();
  return SPAM_EXCLUSIONS.some((term) => t.includes(term));
}

// Deploy guidelines — every one must pass or the cycle is a validation failure.
export const DEPLOY_GUIDELINES = [
  { id: 'G1_EVIDENCE_ANCHOR', label: 'Treatment carries a T0/T1 anchor or measured experiment' },
  { id: 'G2_NO_SPAM_TACTIC', label: 'Treatment contains no spam-policy tactic' },
  { id: 'G3_PROVENANCE_LABELED', label: 'Every written field carries provenance; MODELED never shown as MEASURED' },
  { id: 'G4_TENANT_SCOPED', label: 'Row is bound to a client_id (tenant isolation)' },
  { id: 'G5_SNAPSHOT_EXISTS', label: 'A last-known-good snapshot exists before deploy' },
  { id: 'G6_NO_REGRESSION', label: 'No adjacent metric regressed beyond tolerance' },
  { id: 'G7_CANONICAL_INTACT', label: 'Canonical agreement not broken by the treatment' },
  { id: 'G8_INDEXABLE', label: 'URL remains indexable (not noindex / robots-excluded)' },
];

export const REGRESSION_TOLERANCE = 5; // score points

export function validateDeploy(row, snapshotExists, allowUnassigned = false) {
  const failed = [];
  if (!isShippable(row.evidence_tier)) failed.push('G1_EVIDENCE_ANCHOR');
  if (violatesSpamPolicy(row.recommended_treatment || '')) failed.push('G2_NO_SPAM_TACTIC');
  if (!row.rank_provenance) failed.push('G3_PROVENANCE_LABELED');
  if (!row.client_id && !allowUnassigned) failed.push('G4_TENANT_SCOPED');
  if (!snapshotExists) failed.push('G5_SNAPSHOT_EXISTS');
  if (row.canonical_agrees === false && row.index_state === 'DUPLICATE_ALTERNATE') failed.push('G7_CANONICAL_INTACT');
  if (['EXCLUDED_NOINDEX', 'EXCLUDED_ROBOTS'].includes(row.index_state)) failed.push('G8_INDEXABLE');
  return { passed: failed.length === 0, failed };
}

export function detectRegressions(before, after) {
  const regressions = [];
  if (after.score + REGRESSION_TOLERANCE < before.score) {
    regressions.push(`score fell ${before.score} -> ${after.score}`);
  }
  if (before.impressions > 0 && after.impressions < before.impressions * 0.7) {
    regressions.push(`impressions fell ${before.impressions} -> ${after.impressions}`);
  }
  if (before.canonical_agrees && !after.canonical_agrees) regressions.push('canonical agreement lost');
  if (before.index_state === 'INDEXED' && after.index_state !== 'INDEXED') {
    regressions.push(`index state degraded to ${after.index_state}`);
  }
  return regressions;
}

// Gap classification -> A1..A9 asymmetry + which of the four systems is the bottleneck.
export const GAP_MAP = {
  TECHNICAL: { asymmetry: 'A9_RENDER', system: 'RETRIEVAL' },
  SEO: { asymmetry: 'A2_THRESHOLD', system: 'RE_RANKING' },
  CONTENT: { asymmetry: 'A6_INFORMATION', system: 'CANDIDATE_SELECTION' },
  AUTHORITY: { asymmetry: 'A3_COMPETITION', system: 'RE_RANKING' },
  INTENT: { asymmetry: 'A4_INTENT', system: 'CANDIDATE_SELECTION' },
  SURFACE: { asymmetry: 'A5_SURFACE', system: 'PRESENTATION' },
  AEO: { asymmetry: 'A7_ENTITY', system: 'PRESENTATION' },
  SAO: { asymmetry: 'A7_ENTITY', system: 'CANDIDATE_SELECTION' },
};

export function classifyGap(row) {
  if (!row.index_state || ['NOT_INDEXED', 'CRAWLED_NOT_INDEXED', 'UNOBSERVED'].includes(row.index_state)) {
    return { gap_type: 'TECHNICAL', ...GAP_MAP.TECHNICAL };
  }
  if (row.canonical_agrees === false) return { gap_type: 'TECHNICAL', ...GAP_MAP.TECHNICAL };
  const rank = Number(row.rank || RANK_FLOOR);
  if (row.impressions === 0) return { gap_type: 'CONTENT', ...GAP_MAP.CONTENT };
  if (rank > 30) return { gap_type: 'AUTHORITY', ...GAP_MAP.AUTHORITY };
  if (rank > 10) return { gap_type: 'SEO', ...GAP_MAP.SEO };
  if (rank > 3 && row.ctr < 0.02) return { gap_type: 'SURFACE', ...GAP_MAP.SURFACE };
  if (rank > 3) return { gap_type: 'AEO', ...GAP_MAP.AEO };
  return { gap_type: 'NONE', asymmetry: null, system: 'RETRIEVAL' };
}

export function priorityScore(pCross, deltaTraffic, hours) {
  const h = Math.max(Number(hours) || 1, 0.25);
  return Math.round(((Number(pCross) || 0) * (Number(deltaTraffic) || 0)) / h * 100) / 100;
}

// Binding constraint: the loop never silently stops — it documents why it cannot advance.
export function bindingConstraint(row, attempts) {
  const rank = Number(row.rank || RANK_FLOOR);
  if (rank <= GOAL_RANK) return null;
  if (attempts >= 6 && row.gap_type === 'AUTHORITY') {
    return 'Authority gap: on-page work exhausted. Requires earned link acquisition from higher-authority domains.';
  }
  if (attempts >= 6 && ['EXCLUDED_NOINDEX', 'EXCLUDED_ROBOTS'].includes(row.index_state)) {
    return 'URL is excluded from indexing at the site level. Requires a change outside this engine.';
  }
  if (attempts >= 10) {
    return 'All evidence-based on-page interventions applied without crossing the boundary. Awaiting new measured evidence.';
  }
  return null;
}

export function newCycleId() {
  return `cyc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function pageAll(query, pageSize = 500) {
  const out = [];
  let skip = 0;
  for (let i = 0; i < 20; i += 1) {
    const batch = await query(pageSize, skip);
    out.push(...batch);
    if (batch.length < pageSize) break;
    skip += pageSize;
  }
  return out;
}