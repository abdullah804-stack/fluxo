"use client";
// app/dashboard/messages/[id]/DraftReply.tsx
import { useState } from "react";

const BORDER = "#E6EAF5";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#556075";
const TEXT_MUTED = "#8B95AB";
const ACCENT = "#3B6BFF";

interface StoredDraft {
  text: string;
  generatedAt: string;
}

export type PendingDraftStatus =
  | "pending"
  | "sent"
  | "skipped"
  | "expired"
  | null;

export default function DraftReply({
  messageId,
  initialDraft,
  pendingStatus,
  sentAt,
}: {
  messageId: string;
  initialDraft: StoredDraft | null;
  pendingStatus: PendingDraftStatus;
  sentAt: string | null;
}) {
  const [draft, setDraft] = useState<StoredDraft | null>(initialDraft);
  const [status, setStatus] = useState<PendingDraftStatus>(pendingStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const res = await fetch(`/api/messages/${messageId}/draft`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not generate draft");
        return;
      }
      setDraft(data.draft);
      setStatus("pending");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy");
    }
  }

  // ---------- Header ----------
  const header = (
    <div className="mb-2 flex items-center justify-between">
      <h2
        className="text-base font-semibold tracking-tight"
        style={{ color: TEXT_PRIMARY }}
      >
        Suggested reply
      </h2>
      {(draft && status === "pending") || status === "expired" ? (
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-lg border bg-white px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60"
          style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
        >
          {loading ? "..." : status === "expired" ? "Regenerate" : "Regenerate"}
        </button>
      ) : null}
    </div>
  );

  // ---------- Status chips ----------
  const statusBanner = (() => {
    if (status === "sent" && draft) {
      return (
        <div
          className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium"
          style={{ background: "#ECFDF5", color: "#047857" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 13 4 4L19 7" />
          </svg>
          Sent to customer
          {sentAt
            ? ` · ${new Date(sentAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : ""}
        </div>
      );
    }
    if (status === "skipped") {
      return (
        <div
          className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium"
          style={{ background: "#F3F5FB", color: "#556075" }}
        >
          Skipped — not sent to customer
        </div>
      );
    }
    if (status === "expired") {
      return (
        <div
          className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium"
          style={{ background: "#FFF3E0", color: "#B45309" }}
        >
          Expired — 24 hours passed. Regenerate if you still want to reply.
        </div>
      );
    }
    return null;
  })();

  // ---------- Body ----------
  return (
    <div className="mt-6">
      {header}

      {/* No draft at all */}
      {!draft && (
        <div
          className="flex flex-col items-center gap-3 rounded-xl p-5"
          style={{
            border: `1px dashed ${BORDER}`,
            background: "#FAFBFE",
          }}
        >
          <p
            className="text-center text-sm"
            style={{ color: TEXT_SECONDARY }}
          >
            Let Fluxo draft a reply based on your past messages and this
            customer's context.
          </p>
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60"
            style={{ background: ACCENT }}
          >
            {loading ? "Drafting..." : "Draft reply"}
          </button>
        </div>
      )}

      {/* Draft exists */}
      {draft && (
        <>
          {statusBanner}
          <div
            className="rounded-xl p-4"
            style={{
              background:
                status === "skipped" || status === "expired"
                  ? "#FAFBFE"
                  : "#F0F4FF",
              borderLeft: `3px solid ${
                status === "sent"
                  ? "#10B981"
                  : status === "skipped" || status === "expired"
                    ? "#C4CBDA"
                    : ACCENT
              }`,
              opacity: status === "skipped" ? 0.75 : 1,
            }}
          >
            <p
              className="whitespace-pre-wrap text-sm"
              style={{ color: TEXT_PRIMARY }}
            >
              {draft.text}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs" style={{ color: TEXT_MUTED }}>
                Drafted{" "}
                {new Date(draft.generatedAt).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {status === "pending" && (
                <button
                  onClick={copy}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: copied ? "#10B981" : "#FFFFFF",
                    color: copied ? "#FFFFFF" : TEXT_PRIMARY,
                    border: `1px solid ${copied ? "#10B981" : BORDER}`,
                  }}
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              )}
              {status === "sent" && (
                <span
                  className="rounded-lg px-3 py-1.5 text-xs font-medium"
                  style={{
                    background: "#ECFDF5",
                    color: "#047857",
                    border: "1px solid #A7F3D0",
                  }}
                >
                  ✓ Delivered
                </span>
              )}
            </div>
          </div>

          {status === "pending" && (
            <p className="mt-3 text-xs" style={{ color: TEXT_MUTED }}>
              From WhatsApp, reply{" "}
              <span className="font-medium" style={{ color: TEXT_PRIMARY }}>
                send [name]
              </span>{" "}
              to send this reply, or{" "}
              <span className="font-medium" style={{ color: TEXT_PRIMARY }}>
                edit [name] [text]
              </span>{" "}
              to change it.
            </p>
          )}
        </>
      )}

      {error && (
        <p className="mt-2 text-xs" style={{ color: "#EF4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}