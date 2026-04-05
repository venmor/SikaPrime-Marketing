"use client";

import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type OpenAssistantButtonProps = {
  label: string;
  prompt?: string;
  autoSend?: boolean;
  className?: string;
};

export function OpenAssistantButton({
  label,
  prompt,
  autoSend = false,
  className,
}: OpenAssistantButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-brand-strong hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] focus-visible:ring-offset-2",
        className,
      )}
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent("assistant:open", {
            detail: {
              prompt: prompt ?? "",
              autoSend,
            },
          }),
        );
      }}
    >
      <Sparkles className="h-4 w-4" />
      {label}
    </button>
  );
}
