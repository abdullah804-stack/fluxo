// app/dashboard/messages/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCtx, ago, intentOf, intentTone } from "../_lib";
import { PageHeader } from "../_components/PageHeader";
import { StatusChip } from "../_components/StatusChip";
import { EmptyState } from "../_components/EmptyState";

type SP = {
  dir?: string;
  intent?: string;
  from?: string;
  to?: string;
  q?: string;
};

const BORDER = "#E6EAF5";
const LINE_SOFT = "#F3F5FB";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#556075";
const TEXT_MUTED = "#8B95AB";
const ACCENT = "#3B6BFF";

export default async function Messages({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const { scope } = await getCtx();

  const rows = await prisma.message.findMany({
    where: {
      ...scope,
      ...(sp.dir && { direction: sp.dir }),
      ...(sp.q && {
        content: { contains: sp.q, mode: "insensitive" },
      }),
      ...((sp.from || sp.to) && {
        createdAt: {
          ...(sp.from && { gte: new Date(sp.from) }),
          ...(sp.to && { lte: new Date(sp.to + "T23:59:59") }),
        },
      }),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const list = sp.intent
    ? rows.filter((m) => intentOf(m.extractedData) === sp.intent)
    : rows;

  const intents = [
    ...new Set(
      rows
        .map((m) => intentOf(m.extractedData))
        .filter(Boolean)
    ),
  ] as string[];

  const inp: React.CSSProperties = {
    borderRadius: 8,
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
    color: TEXT_PRIMARY,
    padding: "8px 12px",
    fontSize: 14,
    outline: "none",
  };

  return (
    <>
      <PageHeader
        title="Messages"
        subtitle="Every conversation, with structured meaning."
      />

      {/* Filters */}
      <form
        className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl bg-white p-4 shadow-sm"
        style={{ border: `1px solid ${BORDER}` }}
      >
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Search content..."
          aria-label="Search messages"
          style={{ ...inp, width: 240 }}
        />
        <select name="dir" defaultValue={sp.dir ?? ""} style={inp}>
          <option value="">All directions</option>
          <option value="in">Inbound</option>
          <option value="out">Outbound</option>
        </select>
        <select
          name="intent"
          defaultValue={sp.intent ?? ""}
          style={inp}
        >
          <option value="">All intents</option>
          {intents.map((i) => (
            <option key={i}>{i}</option>
          ))}
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
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          style={{ background: ACCENT }}
        >
          Apply filters
        </button>
      </form>

      {list.length === 0 ? (
        <EmptyState
          title="No messages found"
          subtitle="Messages are logged here with their extracted intent and data."
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
              <path d="M21 12a8 8 0 0 1-11.6 7.1L3 20l1-4.6A8 8 0 1 1 21 12z" />
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
                {["Time", "Direction", "From", "Content", "Intent"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left font-medium"
                      style={{ color: TEXT_MUTED }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {list.map((m) => {
                const intent = intentOf(m.extractedData);
                const preview = m.content ?? "";
                const truncated =
                  preview.length > 60
                    ? preview.slice(0, 60) + "…"
                    : preview;

                return (
                  <tr
                    key={m.id}
                    className="relative transition-colors duration-150 hover:bg-[#F0F4FF]"
                    style={{ borderBottom: `1px solid ${LINE_SOFT}` }}
                  >
                    <td
                      className="tnum px-5 py-3.5 whitespace-nowrap"
                      style={{ color: TEXT_MUTED }}
                    >
                      <Link
                        href={`/dashboard/messages/${m.id}`}
                        className="after:absolute after:inset-0"
                      >
                        {ago(m.createdAt)}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                        style={{
                          background:
                            m.direction === "in"
                              ? "#E5EDFF"
                              : "#F0E8FF",
                          color:
                            m.direction === "in"
                              ? "#3B6BFF"
                              : "#8B5CF6",
                        }}
                        aria-label={
                          m.direction === "in" ? "Inbound" : "Outbound"
                        }
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {m.direction === "in" ? (
                            <path d="M12 5v14M19 12l-7 7-7-7" />
                          ) : (
                            <path d="M12 19V5M5 12l7-7 7 7" />
                          )}
                        </svg>
                      </span>
                    </td>
                    <td
                      className="tnum px-5 py-3.5 whitespace-nowrap"
                      style={{ color: TEXT_SECONDARY }}
                    >
                      {m.fromNumber ?? "—"}
                    </td>
                    <td
                      className="max-w-md truncate px-5 py-3.5"
                      style={{ color: TEXT_SECONDARY }}
                    >
                      {truncated || (
                        <span style={{ color: TEXT_MUTED }}>
                          (no text — {m.type})
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {intent && (
                        <StatusChip
                          tone={
                            intentTone[intent] ?? "accent"
                          }
                        >
                          {intent}
                        </StatusChip>
                      )}
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