"use client";
// app/dashboard/orders/[id]/StatusButton.tsx
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Status = "pending" | "out_for_delivery" | "delivered" | "cancelled";

const OPTIONS: { value: Status; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "out_for_delivery", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const BORDER = "#E6EAF5";
const TEXT_SECONDARY = "#556075";
const ACCENT = "#3B6BFF";

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
    <div className="flex w-full flex-col items-end gap-1.5">
      <div className="grid w-full grid-cols-2 gap-1.5">
        {OPTIONS.map((opt) => {
          const active = optimistic === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={pending}
              onClick={() => setStatus(opt.value)}
              className="rounded-lg px-2 py-1.5 text-center text-[11px] font-medium transition-colors duration-150 disabled:opacity-60"
              style={{
                background: active ? ACCENT : "#F3F5FB",
                color: active ? "#FFFFFF" : TEXT_SECONDARY,
                border: `1px solid ${active ? ACCENT : BORDER}`,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && (
        <span className="text-[10px]" style={{ color: "#EF4444" }}>
          {error}
        </span>
      )}
    </div>
  );
}