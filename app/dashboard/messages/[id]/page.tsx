// app/dashboard/messages/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCtx, intentOf, intentTone } from "../../_lib";
import { PageHeader } from "../../_components/PageHeader";
import { StatusChip } from "../../_components/StatusChip";

const BORDER = "#E6EAF5";
const LINE_SOFT = "#F3F5FB";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#556075";
const TEXT_MUTED = "#8B95AB";
const ACCENT = "#3B6BFF";

export default async function MessageDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { scope } = await getCtx();

  const m = await prisma.message.findFirst({
    where: { id, ...scope },
  });
  if (!m) notFound();

  const intent = intentOf(m.extractedData);

  const order = await prisma.order.findFirst({
    where: { ...scope, sourceMessageId: m.waMessageId },
    select: { id: true, total: true, currency: true },
  });

  const card: React.CSSProperties = {
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
    padding: 24,
    boxShadow: "0 1px 2px 0 rgba(11, 18, 24, 0.04)",
  };

  const mono: React.CSSProperties = {
    overflowX: "auto",
    borderRadius: 12,
    border: `1px solid ${LINE_SOFT}`,
    background: "#FAFBFE",
    padding: 16,
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 1.6,
    color: TEXT_SECONDARY,
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

  const isInbound = m.direction === "in";

  return (
    <>
      <PageHeader
        title="Message"
        subtitle={m.createdAt.toLocaleString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
        actions={
          <Link
            href="/dashboard/messages"
            className="rounded-lg border bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition-colors duration-200"
            style={{ borderColor: BORDER, color: TEXT_PRIMARY }}
          >
            All messages
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main content */}
        <section
          style={card}
          className="fade-up lg:col-span-2"
        >
          <h2
            className="mb-4 text-base font-semibold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            Content
          </h2>

          {/* Message bubble */}
          <div
            className="rounded-2xl p-4 text-sm"
            style={{
              background: isInbound ? "#F0F4FF" : "#F5F0FF",
              color: TEXT_PRIMARY,
              borderLeft: `3px solid ${isInbound ? ACCENT : "#8B5CF6"}`,
            }}
          >
            <div
              className="mb-2 flex items-center gap-2 text-xs font-medium"
              style={{ color: isInbound ? ACCENT : "#8B5CF6" }}
            >
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full"
                style={{
                  background: isInbound ? "#E5EDFF" : "#F0E8FF",
                }}
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
                  {isInbound ? (
                    <path d="M12 5v14M19 12l-7 7-7-7" />
                  ) : (
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  )}
                </svg>
              </span>
              {isInbound ? "Inbound" : "Outbound"}
            </div>
            <p className="whitespace-pre-wrap">
              {m.content || (
                <span style={{ color: TEXT_MUTED }}>
                  (no text — {m.type})
                </span>
              )}
            </p>
          </div>

          {/* Extracted data */}
          <h2
            className="mb-2 mt-6 text-base font-semibold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            Extracted data
          </h2>

          {m.extractedData ? (
            <pre style={mono}>
              {JSON.stringify(m.extractedData, null, 2)}
            </pre>
          ) : (
            <p className="text-sm" style={{ color: TEXT_SECONDARY }}>
              No structured data was extracted from this message.
            </p>
          )}

          {/* Raw payload */}
          <details className="mt-6">
            <summary
              className="cursor-pointer select-none text-sm font-medium"
              style={{ color: TEXT_SECONDARY }}
            >
              Raw payload
            </summary>
            <pre style={{ ...mono, marginTop: 8 }}>
              {JSON.stringify(m.rawPayload ?? {}, null, 2)}
            </pre>
          </details>
        </section>

        {/* Sidebar */}
        <section
          style={{ ...card, animationDelay: "50ms" }}
          className="fade-up"
        >
          <h2
            className="mb-2 text-base font-semibold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            Details
          </h2>

          <dl>
            {row(
              "Direction",
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    background: isInbound ? ACCENT : "#8B5CF6",
                  }}
                />
                {isInbound ? "Inbound" : "Outbound"}
              </span>
            )}
            {row(
              "Sender",
              <span className="tnum">{m.fromNumber ?? "—"}</span>
            )}
            {row(
              "Type",
              <span className="font-mono text-xs">{m.type}</span>
            )}
            {row(
              "Intent",
              intent ? (
                <StatusChip tone={intentTone[intent] ?? "accent"}>
                  {intent}
                </StatusChip>
              ) : (
                "—"
              )
            )}
          </dl>

          {/* Linked order */}
          {order && (
            <div className="mt-4">
              <h3
                className="mb-2 text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ color: TEXT_MUTED }}
              >
                Linked order
              </h3>
              <Link
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm transition-colors duration-150"
                style={{
                  background: "#F0F4FF",
                  border: `1px solid #E5EDFF`,
                  color: TEXT_PRIMARY,
                }}
              >
                <div>
                  <div className="font-medium">
                    #{order.id.slice(-6).toUpperCase()}
                  </div>
                  <div
                    className="mt-0.5 text-xs"
                    style={{ color: TEXT_SECONDARY }}
                  >
                    View order details
                  </div>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={ACCENT}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}