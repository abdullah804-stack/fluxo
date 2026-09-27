// lib/whatsapp/search.ts
import { prisma } from "@/lib/prisma";

export interface SearchResult {
  id: string;
  content: string;
  fromNumber: string;
  direction: string;
  intent: string | null;
  createdAt: Date;
  senderName: string | null;
  orderId: string | null;
  amount: number | null;
  currency: string | null;
}

interface SearchOptions {
  accountId: string;
  query: string;
  limit?: number;
}

/**
 * Free-text search across a WhatsApp account's messages.
 *
 * Supports optional prefixes inside the query string:
 *   "order kurti"       → only messages whose intent is "order"
 *   "question suit"     → only messages whose intent is "question"
 *   "payment 5000"      → only payment-intent messages
 *   "from Sara"         → messages from a sender whose name matches "Sara"
 *
 * Any remaining words are matched against the message content
 * (case-insensitive substring).
 */
export async function searchMessages({
  accountId,
  query,
  limit = 5,
}: SearchOptions): Promise<SearchResult[]> {
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  let intentFilter: string | null = null;
  let senderNameFilter: string | null = null;
  const contentTokens: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].toLowerCase();

    if (
      (t === "order" ||
        t === "question" ||
        t === "complaint" ||
        t === "payment" ||
        t === "status_check" ||
        t === "greeting") &&
      intentFilter === null
    ) {
      intentFilter = t;
      continue;
    }

    if (t === "from" && i + 1 < tokens.length) {
      senderNameFilter = tokens.slice(i + 1).join(" ");
      break;
    }

    contentTokens.push(tokens[i]);
  }

  const contentQuery = contentTokens.join(" ").trim();

  const rows = await prisma.message.findMany({
    where: {
      whatsappAccountId: accountId,
      ...(contentQuery
        ? { content: { contains: contentQuery, mode: "insensitive" } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Resolve customer names for senders — best-effort.
  const phoneNumbers = [...new Set(rows.map((r) => r.fromNumber))];
  const customers = await prisma.customer.findMany({
    where: {
      whatsappAccountId: accountId,
      phone: { in: phoneNumbers },
    },
    select: { phone: true, name: true },
  });
  const nameByPhone = new Map<string, string | null>();
  for (const c of customers) nameByPhone.set(c.phone, c.name);

  // Resolve related orders (sourceMessageId is the Message.id).
  const messageIds = rows.map((r) => r.id);
  const orders = await prisma.order.findMany({
    where: {
      whatsappAccountId: accountId,
      sourceMessageId: { in: messageIds },
    },
    select: {
      id: true,
      sourceMessageId: true,
      total: true,
      originalAmount: true,
      originalCurrency: true,
      currency: true,
    },
  });
  const orderByMessageId = new Map<
    string,
    {
      id: string;
      amount: number | null;
      currency: string | null;
    }
  >();
  for (const o of orders) {
    if (!o.sourceMessageId) continue;
    orderByMessageId.set(o.sourceMessageId, {
      id: o.id,
      amount: Number(o.originalAmount ?? o.total ?? 0) || null,
      currency: o.originalCurrency ?? o.currency ?? null,
    });
  }

  // Build results.
  const results: SearchResult[] = rows.map((r) => {
    const intent =
      r.extractedData && typeof r.extractedData === "object"
        ? ((r.extractedData as { intent?: string }).intent ?? null)
        : null;

    const senderName = nameByPhone.get(r.fromNumber) ?? null;
    const linkedOrder = orderByMessageId.get(r.id);

    return {
      id: r.id,
      content: r.content ?? "",
      fromNumber: r.fromNumber,
      direction: r.direction,
      intent,
      createdAt: r.createdAt,
      senderName,
      orderId: linkedOrder?.id ?? null,
      amount: linkedOrder?.amount ?? null,
      currency: linkedOrder?.currency ?? null,
    };
  });

  // Apply intent + sender filters in memory (cheap, and avoids writing
  // complex JSON predicates).
  let filtered = results;
  if (intentFilter) {
    filtered = filtered.filter((r) => r.intent === intentFilter);
  }
  if (senderNameFilter) {
    const needle = senderNameFilter.toLowerCase();
    filtered = filtered.filter((r) =>
      (r.senderName ?? "").toLowerCase().includes(needle)
    );
  }

  return filtered.slice(0, limit);
}

export function humanizeQueryForReply(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

export function ago(iso: Date): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}