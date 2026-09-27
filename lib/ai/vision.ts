// lib/ai/vision.ts

import { chat, extractJson, VISION_MODEL_FALLBACKS } from "@/lib/ai/client";
import { groqVision } from "@/lib/ai/groq-vision";

const VISION_SYSTEM_PROMPT = `You analyze images sent to a small business on WhatsApp. Customers send payment screenshots, product photos, delivery proofs, and questions.

Return ONLY valid JSON. No preamble, no markdown, no explanation.

Return JSON in this exact shape:

{
  "imageType": "payment_screenshot" | "product_photo" | "delivery_proof" | "question_image" | "other",
  "confidence": 0.0-1.0,
  "payment": {
    "amount": number | null,
    "currency": string | null,
    "method": string | null,
    "recipient_name": string | null,
    "sender_name": string | null,
    "reference": string | null
  } | null,
  "product": {
    "name": string | null,
    "description": string | null,
    "quantity": number | null
  } | null,
  "text_in_image": string | null,
  "notes": string | null
}

PAYMENT SCREENSHOT INSTRUCTIONS (HIGHEST PRIORITY):
- Common payment apps in Pakistan: Easypaisa, JazzCash, Sadapay, NayaPay, Raast, HBL, Meezan, UBL, Bank Alfalah.
- International: Wise, PayPal, Stripe, Revolut, Cash App, Venmo.
- These screenshots typically show:
  - A green checkmark or "Success" / "Successful" / "Completed" / "Sent"
  - An amount (e.g., "Rs. 3,500.00", "PKR 3500", "500.00")
  - A recipient name ("Paid to Sara", "To: Ali Khan")
  - A sender name ("From: Your Account")
  - A transaction ID or reference number (long numeric or alphanumeric string)
  - A date/time
- If you see a payment confirmation, set imageType to "payment_screenshot" with confidence >= 0.85.
- Extract the AMOUNT as a plain number (3500, not "Rs. 3,500.00").
- Extract the CURRENCY as ISO 4217 (PKR, USD, EUR, AED, etc.). If the screenshot shows "Rs." or "PKR", use PKR. If it shows "$" or "USD", use USD.
- Extract the METHOD as the app name lowercase (easypaisa, jazzcash, sadapay, nayapay, wise, paypal, stripe, etc.).
- Read the recipient and sender names exactly as shown in the screenshot.
- Transcribe any visible transaction ID in reference.

PRODUCT PHOTO INSTRUCTIONS:
- Set imageType to "product_photo" if the image shows a physical product (clothing, electronics, furniture, food, etc.).
- Describe the product in 3-6 words (e.g., "black leather handbag", "red saree with gold trim").
- If multiple products are visible, describe the most prominent one.

DELIVERY PROOF INSTRUCTIONS:
- Set imageType to "delivery_proof" for courier receipts, package photos with tracking labels, or delivery confirmation screens.

TEXT IN IMAGE:
- If any text is clearly visible, transcribe it in text_in_image (up to 200 characters).

LANGUAGE:
- Payment screenshots may contain Urdu, English, or mixed text. Read both scripts.
- Output only Latin/Roman characters in all text fields (transliterate if needed).

BE HONEST:
- If you're unsure what the image shows, use imageType "other" with low confidence.
- If you cannot read the amount confidently, set amount to null. Do not guess.
- If the screenshot is partially visible or blurry, set confidence accordingly.
OUTPUT RULES (MANDATORY):
- Do NOT include any reasoning, thinking, or explanations.
- Do NOT use any <thinking> tags or similar.
- Return ONLY the JSON object. Start with { and end with }.
- Keep the entire JSON response under 600 tokens.`;

export interface ImageAnalysis {
  imageType: string;
  confidence: number;
  payment: {
    amount: number | null;
    currency: string | null;
    method: string | null;
    recipient_name: string | null;
    sender_name: string | null;
    reference: string | null;
  } | null;
  product: {
    name: string | null;
    description: string | null;
    quantity: number | null;
  } | null;
  text_in_image: string | null;
  notes: string | null;
}

export async function analyzeImage(
  base64DataUrl: string,
  context: { businessName: string; baseCurrency: string; customerPhone: string }
): Promise<ImageAnalysis | null> {
  const userText = `Business: ${context.businessName}
Base currency: ${context.baseCurrency}
Customer phone: ${context.customerPhone}

Analyze the image below and return JSON.`;

  // ---------------------------------------------------------------
  // 1. Try Groq vision first (free, reliable)
  // ---------------------------------------------------------------
  try {
    console.log("[vision] trying Groq first");
    const groqRaw = await groqVision({
      systemPrompt: VISION_SYSTEM_PROMPT,
      userText,
      imageDataUrl: base64DataUrl,
    });

    if (groqRaw) {
      const cleaned = extractJson(groqRaw);
      const parsed = JSON.parse(cleaned) as ImageAnalysis;
      parsed.confidence =
        typeof parsed.confidence === "number"
          ? Math.max(0, Math.min(1, parsed.confidence))
          : 0.5;
      console.log("[vision] ✓ Groq succeeded");
      return parsed;
    }

    console.warn("[vision] Groq returned null, falling back to OpenRouter");
  } catch (err) {
    console.warn("[vision] Groq threw, falling back to OpenRouter:", err);
  }

  // ---------------------------------------------------------------
  // 2. Fall back to OpenRouter free vision models
  // ---------------------------------------------------------------
  try {
    console.log("[vision] trying OpenRouter fallback list");
    const raw = await chat({
      messages: [
        { role: "system", content: VISION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: base64DataUrl } },
          ],
        },
      ],
      temperature: 0.1,
      models: VISION_MODEL_FALLBACKS,
    });

    const cleaned = extractJson(raw);
    const parsed = JSON.parse(cleaned) as ImageAnalysis;
    parsed.confidence =
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5;
    console.log("[vision] ✓ OpenRouter succeeded");
    return parsed;
  } catch (error) {
    console.error("[vision] all providers failed:", error);
    return null;
  }
}