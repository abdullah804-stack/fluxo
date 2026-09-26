// app/dashboard/customers/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCtx, money } from "../_lib";
import { PageHeader } from "../_components/PageHeader";
import { EmptyState } from "../_components/EmptyState";

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { scope } = await getCtx();
  const customers = await prisma.customer.findMany({
    where: { ...scope, ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] }) },
    include: { orders: { select: { total: true, createdAt: true }, orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" }, take: 200,
  });
  return (
    <>
      <PageHeader title="Customers" subtitle="Everyone who's messaged your business."
        actions={<form><input name="q" defaultValue={q} placeholder="Search name or phone" aria-label="Search customers"
          className="w-64 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm outline-none transition-colors duration-150 focus:border-accent" /></form>} />
      {customers.length === 0 ? (
        <EmptyState title="No customers yet" subtitle="Each person who messages your business is recorded here with their order history." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-ink-2"><tr>
              <th className="px-5 py-3 font-medium">Name</th><th className="px-5 py-3 text-right font-medium">Orders</th>
              <th className="px-5 py-3 text-right font-medium">Total spent</th><th className="px-5 py-3 font-medium">Last order</th></tr></thead>
            <tbody className="divide-y divide-line-soft">
              {customers.map((c) => (
                <tr key={c.id} className="relative transition-colors duration-150 hover:bg-line-soft">
                  <td className="px-5 py-3 font-medium"><Link href={`/dashboard/customers/${c.id}`} className="after:absolute after:inset-0">{c.name ?? c.phone}</Link></td>
                  <td className="tnum px-5 py-3 text-right">{c.orders.length}</td>
                  <td className="tnum px-5 py-3 text-right">{money(c.orders.reduce((s, o) => s + Number(o.total), 0))}</td>
                  <td className="tnum px-5 py-3 text-ink-2">{c.orders[0]?.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }) ?? "—"}</td>
                </tr>))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}