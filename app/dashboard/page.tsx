// app/dashboard/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCtx, ago, itemsSummary, orderTone, orderLabel } from "./_lib";
import { PageHeader } from "./_components/PageHeader";
import { TopBar } from "./_components/TopBar";
import { StatCard } from "./_components/StatCard";
import { StatusChip } from "./_components/StatusChip";
import { Money } from "./_components/Money";
import { OrderScroller } from "./_components/OrderScroller";

const P = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export default async function Overview() {
  const { user, scope } = await getCtx();
  const base =
    (user as { baseCurrency?: string }).baseCurrency ?? "USD";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const week = new Date(Date.now() - 7 * 864e5);
  const unpaid = { ...scope, paymentStatus: "unpaid" };

  const [
    todayN,
    pending,
    unpaidN,
    uBase,
    customers,
    newCust,
    orders,
  ] = await Promise.all([
    prisma.order.count({
      where: { ...scope, createdAt: { gte: today } },
    }),
    prisma.order.count({
      where: { ...scope, status: "pending" },
    }),
    prisma.order.count({ where: unpaid }),
    prisma.order.aggregate({
      where: { ...unpaid, baseAmount: { not: null } },
      _sum: { baseAmount: true },
    }),
    prisma.customer.count({ where: scope }),
    prisma.customer.count({
      where: { ...scope, createdAt: { gte: week } },
    }),
    prisma.order.findMany({
      where: scope,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: true },
    }),
  ]);

  const unpaidTotal = Number(uBase._sum.baseAmount ?? 0);

  return (
    <>
      <TopBar />

      <div className="relative">
        <PageHeader
          eyebrow="Business overview"
          title="Operations"
          subtitle="Your business at a glance."
        />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          tone="blue"
          label="Orders today"
          value={todayN}
          delta={`+${todayN} today`}
          deltaTone={todayN ? "up" : "flat"}
          icon={
            <svg {...P}>
              <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
              <path d="m3 8 9 5 9-5M12 13v8" />
            </svg>
          }
        />
        <StatCard
          index={1}
          tone="purple"
          label="Pending"
          value={pending}
          delta="Awaiting action"
          deltaTone="flat"
          icon={
            <svg {...P}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          }
        />
        <StatCard
          index={2}
          tone="pink"
          label="Unpaid"
          value={unpaidTotal}
          currency={base}
          delta={`${unpaidN} open`}
          deltaTone={unpaidN ? "down" : "flat"}
          icon={
            <svg {...P}>
              <rect x="3" y="6" width="18" height="12" rx="2" />
              <path d="M3 10h18" />
            </svg>
          }
        />
        <StatCard
          index={3}
          tone="teal"
          label="Customers"
          value={customers}
          delta={`+${newCust} this week`}
          deltaTone={newCust ? "up" : "flat"}
          icon={
            <svg {...P}>
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5" />
            </svg>
          }
        />
      </div>

      {/* Recent orders */}
      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <h2
            className="text-xl font-semibold tracking-tight"
            style={{ color: "#0B1220" }}
          >
            Recent orders
          </h2>
          <Link
            href="/dashboard/orders"
            className="text-sm font-medium transition-colors duration-200 hover:opacity-80"
            style={{ color: "#3B6BFF" }}
          >
            View all →
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="card p-6 text-sm text-ink-2">
            Orders extracted from WhatsApp will be tracked here.
          </p>
        ) : (
          <OrderScroller>
            {orders.map((o, i) => {
              const originalCur = o.originalCurrency ?? base;
              const originalAmt = Number(
                o.originalAmount ?? o.total ?? 0
              );
              const showConverted =
                o.baseAmount !== null &&
                o.baseAmount !== undefined &&
                originalCur.toUpperCase() !== base.toUpperCase();

              const displayName =
                (o as { recipientName?: string | null }).recipientName ??
                o.customer?.name ??
                o.customer?.phone ??
                "Unknown";

              return (
                <Link
                  key={o.id}
                  href={`/dashboard/orders/${o.id}`}
                  style={{
                    ["--i" as string]: i,
                    borderRadius: 16,
                  }}
                  className="card lift order-card fade-up flex w-[340px] shrink-0 snap-start flex-col !p-5"
                >
                  <StatusChip
                    tone={
                      orderTone[o.status as keyof typeof orderTone] ??
                      "neutral"
                    }
                  >
                    {orderLabel[o.status] ?? o.status}
                  </StatusChip>

                  <div className="mt-4 flex items-center gap-3">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: "#F3F5FB", color: "#8B95AB" }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20.4 7.5 12 3 3.6 7.5v9L12 21l8.4-4.5z" />
                        <path d="M12 12 3.6 7.5M12 12l8.4-4.5M12 12v9" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <div
                        className="truncate text-sm font-semibold"
                        style={{ color: "#0B1220" }}
                      >
                        {displayName}
                      </div>
                      <div
                        className="truncate text-sm"
                        style={{ color: "#556075" }}
                      >
                        {itemsSummary(o.items)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Money
                      size="lg"
                      amount={originalAmt}
                      currency={originalCur}
                      baseAmount={
                        showConverted ? o.baseAmount : null
                      }
                      baseCurrency={showConverted ? base : undefined}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className="flex items-center gap-1.5 text-xs"
                      style={{ color: "#8B95AB" }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                      {ago(o.createdAt)}
                    </span>
                    <span
                      className="arrow-btn flex h-9 w-9 items-center justify-center rounded-full"
                      style={{
                        background: "#E5ECFF",
                        color: "#3B6BFF",
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </span>
                  </div>
                </Link>
              );
            })}
          </OrderScroller>
        )}
      </section>
    </>
  );
}