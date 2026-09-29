"use client";
// app/onboarding/OnboardingForm.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BUSINESS_TYPES, type BusinessType } from "@/lib/business-types";

const BORDER = "#E6EAF5";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#556075";
const TEXT_MUTED = "#8B95AB";
const ACCENT = "#3B6BFF";

export function OnboardingForm({
  initialName,
}: {
  initialName: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [businessName, setBusinessName] = useState(initialName);
  const [businessType, setBusinessType] = useState<BusinessType | "">("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedType = BUSINESS_TYPES.find((b) => b.value === businessType);

  async function save(next: "dashboard" | "products") {
    if (!businessName.trim()) {
      setError("Please enter your business name");
      return;
    }
    if (!businessType) {
      setError("Please choose a business type");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: businessName.trim(), businessType }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Could not save. Try again.");
        return;
      }

      router.push(next === "products" ? "/dashboard/products" : "/dashboard");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="w-full rounded-2xl bg-white p-8 shadow-sm"
      style={{ border: `1px solid ${BORDER}` }}
    >
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #3B6BFF 0%, #6B8AFF 100%)",
            boxShadow: "0 4px 14px -4px rgba(59, 107, 255, 0.4)",
          }}
        >
          F
        </span>
        <div className="leading-tight">
          <div
            className="text-base font-bold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            Welcome to Fluxo
          </div>
          <div
            className="text-[10px] font-medium tracking-[0.15em]"
            style={{ color: TEXT_MUTED }}
          >
            LET'S SET UP YOUR SHOP
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2">
        <StepDot active={step === 1} done={step > 1} n={1} />
        <div
          className="h-px flex-1"
          style={{ background: step > 1 ? ACCENT : BORDER }}
        />
        <StepDot active={step === 2} done={false} n={2} />
      </div>

      {step === 1 && (
        <>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            Tell us about your business
          </h1>
          <p className="mt-1 text-sm" style={{ color: TEXT_SECONDARY }}>
            This helps Fluxo label things correctly for your shop. You can
            change this later in Settings.
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span
                className="text-sm font-medium"
                style={{ color: TEXT_SECONDARY }}
              >
                Business name
              </span>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Sara Fabrics, Al-Madina Bakery"
                className="rounded-xl px-3.5 py-3 text-sm outline-none transition-colors duration-150 focus:border-[#3B6BFF]"
                style={{
                  border: `1px solid ${BORDER}`,
                  color: TEXT_PRIMARY,
                }}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span
                className="text-sm font-medium"
                style={{ color: TEXT_SECONDARY }}
              >
                What do you sell?
              </span>
              <select
                value={businessType}
                onChange={(e) =>
                  setBusinessType(e.target.value as BusinessType)
                }
                className="rounded-xl px-3.5 py-3 text-sm outline-none transition-colors duration-150 focus:border-[#3B6BFF]"
                style={{
                  border: `1px solid ${BORDER}`,
                  color: TEXT_PRIMARY,
                  background: "#FFFFFF",
                }}
              >
                <option value="">Choose a category</option>
                {BUSINESS_TYPES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>

            {selectedType && (
              <div
                className="rounded-lg px-4 py-3 text-xs"
                style={{
                  background: "#F0F4FF",
                  color: TEXT_SECONDARY,
                  border: `1px solid #E5EDFF`,
                }}
              >
                {selectedType.description}. Orders will be labelled{" "}
                <span
                  className="font-medium"
                  style={{ color: TEXT_PRIMARY }}
                >
                  {selectedType.itemPlural}
                </span>{" "}
                in your dashboard.
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 text-sm" style={{ color: "#EF4444" }}>
              {error}
            </p>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => {
                if (!businessName.trim() || !businessType) {
                  setError(
                    !businessName.trim()
                      ? "Please enter your business name"
                      : "Please choose a business type"
                  );
                  return;
                }
                setError("");
                setStep(2);
              }}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors"
              style={{ background: ACCENT }}
            >
              Continue →
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            Add your {selectedType?.itemPlural.toLowerCase() || "items"}
          </h1>
          <p className="mt-1 text-sm" style={{ color: TEXT_SECONDARY }}>
            If you add prices now, Fluxo can answer customer questions like
            &quot;kitne ka hai?&quot; with real numbers — and fill order
            totals automatically.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => save("products")}
              disabled={saving}
              className="flex items-center justify-between rounded-xl px-4 py-4 text-left transition-colors disabled:opacity-60"
              style={{
                background: "#F0F4FF",
                border: `1px solid #E5EDFF`,
              }}
            >
              <div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: TEXT_PRIMARY }}
                >
                  Add {selectedType?.itemPlural.toLowerCase() || "items"} now
                </div>
                <div
                  className="mt-0.5 text-xs"
                  style={{ color: TEXT_SECONDARY }}
                >
                  Recommended. Takes 2 minutes.
                </div>
              </div>
              <span style={{ color: ACCENT }}>→</span>
            </button>

            <button
              onClick={() => save("dashboard")}
              disabled={saving}
              className="flex items-center justify-between rounded-xl px-4 py-4 text-left transition-colors disabled:opacity-60"
              style={{
                background: "#FFFFFF",
                border: `1px solid ${BORDER}`,
              }}
            >
              <div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: TEXT_PRIMARY }}
                >
                  Skip for now
                </div>
                <div
                  className="mt-0.5 text-xs"
                  style={{ color: TEXT_SECONDARY }}
                >
                  You can add them anytime from the dashboard.
                </div>
              </div>
              <span style={{ color: TEXT_MUTED }}>→</span>
            </button>
          </div>

          {error && (
            <p className="mt-4 text-sm" style={{ color: "#EF4444" }}>
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              disabled={saving}
              className="text-sm font-medium transition-colors"
              style={{ color: TEXT_SECONDARY }}
            >
              ← Back
            </button>
            {saving && (
              <span className="text-xs" style={{ color: TEXT_MUTED }}>
                Saving...
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StepDot({
  n,
  active,
  done,
}: {
  n: number;
  active: boolean;
  done: boolean;
}) {
  const bg = done || active ? ACCENT : "#FFFFFF";
  const color = done || active ? "#FFFFFF" : TEXT_MUTED;
  const border = done || active ? ACCENT : BORDER;
  return (
    <span
      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors"
      style={{ background: bg, color, border: `1px solid ${border}` }}
    >
      {done ? "✓" : n}
    </span>
  );
}