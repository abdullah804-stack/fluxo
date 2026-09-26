"use client";
// app/dashboard/_components/StatCard.tsx
import { useEffect, useState } from "react";

/**
 * Each tone has an icon color (top-left square) and a data color
 * (micro-chart + neutral delta state).
 */
const tones = {
  blue: { icon: "#3B6BFF", iconSoft: "#E5EDFF", data: "#3B6BFF" },
  purple: { icon: "#8B5CF6", iconSoft: "#F0E8FF", data: "#F59E0B" },
  pink: { icon: "#F43F5E", iconSoft: "#FFE5EC", data: "#F43F5E" },
  teal: { icon: "#0EA5A5", iconSoft: "#E0F7F7", data: "#0EA5A5" },
};

type Props = {
  label: string;
  value: number;
  currency?: string;
  delta?: string;
  deltaTone?: "up" | "down" | "flat";
  tone: keyof typeof tones;
  icon: React.ReactNode;
  index?: number;
  trend?: number[];
};

const DEFAULT_TREND = [0.15, 0.4, 0.25, 0.55, 0.35, 0.6, 0.45, 0.8, 0.65, 1];

function MicroChart({
  color,
  trend = DEFAULT_TREND,
  index,
}: {
  color: string;
  trend?: number[];
  index: number;
}) {
  const w = 120;
  const h = 48;
  const pts = trend.map(
    (v, i) => [(i / (trend.length - 1)) * w, h - v * h * 0.9 - 3] as const
  );
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` Q ${mx},${y0} ${mx},${(y0 + y1) / 2} T ${x1},${y1}`;
  }
  const areaD = `${d} L ${w},${h} L 0,${h} Z`;
  const gid = `mc-grad-${index}`;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gid})`} />
      <path
        className="micro-chart-path"
        style={{ ["--i" as string]: index }}
        d={d}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  currency,
  delta,
  deltaTone = "flat",
  tone,
  icon,
  index = 0,
  trend,
}: Props) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }
    const t0 = performance.now();
    const dur = 900;
    let raf = 0;
    const ease = (p: number) => 1 - Math.pow(1 - p, 2);
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setN(value * ease(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const { icon: iconColor, iconSoft, data } = tones[tone];

  const shown = currency
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(n)
    : Math.round(n).toLocaleString("en-US");

  const deltaStyle =
    deltaTone === "up"
      ? { color: "#10B981" }
      : deltaTone === "down"
        ? { color: "#EF4444" }
        : { color: data };

  return (
    <div
      style={{
        ["--i" as string]: index,
        borderRadius: 20,
      }}
      className="card lift fade-up-scale relative overflow-hidden bg-white p-6"
    >
      {/* soft glow bottom-right */}
      <div
        className="kpi-glow pointer-events-none absolute bottom-0 right-0 h-32 w-40"
        style={{
          background: `radial-gradient(circle at bottom right, ${data}1f, transparent 70%)`,
        }}
      />

      {/* top row — icon + label + menu */}
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{ background: iconSoft, color: iconColor }}
          >
            <span
              style={{
                display: "inline-flex",
                width: 20,
                height: 20,
              }}
            >
              {icon}
            </span>
          </span>
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "#8B95AB" }}
          >
            {label}
          </span>
        </div>

        <span style={{ color: "#C4CBDA" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="19" cy="12" r="1.6" />
          </svg>
        </span>
      </div>

      {/* middle row — big number + micro-chart */}
      <div className="relative mt-4 flex items-end justify-between gap-4">
        <div
          className="tnum text-[1.875rem] font-bold leading-none tracking-tight"
          style={{ color: "#0B1220" }}
        >
          {shown}
        </div>
        <MicroChart color={data} trend={trend} index={index} />
      </div>

      {/* bottom row — delta */}
      {delta && (
        <div
          className="relative mt-3 flex items-center gap-1.5 text-sm font-medium"
          style={deltaStyle}
        >
          {deltaTone === "flat" ? (
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: data }}
            />
          ) : (
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {deltaTone === "up" ? (
                <path d="M7 17 17 7M8 7h9v9" />
              ) : (
                <path d="M7 7l10 10M17 8v9H8" />
              )}
            </svg>
          )}
          {delta}
        </div>
      )}
    </div>
  );
}