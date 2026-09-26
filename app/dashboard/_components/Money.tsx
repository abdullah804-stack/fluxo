// app/dashboard/_components/Money.tsx
const sizeCls = { sm: "text-sm", md: "text-lg", lg: "text-2xl" } as const;
const fmt = (n: number, c: string, size: keyof typeof sizeCls) => {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: size === "sm" ? 0 : 2 }).format(n); }
  catch { return `${c} ${n.toFixed(2)}`; }
};
export function Money({ amount, currency, baseAmount, baseCurrency, size = "sm" }: {
  amount: number; currency: string; baseAmount?: number | null; baseCurrency?: string; size?: keyof typeof sizeCls;
}) {
  const differs = baseAmount != null && baseCurrency && baseCurrency !== currency;
  return (
    <span className="inline-flex flex-col items-start leading-tight">
      <span className={`tnum font-bold tracking-tight text-ink ${sizeCls[size]}`}>{fmt(amount, currency, size)}</span>
      {differs && <span className="tnum text-xs text-ink-3">≈ {fmt(baseAmount!, baseCurrency!, size)}</span>}
    </span>
  );
}