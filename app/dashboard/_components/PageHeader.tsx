// app/dashboard/_components/PageHeader.tsx
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 pb-6 sm:pb-8 md:flex-row md:flex-wrap md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div
            className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "#8B95AB" }}
          >
            {eyebrow}
          </div>
        )}
        <h1
          className="mb-1 text-2xl font-bold tracking-tight sm:text-3xl md:mb-2 md:text-4xl"
          style={{ color: "#0B1220" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-sm sm:text-base"
            style={{ color: "#556075" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}