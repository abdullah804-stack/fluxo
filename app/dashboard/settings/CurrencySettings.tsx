"use client";
// app/dashboard/settings/CurrencySettings.tsx
import { useState } from "react";

const BORDER = "#E6EAF5";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#556075";
const ACCENT = "#3B6BFF";

const CURRENCIES = [
  "USD", "PKR", "INR", "EUR", "GBP", "AED", "SAR", "BDT",
  "NGN", "ZAR", "IDR", "MYR", "PHP", "VND", "TRY", "EGP",
  "CNY", "JPY", "AUD", "CAD", "CHF", "SEK", "SGD",
];

export function CurrencySettings({
  initialBaseCurrency,
}: {
  initialBaseCurrency: string;
}) {
  const [baseCurrency, setBaseCurrency] = useState(initialBaseCurrency);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    const res = await fetch("/api/account/currency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseCurrency }),
    });

    if (!res.ok) {
      setError("Could not save currency");
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
        Base currency
        <select
          value={baseCurrency}
          onChange={(e) => setBaseCurrency(e.target.value)}
          className="rounded-lg px-3 py-2 outline-none"
          style={{
            border: `1px solid ${BORDER}`,
            color: TEXT_PRIMARY,
            background: "#FFFFFF",
          }}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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
          {saving ? "Saving..." : "Save currency"}
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