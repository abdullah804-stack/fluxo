// app/dashboard/orders/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  getCtx,
  itemsSummary,
  itemList,
  orderTone,
  orderLabel,
  getBusinessTypeMeta,
} from "../_lib";
import { PageHeader } from "../_components/PageHeader";
import { StatusChip, Badge } from "../_components/StatusChip";
import { EmptyState } from "../_components/EmptyState";
import { Money } from "../_components/Money";

const PAGE = 25;

type SP = {
  view?: string;
  sort?: string;
  dir?: string;
  status?: string;
  pay?: string;
  from?: string;
  to?: string;
  page?: string;
};

const BORDER = "#E6EAF5";
const LINE_SOFT = "#F3F5FB";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#556075";
const TEXT_MUTED = "#8B95AB";
const ACCENT = "#3B6BFF";

export default async function Orders({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const { user, scope } = await getCtx();
  const base =
    (user as { baseCurrency?: string }).baseCurrency ?? "USD";
  const businessMeta = getBusinessTypeMeta(
    (user as { businessType?: string | null }).businessType
  );

  const view = sp.view === "kanban" ? "kanban" : "list";
  const sort = sp.sort === "total" ? "total" : "createdAt";
  const dir = sp.dir === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(sp.page) || 1);

  const where = {
    ...scope,
    ...(sp.status && { status: sp.status }),
    ...(sp.pay && { paymentStatus: sp.pay }),
    ...((sp.from || sp.to) && {
      createdAt: {
        ...(sp.from && { gte: new Date(sp.from) }),
        ...(sp.to && { lte: new Date(sp.to + "T23:59:59") }),
      },
    }),
  };

  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: { customer: true },
      orderBy: { [sort]: dir },
      skip: view === "list" ? (page - 1) * PAGE : undefined,
      take: view === "list" ? PAGE : 200,
    }),
  ]);

  const q = (o: Partial<SP>) =>
    "?" +
    new URLSearchParams(
      Object.entries({ ...sp, ...o }).filter(([, v]) => v) as [
        string,
        string,
      ][]
    );

  const seg = (v: string, l: string) => {
    const active = view === v;
    return (
      <Link
        key={v}
        href={q({ view: v, page: undefined })}
        className="px-3 py-1.5 text-sm font-medium transition-colors duration-150"
        style={{
          background: active ? "#FFFFFF" : "transparent",
          color: active ? TEXT_PRIMARY : TEXT_SECONDARY,
          boxShadow: active
            ? "0 1px 2px 0 rgba(11, 18, 32, 0.06)"
            : "none",
          borderRadius: 8,
        }}
      >
        {l}
      </Link>
    );
  };

  const th = (key: string, l: string) => (
    <Link
      href={q({
        sort: key,
        dir: sort === key && dir === "desc" ? "asc" : "desc",
      })}
      className="transition-colors hover:text-black"
      style={{ color: TEXT_MUTED }}
    >
      {l}
      {sort === key ? (dir === "desc" ? " ↓" : " ↑") : ""}
    </Link>
  );

  const inp: React.CSSProperties = {
    borderRadius: 8,
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
    color: TEXT_PRIMARY,
    padding: "8px 12px",
    fontSize: 14,
    outline: "none",
  };

  const displayName = (o: {
    recipientName?: string | null;
    customer?: { name?: string | null; phone?: string | null } | null;
  }) =>
    o.recipientName ??
    o.customer?.name ??
    o.customer?.phone ??
    "Unknown";

  const amountOf = (o: {
    originalAmount?: number | null;
    originalCurrency?: string | null;
    total?: number | null;
    baseAmount?: number | null;
  }) => {
    const originalCur = o.originalCurrency ?? base;
    const originalAmt = Number(o.originalAmount ?? o.total ?? 0);
    const showConverted =
      o.baseAmount !== null &&
      o.baseAmount !== undefined &&
      originalCur.toUpperCase() !== base.toUpperCase();
    return {
      amount: originalAmt,
      currency: originalCur,
      baseAmount: showConverted ? o.baseAmount : null,
      baseCurrency: showConverted ? base : undefined,
    };
  };

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Every order from WhatsApp, structured."
        actions={
          <div
            className="flex overflow-hidden rounded-lg p-0.5"
            style={{ background: "#EDF0F8" }}
          >
            {seg("list", "List")}
            {seg("kanban", "Kanban")}
          </div>
        }
      />

      {total === 0 && !sp.status && !sp.pay && !sp.from && !sp.to ? (
        <EmptyState
          title="No orders yet"
          subtitle="Orders from WhatsApp will appear here automatically."
          icon={
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
              <path d="m3 8 9 5 9-5M12 13v8" />
            </svg>
          }
          action={
            <details className="text-left">
              <summary
                className="cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors"
                style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
              >
                Learn how it works
              </summary>
              <p
                className="mt-3 max-w-xs text-sm"
                style={{ color: TEXT_SECONDARY }}
              >
                Customers message your WhatsApp number. Each order is
                extracted into items, quantity and total, then tracked
                here.
              </p>
            </details>
          }
        />
      ) : (
        <>
          <form className="mb-5 flex flex-wrap items-center gap-2">
            <input type="hidden" name="view" value={view} />
            <select
              name="status"
              defaultValue={sp.status ?? ""}
              style={inp}
            >
              <option value="">All statuses</option>
              {Object.entries(orderLabel).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
            <select name="pay" defaultValue={sp.pay ?? ""} style={inp}>
              <option value="">All payments</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <input
              type="date"
              name="from"
              defaultValue={sp.from}
              style={inp}
              aria-label="From"
            />
            <input
              type="date"
              name="to"
              defaultValue={sp.to}
              style={inp}
              aria-label="To"
            />
            <button
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors"
              style={{ background: ACCENT }}
            >
              Apply filters
            </button>
          </form>

          {view === "list" ? (
            <>
              <div
                className="overflow-x-auto rounded-2xl bg-white shadow-sm"
                style={{ border: `1px solid ${BORDER}` }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                        {["Customer", businessMeta.itemPlural].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left font-medium"
                          style={{ color: TEXT_MUTED }}
                        >
                          {h}
                        </th>
                      ))}
                      <th
                        className="px-5 py-3 text-right font-medium"
                        style={{ color: TEXT_MUTED }}
                      >
                        {th("total", "Total")}
                      </th>
                      <th
                        className="px-5 py-3 text-left font-medium"
                        style={{ color: TEXT_MUTED }}
                      >
                        Payment
                      </th>
                      <th
                        className="px-5 py-3 text-left font-medium"
                        style={{ color: TEXT_MUTED }}
                      >
                        Status
                      </th>
                      <th
                        className="px-5 py-3 text-left font-medium"
                        style={{ color: TEXT_MUTED }}
                      >
                        {th("createdAt", "Created")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((o) => {
                      const amt = amountOf(o);
                      return (
                        <tr
                          key={o.id}
                          className="relative transition-colors duration-150 hover:bg-[#F0F4FF]"
                          style={{
                            borderBottom: `1px solid ${LINE_SOFT}`,
                          }}
                        >
                          <td
                            className="px-5 py-3.5 font-medium"
                            style={{ color: TEXT_PRIMARY }}
                          >
                            <Link
                              href={`/dashboard/orders/${o.id}`}
                              className="after:absolute after:inset-0"
                            >
                              {displayName(o)}
                            </Link>
                          </td>
                                                    <td
                            className="px-5 py-3.5"
                            style={{ color: TEXT_SECONDARY }}
                          >
                            <div className="flex items-center gap-2">
                              <span>{itemsSummary(o.items)}</span>
                              {(o as { scheduledAt?: Date | null })
                                .scheduledAt && (
                                <span
                                  className="inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium"
                                  style={{
                                    background: "#FFF3E0",
                                    color: "#B45309",
                                  }}
                                  title={`Scheduled for ${new Date(
                                    (o as { scheduledAt?: Date | null })
                                      .scheduledAt!
                                  ).toLocaleString()}`}
                                >
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <rect
                                      x="3"
                                      y="5"
                                      width="18"
                                      height="16"
                                      rx="2"
                                    />
                                    <path d="M8 3v4M16 3v4M3 10h18" />
                                  </svg>
                                  {new Date(
                                    (o as { scheduledAt?: Date | null })
                                      .scheduledAt!
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Money
                              amount={amt.amount}
                              currency={amt.currency}
                              baseAmount={amt.baseAmount}
                              baseCurrency={amt.baseCurrency}
                              size="md"
                            />
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusChip
                              tone={
                                o.paymentStatus === "paid"
                                  ? "success"
                                  : "warning"
                              }
                            >
                              {o.paymentStatus === "paid"
                                ? "Paid"
                                : "Unpaid"}
                            </StatusChip>
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusChip
                              tone={
                                orderTone[
                                  o.status as keyof typeof orderTone
                                ] ?? "neutral"
                              }
                            >
                              {orderLabel[o.status] ?? o.status}
                            </StatusChip>
                          </td>
                          <td
                            className="tnum px-5 py-3.5"
                            style={{ color: TEXT_SECONDARY }}
                          >
                            {o.createdAt.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div
                className="mt-4 flex items-center justify-between text-sm"
                style={{ color: TEXT_SECONDARY }}
              >
                <span className="tnum">
                  Page {page} of {Math.max(1, Math.ceil(total / PAGE))} ·{" "}
                  {total} orders
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      className="rounded-lg border bg-white px-3 py-1.5 transition-colors"
                      style={{ borderColor: BORDER }}
                      href={q({ page: String(page - 1) })}
                    >
                      Previous
                    </Link>
                  )}
                  {page * PAGE < total && (
                    <Link
                      className="rounded-lg border bg-white px-3 py-1.5 transition-colors"
                      style={{ borderColor: BORDER }}
                      href={q({ page: String(page + 1) })}
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Object.entries(orderLabel).map(([status, label]) => {
                const col = rows.filter((o) => o.status === status);
                return (
                  <section
                    key={status}
                    className="rounded-2xl p-3"
                    style={{
                      border: `1px solid ${BORDER}`,
                      background: "#FAFBFE",
                    }}
                  >
                    <h2
                      className="mb-3 flex items-center justify-between px-1 text-sm font-semibold tracking-tight"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      {label}
                      <Badge>{col.length}</Badge>
                    </h2>
                    <div className="flex flex-col gap-2">
                      {col.map((o) => {
                        const amt = amountOf(o);
                        return (
                          <Link
                            key={o.id}
                            href={`/dashboard/orders/${o.id}`}
                            className="lift rounded-xl bg-white p-3 text-sm shadow-sm"
                            style={{ border: `1px solid ${BORDER}` }}
                          >
                            <div
                              className="font-medium"
                              style={{ color: TEXT_PRIMARY }}
                            >
                              {displayName(o)}
                            </div>
                            <div
                              className="mt-1 flex items-center justify-between"
                              style={{ color: TEXT_SECONDARY }}
                            >
                              <span>
                                {itemList(o.items).length} items
                              </span>
                              <Money
                                amount={amt.amount}
                                currency={amt.currency}
                                baseAmount={amt.baseAmount}
                                baseCurrency={amt.baseCurrency}
                                size="sm"
                              />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}