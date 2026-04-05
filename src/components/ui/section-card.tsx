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
        "surface-panel flex min-w-0 flex-col p-[clamp(1rem,3vw,1.5rem)]",
        className,
      )}
    >
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h2 className="font-display text-xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className="max-w-xl text-sm leading-relaxed text-[color:var(--muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="w-full md:w-auto md:shrink-0">{action}</div> : null}
      </div>
      <div className="min-w-0 flex-1">
        {children}
      </div>
    </section>
  );
}
