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
        "inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-70",
        variant === "primary" &&
          "bg-[linear-gradient(135deg,var(--brand),#ff74a7)] text-white shadow-[0_16px_38px_rgba(230,62,140,0.24)] hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(230,62,140,0.28)]",
        variant === "secondary" &&
          "border border-[color:var(--border)] bg-white/78 text-[color:var(--foreground)] shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]",
        variant === "ghost" &&
          "bg-transparent text-[color:var(--foreground)] hover:bg-white/60",
        className,
      )}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
