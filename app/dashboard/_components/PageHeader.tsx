// app/dashboard/_components/PageHeader.tsx
export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-8">
      <div>
        {eyebrow && <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-3">{eyebrow}</div>}
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="text-base text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}