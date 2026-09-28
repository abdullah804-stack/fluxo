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

    const displayName = customer?.name || customerPhone || "a customer";
    const header = `💡 *Suggested reply for ${displayName}*`;
    const body = `${header}\n\n${draft}\n\n_Reply *send ${displayName}* to send it, or *_edit ${displayName} [new text]*_ to change it. Skip with *skip ${displayName}*._`;

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