import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "group relative overflow-hidden rounded-[32px] border border-[color:var(--border-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.82))] p-5 shadow-[var(--shadow-panel)] backdrop-blur-xl transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] sm:p-6",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent)]" />
      <div className="pointer-events-none absolute -right-16 top-0 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(230,62,140,0.12),transparent_68%)] opacity-0 transition duration-300 group-hover:opacity-100" />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-[1.25rem] font-semibold tracking-[-0.02em] text-[color:var(--foreground)] sm:text-[1.35rem]">
            {title}
          </h2>
          {description ? (
            <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
