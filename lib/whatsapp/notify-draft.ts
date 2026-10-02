// lib/whatsapp/notify-draft.ts
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send";
import { generateDraftReply } from "@/lib/ai/draft-reply";
import { createPendingDraft } from "@/lib/whatsapp/drafts";

export async function notifyOwnerWithDraft({
  messageId,
  accountId,
  userId,
  customerPhone,
  messageContent,
}: {
  messageId: string;
  accountId: string;
  userId: string;
  customerPhone: string;
  messageContent: string;
}): Promise<void> {
  try {
    const owner = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!owner) return;

    if (!owner.draftNotifications) {
      return;
    }

    const account = await prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) return;

    const customer = await prisma.customer.findUnique({
      where: {
        whatsappAccountId_phone: {
          whatsappAccountId: accountId,
          phone: customerPhone,
        },
      },
      select: { name: true },
    });

    const draft = await generateDraftReply({
      accountId,
      messageContent,
      customerPhone,
      customerName: customer?.name ?? null,
    });

    if (!draft) {
      console.warn("[notify-draft] generation failed for message", messageId);
      return;
    }

    // Store on the message row (dashboard reads this)
    const payload = {
      text: draft,
      generatedAt: new Date().toISOString(),
    };
    await prisma.message.update({
      where: { id: messageId },
      data: { draftReply: payload as any },
    });

    // Also create a PendingDraft so the owner can approve it later with
    // `send [name]`.
    await createPendingDraft({
      accountId,
      messageId,
      customerPhone,
      customerName: customer?.name ?? null,
      draftText: draft,
    });

    // Count how many pending drafts exist for this account right now.
    // If there's more than one, the reply will need a snippet to
    // disambiguate them.
    const pendingCount = await prisma.pendingDraft.count({
      where: {
        whatsappAccountId: accountId,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
    });

    const displayName = customer?.name || customerPhone || "a customer";
    const preview =
      draft.length > 80 ? draft.slice(0, 80) + "…" : draft;

    const lines = [
      `💡 *Draft ready for ${displayName}*`,
      ``,
      `_"${preview}"_`,
      ``,
    ];

    if (pendingCount === 1) {
      // Only one pending draft → bare commands work
      lines.push(`Reply *send* to approve`);
      lines.push(`Reply *edit [new text]* to change`);
      lines.push(`Reply *skip* to ignore`);
    } else {
      // Multiple → the owner needs to reference it by number from the
      // list they'll get when they type `drafts`.
      lines.push(`_You have ${pendingCount} pending drafts._`);
      lines.push(`Reply *drafts* to see them all`);
      lines.push(`Reply *send [number]* to send one`);
    }

    const body = lines.join("\n");

    const ownerNumber = account.phoneNumber.replace(/\D/g, "");
    await sendWhatsAppMessage(ownerNumber, body);

    console.log(
      "[notify-draft] sent draft + created PendingDraft for",
      customerPhone
    );
  } catch (err) {
    console.error("[notify-draft] failed:", err);
  }
}