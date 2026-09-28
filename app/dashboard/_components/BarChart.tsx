"use client";
// app/dashboard/_components/BarChart.tsx
import { useState } from "react";

export interface Bar {
  label: string;
  value: number;
  /** Pre-formatted value to show in the tooltip. Falls back to the raw number. */
  display?: string;
}

interface Props {
  data: Bar[];
  color?: string;
  height?: number;
}

export function BarChart({
  data,
  color = "#3B6BFF",
  height = 200,
}: Props) {
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm"
        style={{
          height,
          color: "#8B95AB",
          border: "1px dashed #E6EAF5",
          borderRadius: 12,
        }}
      >
        No data yet
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="relative">
      <div
        className="relative flex items-end gap-[2px]"
        style={{ height }}
      >
        {data.map((d, i) => {
          const h = (d.value / max) * 100;
          const isHover = hover === i;
          return (
            <div
              key={i}
              className="group relative flex flex-1 items-end"
              style={{ height: "100%" }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div
                className="w-full transition-all duration-200"
                style={{
                  height: `${Math.max(h, d.value > 0 ? 2 : 0)}%`,
                  background: isHover
                    ? color
                    : `linear-gradient(180deg, ${color} 0%, ${color}CC 100%)`,
                  borderRadius: 4,
                  opacity: d.value === 0 ? 0.15 : 1,
                }}
              />
              {isHover && (
                <div
                  className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium text-white shadow-lg"
                  style={{ background: "#0B1220" }}
                >
                  <div>{d.label}</div>
                  <div className="tnum opacity-90">
                    {d.display ?? d.value}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* X-axis labels — every ~5th bar to avoid crowding */}
      <div className="mt-2 flex justify-between text-[10px]">
        {data
          .map((d, i) => ({ d, i }))
          .filter(({ i }) => i % 5 === 0 || i === data.length - 1)
          .map(({ d, i }) => (
            <span key={i} style={{ color: "#8B95AB" }}>
              {d.label}
            </span>
          ))}
      </div>
    </div>
  );
}