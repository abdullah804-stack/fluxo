"use client";
// app/dashboard/_components/OrderScroller.tsx
import { useRef, useState } from "react";

export function OrderScroller({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  };

  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    // scroll by ~2 cards at a time (2 × 340 + gap 16 = 696)
    el.scrollBy({ left: dir * 356, behavior: "smooth" });
  };

  const btnStyle: React.CSSProperties = {
    borderColor: "#E6EAF5",
    color: "#3B6BFF",
    background: "#FFFFFF",
  };

  return (
    <div>
      {/* Horizontal cards */}
      <div
        ref={ref}
        onScroll={onScroll}
        className="thin-scroll -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-4"
      >
        {children}
      </div>

      {/* Bottom nav: chevron ← progress → chevron */}
      <div className="mt-5 flex items-center gap-3">
        <button
          aria-label="Scroll left"
          onClick={() => nudge(-1)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-sm transition-all duration-200 hover:shadow-md"
          style={btnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#F0F4FF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#FFFFFF";
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        {/* Progress bar */}
        <div
          className="h-2 flex-1 overflow-hidden rounded-full"
          style={{ background: "#EDF0F8" }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-150"
            style={{
              width: `${Math.max(5, progress * 100)}%`,
              background:
                "linear-gradient(90deg, #C7D7FF 0%, #3B6BFF 100%)",
            }}
          />
        </div>

        <button
          aria-label="Scroll right"
          onClick={() => nudge(1)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-sm transition-all duration-200 hover:shadow-md"
          style={btnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#F0F4FF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#FFFFFF";
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}