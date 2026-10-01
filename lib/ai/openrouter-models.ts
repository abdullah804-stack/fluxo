// lib/ai/openrouter-models.ts

/**
 * Discovers the currently-available free text models on OpenRouter,
 * cached for 24 hours.
 *
 * Why: hardcoded slugs go stale. OpenRouter retires free models without
 * notice, and any hardcoded list breaks. This fetches the live list and
 * filters for what we need.
 *
 * Falls back to a hardcoded safe list if the discovery call fails, so
 * the AI pipeline never stalls on discovery problems.
 */

interface OpenRouterModel {
  id: string;
  name: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  architecture?: {
    modality?: string;
    input_modalities?: string[];
  };
  supported_parameters?: string[];
}

interface Cache {
  models: string[];
  fetchedAt: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
let cache: Cache | null = null;

/**
 * A conservative hardcoded list used when discovery fails.
 * These are widely available and support JSON mode.
 */
const HARDCODED_FALLBACK = [
  "openrouter/free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen-3-32b:free",
  "deepseek/deepseek-chat-v3.1:free",
  "mistralai/mistral-nemo:free",
  "google/gemma-2-9b-it:free",
];

/**
 * Models we always want tried first, in this order, if they're available.
 */
const PREFERRED_ORDER = [
  "openrouter/free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen-3-32b:free",
  "deepseek/deepseek-chat-v3.1:free",
  "mistralai/mistral-nemo:free",
];

/**
 * Models we never use — known to be unreliable, too small, or
 * incompatible with our JSON-output requirement.
 */
const BLOCKED_SLUGS = new Set([
  // reasoning-only models that don't return usable text
  "deepseek/deepseek-r1:free",
  "deepseek/deepseek-r1-distill-llama-70b:free",
  // models with tiny context windows
  "google/gemma-2-2b-it:free",
]);

function isFree(model: OpenRouterModel): boolean {
  const p = model.pricing?.prompt;
  const c = model.pricing?.completion;
  return p === "0" && c === "0";
}

function supportsJsonMode(model: OpenRouterModel): boolean {
  const params = model.supported_parameters ?? [];
  return (
    params.includes("response_format") ||
    params.includes("structured_outputs")
  );
}

function isTextOnly(model: OpenRouterModel): boolean {
  const modality = model.architecture?.modality ?? "";
  // Accept text->text, and text+image->text (vision models also handle text)
  return modality.startsWith("text");
}

function hasEnoughContext(model: OpenRouterModel): boolean {
  return (model.context_length ?? 0) >= 8000;
}

/**
 * Fetch the free-model list from OpenRouter, cache for 24h, and return
 * an ordered list of model slugs to try.
 *
 * On any failure, returns a hardcoded safe list.
 */
export async function getFreeTextModels(): Promise<string[]> {
  // Serve from cache if fresh
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.models;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("[models] OPENROUTER_API_KEY not set — using hardcoded list");
    return HARDCODED_FALLBACK;
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://fluxo.app",
        "X-Title": "Fluxo",
      },
      // Short timeout — don't block the pipeline on discovery
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn(
        `[models] discovery HTTP ${res.status} — using hardcoded list`
      );
      return HARDCODED_FALLBACK;
    }

    const data = await res.json();
    const all: OpenRouterModel[] = data?.data ?? [];

    // Filter for models we can actually use
    const eligible = all
      .filter((m) => {
        if (!m.id) return false;
        if (BLOCKED_SLUGS.has(m.id)) return false;
        if (!m.id.endsWith(":free") && m.id !== "openrouter/free") return false;
        if (!isFree(m)) return false;
        if (!supportsJsonMode(m)) return false;
        if (!isTextOnly(m)) return false;
        if (!hasEnoughContext(m)) return false;
        return true;
      })
      .map((m) => m.id);

    // Order: preferred first, then everything else alphabetically
    const preferred = PREFERRED_ORDER.filter((slug) =>
      eligible.includes(slug)
    );
    const remaining = eligible
      .filter((slug) => !preferred.includes(slug))
      .sort();

    const ordered = [...preferred, ...remaining].slice(0, 8); // cap at 8

    if (ordered.length === 0) {
      console.warn("[models] no eligible free models found — using hardcoded");
      return HARDCODED_FALLBACK;
    }

    console.log(
      `[models] discovered ${ordered.length} free text models:`,
      ordered.join(", ")
    );

    cache = { models: ordered, fetchedAt: Date.now() };
    return ordered;
  } catch (err) {
    console.warn("[models] discovery failed — using hardcoded list:", err);
    return HARDCODED_FALLBACK;
  }
}

/**
 * Manually invalidate the cache. Useful for testing.
 */
export function clearModelCache() {
  cache = null;
}