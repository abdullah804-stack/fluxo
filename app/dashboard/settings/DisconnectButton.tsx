"use client";
// app/dashboard/settings/DisconnectButton.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";

const DANGER = "#EF4444";

export function DisconnectButton({
  phoneNumber,
}: {
  phoneNumber: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDisconnect() {
    setBusy(true);
    const res = await fetch("/api/whatsapp/disconnect", {
      method: "POST",
    });
    if (!res.ok) {
      setBusy(false);
      return;
    }
    router.refresh();
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
        style={{ borderColor: "rgba(239,68,68,0.3)", color: DANGER }}
      >
        Disconnect WhatsApp
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3
              className="mb-2 text-base font-semibold"
              style={{ color: "#0B1220" }}
            >
              Disconnect WhatsApp?
            </h3>
            <p
              className="mb-5 text-sm"
              style={{ color: "#556075" }}
            >
              This will stop tracking new messages from{" "}
              <span className="tnum font-medium">{phoneNumber}</span>.
              Existing orders and customers are kept.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border px-4 py-2 text-sm font-medium"
                style={{ borderColor: "#E6EAF5", color: "#0B1220" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                disabled={busy}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                style={{ background: DANGER }}
              >
                {busy ? "Disconnecting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}