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
        "surface-panel flex flex-col p-6 sm:p-8",
        className,
      )}
    >
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <h2 className="font-display text-xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className="max-w-xl text-sm leading-relaxed text-[color:var(--muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="flex-1">
        {children}
      </div>
    </section>
  );
}
