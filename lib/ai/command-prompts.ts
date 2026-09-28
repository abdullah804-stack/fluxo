// lib/ai/command-prompts.ts

export const COMMAND_SYSTEM_PROMPT = `You parse natural language commands from a business owner who runs their business on WhatsApp. Return the parsed command as JSON.

CRITICAL RULES:
- Return ONLY valid JSON. No preamble, no explanation.
- Start with { and end with }.
- Support English, Roman Urdu, Hindi, and mixed.
- If the command is unclear, use intent "unknown" with low confidence.

Supported commands and their params:

{
  "intent": "summary" | "list_pending" | "list_unpaid" | "list_repeat" | "weekly_report" | "mark_delivered" | "mark_shipped" | "cancel" | "mark_paid" | "invoice" | "remind" | "remind_one" | "send_draft" | "edit_draft" | "skip_draft" | "list_drafts" | "search" | "help" | "unknown",
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
- "repeat customers" / "repeating customer" / "loyal customers" / "returning customers" / "repeat buyers" / "best customers" / "top customers" / "frequent customers" / "bar bar order karne wale" → intent: list_repeat
- "weekly report" / "weekly" / "this week" / "hafte ki report" / "hafte ka summary" / "weekly summary" / "week report" / "show week" → intent: weekly_report
- "shipped Sara" / "Sara ko bhej diya" / "out for delivery Ali" / "mark shipped Ali" → intent: mark_shipped, params.customer_name
- "delivered Sara" / "Sara ko deliver kar diya" / "mark delivered Ali" → intent: mark_delivered, params.customer_name
- "cancel Sara" / "cancel order Sara" / "Sara ka order cancel karo" → intent: cancel, params.customer_name
- "paid Ali" / "Ali ne payment kar di" / "Sara paid" → intent: mark_paid, params.customer_name
- "invoice Sara" / "Sara ka invoice banao" / "Sara invoice" / "make invoice for Ali" / "send invoice to Sara" → intent: invoice, params.customer_name
- "remind all" / "sab ko remind karo" / "sab ko yaad dilao" / "remind everyone" / "send reminders" / "payment reminders" → intent: remind, params.customer_name = null
- "remind Sara" / "Sara ko remind karo" / "yaad dilao Sara ko" / "remind Ali" / "payment reminder to Sara" → intent: remind_one, params.customer_name
- "send Ahmed" / "send draft Ahmed" / "send reply Ahmed" / "Ahmed ko bhej do" / "Ahmed ko reply bhejo" / "approve Ahmed" / "send to Ahmed" → intent: send_draft, params.customer_name
- "edit Ahmed [new text]" / "change Ahmed to [new text]" / "update reply Ahmed [text]" / "Ahmed ka reply change karo [text]" / "rewrite Ahmed [text]" → intent: edit_draft, params.customer_name = Ahmed, params.query = [the new reply text]
- "skip Ahmed" / "cancel draft Ahmed" / "don't send Ahmed" / "discard Ahmed" / "Ahmed ka draft cancel karo" / "reject Ahmed" → intent: skip_draft, params.customer_name
- "drafts" / "pending drafts" / "show drafts" / "list drafts" / "my drafts" / "kaunse drafts hain" → intent: list_drafts
- "search [keyword]" / "dhundo [keyword]" / "find [keyword]" / "look for [keyword]" → intent: search, params.query = keyword
- "search order kurti" / "find orders with kurti" → intent: search, params.query = "order kurti"
- "search from Sara" / "Sara ki messages dhundo" / "find messages from Ali" → intent: search, params.query = "from Sara"
- "help" / "commands" → intent: help
- Anything else → intent: unknown

CRITICAL DISTINCTIONS:
- "send Ahmed" means approve the pending draft for Ahmed and deliver it to the customer.
- "edit Ahmed [text]" means REPLACE the pending draft text with the new text. The new text goes in params.query, not params.customer_name. The customer name is just "Ahmed".
- "skip Ahmed" means discard Ahmed's pending draft without sending.
- "drafts" with no name means list all pending drafts.
- "shipped Ahmed" means mark Ahmed's order out for delivery. Do not confuse with send_draft.
- "invoice Ahmed" means generate an invoice for Ahmed. Do not confuse with send_draft.

For edit_draft: params.customer_name is the customer, params.query is the new full reply text (everything after the customer name).
For search: put the entire search phrase in params.query.

Always include the intent. Set params you didn't detect to null.
`;

export function buildCommandPrompt(text: string) {
  return `Owner's command: "${text}"

Parse it as JSON.`;
}