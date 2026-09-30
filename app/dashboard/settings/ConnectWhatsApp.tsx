"use client";
// app/dashboard/settings/ConnectWhatsApp.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";

const BORDER = "#E6EAF5";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#556075";
const TEXT_MUTED = "#8B95AB";
const ACCENT = "#3B6BFF";

export function ConnectWhatsApp() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          phoneNumberId,
          wabaId,
          displayName,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to connect");
        return;
      }

      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  const inp: React.CSSProperties = {
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
    color: TEXT_PRIMARY,
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    width: "100%",
    outline: "none",
  };

  const label: React.CSSProperties = {
    color: TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 6,
    display: "block",
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div
        className="rounded-lg p-3 text-sm"
        style={{
          background: "#F0F4FF",
          border: "1px solid #E5EDFF",
          color: "#1E3A5F",
        }}
      >
        <strong>First time connecting?</strong>{" "}
        Read the{" "}
        <a
          href="/setup-guide"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: ACCENT, fontWeight: 600, textDecoration: "underline" }}
        >
          5-minute setup guide
        </a>{" "}
        — it walks you through every value below.
      </div>

      {error && (
        <div
          className="rounded-lg p-3 text-sm"
          style={{ background: "#FEF2F2", color: "#B91C1C" }}
        >
          {error}
        </div>
      )}

      <div>
        <label style={label}>Business phone number</label>
        <input
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+92 300 1234567"
          style={inp}
          required
        />
      </div>

      <div>
        <label style={label}>Phone Number ID</label>
        <input
          type="text"
          value={phoneNumberId}
          onChange={(e) => setPhoneNumberId(e.target.value)}
          placeholder="123456789012345"
          style={inp}
          required
        />
        <p className="mt-1 text-xs" style={{ color: TEXT_MUTED }}>
          The numeric ID, not the phone number.
        </p>
      </div>

      <div>
        <label style={label}>WhatsApp Business Account ID (WABA ID)</label>
        <input
          type="text"
          value={wabaId}
          onChange={(e) => setWabaId(e.target.value)}
          placeholder="987654321098765"
          style={inp}
          required
        />
      </div>

      <div>
        <label style={label}>Display name (optional)</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your business name"
          style={inp}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60"
        style={{ background: ACCENT }}
      >
        {saving ? "Connecting..." : "Connect WhatsApp"}
      </button>
    </form>
  );
}