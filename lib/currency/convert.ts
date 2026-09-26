// lib/currency/convert.ts
import { prisma } from "@/lib/prisma";

const TTL_MS = 24 * 60 * 60 * 1000;
const PIVOT = "USD";

export type Converted = { amount: number; rate: number; date: Date };

/**
 * Refresh USD-based rates from exchangerate-api.com when the cache is
 * older than 24 hours. Falls back to stale cache on failure.
 */
export async function refreshRates(force = false): Promise<Date | null> {
  const latest = await prisma.exchangeRate.findFirst({
    where: { fromCode: PIVOT },
    orderBy: { fetchedAt: "desc" },
  });

  if (!force && latest && Date.now() - latest.fetchedAt.getTime() < TTL_MS) {
    return latest.fetchedAt;
  }

  const apiKey = process.env.EXCHANGERATE_API_KEY;
  if (!apiKey) {
    console.warn("[currency] EXCHANGERATE_API_KEY not set");
    return latest?.fetchedAt ?? null;
  }

  try {
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${PIVOT}`,
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error(`exchangerate-api ${res.status}`);

    const data = (await res.json()) as {
      result: string;
      conversion_rates: Record<string, number>;
    };

    if (data.result !== "success" || !data.conversion_rates) {
      throw new Error("exchangerate-api returned non-success");
    }

    const now = new Date();
    const entries = Object.entries(data.conversion_rates);

    await Promise.all(
      entries.map(([toCode, rate]) =>
        prisma.exchangeRate.upsert({
          where: {
            fromCode_toCode: { fromCode: PIVOT, toCode },
          },
          update: { rate, fetchedAt: now },
          create: { fromCode: PIVOT, toCode, rate, fetchedAt: now },
        })
      )
    );

    console.log(`[currency] refreshed ${entries.length} rates`);
    return now;
  } catch (e) {
    console.error("[currency] refresh failed", e);
    return latest?.fetchedAt ?? null;
  }
}

/** Convert via the USD pivot. Returns null when either currency has no rate. */
export async function convert(
  amount: number,
  from: string,
  to: string
): Promise<Converted | null> {
  from = from.toUpperCase();
  to = to.toUpperCase();

  if (from === to) return { amount, rate: 1, date: new Date() };

  const date = await refreshRates();

  const rows = await prisma.exchangeRate.findMany({
    where: { fromCode: PIVOT, toCode: { in: [from, to] } },
  });

  const r = (c: string) =>
    c === PIVOT ? 1 : rows.find((x) => x.toCode === c)?.rate;

  const a = r(from);
  const b = r(to);

  if (!a || !b) return null;

  const rate = b / a;
  return {
    amount: Math.round(amount * rate * 100) / 100,
    rate,
    date: date ?? new Date(),
  };
}