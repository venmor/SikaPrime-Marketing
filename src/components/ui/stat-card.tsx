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
    <div className="nested-panel card-hover flex flex-col justify-center p-[clamp(1rem,3vw,1.5rem)]">
      <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-4 font-display text-[clamp(1.75rem,5vw,2.25rem)] font-semibold tracking-tight text-[color:var(--foreground)]">
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
