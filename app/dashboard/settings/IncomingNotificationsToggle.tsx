"use client";
// app/dashboard/settings/IncomingNotificationsToggle.tsx
import { useState } from "react";

const TEXT_PRIMARY = "#0B1220";
const ACCENT = "#3B6BFF";

export function IncomingNotificationsToggle({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function toggle() {
    const next = !enabled;
    setSaving(true);
    setError("");
    setSaved(false);
    setEnabled(next);

    try {
      const res = await fetch("/api/account/incoming-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) {
        setEnabled(!next);
        setError("Could not save");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setEnabled(!next);
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        disabled={saving}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 disabled:opacity-60"
        style={{ background: enabled ? ACCENT : "#D5DCF0" }}
        aria-pressed={enabled}
      >
        <span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
          style={{
            transform: enabled
              ? "translateX(24px)"
              : "translateX(4px)",
          }}
        />
      </button>
      <span
        className="text-sm font-medium"
        style={{ color: TEXT_PRIMARY }}
      >
        {enabled ? "On" : "Off"}
      </span>
      {error && (
        <span className="text-xs" style={{ color: "#EF4444" }}>
          {error}
        </span>
      )}
      {saved && (
        <span className="text-xs" style={{ color: "#10B981" }}>
          ✓ Saved
        </span>
      )}
    </div>
  );
}