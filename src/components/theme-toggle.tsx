"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn("h-8 w-16 rounded-full bg-surface-soft", className)} />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-8 w-16 items-center rounded-full border border-border-strong bg-surface-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
    >
      <span className="sr-only">Toggle theme</span>
      <span
        className={cn(
          "pointer-events-none inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-surface-strong shadow-sm transition-transform duration-300 ease-in-out",
          isDark ? "translate-x-9" : "translate-x-1"
        )}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-foreground" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-foreground" />
        )}
      </span>
    </button>
  );
}
