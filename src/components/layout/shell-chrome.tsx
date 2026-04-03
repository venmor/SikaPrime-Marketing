"use client";

import Link from "next/link";
import { UserRole } from "@prisma/client";
import { useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  ChevronDown,
  Menu,
  Sparkles,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { canGenerateContent, canReviewContent, canViewAnalytics } from "@/lib/auth/access";
import { AppLogo } from "@/components/branding/app-logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Badge } from "@/components/ui/badge";
import { cn, humanizeEnum } from "@/lib/utils";
import { getNavigationState, type NavigationChild } from "@/lib/constants";

function getPrimaryAction(role: UserRole) {
  if (canGenerateContent(role)) {
    return {
      href: "/content",
      label: "Create",
      icon: Sparkles,
    };
  }

  if (canReviewContent(role)) {
    return {
      href: "/workflow",
      label: "Review",
      icon: BookOpen,
    };
  }

  if (canViewAnalytics(role)) {
    return {
      href: "/analytics",
      label: "Performance",
      icon: BarChart3,
    };
  }

  return null;
}

export function ShellChrome({
  user,
  accountActions,
  children,
}: {
  user: { name: string; role: UserRole; jobTitle: string; avatarSeed: string };
  accountActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const {
    activeSection,
    breadcrumbs,
    currentPage,
    localNavigation,
  } = getNavigationState(pathname);
  const primaryAction = getPrimaryAction(user.role);
  const backTarget =
    breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;

  return (
    <div className="relative min-h-screen bg-[color:var(--background)]">
      <div className="relative flex min-h-screen">
        <div className="hidden w-[280px] shrink-0 p-4 xl:block">
          <SidebarNav user={user} />
        </div>

        {/* Mobile Navigation Backdrop */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 xl:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative h-full w-[min(85vw,320px)] transform bg-[color:var(--surface)] p-3 shadow-2xl transition-transform duration-300 ease-in-out">
              <SidebarNav
                user={user}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        )}

        <div className="relative flex min-h-screen min-w-0 flex-1 flex-col p-4 sm:p-6 lg:p-8">
          <header className="mb-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  aria-label="Open navigation"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--border)] bg-white text-[color:var(--foreground)] shadow-sm transition-all hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] xl:hidden"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="xl:hidden">
                  <AppLogo compact />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <details className="group relative">
                  <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--foreground)] shadow-sm transition-all hover:border-[color:var(--muted)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] [&::-webkit-details-marker]:hidden">
                    <span className="max-w-[120px] truncate sm:max-w-[160px]">{user.name}</span>
                    <ChevronDown className="h-4 w-4 text-[color:var(--muted)] transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 rounded-2xl border border-[color:var(--border-strong)] bg-white p-4 shadow-xl">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--muted)]">
                      Account
                    </p>
                    <p className="mt-2 truncate text-sm font-semibold text-[color:var(--foreground)]">
                      {user.name}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      {user.jobTitle}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="muted">{humanizeEnum(user.role)}</Badge>
                    </div>
                    {accountActions && <div className="mt-4 pt-4 border-t border-[color:var(--border)]">{accountActions}</div>}
                  </div>
                </details>

                {primaryAction && (
                  <Link
                    href={primaryAction.href}
                    className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-strong hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] focus-visible:ring-offset-2"
                  >
                    <primaryAction.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{primaryAction.label}</span>
                  </Link>
                )}
              </div>
            </div>

            <div>
              {backTarget && (
                <Link
                  href={backTarget.href}
                  className="group mb-4 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Back to {backTarget.label}
                </Link>
              )}

              <div className="flex items-center gap-3">
                <Badge variant="cyan-subtle">{activeSection.label}</Badge>
                {breadcrumbs.length > 1 && (
                  <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 text-sm text-[color:var(--muted)]">
                    <span className="text-[color:var(--border-strong)]">/</span>
                    <span className="font-medium text-[color:var(--foreground)]">{currentPage.label}</span>
                  </nav>
                )}
              </div>

              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
                {currentPage.label}
              </h1>
            </div>

            {localNavigation.length > 1 && (
              <nav aria-label={`${activeSection.label} pages`} className="flex gap-2 overflow-x-auto pb-2 border-b border-[color:var(--border)]">
                {localNavigation.map((item: NavigationChild) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]",
                        active
                          ? "bg-[color:var(--surface-strong)] text-[color:var(--foreground)] shadow-sm ring-1 ring-[color:var(--border-strong)]"
                          : "text-[color:var(--muted)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--foreground)]"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </header>

          <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
