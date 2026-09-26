export const COMMAND_SYSTEM_PROMPT = `You parse natural language commands from a business owner who runs their business on WhatsApp. Return the parsed command as JSON.

CRITICAL RULES:
- Return ONLY valid JSON. No preamble, no explanation.
- Start with { and end with }.
- Support English, Roman Urdu, Hindi, and mixed.
- If the command is unclear, use intent "unknown" with low confidence.

Supported commands and their params:

{
  "intent": "summary" | "list_pending" | "list_unpaid" | "mark_delivered" | "mark_paid" | "invoice" | "remind" | "search" | "help" | "unknown",
  "confidence": 0.0-1.0,
  "params": {
    "customer_name": string | null,
    "status": string | null,
    "query": string | null
  }
}

INTERPRETATION:

- "summary" / "summary dikhao" / "aaj ka summary" → intent: summary
- "pending" / "show pending" / "pending orders" → intent: list_pending
- "who owes me" / "kis ne paise nahi diye" / "unpaid" → intent: list_unpaid
- "delivered Sara" / "Sara ko deliver kar diya" / "mark delivered Ali" → intent: mark_delivered, params.customer_name
- "paid Ali" / "Ali ne payment kar di" / "Sara paid" → intent: mark_paid, params.customer_name
- "invoice Sara" / "Sara ka invoice banao" → intent: invoice, params.customer_name
- "remind all" / "sab ko remind karo" → intent: remind
- "search [keyword]" / "dhundo [keyword]" → intent: search, params.query
- "help" / "commands" → intent: help
- Anything else → intent: unknown

Always include the intent. Set params you didn't detect to null.
`;

export function buildCommandPrompt(text: string) {
  return `Owner's command: "${text}"

Parse it as JSON.`;
}