// lib/ai/client.ts
import { getFreeTextModels } from "./openrouter-models";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  >;
}

interface ChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  models?: string[];
  maxRetries?: number;
  /** Force JSON output. Default true (extraction use case). Set false for text output. */
  json?: boolean;
}

/**
 * Free VISION models on OpenRouter. These support image input.
 * Vision models are less subject to retirement than text ones, so a
 * static list is acceptable here. If one retires, the next is tried.
 */
export const VISION_MODEL_FALLBACKS = [
  "allenai/molmo-2-8b:free",
  "nvidia/nemotron-nano-12b-v2-vl:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "google/gemma-4-26b-a4b-it:free",
];

/**
 * Get the current text model list. Uses runtime discovery so we
 * automatically pick up OpenRouter's current free models.
 *
 * If OPENROUTER_MODEL is set in env, it goes first.
 */
async function getTextModelList(): Promise<string[]> {
  const discovered = await getFreeTextModels();
  const primary = process.env.OPENROUTER_MODEL;

  if (primary && !discovered.includes(primary)) {
    return [primary, ...discovered];
  }
  if (primary) {
    return [primary, ...discovered.filter((m) => m !== primary)];
  }
  return discovered;
}

export async function chat({
  messages,
  temperature = 0.2,
  models,
  maxRetries = 2,
  json = true,
}: ChatOptions): Promise<string> {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  const modelList = models || (await getTextModelList());
  let lastError: Error | null = null;

  for (const model of modelList) {
    console.log(`[AI] Trying: ${model}`);

    const isGroq = model.startsWith("groq/");
    const endpoint = isGroq
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://openrouter.ai/api/v1/chat/completions";
    const key = isGroq ? groqKey : openrouterKey;
    const actualModel = isGroq ? model.slice("groq/".length) : model;

    if (!key) {
      const keyName = isGroq ? "GROQ_API_KEY" : "OPENROUTER_API_KEY";
      console.warn(`[AI] ${model} skipped — ${keyName} not set`);
      continue;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            ...(isGroq
              ? {}
              : {
                  "HTTP-Referer": "https://fluxo.app",
                  "X-Title": "Fluxo",
                }),
          },
          body: JSON.stringify({
            model: actualModel,
            messages,
            temperature,
            ...(json
              ? { response_format: { type: "json_object" } }
              : {}),
            ...(isGroq
              ? { max_tokens: 900 }
              : {
                  provider: {
                    sort: "throughput",
                    allow_fallbacks: true,
                    require_parameters: true,
                  },
                }),
          }),
        });

        if (res.status >= 500 || res.status === 429) {
          const text = await res.text();
          lastError = new Error(
            `${isGroq ? "Groq" : "OpenRouter"} ${res.status}: ${text}`
          );
          console.warn(
            `[AI] ${model} attempt ${attempt}/${maxRetries} → ${res.status}`
          );
          if (attempt < maxRetries) {
            await new Promise((r) =>
              setTimeout(r, 800 * Math.pow(2, attempt - 1))
            );
            continue;
          }
          break;
        }

        if (!res.ok) {
          const text = await res.text();
          lastError = new Error(
            `${isGroq ? "Groq" : "OpenRouter"} error ${res.status}: ${text}`
          );
          console.warn(
            `[AI] ${model} HTTP ${res.status}: ${text.slice(0, 160)}`
          );
          break;
        }

        const data = await res.json();
        const content =
          data?.choices?.[0]?.message?.content ||
          data?.choices?.[0]?.message?.reasoning_content ||
          "";

        if (!content) {
          lastError = new Error("Empty response from model");
          console.warn(`[AI] ${model} returned empty content`);
          break;
        }

        console.log(`[AI] ✓ Success with ${model}`);
        return content;
      } catch (error: any) {
        lastError = error;
        console.warn(`[AI] ${model} threw: ${error.message}`);
        if (attempt < maxRetries) {
          await new Promise((r) =>
            setTimeout(r, 800 * Math.pow(2, attempt - 1))
          );
          continue;
        }
        break;
      }
    }
  }

  throw new Error(lastError?.message || "All models failed");
}

export function extractJson(raw: string): string {
  const s = raw.trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = (fenced?.[1] ?? s).trim();

  try {
    JSON.parse(candidate);
    return candidate;
  } catch {}

  const start = candidate.search(/[\[{]/);
  if (start < 0) throw new Error("No JSON in response");

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < candidate.length; i++) {
    const char = candidate[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{" || char === "[") depth++;
    else if (char === "}" || char === "]") {
      depth--;
      if (depth === 0) return candidate.slice(start, i + 1);
    }
  }
  return candidate;
}