"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div className={cn("grid gap-2", className)}>
        <div className="grid h-10 grid-cols-3 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-1" />
        <div className="h-4 w-40 rounded-full bg-[color:var(--surface-soft)]" />
      </div>
    );
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <div
        aria-label="Theme"
        className="grid grid-cols-3 gap-1 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-1"
        role="group"
      >
        {themeOptions.map((option) => {
          const active = theme === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              className={cn(
                "inline-flex min-h-8 items-center justify-center gap-1.5 rounded-[16px] px-3 py-2 text-xs font-semibold transition-[background-color,color,box-shadow,transform] duration-200",
                active
                  ? "bg-[color:var(--surface-strong)] text-[color:var(--foreground)] shadow-[var(--shadow-sm)]"
                  : "text-[color:var(--muted)] hover:bg-[color:var(--surface)] hover:text-[color:var(--foreground)]",
              )}
              onClick={() => setTheme(option.value)}
            >
              <option.icon className="h-3.5 w-3.5" />
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-[color:var(--muted)]">
        {theme === "system"
          ? `Following your device setting, currently ${resolvedTheme ?? "light"}.`
          : `Using ${theme} mode for this workspace.`}
      </p>
    </div>
  );
}
