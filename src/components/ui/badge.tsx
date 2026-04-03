import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "muted"
    | "brand-subtle"
    | "cyan-subtle";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider transition-colors",
        variant === "default" &&
          "bg-brand-soft text-brand-strong",
        variant === "success" &&
          "bg-emerald-100 text-emerald-800",
        variant === "warning" &&
          "bg-amber-100 text-amber-800",
        variant === "danger" &&
          "bg-rose-100 text-rose-800",
        variant === "muted" &&
          "bg-slate-100 text-slate-600",
        variant === "brand-subtle" &&
          "bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]",
        variant === "cyan-subtle" &&
          "bg-[color:var(--secondary-soft)] text-[color:var(--secondary-strong)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
