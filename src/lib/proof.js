// Proof level system — the proof-first spine of the OS.
// Level 0 is modeled only; level 7 is confirmed paid-search replacement.
// Nothing below 5 may be presented as demonstrated value.
export const PROOF_LABELS = {
  0: 'Modeled only',
  1: 'Exact ranking improved',
  2: 'Organic visibility increased',
  3: 'Qualified organic leads increased',
  4: 'Organic revenue increased',
  5: 'Paid-equivalent value demonstrated',
  6: 'Controlled budget reduction held performance',
  7: 'Confirmed paid-search replacement',
};

export function proofTone(level) {
  if (level >= 7) return 'confirmed';
  if (level >= 5) return 'strong';
  if (level >= 2) return 'progress';
  return 'modeled';
}

export const PROOF_CLASS = {
  MODELED_ONLY: 'Modeled only',
  GSC_AGGREGATED: 'GSC aggregated',
  INDEPENDENT_SERP: 'Independent SERP',
  DUAL_VERIFIED: 'Dual verified',
  MANUAL_VERIFIED: 'Manual verified',
};