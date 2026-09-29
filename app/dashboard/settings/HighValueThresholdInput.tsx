"use client";
// app/dashboard/settings/HighValueThresholdInput.tsx
import { useState } from "react";

const BORDER = "#E6EAF5";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#556075";
const ACCENT = "#3B6BFF";

export function HighValueThresholdInput({
  initialThreshold,
  baseCurrency,
}: {
  initialThreshold: number | null;
  baseCurrency: string;
}) {
  const [value, setValue] = useState(
    initialThreshold === null ? "" : String(initialThreshold)
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetch("/api/account/high-value-threshold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threshold: value.trim() === "" ? null : value,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Could not save");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-3 text-sm">
      <label className="flex flex-col gap-1.5">
        <span
          className="text-sm font-medium"
          style={{ color: TEXT_SECONDARY }}
        >
          Alert when an order is at least ({baseCurrency})
        </span>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          placeholder="Leave blank to turn off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded-lg px-3 py-2 outline-none transition-colors duration-150 focus:border-[#3B6BFF]"
          style={{
            border: `1px solid ${BORDER}`,
            background: "#FFFFFF",
            color: TEXT_PRIMARY,
            maxWidth: 240,
          }}
        />
      </label>

      <p className="text-xs" style={{ color: TEXT_SECONDARY }}>
        Example: set to <span className="font-medium">10000</span> and
        every order of Rs 10,000 or more will ping you on WhatsApp.
        Leave blank to disable.
      </p>

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
          {saving ? "Saving..." : "Save threshold"}
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