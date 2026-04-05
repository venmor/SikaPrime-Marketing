export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="nested-panel card-hover flex min-w-0 flex-col justify-center overflow-hidden p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-4 break-words font-display text-3xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
        {value}
      </p>
      {hint ? (
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
