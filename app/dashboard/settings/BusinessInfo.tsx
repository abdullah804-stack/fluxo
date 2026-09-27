"use client";
// app/dashboard/settings/BusinessInfo.tsx
import { useState } from "react";

const BORDER = "#E6EAF5";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#556075";
const ACCENT = "#3B6BFF";

export function BusinessInfo({
  initialDisplayName,
}: {
  initialDisplayName: string;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    const res = await fetch("/api/whatsapp/update-display-name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    });

    if (!res.ok) {
      setError("Could not save");
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-3 text-sm">
      <label
        className="flex flex-col gap-1.5 text-sm font-medium"
        style={{ color: TEXT_SECONDARY }}
      >
        Display name
        <input
          name="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="My Business"
          className="rounded-lg px-3 py-2 outline-none"
          style={{
            border: `1px solid ${BORDER}`,
            color: TEXT_PRIMARY,
            background: "#FFFFFF",
          }}
        />
      </label>

      {error && (
        <p className="text-sm" style={{ color: "#EF4444" }}>
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60"
          style={{ background: ACCENT }}
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        {saved && (
          <span className="text-sm" style={{ color: "#10B981" }}>
            ✓ Saved
          </span>
        )}
      </div>
    </form>
  );
}