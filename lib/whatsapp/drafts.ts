// lib/whatsapp/drafts.ts
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send";

const EXPIRY_HOURS = 24;

/**
 * Creates or updates the pending draft for a given inbound message.
 * Uses `messageId` as the unique key — regenerating replaces the old one.
 */
export async function createPendingDraft({
  accountId,
  messageId,
  customerPhone,
  customerName,
  draftText,
}: {
  accountId: string;
  messageId: string;
  customerPhone: string;
  customerName: string | null;
  draftText: string;
}) {
  const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 3600 * 1000);

  return prisma.pendingDraft.upsert({
    where: { messageId },
    update: {
      draftText,
      customerName,
      customerPhone,
      status: "pending",
      sentAt: null,
      expiresAt,
      createdAt: new Date(),
    },
    create: {
      whatsappAccountId: accountId,
      messageId,
      customerPhone,
      customerName,
      draftText,
      status: "pending",
      expiresAt,
    },
  });
}

/**
 * Finds the pending draft matching a customer name (fuzzy, case-insensitive).
 * Returns at most 2 matches so the caller can decide ambiguity.
 *
 * Excludes drafts that have expired (expiresAt < now) even if the cron
 * hasn't run yet — so the owner never sees stale entries.
 */
export async function findPendingDraftsByName({
  accountId,
  name,
}: {
  accountId: string;
  name: string;
}) {
  return prisma.pendingDraft.findMany({
    where: {
      whatsappAccountId: accountId,
      status: "pending",
      expiresAt: { gt: new Date() },
      OR: [
        { customerName: { contains: name, mode: "insensitive" } },
        // Fallback: match by customer phone if the name lookup misses
        { customerPhone: { contains: name } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

/**
 * Sends the pending draft's text to the customer, marks the draft as sent,
 * and returns the outcome.
 */
export async function approveAndSendDraft(draftId: string): Promise<{
  ok: boolean;
  customerPhone?: string;
  draftText?: string;
  error?: string;
}> {
  const draft = await prisma.pendingDraft.findUnique({
    where: { id: draftId },
  });

  if (!draft) {
    return { ok: false, error: "Draft not found" };
  }

  if (draft.status !== "pending") {
    return {
      ok: false,
      error: `Draft is already ${draft.status}`,
    };
  }

  if (draft.expiresAt.getTime() < Date.now()) {
    await prisma.pendingDraft.update({
      where: { id: draft.id },
      data: { status: "expired" },
    });
    return { ok: false, error: "Draft has expired" };
  }

  const sent = await sendWhatsAppMessage(draft.customerPhone, draft.draftText);

  if (!sent) {
    return { ok: false, error: "Failed to send to customer" };
  }

  await prisma.pendingDraft.update({
    where: { id: draft.id },
    data: { status: "sent", sentAt: new Date() },
  });

  // Also log the outgoing message so the dashboard shows it
  try {
    await prisma.message.create({
      data: {
        whatsappAccountId: draft.whatsappAccountId,
        waMessageId: `out-draft-${draft.id}`,
        direction: "out",
        fromNumber: "",
        toNumber: draft.customerPhone,
        type: "text",
        content: draft.draftText,
        rawPayload: {} as any,
      },
    });
  } catch (err) {
    console.warn("[drafts] failed to log outgoing message:", err);
  }

  return {
    ok: true,
    customerPhone: draft.customerPhone,
    draftText: draft.draftText,
  };
}

/**
 * Marks a pending draft as skipped.
 */
export async function skipDraft(draftId: string) {
  return prisma.pendingDraft.update({
    where: { id: draftId },
    data: { status: "skipped" },
  });
}

/**
 * Replaces the pending draft text (used by the edit command in session 2).
 */
export async function editDraftText(draftId: string, newText: string) {
  return prisma.pendingDraft.update({
    where: { id: draftId },
    data: { draftText: newText },
  });
}

/**
 * Marks every expired pending draft for this account as expired.
 * Called by the daily cron in session 3.
 */
export async function expireStaleDrafts(accountId: string) {
  const result = await prisma.pendingDraft.updateMany({
    where: {
      whatsappAccountId: accountId,
      status: "pending",
      expiresAt: { lt: new Date() },
    },
    data: { status: "expired" },
  });
  return result.count;
}