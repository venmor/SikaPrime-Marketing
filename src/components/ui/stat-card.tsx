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
    <div className="nested-panel card-hover flex flex-col justify-center p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-4 font-display text-4xl font-semibold tracking-tight text-[color:var(--foreground)]">
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
