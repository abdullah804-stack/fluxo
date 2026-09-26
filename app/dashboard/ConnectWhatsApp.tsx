"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConnectWhatsApp() {
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
      const data = await res.json();
      setError(data.error || "Failed to connect");
      setSaving(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="card p-6">
      <h2 className="mb-1 text-lg font-semibold text-ink">
        Connect your WhatsApp
      </h2>
      <p className="mb-6 text-sm text-ink-2">
        Enter your WhatsApp Business credentials to start.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-rose-soft p-3 text-sm text-rose">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-2">
            Business phone number (with country code)
          </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 555 123 4567"
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-ink placeholder:text-ink-3"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-2">
            Phone Number ID
          </label>
          <input
            type="text"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            placeholder="123456789012345"
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-ink placeholder:text-ink-3"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-2">
            WhatsApp Business Account ID
          </label>
          <input
            type="text"
            value={wabaId}
            onChange={(e) => setWabaId(e.target.value)}
            placeholder="987654321098765"
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-ink placeholder:text-ink-3"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-2">
            Display name (optional)
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="My Business"
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-ink placeholder:text-ink-3"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {saving ? "Connecting..." : "Connect WhatsApp"}
        </button>
      </form>
    </div>
  );
}