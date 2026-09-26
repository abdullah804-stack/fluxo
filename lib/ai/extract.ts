import { chat, extractJson } from "@/lib/ai/client";
import { EXTRACTOR_SYSTEM_PROMPT, buildExtractorPrompt } from "@/lib/ai/prompts";

export interface ExtractedMessage {
  intent: string;
  confidence: number;
  language: string;
  customer: { name: string | null; phone: string | null };
    order: {
    items: { name: string; quantity: number | null; price: number | null }[];
    total: number | null;
    currency: string | null;
    currency_confidence: number | null;
    currency_reasoning: string | null;
    payment_method: string | null;
    address: string | null;
  } | null;
}

const VALID_INTENTS = [
  "order",
  "complaint",
  "question",
  "payment",
  "status_check",
  "greeting",
  "other",
];

export async function extractMessage(
  messageText: string,
  businessName: string
): Promise<ExtractedMessage> {
  const raw = await chat({
    messages: [
      { role: "system", content: EXTRACTOR_SYSTEM_PROMPT },
      { role: "user", content: buildExtractorPrompt(messageText, businessName) },
    ],
    temperature: 0.1,
  });

  const cleaned = extractJson(raw);

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned invalid JSON: " + cleaned.slice(0, 200));
  }

  // Validate and normalize
  if (!VALID_INTENTS.includes(parsed.intent)) {
    parsed.intent = "other";
  }

  parsed.confidence =
    typeof parsed.confidence === "number"
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.5;

  parsed.language = parsed.language || "other";

  parsed.customer = parsed.customer || { name: null, phone: null };

  if (parsed.order && !Array.isArray(parsed.order.items)) {
    parsed.order = null;
  }

  return parsed as ExtractedMessage;
}