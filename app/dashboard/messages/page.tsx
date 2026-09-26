// app/dashboard/messages/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCtx, ago, intentOf } from "../_lib";
import { PageHeader } from "../_components/PageHeader";
import { StatusChip } from "../_components/StatusChip";
import { EmptyState } from "../_components/EmptyState";

type SP = { dir?: string; intent?: string; from?: string; to?: string; q?: string };

export default async function Messages({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { scope } = await getCtx();
  const rows = await prisma.message.findMany({
    where: {
      ...scope,
      ...(sp.dir && { direction: sp.dir }),
      ...(sp.q && { content: { contains: sp.q, mode: "insensitive" } }),
      ...((sp.from || sp.to) && { createdAt: { ...(sp.from && { gte: new Date(sp.from) }), ...(sp.to && { lte: new Date(sp.to + "T23:59:59") }) } }),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const list = sp.intent ? rows.filter((m) => intentOf(m.extractedData) === sp.intent) : rows;
  const intents = [...new Set(rows.map((m) => intentOf(m.extractedData)).filter(Boolean))] as string[];
  const inp = "rounded-lg border border-line bg-surface px-2 py-1.5 text-sm";
  return (
    <>
      <PageHeader title="Messages" subtitle="Every conversation, with structured meaning." />
      <form className="mb-4 flex flex-wrap items-center gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Search content" aria-label="Search messages" className={`${inp} w-56`} />
        <select name="dir" defaultValue={sp.dir ?? ""} className={inp}><option value="">All directions</option><option value="in">Inbound</option><option value="out">Outbound</option></select>
        <select name="intent" defaultValue={sp.intent ?? ""} className={inp}><option value="">All intents</option>{intents.map((i) => <option key={i}>{i}</option>)}</select>
        <input type="date" name="from" defaultValue={sp.from} className={inp} aria-label="From" />
        <input type="date" name="to" defaultValue={sp.to} className={inp} aria-label="To" />
        <button className="rounded-lg bg-accent px-3 py-1.5 text-sm text-white transition-colors duration-150 hover:bg-accent-hover">Apply filters</button>
      </form>
      {list.length === 0 ? (
        <EmptyState title="No messages found" subtitle="Messages are logged here with their extracted intent and data." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-ink-2"><tr>
              {["Time", "Direction", "From", "Content", "Intent"].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line-soft">
              {list.map((m) => { const intent = intentOf(m.extractedData); return (
                <tr key={m.id} className="relative transition-colors duration-150 hover:bg-line-soft">
                  <td className="tnum px-5 py-3 text-ink-3"><Link href={`/dashboard/messages/${m.id}`} className="after:absolute after:inset-0">{ago(m.createdAt)}</Link></td>
                  <td className="px-5 py-3 text-ink-3" aria-label={m.direction}>{m.direction === "in" ? "↓" : "↑"}</td>
                  <td className="tnum px-5 py-3">{m.fromNumber ?? "—"}</td>
                  <td className="max-w-md truncate px-5 py-3 text-ink-2">
                    {(m.content ?? "").slice(0, 60)}{(m.content ?? "").length > 60 && "…"}
                  </td>
                  <td className="px-5 py-3">{intent && <StatusChip tone="accent">{intent}</StatusChip>}</td>
                </tr>); })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}