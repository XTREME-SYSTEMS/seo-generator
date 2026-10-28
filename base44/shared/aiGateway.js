/**
 * Single AI gateway for backend functions. Same policy as src/lib/ai.js.
 *
 * Callers pass the client they already resolved (user-scoped base44 or
 * base44.asServiceRole); the gateway never escalates privileges itself.
 *
 * Usage:
 *   const { data, meta } = await invokeAI(base44, { prompt, responseJsonSchema });
 *   const raw = await invokeLLM(base44, { prompt, response_json_schema });  // legacy shape
 */

export const REASONING_MODEL = 'gpt_5_6_sol';
export const FAST_MODEL = 'gpt_5_6_luna';
export const WEB_MODEL = 'gemini_3_8_flash';

const REASONING_CHAIN = [REASONING_MODEL, FAST_MODEL, undefined];
const WEB_CHAIN = [WEB_MODEL, undefined];
const RETIRED = new Set(['gpt_5_mini', 'openai/gpt-4o-mini', 'gpt-4o-mini', 'gpt-4o']);

function chainFor(addInternetContext, legacyModel, tier) {
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
  throw error;
}

export async function invokeAI(base44, { prompt, responseJsonSchema, addInternetContext = false, fileUrls, tier = 'reasoning', legacyModel } = {}) {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    const error = new Error('AI request blocked: a prompt is required.');
    error.code = 'AI_BLOCKED';
    throw error;
  }

  const files = Array.isArray(fileUrls) && fileUrls.length ? fileUrls : undefined;
  if (addInternetContext && files) {
    const error = new Error('AI request blocked: live web context and file attachments cannot be combined.');
    error.code = 'AI_BLOCKED';
    throw error;
  }

  const chain = chainFor(addInternetContext, legacyModel, tier);
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
        ...(files ? { file_urls: files } : {}),
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
      if (error && error.code === 'AI_INVALID_RESPONSE') throw error;
      failure = { model: model || 'automatic', message: (error && error.message) || String(error) };
    }
  }

  const error = new Error((failure && failure.message) || 'AI request failed');
  error.code = 'AI_FAILED';
  error.model = failure && failure.model;
  throw error;
}

// Legacy-shaped call (snake_case params, raw payload back) so existing
// functions gain the gateway's policy without restructuring their bodies.
export async function invokeLLM(base44, { prompt, response_json_schema, add_context_from_internet, file_urls, model, tier } = {}) {
  const { data } = await invokeAI(base44, {
    prompt,
    responseJsonSchema: response_json_schema,
    addInternetContext: Boolean(add_context_from_internet),
    fileUrls: file_urls,
    tier: tier || 'reasoning',
    legacyModel: model,
  });
  return data;
}