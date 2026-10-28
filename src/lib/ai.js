import { base44 } from '@/api/base44Client';

/**
 * Single AI gateway for the browser bundle.
 *
 * Everything that reasons, plans, classifies or generates goes through here so
 * model policy, fallback, duplicate suppression and honest metadata live in one
 * place instead of being re-guessed at each call site.
 *
 * Runtime facts this policy is built on (verified against the live workspace):
 *   - gpt_5_6_sol            -> answers, and resolves to the gpt_6_sol engine
 *   - gpt_5_6_luna           -> answers (cheaper same-family fallback)
 *   - gemini_3_8_flash       -> the ONLY model that accepts live web context
 *   - gpt_5_6_sol + web      -> hard 400, so web requests are routed by the gateway
 */

export const AI_STATUS = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  COMPLETE: 'COMPLETE',
  FAILED: 'FAILED',
  BLOCKED: 'BLOCKED',
};

export const REASONING_MODEL = 'gpt_5_6_sol';
export const FAST_MODEL = 'gpt_5_6_luna';
export const WEB_MODEL = 'gemini_3_8_flash';

// First attempt plus at most two automatic retries.
const REASONING_CHAIN = [REASONING_MODEL, FAST_MODEL, undefined];
const WEB_CHAIN = [WEB_MODEL, undefined];

// Ids that no longer resolve to the engine the call site intended.
const RETIRED = new Set(['gpt_5_mini', 'openai/gpt-4o-mini', 'gpt-4o-mini', 'gpt-4o']);

const inFlight = new Map();

function chainFor({ addInternetContext, legacyModel, tier }) {
  if (addInternetContext) return WEB_CHAIN;
  const deliberate = legacyModel && !RETIRED.has(legacyModel) ? legacyModel : null;
  if (deliberate) return [deliberate, ...REASONING_CHAIN];
  if (tier === 'fast') return [FAST_MODEL, ...REASONING_CHAIN];
  return REASONING_CHAIN;
}

function assertShape(data, schema) {
  if (!schema || !Array.isArray(schema.required)) return;
  const missing = schema.required.filter((key) => !data || data[key] === undefined || data[key] === null);
  if (!missing.length) return;
  const error = new Error(`AI response missing required field(s): ${missing.join(', ')}`);
  error.code = 'AI_INVALID_RESPONSE';
  error.missing = missing;
  throw error;
}

async function execute({ prompt, responseJsonSchema, addInternetContext, fileUrls, tier, legacyModel }) {
  const chain = chainFor({ addInternetContext, legacyModel, tier });
  const started = Date.now();
  let failure = null;

  for (let attempt = 0; attempt < chain.length && attempt <= 2; attempt += 1) {
    const model = chain[attempt];
    try {
      const raw = await base44.integrations.Core.InvokeLLM({
        prompt,
        ...(model ? { model } : {}),
        ...(responseJsonSchema ? { response_json_schema: responseJsonSchema } : {}),
        ...(addInternetContext ? { add_context_from_internet: true } : {}),
        ...(fileUrls ? { file_urls: fileUrls } : {}),
      });
      assertShape(raw, responseJsonSchema);
      return {
        data: raw,
        meta: {
          requested_model: legacyModel || model || 'automatic',
          actual_model: model || 'automatic',
          status: 'GENERATED',
          verification: 'GENERATED_ONLY',
          tier,
          attempts: attempt + 1,
          fallback_used: Boolean(failure),
          duration_ms: Date.now() - started,
          ...(failure ? { fallback_from: failure.model, fallback_reason: failure.message } : {}),
        },
      };
    } catch (error) {
      // A well-formed answer of the wrong shape is a real failure, not a model problem.
      if (error?.code === 'AI_INVALID_RESPONSE') throw error;
      failure = { model: model || 'automatic', message: error?.message || String(error) };
    }
  }

  const error = new Error(failure?.message || 'AI request failed');
  error.code = 'AI_FAILED';
  error.model = failure?.model;
  throw error;
}

/**
 * @returns {Promise<{data: any, meta: object}>} generated payload plus honest provenance
 */
export function invokeAI({
  prompt,
  responseJsonSchema,
  addInternetContext = false,
  fileUrls,
  tier = 'reasoning',
  legacyModel,
}) {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    const error = new Error('AI request blocked: a prompt is required.');
    error.code = 'AI_BLOCKED';
    return Promise.reject(error);
  }

  const files = Array.isArray(fileUrls) && fileUrls.length ? fileUrls : undefined;
  if (addInternetContext && files) {
    const error = new Error('AI request blocked: live web context and file attachments cannot be combined.');
    error.code = 'AI_BLOCKED';
    return Promise.reject(error);
  }

  const signature = JSON.stringify([prompt, responseJsonSchema || null, addInternetContext, files || null, tier, legacyModel || null]);
  if (inFlight.has(signature)) return inFlight.get(signature);

  const request = execute({ prompt, responseJsonSchema, addInternetContext, fileUrls: files, tier, legacyModel })
    .finally(() => inFlight.delete(signature));
  inFlight.set(signature, request);
  return request;
}

/**
 * Legacy-shaped call (snake_case params, raw payload back) so existing call
 * sites gain the gateway's policy without changing their surroundings.
 */
export async function invokeLLM({ prompt, response_json_schema, add_context_from_internet, file_urls, model, tier } = {}) {
  const { data, meta } = await invokeAI({
    prompt,
    responseJsonSchema: response_json_schema,
    addInternetContext: Boolean(add_context_from_internet),
    fileUrls: file_urls,
    tier: tier || 'reasoning',
    legacyModel: model,
  });
  if (typeof window !== 'undefined') window.__lastAIMeta = meta;
  return data;
}

// Convenience for callers that only want text (copilots, field writers).
export async function invokeText({ prompt, ...rest }) {
  const { data } = await invokeAI({ prompt, ...rest });
  if (typeof data === 'string') return data;
  return (data?.text || data?.output || JSON.stringify(data) || '').trim();
}