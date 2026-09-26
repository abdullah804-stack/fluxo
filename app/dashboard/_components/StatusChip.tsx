// app/dashboard/_components/StatusChip.tsx
const tones = {
  neutral: { chip: "#64748B", bg: "rgba(100,116,139,0.12)", dot: "#94A3B8" },
  accent: { chip: "#1D4ED8", bg: "rgba(59,130,246,0.12)", dot: "#3B82F6" },
  success: { chip: "#047857", bg: "rgba(16,185,129,0.12)", dot: "#10B981" },
  warning: { chip: "#B45309", bg: "rgba(245,158,11,0.12)", dot: "#F59E0B" },
  danger: { chip: "#B91C1C", bg: "rgba(239,68,68,0.12)", dot: "#EF4444" },
};
export type Tone = keyof typeof tones;
export function StatusChip({ tone = "neutral", dot = true, children }: { tone?: Tone; dot?: boolean; children: React.ReactNode }) {
  const t = tones[tone];
  return (
    <span className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-medium" style={{ background: t.bg, color: t.chip }}>
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.dot }} />}{children}
    </span>
  );
}
export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="tnum inline-flex min-w-5 justify-center rounded-full bg-[--color-bg-hover] px-1.5 text-xs font-medium text-ink-2">{children}</span>;
}