// lib/whatsapp/reminders.ts
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send";

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Sends one reminder per customer that has unpaid orders. Skips customers
 * whose most recent reminder was within the cooldown window.
 *
 * Returns a summary: how many were sent, skipped, and the total still owed.
 */
export async function sendRemindersForAccount(
  accountId: string,
  opts: { customerName?: string | null } = {}
): Promise<{
  sent: number;
  skipped: number;
  failed: number;
  totalOwed: number;
  currency: string;
  recipients: string[];
}> {
  const account = await prisma.whatsAppAccount.findUnique({
    where: { id: accountId },
    include: { user: true },
  });

  if (!account) {
    return {
      sent: 0,
      skipped: 0,
      failed: 0,
      totalOwed: 0,
      currency: "USD",
      recipients: [],
    };
  }

  const baseCurrency = account.user.baseCurrency || "USD";
  const businessName = account.displayName || account.user.name || "your seller";

  // Find every unpaid order (optionally scoped to one customer name).
  const unpaidOrders = await prisma.order.findMany({
    where: {
      whatsappAccountId: accountId,
      paymentStatus: "unpaid",
      status: { not: "cancelled" },
      ...(opts.customerName
        ? {
            OR: [
              {
                recipientName: {
                  contains: opts.customerName,
                  mode: "insensitive",
                },
              },
              {
                customer: {
                  name: {
                    contains: opts.customerName,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: { customer: true },
    orderBy: { createdAt: "asc" },
  });

  if (unpaidOrders.length === 0) {
    return {
      sent: 0,
      skipped: 0,
      failed: 0,
      totalOwed: 0,
      currency: baseCurrency,
      recipients: [],
    };
  }

  // Group by customerId.
  const byCustomer = new Map<
    string,
    {
      customerId: string;
      phone: string;
      name: string | null;
      orders: typeof unpaidOrders;
    }
  >();

  for (const o of unpaidOrders) {
    const key = o.customerId;
    if (!byCustomer.has(key)) {
      byCustomer.set(key, {
        customerId: o.customerId,
        phone: o.customer.phone,
        name:
          o.recipientName ||
          o.customer.name ||
          null,
        orders: [],
      });
    }
    byCustomer.get(key)!.orders.push(o);
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let totalOwed = 0;
  const recipients: string[] = [];

  const now = Date.now();

  for (const group of byCustomer.values()) {
    // Cooldown: if every order for this customer was reminded recently, skip.
    const mostRecentReminder = group.orders.reduce<Date | null>((acc, o) => {
      if (!o.lastRemindedAt) return acc;
      if (!acc) return o.lastRemindedAt;
      return o.lastRemindedAt > acc ? o.lastRemindedAt : acc;
    }, null);

    if (
      mostRecentReminder &&
      now - mostRecentReminder.getTime() < COOLDOWN_MS
    ) {
      skipped++;
      continue;
    }

    const orderTotals = group.orders.reduce(
      (sum, o) => sum + Number(o.baseAmount ?? o.total ?? 0),
      0
    );
    totalOwed += orderTotals;

    const displayName = group.name || "there";
    const orderCount = group.orders.length;

    const lines = group.orders.map((o) => {
      const summary = firstItemSummary(o.items);
      const amount = formatAmount(
        Number(o.baseAmount ?? o.originalAmount ?? o.total ?? 0),
        baseCurrency
      );
      return `• ${summary} — ${amount}`;
    });

    const message =
      `Hi ${displayName}, this is a friendly reminder from ${businessName}.\n\n` +
      `You have ${orderCount} unpaid order${orderCount > 1 ? "s" : ""}:\n` +
      `${lines.join("\n")}\n\n` +
      `Total: ${formatAmount(orderTotals, baseCurrency)}\n\n` +
      `Reply here once you've sent the payment. Thank you!`;

    const ok = await sendWhatsAppMessage(group.phone, message);

    if (ok) {
      sent++;
      recipients.push(displayName);

      // Mark every order in this group as reminded.
      await prisma.order.updateMany({
        where: { id: { in: group.orders.map((o) => o.id) } },
        data: { lastRemindedAt: new Date() },
      });
    } else {
      failed++;
    }
  }

  return {
    sent,
    skipped,
    failed,
    totalOwed,
    currency: baseCurrency,
    recipients,
  };
}

function firstItemSummary(items: unknown): string {
  if (!Array.isArray(items) || items.length === 0) return "order";
  const first = items[0] as { name?: string; quantity?: number };
  const name = first.name || "item";
  const qty = first.quantity ?? 1;
  return items.length > 1
    ? `${name} ×${qty} +${items.length - 1} more`
    : `${name} ×${qty}`;
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