// app/dashboard/_components/EmptyState.tsx
export function EmptyState({ title, subtitle, icon, action }: { title: string; subtitle: string; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="card fade-up mx-auto flex max-w-md flex-col items-center text-center">
      {icon && <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-accent" style={{ background: "var(--color-accent-soft)" }}>{icon}</div>}
      <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-2">{subtitle}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}