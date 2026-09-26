// app/dashboard/messages/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCtx, intentOf } from "../../_lib";
import { PageHeader } from "../../_components/PageHeader";
import { StatusChip } from "../../_components/StatusChip";

export default async function MessageDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { scope } = await getCtx();
  const m = await prisma.message.findFirst({ where: { id, ...scope } });
  if (!m) notFound();
  const intent = intentOf(m.extractedData);
  const order = await prisma.order.findFirst({
    where: { ...scope, sourceMessageId: m.waMessageId },
    select: { id: true },
  });
  const mono = "overflow-x-auto rounded-lg border border-line-soft bg-page p-4 font-mono text-xs leading-relaxed";
  return (
    <>
      <PageHeader title="Message" subtitle={m.createdAt.toLocaleString("en-US")}
        actions={<Link href="/dashboard/messages" className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm hover:bg-line-soft">All messages</Link>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="fade-up rounded-lg border border-line bg-surface p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Content</h2>
          <p className="whitespace-pre-wrap text-sm">{m.content ?? "—"}</p>
          <h2 className="mb-2 mt-6 text-sm font-semibold tracking-tight">Extracted data</h2>
          {m.extractedData ? <pre className={mono}>{JSON.stringify(m.extractedData, null, 2)}</pre> : <p className="text-sm text-ink-2">No structured data was extracted from this message.</p>}
          <details className="mt-6"><summary className="cursor-pointer text-sm font-medium text-ink-2 hover:text-ink">Raw payload</summary>
            <pre className={`${mono} mt-2`}>{JSON.stringify(m.rawPayload ?? {}, null, 2)}</pre></details>
        </section>
        <section className="fade-up rounded-lg border border-line bg-surface p-5 shadow-sm" style={{ ["--i" as string]: 1 }}>
          <h2 className="mb-1 text-sm font-semibold tracking-tight">Details</h2>
          <dl className="divide-y divide-line-soft text-sm">
            <div className="flex justify-between py-2"><dt className="text-ink-2">Direction</dt><dd>{m.direction === "in" ? "Inbound" : "Outbound"}</dd></div>
            <div className="flex justify-between py-2"><dt className="text-ink-2">Sender</dt><dd className="tnum">{m.fromNumber ?? "—"}</dd></div>
            <div className="flex justify-between py-2"><dt className="text-ink-2">Intent</dt><dd>{intent ? <StatusChip tone="accent">{intent}</StatusChip> : "—"}</dd></div>
            {order && <div className="flex justify-between py-2"><dt className="text-ink-2">Order</dt><dd><Link href={`/dashboard/orders/${order.id}`} className="text-accent hover:underline">View order</Link></dd></div>}
          </dl>
        </section>
      </div>
    </>
  );
}