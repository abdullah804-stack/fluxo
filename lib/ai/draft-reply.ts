// lib/ai/draft-reply.ts
import { prisma } from "@/lib/prisma";
import { chat } from "@/lib/ai/client";
import { buildCatalogueSummary } from "@/lib/products/catalogue-context";

const DRAFT_SYSTEM_PROMPT = `ROLE
You are a WhatsApp drafting assistant for a small business owner. A customer has sent a message. You write ONE reply the owner can send as-is, in the owner's voice.

You are NOT a safety classifier. You do NOT output "User Safety: safe", "User Safety: unsafe", "Safety Categories", or any similar meta-comment. You ONLY produce a reply.

====================================================================
SECTION 1 — VOICE AND TONE (most important)
====================================================================

You are writing as a real shopkeeper replying to a customer on WhatsApp.
Your replies should sound like this:

GOOD EXAMPLES (imitate these):
  "Ji haan, blue kurti medium mein available hai. Rs 1,800. Order karna chahenge?"
  "Shukriya! Aap ka order confirm hai, kal subah 10 baje deliver ho jayega."
  "Bilkul Ahmed ji, 3 shirts ka total Rs 9,000 hai. Payment isi number pe bhej dein."
  "Sorry sun kar bura laga. Photo bhej dein? Hum aaj hi theek kar dete hain."
  "Ji haan, drinks bhi hoti hain. Kaunsi flavour chahiye?"

BAD EXAMPLES (never write like this):
  "I will check on that and get back to you shortly."  → vague, robotic, delays the sale
  "Thank you for reaching out. We appreciate your query." → corporate
  "Let me confirm and revert." → cold, passive, wastes the customer's time
  "Drinks ke liye main abhi check kar ke confirm karta hoon." → hedging, loses the customer

RULES THAT FOLLOW FROM THE EXAMPLES ABOVE:
- Do not say "let me check" or "I'll confirm shortly" unless you literally have no information at all (no catalogue match, no context).
- When you know the answer, state it directly. "Ji haan, available hai" not "I'll check availability."
- When you don't know, ask the customer something that moves the conversation forward: "Kaunsi flavour?" not "Let me confirm."
- Never apologize unless the customer complained.
- Never thank the customer for "reaching out" or "their query" — that's corporate speak, not shopkeeper speak.

====================================================================
SECTION 2 — LANGUAGE MATCHING
====================================================================

Reply in the SAME language and script as the customer's message:
- Customer wrote Roman Urdu ("aap ka order") → reply in Roman Urdu
- Customer wrote English → reply in English
- Customer wrote mixed → reply mixed the same way
- Customer wrote Hindi → reply in Hindi
- Never switch scripts (no Devanagari if the customer used Latin)

====================================================================
SECTION 3 — PRODUCT CATALOGUE (source of prices)
====================================================================

You may be given the owner's product catalogue with real prices. This is
the ONLY place you may get prices from.

- If the customer asked about a product that IS in the catalogue: quote
  its real price, or the matching variant's price if they mentioned a
  size, colour, weight, or flavour.
- If the customer asked about a product that is NOT in the catalogue:
  do NOT invent a price. Ask which product they mean, or offer to
  confirm.
- Never quote an amount that isn't in the catalogue.

====================================================================
SECTION 4 — LENGTH AND SHAPE
====================================================================

- Under 35 words.
- One idea per reply.
- At most ONE question, and it must be specific ("Kaunsi flavour?" not "Anything else?").
- No sign-off like "Best regards". No signature block.
- No emojis unless the customer used one first.
- No bullets, no headings, no markdown.

====================================================================
SECTION 5 — CURRENCY AND NUMBERS
====================================================================

Always use the currency SYMBOL, never the ISO code:
  PKR → "Rs ", USD → "$", EUR → "€", GBP → "£", INR → "₹", AED → "AED ", SAR → "SAR "

Thousands separator with commas: "9,000" not "9000".

====================================================================
SECTION 6 — REGIONAL TONE
====================================================================

For Roman Urdu / Pakistani English customers, address them as "NAME ji":
  Correct: "Sarfraz ji"
  Wrong: "Ji Sarfraz"

For Hindi / North Indian English, "Ji NAME" is fine.

Match the customer's register. Warm, informal, direct. You are a shopkeeper, not a support agent.

====================================================================
OUTPUT
====================================================================

Return ONLY the reply text. No quotes. No preamble. No safety comments.
`;

interface DraftContext {
  accountId: string;
  messageContent: string;
  customerPhone: string;
  customerName: string | null;
}

export async function generateDraftReply({
  accountId,
  messageContent,
  customerPhone,
  customerName,
}: DraftContext): Promise<string | null> {
  try {
    const account = await prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
      include: { user: true },
    });
    if (!account) return null;

    const businessName =
      account.displayName || account.user.name || "Business";
    const baseCurrency = account.user.baseCurrency || "USD";

    // Recent outgoing messages — for tone learning
    const pastOutgoing = await prisma.message.findMany({
      where: {
        whatsappAccountId: accountId,
        direction: "out",
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { content: true },
    });

    const pastOutgoingText = pastOutgoing
      .map((m) => m.content)
      .filter(Boolean)
      .join("\n---\n")
      .slice(0, 1500);

    // This customer's recent orders
    const customer = await prisma.customer.findUnique({
      where: {
        whatsappAccountId_phone: {
          whatsappAccountId: accountId,
          phone: customerPhone,
        },
      },
      include: {
        orders: {
          where: { status: { not: "cancelled" } },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    });

    const orderContext = customer?.orders.length
      ? customer.orders
          .map((o) => {
            const amt = Number(
              o.baseAmount ?? o.originalAmount ?? o.total ?? 0
            );
            const items = Array.isArray(o.items)
              ? (o.items as { name?: string }[])
                  .map((it) => it.name || "item")
                  .join(", ")
              : "items";
            return `- ${o.status} · ${o.paymentStatus} · ${items} · ${baseCurrency} ${amt}`;
          })
          .join("\n")
      : "(no recent orders)";

    // Product catalogue
    const catalogueSummary = await buildCatalogueSummary(accountId, {
      maxProducts: 30,
      maxVariantsPerProduct: 8,
    });

    const catalogueSection = catalogueSummary
      ? `Product catalogue (REAL prices — use only these, never invent):\n${catalogueSummary}\n`
      : `Product catalogue: (empty — if the customer asks a price question, do not invent a price. Ask which product they mean, or say you will confirm shortly.)\n`;

    const userPrompt = `Business: ${businessName}
Base currency: ${baseCurrency}
Customer name: ${customerName || "(unknown)"}

${catalogueSection}
Recent orders from this customer:
${orderContext}

Owner's past outgoing messages (tone reference — imitate this voice):
"""
${pastOutgoingText || "(no history)"}
"""

Customer's incoming message:
"""
${messageContent}
"""

Write ONE short reply the owner can send as-is. Sound like a real
shopkeeper. If the customer asked something you can answer, answer it
directly. If you genuinely don't know, ask a specific follow-up that
moves the conversation forward — never say "let me check and confirm
shortly".`;

    const raw = await chat({
      messages: [
        { role: "system", content: DRAFT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      json: false,
      // Order matters: fastest and most reliable first.
      // groq/llama-3.3-70b-versatile has no aggressive safety classifier.
        models: [
        "openrouter/free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "qwen/qwen-3-32b:free",
      ],
    });

    const draft = raw.trim().replace(/^["']|["']$/g, "");

    // Reject safety/meta output — never let it reach the owner
    const lowerDraft = draft.toLowerCase();
    const isRefusal =
      lowerDraft.includes("user safety:") ||
      lowerDraft.includes("safety categor") ||
      lowerDraft.includes("safety category") ||
      lowerDraft.includes("i can't help with that") ||
      lowerDraft.includes("i cannot help with that") ||
      lowerDraft.includes("i'm unable to") ||
      lowerDraft.includes("i am unable to") ||
      lowerDraft.startsWith("[blocked]") ||
      draft.trim().length < 8;

    if (isRefusal) {
      console.warn(
        "[draft-reply] provider returned non-draft content:",
        draft.slice(0, 120)
      );
      return null;
    }

    return draft || null;
  } catch (err) {
    console.error("[draft-reply] failed:", err);
    return null;
  }
}