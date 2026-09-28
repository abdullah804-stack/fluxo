// lib/reports/weekly.ts
import { prisma } from "@/lib/prisma";

export interface WeeklyReport {
  periodStart: Date;
  periodEnd: Date;
  orderCount: number;
  revenue: number;
  paid: number;
  unpaid: number;
  topProducts: { name: string; count: number }[];
  repeatCustomers: { name: string; count: number }[];
  bestDay: { date: Date; amount: number } | null;
  currency: string;
  businessName: string;
}

/**
 * Computes the weekly report for one WhatsApp account.
 * "This week" = the 7 days ending now (Monday → Sunday when called from cron).
 */
export async function computeWeeklyReport(
  accountId: string
): Promise<WeeklyReport | null> {
  const account = await prisma.whatsAppAccount.findUnique({
    where: { id: accountId },
    include: { user: true },
  });
  if (!account) return null;

  const currency = account.user.baseCurrency || "USD";
   console.log("[weekly] baseCurrency from DB:", account.user.baseCurrency, "→ using:", currency);
  const businessName =
    account.displayName || account.user.name || "Business";

  // Period: last 7 days (rolling). The cron runs Monday, so this covers
  // Mon→Sun of the previous week.
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - 7 * 864e5);

  const orders = await prisma.order.findMany({
    where: {
      whatsappAccountId: accountId,
      createdAt: { gte: periodStart, lte: periodEnd },
      status: { not: "cancelled" },
    },
    include: { customer: true },
  });

  const orderCount = orders.length;

  const amountOf = (o: (typeof orders)[number]) =>
    Number(o.baseAmount ?? o.originalAmount ?? o.total ?? 0);

  const revenue = orders.reduce((s, o) => s + amountOf(o), 0);
  const paid = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((s, o) => s + amountOf(o), 0);
  const unpaid = revenue - paid;

  // Top products — count item names across all orders.
  const productCounts = new Map<string, number>();
  for (const o of orders) {
    if (!Array.isArray(o.items)) continue;
    for (const it of o.items as { name?: string; quantity?: number }[]) {
      const name = (it.name || "").trim().toLowerCase();
      if (!name) continue;
      const qty = it.quantity ?? 1;
      productCounts.set(name, (productCounts.get(name) ?? 0) + qty);
    }
  }
  const topProducts = [...productCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Repeat customers — anyone with 2+ orders total (all-time).
  const customerOrderCounts = new Map<
    string,
    { name: string; count: number }
  >();
  const allTimeOrders = await prisma.order.findMany({
    where: {
      whatsappAccountId: accountId,
      status: { not: "cancelled" },
    },
    include: { customer: true },
  });
  for (const o of allTimeOrders) {
    const key = o.customerId;
    const displayName =
      o.recipientName || o.customer.name || o.customer.phone;
    const existing = customerOrderCounts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      customerOrderCounts.set(key, { name: displayName, count: 1 });
    }
  }
  const repeatCustomers = [...customerOrderCounts.values()]
    .filter((c) => c.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Best day — highest single-day revenue this week.
  const byDay = new Map<string, number>();
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + amountOf(o));
  }
  let bestDay: { date: Date; amount: number } | null = null;
  for (const [key, amount] of byDay) {
    if (!bestDay || amount > bestDay.amount) {
      bestDay = { date: new Date(key), amount };
    }
  }

  return {
    periodStart,
    periodEnd,
    orderCount,
    revenue,
    paid,
    unpaid,
    topProducts,
    repeatCustomers,
    bestDay,
    currency,
    businessName,
  };
}

/**
 * Formats a WeeklyReport into a WhatsApp-friendly text message.
 */
export function formatWeeklyReport(r: WeeklyReport): string {
  const fmt = (n: number) => formatAmount(n, r.currency);
  const dateStr = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const lines: string[] = [];

  lines.push(`📊 *Weekly Report*`);
  lines.push(`${dateStr(r.periodStart)} – ${dateStr(r.periodEnd)}`);
  lines.push("");

  lines.push(`*Summary*`);
  lines.push(`Orders: ${r.orderCount}`);
  lines.push(`Revenue: ${fmt(r.revenue)}`);
  lines.push(`Paid: ${fmt(r.paid)}`);
  lines.push(`Unpaid: ${fmt(r.unpaid)}`);

  if (r.topProducts.length > 0) {
    lines.push("");
    lines.push(`*Top products*`);
    r.topProducts.forEach((p, i) => {
      lines.push(`${i + 1}. ${p.name} — ${p.count}`);
    });
  }

  if (r.repeatCustomers.length > 0) {
    lines.push("");
    lines.push(`*Repeat customers*`);
    lines.push(
      r.repeatCustomers.map((c) => `${c.name} (${c.count})`).join(" · ")
    );
  }

  if (r.bestDay) {
    lines.push("");
    lines.push(`*Best day*`);
    const dayName = r.bestDay.date.toLocaleDateString("en-US", {
      weekday: "long",
    });
    lines.push(`${dayName} — ${fmt(r.bestDay.amount)}`);
  }

  return lines.join("\n");
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