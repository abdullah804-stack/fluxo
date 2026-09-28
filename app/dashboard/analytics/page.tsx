// app/dashboard/analytics/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCtx, orderLabel, orderTone } from "../_lib";
import { PageHeader } from "../_components/PageHeader";
import { StatusChip } from "../_components/StatusChip";
import { Money } from "../_components/Money";
import { BarChart } from "../_components/BarChart";

export const revalidate = 0;

export default async function Analytics() {
  const { user, scope } = await getCtx();
  const base =
    (user as { baseCurrency?: string }).baseCurrency ?? "USD";

  const now = new Date();
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 864e5);

  // ---------- Month-to-date orders ----------
  const mtdOrders = await prisma.order.findMany({
    where: {
      ...scope,
      createdAt: { gte: monthStart },
      status: { not: "cancelled" },
    },
    select: {
      id: true,
      baseAmount: true,
      paymentStatus: true,
      status: true,
    },
  });

  const mtdRevenue = mtdOrders.reduce(
    (s, o) => s + Number(o.baseAmount ?? 0),
    0
  );
  const mtdOrderCount = mtdOrders.length;
  const mtdAvgOrderValue =
    mtdOrderCount > 0 ? mtdRevenue / mtdOrderCount : 0;
  const mtdUnconverted = mtdOrders.filter(
    (o) => o.baseAmount === null || o.baseAmount === undefined
  ).length;

  // ---------- Repeat customer % ----------
  const [totalCustomers, repeatCustomers] = await Promise.all([
    prisma.customer.count({ where: scope }),
    prisma.customer.count({
      where: {
        ...scope,
        orders: {
          some: { status: { not: "cancelled" } },
        },
      },
    }),
  ]);

  const customersWithAtLeast2 = await prisma.customer.findMany({
    where: scope,
    include: {
      orders: {
        where: { status: { not: "cancelled" } },
        select: { id: true },
      },
    },
  });
  const repeatPct =
    totalCustomers > 0
      ? (customersWithAtLeast2.filter((c) => c.orders.length >= 2)
          .length /
          totalCustomers) *
        100
      : 0;

  // ---------- Last 30 days revenue chart ----------
  const last30Orders = await prisma.order.findMany({
    where: {
      ...scope,
      createdAt: { gte: thirtyDaysAgo },
      status: { not: "cancelled" },
    },
    select: { createdAt: true, baseAmount: true },
  });

  const dailyMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo.getTime() + i * 864e5);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, 0);
  }
  for (const o of last30Orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (dailyMap.has(key)) {
      dailyMap.set(
        key,
        (dailyMap.get(key) ?? 0) + Number(o.baseAmount ?? 0)
      );
    }
  }
  const chartData = [...dailyMap.entries()].map(([key, value]) => ({
    label: new Date(key).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value,
  }));

  // ---------- Top products ----------
  const allOrdersForProducts = await prisma.order.findMany({
    where: {
      ...scope,
      status: { not: "cancelled" },
    },
    select: { items: true },
  });

  const productCounts = new Map<string, number>();
  for (const o of allOrdersForProducts) {
    if (!Array.isArray(o.items)) continue;
    for (const it of o.items as {
      name?: string;
      quantity?: number;
    }[]) {
      const name = (it.name || "").trim();
      if (!name) continue;
      productCounts.set(
        name,
        (productCounts.get(name) ?? 0) + (it.quantity ?? 1)
      );
    }
  }
  const topProducts = [...productCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ---------- Top customers ----------
  const customerAgg = new Map<
    string,
    { name: string; orders: number; total: number }
  >();
  const customerOrders = await prisma.order.findMany({
    where: {
      ...scope,
      status: { not: "cancelled" },
    },
    include: { customer: true },
  });
  for (const o of customerOrders) {
    const key = o.customerId;
    const displayName =
      o.recipientName || o.customer.name || o.customer.phone;
    const existing = customerAgg.get(key);
    const amt = Number(o.baseAmount ?? 0);
    if (existing) {
      existing.orders += 1;
      existing.total += amt;
    } else {
      customerAgg.set(key, {
        name: displayName,
        orders: 1,
        total: amt,
      });
    }
  }
  const topCustomers = [...customerAgg.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // ---------- Status breakdowns ----------
  const statusCounts = new Map<string, number>();
  const paymentCounts = new Map<string, number>();
  for (const o of mtdOrders) {
    statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
    paymentCounts.set(
      o.paymentStatus,
      (paymentCounts.get(o.paymentStatus) ?? 0) + 1
    );
  }

  const card: React.CSSProperties = {
    borderRadius: 16,
    border: "1px solid #E6EAF5",
    background: "#FFFFFF",
    padding: 20,
    boxShadow: "0 1px 2px 0 rgba(11, 18, 24, 0.04)",
  };

  const fmtMoney = (n: number) => {
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
    const sym = symbols[base] || `${base} `;
    return `${sym}${Math.round(n).toLocaleString("en-US")}`;
  };

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="How your business is doing."
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div style={card} className="fade-up">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "#8B95AB" }}
          >
            Revenue (this month)
          </p>
          <p
            className="tnum mt-3 text-3xl font-bold"
            style={{ color: "#0B1220" }}
          >
            {fmtMoney(mtdRevenue)}
          </p>
          {mtdUnconverted > 0 && (
            <p className="mt-1 text-xs" style={{ color: "#8B95AB" }}>
              {mtdUnconverted} order{mtdUnconverted > 1 ? "s" : ""} not
              converted
            </p>
          )}
        </div>

        <div
          style={{ ...card, animationDelay: "50ms" }}
          className="fade-up"
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "#8B95AB" }}
          >
            Orders (this month)
          </p>
          <p
            className="tnum mt-3 text-3xl font-bold"
            style={{ color: "#0B1220" }}
          >
            {mtdOrderCount}
          </p>
        </div>

        <div
          style={{ ...card, animationDelay: "100ms" }}
          className="fade-up"
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "#8B95AB" }}
          >
            Avg order value
          </p>
          <p
            className="tnum mt-3 text-3xl font-bold"
            style={{ color: "#0B1220" }}
          >
            {fmtMoney(mtdAvgOrderValue)}
          </p>
        </div>

        <div
          style={{ ...card, animationDelay: "150ms" }}
          className="fade-up"
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "#8B95AB" }}
          >
            Repeat customer %
          </p>
          <p
            className="tnum mt-3 text-3xl font-bold"
            style={{ color: "#0B1220" }}
          >
            {repeatPct.toFixed(0)}%
          </p>
          <p className="mt-1 text-xs" style={{ color: "#8B95AB" }}>
            {repeatCustomers} repeat · {totalCustomers} total
          </p>
        </div>
      </div>

      {/* Chart */}
      <section className="mt-8">
        <div
          style={{ ...card, animationDelay: "200ms" }}
          className="fade-up"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="text-base font-semibold tracking-tight"
              style={{ color: "#0B1220" }}
            >
              Revenue — last 30 days
            </h2>
            <span
              className="tnum text-sm font-medium"
              style={{ color: "#3B6BFF" }}
            >
              {fmtMoney(chartData.reduce((s, d) => s + d.value, 0))}
            </span>
          </div>
                    <BarChart
            data={chartData.map((d) => ({
              ...d,
              display: fmtMoney(d.value),
            }))}
            color="#3B6BFF"
            height={200}
          />
        </div>
      </section>

      {/* Top products + Top customers */}
      <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div
          style={{ ...card, animationDelay: "250ms" }}
          className="fade-up"
        >
          <h2
            className="mb-4 text-base font-semibold tracking-tight"
            style={{ color: "#0B1220" }}
          >
            Top products
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-sm" style={{ color: "#556075" }}>
              No products yet.
            </p>
          ) : (
            <ul className="flex flex-col">
              {topProducts.map((p, i) => (
                <li
                  key={p.name}
                  className="flex items-center justify-between py-2.5"
                  style={{
                    borderBottom:
                      i === topProducts.length - 1
                        ? "none"
                        : "1px solid #F3F5FB",
                  }}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold"
                      style={{
                        background: "#E5ECFF",
                        color: "#3B6BFF",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="text-sm font-medium capitalize"
                      style={{ color: "#0B1220" }}
                    >
                      {p.name}
                    </span>
                  </span>
                  <span
                    className="tnum text-sm"
                    style={{ color: "#556075" }}
                  >
                    {p.count} sold
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          style={{ ...card, animationDelay: "300ms" }}
          className="fade-up"
        >
          <h2
            className="mb-4 text-base font-semibold tracking-tight"
            style={{ color: "#0B1220" }}
          >
            Top customers
          </h2>
          {topCustomers.length === 0 ? (
            <p className="text-sm" style={{ color: "#556075" }}>
              No customers yet.
            </p>
          ) : (
            <ul className="flex flex-col">
              {topCustomers.map((c, i) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between py-2.5"
                  style={{
                    borderBottom:
                      i === topCustomers.length - 1
                        ? "none"
                        : "1px solid #F3F5FB",
                  }}
                >
                  <Link
                    href={`/dashboard/customers/${c.id}`}
                    className="flex items-center gap-3 transition-opacity hover:opacity-80"
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold"
                      style={{
                        background: "#E0F7F7",
                        color: "#0EA5A5",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "#0B1220" }}
                    >
                      {c.name}
                    </span>
                  </Link>
                  <span className="text-right">
                    <span
                      className="tnum block text-sm font-medium"
                      style={{ color: "#0B1220" }}
                    >
                      {fmtMoney(c.total)}
                    </span>
                    <span
                      className="tnum block text-xs"
                      style={{ color: "#8B95AB" }}
                    >
                      {c.orders} order{c.orders > 1 ? "s" : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Breakdowns */}
      <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div
          style={{ ...card, animationDelay: "350ms" }}
          className="fade-up"
        >
          <h2
            className="mb-4 text-base font-semibold tracking-tight"
            style={{ color: "#0B1220" }}
          >
            Order status
          </h2>
          {statusCounts.size === 0 ? (
            <p className="text-sm" style={{ color: "#556075" }}>
              No orders this month.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {[...statusCounts.entries()].map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center gap-2"
                >
                  <StatusChip
                    tone={
                      orderTone[status as keyof typeof orderTone] ??
                      "neutral"
                    }
                  >
                    {orderLabel[status] ?? status}
                  </StatusChip>
                  <span
                    className="tnum text-sm font-medium"
                    style={{ color: "#0B1220" }}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{ ...card, animationDelay: "400ms" }}
          className="fade-up"
        >
          <h2
            className="mb-4 text-base font-semibold tracking-tight"
            style={{ color: "#0B1220" }}
          >
            Payment status
          </h2>
          {paymentCounts.size === 0 ? (
            <p className="text-sm" style={{ color: "#556075" }}>
              No orders this month.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {[...paymentCounts.entries()].map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center gap-2"
                >
                  <StatusChip
                    tone={status === "paid" ? "success" : "warning"}
                  >
                    {status === "paid" ? "Paid" : "Unpaid"}
                  </StatusChip>
                  <span
                    className="tnum text-sm font-medium"
                    style={{ color: "#0B1220" }}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}