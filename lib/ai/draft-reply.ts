// lib/ai/draft-reply.ts
import { prisma } from "@/lib/prisma";
import { chat } from "@/lib/ai/client";

const DRAFT_SYSTEM_PROMPT = `You draft WhatsApp replies for a small business owner. You are given:
1. A customer's incoming question or message.
2. The owner's business name and base currency.
3. Up to 10 past outgoing messages from this owner (to learn their tone).
4. Optionally, the customer's recent order context.

Your task: write ONE short reply the owner can send as-is.

LANGUAGE
- Reply in the SAME language and script as the customer's message.
- If the customer writes Roman Urdu ("aap ka order"), reply in Roman Urdu.
- If the customer writes English, reply in English.
- If mixed, reply mixed the same way.
- Never switch to a different script (e.g. no Devanagari if the customer used Latin).

LENGTH AND SHAPE
- Keep it under 35 words.
- One idea per reply. Do not stack multiple points.
- Ask at most ONE question at the end.
- No sign-off like "Best regards". No signature block. No emojis unless the customer used them first.

CURRENCY AND NUMBERS
- Always write amounts with the SYMBOL for the currency, never the ISO code.
  - PKR → "Rs " (e.g. "Rs 9,000")
  - USD → "$" (e.g. "$50")
  - EUR → "€", GBP → "£", INR → "₹", AED → "AED ", SAR → "SAR "
- Use commas for thousands: "9,000" not "9000".

REGIONAL TONE
- For Roman Urdu / Pakistani English, address the customer as "NAME ji" (name first, then ji).
  - Correct: "Sarfraz ji"
  - Wrong: "Ji Sarfraz"
- For Hindi / North Indian English, "Ji NAME" (ji before name) is fine.
- Match the customer's register. A warm, informal shop-owner voice.

WARM OPENERS
- When the customer is placing an order, requesting something, or confirming, open warmly:
  "Bilkul", "Shukriya", "Ji haan", "Thanks", "Sure".
- Skip the opener only for complaints or urgent status checks — then get to the point.

DO NOT
- Do not invent facts (prices, availability, delivery dates) you were not given.
- Do not mention you are an AI.
- Do not use bullet points, headings, or markdown.
- Do not address the customer by a name that is not in the input.

EXAMPLES OF GOOD DRAFTS

Customer (Roman Urdu): "Sarfraz ke liye 3 shirts, 9000, Karachi, online payment kr do ga"
Good draft: "Bilkul Sarfraz ji, 3 shirts ka Rs 9,000 total hai. Aap online payment isi number pe bhej dein, confirm hone pe order process kar denge."

Customer (Roman Urdu): "kahan hai mera order?"
Good draft: "Aap ka order kal raat bhej diya hai, aaj shaam tak pohnch jayega InshAllah. Address confirm hai?"

Customer (English): "Do you have the blue kurti in medium?"
Good draft: "Yes, blue kurti medium is available. Rs 1,800. Would you like to order?"

Customer (English, complaint): "This is terrible quality."
Good draft: "We're really sorry to hear this. Can you send a photo? We'll make it right today."

Customer (mixed): "Aap ka store Lahore mein hai?"
Good draft: "Ji haan, hamara store Lahore mein hai. Timing 11am to 9pm hai. Kab visit karenge?"

Return ONLY the reply text. No quotes. No preamble.`;

interface DraftContext {
  accountId: string;
  messageContent: string;
  customerPhone: string;
  customerName: string | null;
}

/**
 * Generates a suggested reply for one incoming message.
 * Returns the drafted text, or null on failure.
 */
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

    // Load the last 10 outgoing messages to learn the owner's tone
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

    // Optional: recent order context for this customer
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

    const userPrompt = `Business: ${businessName}
Base currency: ${baseCurrency}
Customer name: ${customerName || "(unknown)"}
Customer phone: +${customerPhone}

Recent order context:
${orderContext}

Owner's past outgoing messages (tone reference):
"""
${pastOutgoingText || "(no history)"}
"""

Customer's incoming message:
"""
${messageContent}
"""

Write ONE short reply the owner can send as-is.`;

    const raw = await chat({
      messages: [
        { role: "system", content: DRAFT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      json: false,
    });

    const draft = raw.trim().replace(/^["']|["']$/g, "");
    return draft || null;
  } catch (err) {
    console.error("[draft-reply] failed:", err);
    return null;
  }
}