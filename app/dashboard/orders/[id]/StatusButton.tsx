"use client";
// app/dashboard/orders/[id]/StatusButtons.tsx
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Status = "pending" | "out_for_delivery" | "delivered" | "cancelled";

const OPTIONS: { value: Status; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const BORDER = "#E6EAF5";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#556075";
const ACCENT = "#3B6BFF";
const ACCENT_SOFT = "#E5ECFF";

export default function StatusButtons({
  orderId,
  current,
}: {
  orderId: string;
  current: Status;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<Status>(current);
  const [error, setError] = useState("");

  async function setStatus(next: Status) {
    if (next === optimistic) return;
    setError("");
    const prev = optimistic;
    setOptimistic(next);

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setOptimistic(prev);
        setError(data?.error || "Could not update status");
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setOptimistic(prev);
      setError("Network error");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div
        className="flex overflow-hidden rounded-lg p-0.5"
        style={{ background: "#EDF0F8" }}
      >
        {OPTIONS.map((opt) => {
          const active = optimistic === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={pending}
              onClick={() => setStatus(opt.value)}
              className="px-2.5 py-1 text-xs font-medium transition-colors duration-150 disabled:opacity-60"
              style={{
                background: active ? "#FFFFFF" : "transparent",
                color: active ? ACCENT : TEXT_SECONDARY,
                borderRadius: 6,
                boxShadow: active
                  ? "0 1px 2px 0 rgba(11, 18, 32, 0.06)"
                  : "none",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && (
        <span className="text-[11px]" style={{ color: "#EF4444" }}>
          {error}
        </span>
      )}
    </div>
  );
}