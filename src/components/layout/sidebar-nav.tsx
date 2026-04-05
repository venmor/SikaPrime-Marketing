"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppLogo } from "@/components/branding/app-logo";
import { Badge } from "@/components/ui/badge";
import {
  canAccessNavigationChild,
  canAccessNavigationSection,
} from "@/lib/auth/access";
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
  const visiblePrimarySections = primarySections.filter((section) =>
    canAccessNavigationSection(user.role, section.id),
  );
  const visibleSecondarySections = secondarySections
    .filter((section) => canAccessNavigationSection(user.role, section.id))
    .map((section) => ({
      ...section,
      children: section.children?.filter((child) =>
        canAccessNavigationChild(user.role, child.href),
      ),
    }))
    .filter((section) => (section.children?.length ?? 1) > 0);

  return (
    <aside
      aria-label="Global navigation"
      className="flex h-full flex-col gap-6"
    >
      <div className="flex items-center justify-between px-1">
        <AppLogo compact />
        <Badge variant="brand-subtle">Live</Badge>
      </div>

      <nav aria-label="Primary destinations" className="flex flex-col gap-1.5">
        {visiblePrimarySections.map((section: NavigationSection) => {
          const sectionActive = activeSection.id === section.id;

          return (
            <Link
              key={section.id}
              href={section.href}
              onClick={onNavigate}
              aria-current={pathname === section.href ? "page" : undefined}
              className={cn(
                "group flex min-w-0 items-center gap-3 rounded-2xl px-3 py-3 transition-[background-color,color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]",
                sectionActive
                  ? "bg-[color:var(--surface-soft)] text-[color:var(--foreground)] shadow-sm ring-1 ring-[color:var(--border)]"
                  : "text-[color:var(--muted)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--foreground)]",
              )}
            >
              <section.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  sectionActive
                    ? "text-brand"
                    : "text-[color:var(--muted)] group-hover:text-[color:var(--foreground)]",
                )}
              />
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

      {visibleSecondarySections.length ? (
        <nav aria-label="Settings" className="flex flex-col gap-1">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)]">
            Setup
          </p>
          {visibleSecondarySections.map((section: NavigationSection) => {
            const active = isPathActive(pathname, section.href);

            return (
              <Link
                key={section.id}
                href={section.href}
                onClick={onNavigate}
                aria-current={pathname === section.href ? "page" : undefined}
                className={cn(
                  "group flex min-w-0 items-center gap-3 rounded-2xl px-3 py-3 transition-[background-color,color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]",
                  active
                    ? "bg-[color:var(--surface-soft)] text-[color:var(--foreground)] shadow-sm ring-1 ring-[color:var(--border)]"
                    : "text-[color:var(--muted)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--foreground)]",
                )}
              >
                <section.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    active
                      ? "text-brand"
                      : "text-[color:var(--muted)] group-hover:text-[color:var(--foreground)]",
                  )}
                />
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

      <div className="mt-auto rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
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
