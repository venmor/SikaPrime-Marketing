import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
        variant === "default" &&
          "border-[color:var(--border)] bg-[color:rgba(18,62,74,0.08)] text-[color:var(--brand)]",
        variant === "success" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        variant === "warning" &&
          "border-amber-200 bg-amber-50 text-amber-700",
        variant === "muted" &&
          "border-[color:var(--border)] bg-[color:rgba(95,107,104,0.08)] text-[color:var(--muted)]",
      )}
    >
      {children}
    </span>
  );
}
