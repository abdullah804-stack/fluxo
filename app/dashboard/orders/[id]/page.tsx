// app/dashboard/orders/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCtx, itemList, orderTone, orderLabel } from "../../_lib";
import { PageHeader } from "../../_components/PageHeader";
import { StatusChip } from "../../_components/StatusChip";
import { Money } from "../../_components/Money";

export default async function OrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, scope } = await getCtx();
  const base =
    (user as { baseCurrency?: string }).baseCurrency ?? "USD";

  const o = await prisma.order.findFirst({
    where: { id, ...scope },
    include: { customer: true },
  });
  if (!o) notFound();

  const items = itemList(o.items);

  const originalCur = o.originalCurrency ?? base;
  const originalAmt = Number(o.originalAmount ?? o.total ?? 0);
  const showConverted =
    o.baseAmount !== null &&
    o.baseAmount !== undefined &&
    originalCur.toUpperCase() !== base.toUpperCase();

  const displayName =
    (o as { recipientName?: string | null }).recipientName ??
    o.customer?.name ??
    o.customer?.phone ??
    "Unknown";

  const row = (k: string, v: React.ReactNode) => (
    <div
      className="flex items-center justify-between gap-4 py-3 text-sm"
      style={{ borderBottom: "1px solid #F3F5FB" }}
    >
      <dt style={{ color: "#556075" }}>{k}</dt>
      <dd className="text-right" style={{ color: "#0B1220" }}>
        {v}
      </dd>
    </div>
  );

  return (
    <>
      <PageHeader
        title={`Order #${o.id.slice(-6).toUpperCase()}`}
        subtitle={o.createdAt.toLocaleString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
        actions={
          <Link
            href="/dashboard/orders"
            className="rounded-lg border bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition-colors duration-200"
            style={{ borderColor: "#E6EAF5", color: "#0B1220" }}
          >
            All orders
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Items + total */}
        <section
          className="fade-up rounded-2xl bg-white p-6 shadow-sm lg:col-span-2"
          style={{ border: "1px solid #E6EAF5" }}
        >
          <h2
            className="mb-4 text-base font-semibold tracking-tight"
            style={{ color: "#0B1220" }}
          >
            Items
          </h2>

          <ul className="text-sm">
            {items.map((it, i) => (
              <li
                key={i}
                className="flex items-center justify-between py-3"
                style={{
                  borderBottom:
                    i === items.length - 1
                      ? "none"
                      : "1px solid #F3F5FB",
                }}
              >
                <span style={{ color: "#0B1220" }}>
                  {it.name ?? "Item"}
                </span>
                <span
                  className="tnum"
                  style={{ color: "#556075" }}
                >
                  ×{it.quantity ?? 1}
                </span>
              </li>
            ))}
          </ul>

          <div
            className="mt-4 flex items-center justify-between border-t pt-4"
            style={{ borderColor: "#E6EAF5" }}
          >
            <span
              className="text-sm font-semibold"
              style={{ color: "#0B1220" }}
            >
              Total
            </span>
            <Money
              size="lg"
              amount={originalAmt}
              currency={originalCur}
              baseAmount={showConverted ? o.baseAmount : null}
              baseCurrency={showConverted ? base : undefined}
            />
          </div>
        </section>

        {/* Details */}
        <section
          className="fade-up rounded-2xl bg-white p-6 shadow-sm"
          style={{
            border: "1px solid #E6EAF5",
            ["--i" as string]: 1,
          }}
        >
          <h2
            className="mb-2 text-base font-semibold tracking-tight"
            style={{ color: "#0B1220" }}
          >
            Details
          </h2>

          <dl>
            {row(
              "Status",
              <StatusChip
                tone={
                  orderTone[o.status as keyof typeof orderTone] ??
                  "neutral"
                }
              >
                {orderLabel[o.status] ?? o.status}
              </StatusChip>
            )}
            {row(
              "Payment",
              <StatusChip
                tone={
                  o.paymentStatus === "paid" ? "success" : "warning"
                }
              >
                {o.paymentStatus === "paid" ? "Paid" : "Unpaid"}
              </StatusChip>
            )}
            {row(
              "Order for",
              <span style={{ color: "#0B1220", fontWeight: 500 }}>
                {displayName}
              </span>
            )}
            {row(
              "Contact",
              <Link
                href={`/dashboard/customers/${o.customerId}`}
                className="transition-opacity hover:opacity-80"
                style={{ color: "#3B6BFF" }}
              >
                {o.customer?.phone ?? "—"}
              </Link>
            )}
            {row("Address", o.address ?? o.customer?.address ?? "—")}
            {row(
              "Payment method",
              o.paymentMethod ?? "—"
            )}
          </dl>
        </section>
      </div>
    </>
  );
}