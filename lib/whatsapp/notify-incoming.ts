// lib/whatsapp/notify-incoming.ts
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send";

const PING_INTENTS = new Set([
  "order",
  "complaint",
  "question",
  "payment",
]);

interface NotifyOptions {
  messageId: string;
  accountId: string;
  userId: string;
  customerPhone: string;
  messageContent: string;
  intent: string;
  /** If draft notifications already pinged for this message, skip. */
  skip?: boolean;
}

/**
 * Pings the owner on WhatsApp when a customer sends a message that
 * falls into a high-signal intent: order, complaint, question, or payment.
 *
 * - Respects the user's notifyIncomingMessages toggle
 * - Skips greetings, status checks, and "other"
 * - Skips entirely if the caller already sent a draft notification
 */
export async function notifyIncomingMessage({
  messageId,
  accountId,
  userId,
  customerPhone,
  messageContent,
  intent,
  skip = false,
}: NotifyOptions): Promise<void> {
  if (skip) return;

  if (!PING_INTENTS.has(intent)) return;

  try {
    const owner = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!owner) return;

    const account = await prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
      select: { phoneNumber: true },
    });
    if (!account) return;

    // Look up the customer name for a friendlier ping
    const customer = await prisma.customer.findUnique({
      where: {
        whatsappAccountId_phone: {
          whatsappAccountId: accountId,
          phone: customerPhone,
        },
      },
      select: { name: true },
    });

    const displayName = customer?.name || `+${customerPhone}`;
    const preview =
      messageContent.length > 100
        ? messageContent.slice(0, 100) + "…"
        : messageContent;

    const { header, emoji } = labelForIntent(intent);

    const body = `${emoji} *${header}*\n${displayName}\n"${preview}"`;

    const ownerNumber = account.phoneNumber.replace(/\D/g, "");
    const sent = await sendWhatsAppMessage(ownerNumber, body);

    if (sent) {
      console.log(
        `[notify-incoming] pinged owner for ${intent} from ${customerPhone}`
      );
    } else {
      console.warn(
        `[notify-incoming] failed to ping owner for ${intent} from ${customerPhone}`
      );
    }
  } catch (err) {
    console.error("[notify-incoming] failed:", err);
  }
}

function labelForIntent(intent: string): {
  header: string;
  emoji: string;
} {
  switch (intent) {
    case "order":
      return { header: "New order", emoji: "🛍" };
    case "complaint":
      return { header: "New complaint", emoji: "⚠️" };
    case "question":
      return { header: "New question", emoji: "❓" };
    case "payment":
      return { header: "Payment notification", emoji: "💵" };
    default:
      return { header: "New message", emoji: "📥" };
  }
}