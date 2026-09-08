// Shared orchestration spine for the deterministic autonomous system.
// Imported by MasterOrchestrator, DeliveryGuarantee, and AutonomousConvergence.
// Every function here is pure, deterministic, and side-effect free.

// The fixed phase order. Same state → same execution path. Never reorder.
export const ALL_PHASES = [
  'sync',       // SyncSearchConsole — pull fresh GSC data
  'reflect',    // AreReflect — measure current state, classify gaps
  'detect',     // DetectAsymmetries — find asymmetry-class gaps
  'suggest',    // AreSuggest — generate evidence-anchored recommendations
  'implement',  // AreImplement — queue treatments for deployment
  'fix',        // FixEngine — fix blocked rows (batched)
  'validate',   // ValidateSystem — check system health
  'deliver',    // DeliveryGuarantee — audit against pricing promises
];

// Default batch sizes — tuned to stay under execution time limits.
export const FIX_BATCH_SIZE = 5;
export const SUGGEST_BATCH_SIZE = 12;
export const IMPLEMENT_BATCH_SIZE = 10;

// Generate a deterministic cycle ID from timestamp (no randomness).
export function cycleId() {
  return `cyc_${Date.now().toString(36)}`;
}

// Sleep helper for rate-limiting between batched calls.
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run a function with retry and exponential backoff.
// Returns { ok, result, error, attempts } — never throws.
export async function withRetry(fn, maxAttempts = 2, baseDelayMs = 1000) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return { ok: true, result, error: null, attempts: attempt };
    } catch (e) {
      lastError = e;
      if (attempt < maxAttempts) await sleep(baseDelayMs * attempt);
    }
  }
  return { ok: false, result: null, error: lastError?.message || 'Unknown error', attempts: maxAttempts };
}

// Chunk an array into batches of size n.
export function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// Write an immutable proof receipt.
export async function writeReceipt(svc, { kind, summary, detail, source, provenance = 'MEASURED' }) {
  try {
    await svc.entities.Receipt.create({
      kind,
      summary: String(summary || '').slice(0, 500),
      detail: String(detail || '').slice(0, 8000),
      source,
      provenance,
      occurred_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[orchestration] Failed to write receipt:', e.message);
  }
}

// Write a telemetry record.
export async function writeTelemetry(svc, { runType, subsystem, status, startedAt, recordsWritten, message, durationMs }) {
  try {
    await svc.entities.RunTelemetry.create({
      run_type: runType,
      subsystem,
      status,
      started_at: startedAt,
      duration_ms: durationMs || (Date.now() - new Date(startedAt).getTime()),
      records_written: recordsWritten || 0,
      message: String(message || '').slice(0, 500),
    });
  } catch (e) {
    console.error('[orchestration] Failed to write telemetry:', e.message);
  }
}

// Invoke a backend function safely via the service role.
// Returns { ok, data, error } — never throws.
export async function safeInvoke(svc, functionName, args) {
  try {
    const res = await svc.functions.invoke(functionName, args);
    return { ok: true, data: res?.data || res, error: null };
  } catch (e) {
    console.error(`[orchestration] ${functionName} failed:`, e.message);
    return { ok: false, data: null, error: e.message };
  }
}