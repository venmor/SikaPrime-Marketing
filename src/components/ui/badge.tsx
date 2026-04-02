import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?:
    | "default"
    | "success"
    | "warning"
    | "muted"
    | "brand-subtle"
    | "cyan-subtle";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
        variant === "default" &&
          "border-[color:rgba(230,62,140,0.16)] bg-[linear-gradient(135deg,rgba(230,62,140,0.12),rgba(255,255,255,0.88))] text-[color:var(--brand)]",
        variant === "success" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        variant === "warning" &&
          "border-amber-200 bg-amber-50 text-amber-700",
        variant === "muted" &&
          "border-[color:var(--border)] bg-[color:rgba(148,163,184,0.08)] text-[color:var(--muted)]",
        variant === "brand-subtle" &&
          "border-[color:rgba(230,62,140,0.18)] bg-[color:rgba(230,62,140,0.14)] text-[color:var(--brand)]",
        variant === "cyan-subtle" &&
          "border-[color:rgba(33,198,217,0.2)] bg-[color:rgba(33,198,217,0.14)] text-[color:var(--secondary-strong)]",
      )}
    >
      {children}
    </span>
  );
}
