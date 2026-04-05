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
        "inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-center text-[0.6875rem] font-semibold uppercase leading-tight tracking-wider transition-colors",
        variant === "default" &&
          "border-transparent bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]",
        variant === "success" &&
          "border-transparent bg-[color:var(--success-soft)] text-[color:var(--success-strong)]",
        variant === "warning" &&
          "border-transparent bg-[color:var(--warning-soft)] text-[color:var(--warning-strong)]",
        variant === "danger" &&
          "border-transparent bg-[color:var(--danger-soft)] text-[color:var(--danger-strong)]",
        variant === "muted" &&
          "border-[color:var(--border)] bg-[color:var(--surface-soft)] text-[color:var(--muted)]",
        variant === "brand-subtle" &&
          "border-transparent bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]",
        variant === "cyan-subtle" &&
          "border-transparent bg-[color:var(--secondary-soft)] text-[color:var(--secondary-strong)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
