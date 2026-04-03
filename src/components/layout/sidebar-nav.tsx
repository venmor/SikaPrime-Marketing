"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppLogo } from "@/components/branding/app-logo";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/lib/auth/roles";
import {
  getNavigationState,
  isPathActive,
  type NavigationSection,
} from "@/lib/constants";
import { cn, initials } from "@/lib/utils";

export function SidebarNav({
  user,
  onNavigate,
}: {
  user: { name: string; role: UserRole; jobTitle: string; avatarSeed: string };
  accountActions?: React.ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { activeSection, primarySections, secondarySections } =
    getNavigationState(pathname);

  return (
    <aside
      aria-label="Global navigation"
      className="flex h-full flex-col gap-6"
    >
      <div className="flex items-center justify-between px-2">
        <AppLogo compact />
        <Badge variant="brand-subtle">Live</Badge>
      </div>

      <nav aria-label="Primary destinations" className="flex flex-col gap-1">
        {primarySections.map((section: NavigationSection) => {
          const sectionActive = activeSection.id === section.id;

          return (
            <Link
              key={section.id}
              href={section.href}
              onClick={onNavigate}
              aria-current={pathname === section.href ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]",
                sectionActive
                  ? "bg-brand-soft text-brand-strong"
                  : "text-[color:var(--muted)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--foreground)]",
              )}
            >
              <section.icon className={cn("h-5 w-5 transition-colors", sectionActive ? "text-brand" : "text-[color:var(--muted)] group-hover:text-[color:var(--foreground)]")} />
              <span
                className={cn(
                  "truncate text-sm font-medium",
                  sectionActive ? "font-semibold" : "",
                )}
              >
                {section.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {secondarySections.length ? (
        <nav aria-label="Settings" className="flex flex-col gap-1">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)]">
            Setup
          </p>
          {secondarySections.map((section: NavigationSection) => {
            const active = isPathActive(pathname, section.href);

            return (
              <Link
                key={section.id}
                href={section.href}
                onClick={onNavigate}
                aria-current={pathname === section.href ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]",
                  active
                    ? "bg-brand-soft text-brand-strong"
                    : "text-[color:var(--muted)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--foreground)]",
                )}
              >
                <section.icon className={cn("h-5 w-5 transition-colors", active ? "text-brand" : "text-[color:var(--muted)] group-hover:text-[color:var(--foreground)]")} />
                <span
                  className={cn(
                    "truncate text-sm font-medium",
                    active ? "font-semibold" : "",
                  )}
                >
                  {section.label}
                </span>
              </Link>
            );
          })}
        </nav>
      ) : null}

      <div className="mt-auto flex flex-col gap-4 px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand-strong">
            {initials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[color:var(--foreground)]">
              {user.name}
            </p>
            <p className="truncate text-xs text-[color:var(--muted)]">
              {user.jobTitle}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
