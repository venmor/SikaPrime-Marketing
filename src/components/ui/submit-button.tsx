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
  variant?: "primary" | "secondary" | "ghost";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-70",
        variant === "primary" &&
          "bg-brand text-white shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] hover:bg-brand-strong",
        variant === "secondary" &&
          "border border-[color:var(--border-strong)] bg-white text-[color:var(--foreground)] shadow-sm hover:-translate-y-0.5 hover:border-[color:var(--muted)] hover:shadow-md",
        variant === "ghost" &&
          "bg-transparent text-[color:var(--foreground)] hover:bg-slate-100",
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
