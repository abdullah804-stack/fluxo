// lib/whatsapp/notify-high-value.ts
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send";

/**
 * Sends a high-value order alert to the owner if the order's baseAmount
 * crosses the owner's threshold.
 *
 * - Does nothing if the owner hasn't set a threshold (null = off)
 * - Uses baseAmount for comparison, so mixed currencies work correctly
 * - Sends to the owner's own WhatsApp number, not the customer
 */
export async function notifyHighValueOrder({
  orderId,
  accountId,
  userId,
}: {
  orderId: string;
  accountId: string;
  userId: string;
}): Promise<void> {
  try {
    const owner = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!owner) return;

    const threshold = owner.highValueThreshold;
    if (threshold === null || threshold === undefined || threshold <= 0) {
      return; // notifications off
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order) return;

    const baseAmount = Number(order.baseAmount ?? 0);
    if (baseAmount < threshold) {
      return; // below threshold — no alert
    }

    const account = await prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) return;

    const baseCurrency = owner.baseCurrency || "USD";
    const displayName =
      order.recipientName || order.customer.name || order.customer.phone;

    // Item summary — "3 × suit, 1 × shirt"
    const items = Array.isArray(order.items)
      ? (order.items as { name?: string; quantity?: number }[])
      : [];
    const itemsText =
      items.length === 0
        ? "No items"
        : items
            .map((it) => `${it.quantity ?? 1} × ${it.name ?? "item"}`)
            .join(", ");

    const amountText = formatAmount(baseAmount, baseCurrency);
    const paymentLabel =
      order.paymentStatus === "paid" ? "Paid ✓" : "Unpaid";

    const body = [
      `🔔 *High-value order*`,
      ``,
      `${displayName} — ${amountText}`,
      `Items: ${itemsText}`,
      `Payment: ${paymentLabel}`,
      ``,
      `Quick replies:`,
      `• *invoice ${displayName}*`,
      `• *paid ${displayName}*`,
      `• *shipped ${displayName}*`,
    ].join("\n");

    const ownerNumber = account.phoneNumber.replace(/\D/g, "");
    const sent = await sendWhatsAppMessage(ownerNumber, body);

    if (sent) {
      console.log(
        `[notify-high-value] alerted owner for order ${order.id} (${amountText})`
      );
    } else {
      console.warn(
        `[notify-high-value] failed to alert for order ${order.id}`
      );
    }
  } catch (err) {
    console.error("[notify-high-value] failed:", err);
  }
}

function formatAmount(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    PKR: "Rs ",
    INR: "₹",
    AED: "AED ",
    SAR: "SAR ",
    BDT: "৳",
    NGN: "₦",
  };
  const sym = symbols[currency] || `${currency} `;
  const n = Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: Number(amount) % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${sym}${n}`;
}