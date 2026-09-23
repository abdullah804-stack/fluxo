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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        Connect your WhatsApp
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Enter your WhatsApp Business credentials to start.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Business phone number (with country code)
          </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 555 123 4567"
            className="w-full border border-gray-300 text-gray-900 rounded-md px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone Number ID
          </label>
          <input
            type="text"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            placeholder="123456789012345"
            className="w-full border border-gray-300 text-gray-900 rounded-md px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            WhatsApp Business Account ID
          </label>
          <input
            type="text"
            value={wabaId}
            onChange={(e) => setWabaId(e.target.value)}
            placeholder="987654321098765"
            className="w-full border border-gray-300 text-gray-900 rounded-md px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Display name (optional)
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="My Business"
            className="w-full border border-gray-300 text-gray-900 rounded-md px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Connecting..." : "Connect WhatsApp"}
        </button>
      </form>
    </div>
  );
}