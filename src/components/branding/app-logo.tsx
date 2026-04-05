import Image from "next/image";

import { cn } from "@/lib/utils";

export function AppLogo({
  className,
  compact = false,
  showLabel = true,
  theme = "light",
}: {
  className?: string;
  compact?: boolean;
  showLabel?: boolean;
  theme?: "light" | "dark";
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-[22px] border shadow-[var(--shadow-soft)]",
          compact ? "h-12 w-12" : "h-14 w-14",
          theme === "dark"
            ? "border-white/15 bg-surface-strong/10 backdrop-blur-xl"
            : "border-[color:var(--border-strong)] bg-surface-strong/90 backdrop-blur-xl",
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(230,62,140,0.16),transparent_58%),radial-gradient(circle_at_bottom_right,rgba(33,198,217,0.18),transparent_55%)]" />
        <Image
          src="/sika-prime-logo.png"
          alt="Sika Prime Loans logo"
          width={compact ? 34 : 42}
          height={compact ? 34 : 42}
          className="relative z-10 h-auto w-auto object-contain"
          priority
        />
      </div>

      {showLabel ? (
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-[10px] font-semibold uppercase tracking-[0.22em] sm:text-[11px] sm:tracking-[0.28em]",
              theme === "dark" ? "text-white/60" : "text-[color:var(--muted)]",
            )}
          >
            Sika Prime Loans
          </p>
          <p
            className={cn(
              "truncate font-display font-semibold",
              compact ? "text-base" : "text-lg",
              theme === "dark" ? "text-white" : "text-[color:var(--foreground)]",
            )}
          >
            Marketing workspace
          </p>
        </div>
      ) : null}
    </div>
  );
}
