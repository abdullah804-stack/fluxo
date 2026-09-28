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

export default function DraftReply({
  messageId,
  initialDraft,
}: {
  messageId: string;
  initialDraft: StoredDraft | null;
}) {
  const [draft, setDraft] = useState<StoredDraft | null>(initialDraft);
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

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2
          className="text-base font-semibold tracking-tight"
          style={{ color: TEXT_PRIMARY }}
        >
          Suggested reply
        </h2>
        {draft && (
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-lg border bg-white px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60"
            style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
          >
            {loading ? "..." : "Regenerate"}
          </button>
        )}
      </div>

      {!draft ? (
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
      ) : (
        <div
          className="rounded-xl p-4"
          style={{
            background: "#F0F4FF",
            borderLeft: `3px solid ${ACCENT}`,
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
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs" style={{ color: "#EF4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}