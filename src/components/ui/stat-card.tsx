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
    <div className="relative overflow-hidden rounded-[26px] border border-[color:var(--border-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.82))] p-5 shadow-[var(--shadow-panel)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.92),transparent)]" />
      <div className="pointer-events-none absolute -right-8 top-3 h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(33,198,217,0.12),transparent_72%)]" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-4 font-display text-[2rem] font-semibold tracking-[-0.04em] text-[color:var(--foreground)] sm:text-[2.35rem]">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 max-w-[18rem] text-sm leading-6 text-[color:var(--muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
