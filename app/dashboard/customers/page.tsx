// app/dashboard/customers/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCtx } from "../_lib";
import { PageHeader } from "../_components/PageHeader";
import { EmptyState } from "../_components/EmptyState";
import { Money } from "../_components/Money";

const BORDER = "#E6EAF5";
const LINE_SOFT = "#F3F5FB";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#556075";
const TEXT_MUTED = "#8B95AB";
const ACCENT = "#3B6BFF";

export default async function Customers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { user, scope } = await getCtx();
  const base =
    (user as { baseCurrency?: string }).baseCurrency ?? "USD";

  const customers = await prisma.customer.findMany({
    where: {
      ...scope,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
        ],
      }),
    },
    include: {
      orders: {
        select: { total: true, baseAmount: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Everyone who's messaged your business."
        actions={
          <form>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name or phone"
              aria-label="Search customers"
              className="w-64 rounded-lg px-3 py-2 text-sm outline-none transition-colors duration-150"
              style={{
                border: `1px solid ${BORDER}`,
                background: "#FFFFFF",
                color: TEXT_PRIMARY,
              }}
            />
          </form>
        }
      />

      {customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          subtitle="Each person who messages your business is recorded here with their order history."
          icon={
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5" />
            </svg>
          }
        />
      ) : (
        <div
          className="overflow-x-auto rounded-2xl bg-white shadow-sm"
          style={{ border: `1px solid ${BORDER}` }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                <th
                  className="px-5 py-3 text-left font-medium"
                  style={{ color: TEXT_MUTED }}
                >
                  Name
                </th>
                <th
                  className="px-5 py-3 text-right font-medium"
                  style={{ color: TEXT_MUTED }}
                >
                  Orders
                </th>
                <th
                  className="px-5 py-3 text-right font-medium"
                  style={{ color: TEXT_MUTED }}
                >
                  Total spent
                </th>
                <th
                  className="px-5 py-3 text-left font-medium"
                  style={{ color: TEXT_MUTED }}
                >
                  Last order
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const ordersCount = c.orders.length;

                // Sum only converted baseAmount. Skip orders without conversion.
                const totalBase = c.orders.reduce(
                  (s, o) => s + Number(o.baseAmount ?? o.total ?? 0),
                  0
                );

                const lastOrderDate = c.orders[0]
                  ? c.orders[0].createdAt
                  : null;

                return (
                  <tr
                    key={c.id}
                    className="relative transition-colors duration-150 hover:bg-[#F0F4FF]"
                    style={{ borderBottom: `1px solid ${LINE_SOFT}` }}
                  >
                    <td
                      className="px-5 py-3.5 font-medium"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      <Link
                        href={`/dashboard/customers/${c.id}`}
                        className="after:absolute after:inset-0"
                      >
                        {c.name ?? c.phone}
                      </Link>
                    </td>
                    <td
                      className="tnum px-5 py-3.5 text-right"
                      style={{ color: TEXT_SECONDARY }}
                    >
                      {ordersCount}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Money
                        amount={totalBase}
                        currency={base}
                        size="md"
                      />
                    </td>
                    <td
                      className="tnum px-5 py-3.5"
                      style={{ color: TEXT_SECONDARY }}
                    >
                      {lastOrderDate
                        ? lastOrderDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}