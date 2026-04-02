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
    <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl font-semibold text-[color:var(--foreground)]">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-sm text-[color:var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}
