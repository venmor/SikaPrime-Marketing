"use client";

import { MessageCircleMore, Sparkles, SquarePen } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AIGenerationChannelSelection } from "@/lib/ai/types";

const channelOptions = [
  {
    value: "FACEBOOK" as const,
    label: "Facebook",
    summary: "Generate a full post body, shorter caption, and engagement comments.",
    icon: SquarePen,
  },
  {
    value: "WHATSAPP" as const,
    label: "WhatsApp",
    summary: "Generate a concise, conversational message designed for direct sharing.",
    icon: MessageCircleMore,
  },
  {
    value: "BOTH" as const,
    label: "Both",
    summary: "Create separate Facebook and WhatsApp drafts in one guided run.",
    icon: Sparkles,
  },
];

export function ChannelSelector({
  value,
  onChange,
}: {
  value: AIGenerationChannelSelection;
  onChange: (nextValue: AIGenerationChannelSelection) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {channelOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-[24px] border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
            value === option.value
              ? "border-brand bg-brand-soft/60 shadow-[0_0_0_3px_var(--brand-soft)]"
              : "border-[color:var(--border)] bg-white",
          )}
          aria-pressed={value === option.value}
        >
          <option.icon className="h-5 w-5 text-brand" />
          <p className="mt-4 font-display text-lg font-semibold text-[color:var(--foreground)]">
            {option.label}
          </p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            {option.summary}
          </p>
        </button>
      ))}
    </div>
  );
}
