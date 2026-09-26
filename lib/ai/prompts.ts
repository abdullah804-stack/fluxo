// lib/ai/prompts.ts
export const EXTRACTOR_SYSTEM_PROMPT = `You analyze WhatsApp messages sent to a small business. Extract the business meaning and return it as JSON.

CRITICAL RULES:
- Return ONLY valid JSON. No preamble, no thinking, no markdown.
- Start with { and end with }.
- Only extract what is ACTUALLY in the message. Never invent.
- If a field isn't present, set it to null. Do not guess.
- Support English, Urdu (Roman script), Hindi (Roman script), and mixed language.

Return JSON in this exact shape:

{
  "intent": "order" | "complaint" | "question" | "payment" | "status_check" | "greeting" | "other",
  "confidence": 0.0-1.0,
  "language": "english" | "urdu" | "roman_urdu" | "hindi" | "mixed" | "other",
  "customer": {
    "name": string | null,
    "phone": string | null
  },
  "order": {
    "items": [ { "name": string, "quantity": number | null, "price": number | null } ],
    "total": number | null,
    "currency": string | null,
    "currency_confidence": 0.0-1.0,
    "currency_reasoning": string | null,
    "payment_method": string | null,
    "address": string | null
  } | null,
  "question": string | null,
  "complaint": string | null,
  "status_reference": string | null,
  "notes": string | null
}

INTERPRETATION GUIDELINES:
- "2 suits, 3500, COD" → order with 2 items, total 3500, payment_method COD
- "kahan hai mera order?" → intent: status_check, language: roman_urdu
- "Ali ke liye 1 kurti, 1200" → order, customer.name = "Ali"
- "Out of stock kab hoga?" → intent: question
- "Worst quality" → intent: complaint
- "Shukriya" → intent: greeting, language: roman_urdu

CURRENCY DETECTION:
1. If the message contains an explicit currency symbol or code 
   ($, €, £, Rs, PKR, USD, EUR, INR, AED, SAR, etc.), use that. 
   Set currency_confidence to 0.9 or higher.

2. Otherwise, look at the customer's phone country code provided in the 
   prompt. Use this mapping:
   +92 → PKR    +91 → INR    +880 → BDT   +1 → USD
   +44 → GBP    +971 → AED   +966 → SAR   +234 → NGN
   +27 → ZAR    +62 → IDR    +60 → MYR    +63 → PHP
   +84 → VND    +90 → TRY    +20 → EGP    +7 → RUB
   +86 → CNY    +81 → JPY    +61 → AUD    +33 → EUR
   
   When inferring from the phone code, set currency_confidence to 0.75.

3. If no phone code is provided, fall back to the seller's base currency 
   (also provided in the prompt). Set currency_confidence to 0.6.

4. Always include currency_reasoning explaining how you decided.

Return ISO 4217 codes only. If you truly cannot determine a currency, 
return null and set currency_confidence to 0.
`;

export function buildExtractorPrompt(messageText: string, businessName: string) {
  return `Business: ${businessName}

Incoming message from customer:
"""
${messageText}
"""

Extract the business meaning as JSON.`;
}