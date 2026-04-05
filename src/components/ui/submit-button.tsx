"use client";

import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  pendingLabel = "Working...",
  className,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "success";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center gap-[clamp(0.25rem,1vw,0.5rem)] rounded-full px-[clamp(1rem,3vw,1.25rem)] py-[clamp(0.5rem,2vw,0.625rem)] text-sm font-semibold transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)] disabled:cursor-not-allowed disabled:opacity-70",
        variant === "primary" &&
          "bg-brand text-white shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] hover:bg-brand-strong",
        variant === "success" &&
          "bg-[color:var(--success)] text-[color:var(--background)] shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] hover:bg-[color:var(--success-strong)]",
        variant === "secondary" &&
          "border border-[color:var(--border-strong)] bg-surface-strong text-[color:var(--foreground)] shadow-sm hover:-translate-y-0.5 hover:border-[color:var(--muted)] hover:shadow-md",
        variant === "ghost" &&
          "bg-transparent text-[color:var(--foreground)] hover:bg-[color:var(--surface-soft)]",
        className,
      )}
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
