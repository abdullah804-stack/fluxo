// lib/ai/groq-vision.ts

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_VISION_MODEL = "qwen/qwen3.8-27b";

interface GroqVisionOptions {
  systemPrompt: string;
  userText: string;
  imageDataUrl: string;
  temperature?: number;
}

/**
 * Calls Groq's vision-capable chat completions API with an image + text.
 * Returns the raw content string, or null on failure.
 */
export async function groqVision({
  systemPrompt,
  userText,
  imageDataUrl,
  temperature = 0.1,
}: GroqVisionOptions): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[groq-vision] GROQ_API_KEY not set");
    return null;
  }

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
            body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        temperature,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[groq-vision] error ${res.status}: ${text}`);
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === "string" && content.trim() ? content : null;
  } catch (error) {
    console.error("[groq-vision] failed:", error);
    return null;
  }
}