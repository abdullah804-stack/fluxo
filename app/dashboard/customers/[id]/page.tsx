// app/dashboard/customers/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getCtx,
  ago,
  itemsSummary,
  orderTone,
  orderLabel,
} from "../../_lib";
import { PageHeader } from "../../_components/PageHeader";
import { StatusChip } from "../../_components/StatusChip";
import { Money } from "../../_components/Money";

const BORDER = "#E6EAF5";
const LINE_SOFT = "#F3F5FB";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#556075";
const TEXT_MUTED = "#8B95AB";

export default async function CustomerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, scope } = await getCtx();
  const base =
    (user as { baseCurrency?: string }).baseCurrency ?? "USD";

  const customer = await prisma.customer.findFirst({
    where: { id, ...scope },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) notFound();

  const nonCancelled = customer.orders.filter(
    (o) => o.status !== "cancelled"
  );
  const ordersCount = nonCancelled.length;
  const isRepeat = ordersCount >= 2;

    const totalBase = nonCancelled.reduce(
    (s, o) => s + Number(o.baseAmount ?? 0),
    0
  );

  const lastOrderDate = customer.orders[0]
    ? new Date(customer.orders[0].createdAt as any)
    : null;

  const unpaidCount = customer.orders.filter(
    (o) => o.paymentStatus === "unpaid" && o.status !== "cancelled"
  ).length;

  const displayName = customer.name ?? customer.phone;

  const statCard: React.CSSProperties = {
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
    padding: 20,
    boxShadow: "0 1px 2px 0 rgba(11, 18, 24, 0.04)",
  };

  const row = (k: string, v: React.ReactNode) => (
    <div
      className="flex items-center justify-between gap-4 py-3 text-sm"
      style={{ borderBottom: `1px solid ${LINE_SOFT}` }}
    >
      <dt style={{ color: TEXT_SECONDARY }}>{k}</dt>
      <dd className="text-right" style={{ color: TEXT_PRIMARY }}>
        {v}
      </dd>
    </div>
  );

  return (
    <>
      <PageHeader
        title={displayName}
        subtitle={`Customer since ${new Date(
          customer.createdAt
        ).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}`}
        actions={
          <Link
            href="/dashboard/customers"
            className="rounded-lg border bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition-colors duration-200"
            style={{ borderColor: BORDER, color: TEXT_PRIMARY }}
          >
            All customers
          </Link>
        }
      />

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div style={statCard} className="fade-up">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: TEXT_MUTED }}
          >
            Total orders
          </p>
          <p
            className="mt-2 text-3xl font-bold tabular-nums"
            style={{ color: TEXT_PRIMARY }}
          >
            {ordersCount}
          </p>
        </div>

        <div
          style={{ ...statCard, animationDelay: "50ms" }}
          className="fade-up"
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: TEXT_MUTED }}
          >
            Total spent
          </p>
          <div className="mt-2">
            <Money amount={totalBase} currency={base} size="lg" />
          </div>
        </div>

        <div
          style={{ ...statCard, animationDelay: "100ms" }}
          className="fade-up"
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: TEXT_MUTED }}
          >
            Unpaid
          </p>
          <p
            className="mt-2 text-3xl font-bold tabular-nums"
            style={{ color: unpaidCount ? "#EF4444" : TEXT_PRIMARY }}
          >
            {unpaidCount}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Orders */}
        <section
          style={{ ...statCard, animationDelay: "150ms" }}
          className="fade-up lg:col-span-2"
        >
          <h2
            className="mb-4 text-base font-semibold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            Orders
          </h2>

          {customer.orders.length === 0 ? (
            <p className="text-sm" style={{ color: TEXT_SECONDARY }}>
              No orders yet.
            </p>
          ) : (
            <ul className="flex flex-col">
              {customer.orders.map((o) => {
                const originalCur = o.originalCurrency ?? base;
                const originalAmt = Number(
                  o.originalAmount ?? o.total ?? 0
                );
                const showConverted =
                  o.baseAmount !== null &&
                  o.baseAmount !== undefined &&
                  originalCur.toUpperCase() !== base.toUpperCase();

                return (
                  <li key={o.id}>
                    <Link
                      href={`/dashboard/orders/${o.id}`}
                      className="-mx-3 flex items-center justify-between gap-4 rounded-lg px-3 py-3 transition-colors duration-150 hover:bg-[#F0F4FF]"
                    >
                      <div className="min-w-0">
                        <div
                          className="text-sm font-medium"
                          style={{ color: TEXT_PRIMARY }}
                        >
                          {itemsSummary(o.items)}
                        </div>
                        <div
                          className="mt-0.5 text-xs"
                          style={{ color: TEXT_MUTED }}
                        >
                          {ago(o.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Money
                          amount={originalAmt}
                          currency={originalCur}
                          baseAmount={
                            showConverted ? o.baseAmount : null
                          }
                          baseCurrency={showConverted ? base : undefined}
                          size="md"
                        />
                        <StatusChip
                          tone={
                            orderTone[
                              o.status as keyof typeof orderTone
                            ] ?? "neutral"
                          }
                        >
                          {orderLabel[o.status] ?? o.status}
                        </StatusChip>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Details */}
        <section
          style={{ ...statCard, animationDelay: "200ms" }}
          className="fade-up"
        >
          <h2
            className="mb-2 text-base font-semibold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            Contact
          </h2>

          <dl>
            {row(
              "Phone",
              <span className="tnum">{customer.phone}</span>
            )}
            {row("Name", customer.name ?? "—")}
            {row("Address", customer.address ?? "—")}
            {row(
              "Last order",
              lastOrderDate ? (
                <span className="tnum">
                  {lastOrderDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              ) : (
                "—"
              )
            )}
          </dl>
        </section>
      </div>
    </>
  );
}