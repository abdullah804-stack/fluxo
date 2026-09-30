// app/_components/ExtractionDemo.tsx

/**
 * Looping animation: customer message → extracted structured order.
 * Pure CSS. No client JS.
 */
export function ExtractionDemo() {
  return (
    <div className="relative">
      <div
        className="relative h-[420px] overflow-hidden rounded-3xl p-6"
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 24px 60px -20px rgba(59, 107, 255, 0.3)",
        }}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "#8B95AB" }}
          >
            Live extraction
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-xs"
            style={{ color: "#10B981" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 anim-pulse-dot" />
            Running
          </span>
        </div>

        {/* Stage */}
        <div className="relative h-[330px]">
          {/* Phase 1 — incoming WhatsApp message */}
          <div className="phase phase-1 absolute inset-0 flex flex-col gap-3">
            <span
              className="text-[10px] font-medium uppercase tracking-[0.12em]"
              style={{ color: "#8B95AB" }}
            >
              Incoming message
            </span>

            <div
              className="rounded-2xl p-4"
              style={{
                background: "rgba(16, 185, 129, 0.08)",
                borderLeft: "3px solid #10B981",
              }}
            >
              <div
                className="mb-2 flex items-center gap-2 text-xs font-medium"
                style={{ color: "#10B981" }}
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Customer · +92 300 ***
              </div>
              <p className="text-sm leading-relaxed text-white">
                Sara k liye 2 suits, 3,500, COD, Gulberg
              </p>
              <p
                className="mt-2 text-xs italic"
                style={{ color: "#8B95AB" }}
              >
                2 suits for Sara, Rs 3,500, cash on delivery
              </p>
            </div>

            <div
              className="mt-auto flex items-center gap-2 text-xs"
              style={{ color: "#8B95AB" }}
            >
              <span className="anim-dots">Reading</span>
            </div>
          </div>

          {/* Phase 2 — analyzing */}
          <div className="phase phase-2 absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full opacity-40 blur-xl"
                style={{ background: "#3B6BFF" }}
              />
              <div
                className="relative flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, #3B6BFF 0%, #6B8AFF 100%)",
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="anim-spin-slow"
                >
                  <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
                </svg>
              </div>
            </div>

            <div className="text-center">
              <p
                className="text-sm font-semibold"
                style={{ color: "#6B8AFF" }}
              >
                Extracting
              </p>
              <p
                className="mt-1 text-xs"
                style={{ color: "#8B95AB" }}
              >
                Intent · Entities · Currency
              </p>
            </div>

            <div
              className="mt-2 h-1 w-32 overflow-hidden rounded-full"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="anim-progress-bar h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, #3B6BFF 0%, #6B8AFF 100%)",
                }}
              />
            </div>
          </div>

          {/* Phase 3 — structured order */}
          <div className="phase phase-3 absolute inset-0 flex flex-col gap-3">
            <span
              className="text-[10px] font-medium uppercase tracking-[0.12em]"
              style={{ color: "#8B95AB" }}
            >
              Structured order
            </span>

            <div
              className="rounded-2xl p-4"
              style={{
                background: "rgba(59, 107, 255, 0.08)",
                border: "1px solid rgba(59, 107, 255, 0.2)",
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className="font-mono text-[10px] tracking-wider"
                  style={{ color: "#8B95AB" }}
                >
                  ORDER #A1B2C3
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background: "rgba(245, 158, 11, 0.15)",
                      color: "#F5B83D",
                    }}
                  >
                    Pending
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background: "rgba(245, 158, 11, 0.15)",
                      color: "#F5B83D",
                    }}
                  >
                    Unpaid
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <Row label="Customer" value="Sara" />
                <Row label="Item" value="2 × suits" />
                <Row label="Total" value="Rs 3,500" bold />
                <Row label="Payment" value="Cash on delivery" />
                <Row label="Address" value="Gulberg" />
              </div>
            </div>

            <div
              className="mt-auto flex items-center gap-2 text-xs"
              style={{ color: "#10B981" }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 13 4 4L19 7" />
              </svg>
              Saved to dashboard · 0.4s
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="mt-4 flex items-center justify-between border-t pt-4"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <span className="text-xs" style={{ color: "#8B95AB" }}>
            Every message, structured in real time
          </span>
          <span
            className="text-xs font-semibold"
            style={{ color: "#6B8AFF" }}
          >
            Auto
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs" style={{ color: "#8B95AB" }}>
        {label}
      </span>
      <span
        className={`text-sm ${bold ? "font-semibold" : ""}`}
        style={{ color: bold ? "#FFFFFF" : "#E5EAF3" }}
      >
        {value}
      </span>
    </div>
  );
}