interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  models?: string[];
  maxRetries?: number;
}

const MODEL_FALLBACKS = [
  "openrouter/free",
  "openai/gpt-oss-20b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen-3-32b:free",
];

function getModelList(): string[] {
  const primary = process.env.OPENROUTER_MODEL;
  if (primary && !MODEL_FALLBACKS.includes(primary)) {
    return [primary, ...MODEL_FALLBACKS];
  }
  if (primary) {
    return [primary, ...MODEL_FALLBACKS.filter((m) => m !== primary)];
  }
  return MODEL_FALLBACKS;
}

export async function chat({
  messages,
  temperature = 0.2,
  models,
  maxRetries = 2,
}: ChatOptions): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const modelList = models || getModelList();
  let lastError: Error | null = null;

  for (const model of modelList) {
    console.log(`[AI] Trying: ${model}`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://fluxo.app",
              "X-Title": "Fluxo",
            },
            body: JSON.stringify({
              model,
              messages,
              temperature,
              response_format: { type: "json_object" },
              provider: {
                sort: "throughput",
                allow_fallbacks: true,
                require_parameters: true,
              },
            }),
          }
        );

        if (res.status >= 500 || res.status === 429) {
          const text = await res.text();
          lastError = new Error(`OpenRouter ${res.status}: ${text}`);
          console.warn(`[AI] ${model} attempt ${attempt}/${maxRetries} → ${res.status}`);
          if (attempt < maxRetries) {
            await new Promise((r) =>
              setTimeout(r, 1000 * Math.pow(2, attempt - 1))
            );
            continue;
          }
          break;
        }

        if (!res.ok) {
          const text = await res.text();
          lastError = new Error(`OpenRouter error ${res.status}: ${text}`);
          break;
        }

        const data = await res.json();
        const content =
          data?.choices?.[0]?.message?.content ||
          data?.choices?.[0]?.message?.reasoning_content ||
          "";

        if (!content) {
          lastError = new Error("Empty response from model");
          break;
        }

        console.log(`[AI] ✓ Success with ${model}`);
        return content;
      } catch (error: any) {
        lastError = error;
        console.warn(`[AI] ${model} threw: ${error.message}`);
        if (attempt < maxRetries) {
          await new Promise((r) =>
            setTimeout(r, 1000 * Math.pow(2, attempt - 1))
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