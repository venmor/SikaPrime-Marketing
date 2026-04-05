"use client";

import Link from "next/link";
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

import { AssistantDock } from "@/components/assistant/assistant-dock";
import {
  canAccessNavigationChild,
  canGenerateContent,
  canReviewContent,
  canViewAnalytics,
} from "@/lib/auth/access";
import type { AssistantHomeSnapshot } from "@/lib/assistant/types";
import type { UserRole } from "@/lib/auth/roles";
import { AppLogo } from "@/components/branding/app-logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Badge } from "@/components/ui/badge";
import { cn, humanizeEnum, initials } from "@/lib/utils";
import { getNavigationState, type NavigationChild } from "@/lib/constants";
import { ThemeToggle } from "@/components/theme-toggle";

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
  assistantSnapshot,
  accountActions,
  children,
}: {
  user: { name: string; role: UserRole; jobTitle: string; avatarSeed: string };
  assistantSnapshot: AssistantHomeSnapshot | null;
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
  const visibleLocalNavigation = localNavigation.filter((item) =>
    canAccessNavigationChild(user.role, item.href),
  );
  const primaryAction = getPrimaryAction(user.role);
  const backTarget =
    breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;

  return (
    <div className="relative min-h-screen bg-[color:var(--background)]">
      <div className="relative flex min-h-screen">
        <div className="hidden w-[clamp(240px,20vw,260px)] shrink-0 p-4 xl:block">
          <div className="surface-panel sticky top-4 h-[calc(100vh-2rem)] p-[clamp(1rem,2vw,1.25rem)]">
            <SidebarNav user={user} />
          </div>
        </div>

        {/* Mobile Navigation Backdrop */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 xl:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileOpen(false)}
            />
            <div className="surface-panel relative h-full w-[min(90vw,332px)] overflow-y-auto rounded-none p-4 shadow-2xl transition-transform duration-300 ease-in-out">
              <SidebarNav user={user} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div className="relative flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <header className="relative z-[100] mb-8">
            <div className="surface-panel flex overflow-hidden flex-col gap-[clamp(1rem,2vw,1.25rem)] p-[clamp(1rem,2vw,1.25rem)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    aria-label="Open navigation"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)] shadow-sm transition-[background-color,box-shadow,color,transform] hover:bg-[color:var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] xl:hidden"
                    onClick={() => setMobileOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <div className="xl:hidden">
                    <AppLogo compact />
                  </div>
                </div>

                <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                  <details className="group relative max-w-full">
                    <summary className="flex max-w-[min(100%,16rem)] cursor-pointer list-none items-center gap-2.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] py-1 pl-1 pr-4 text-sm font-medium text-[color:var(--foreground)] shadow-sm transition-[border-color,box-shadow,background-color,color] hover:border-[color:var(--muted)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] [&::-webkit-details-marker]:hidden">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand-strong">
                        {initials(user.name)}
                      </div>
                      <span className="max-w-[112px] truncate sm:max-w-[160px]">
                        {user.name}
                      </span>
                      <ChevronDown className="h-4 w-4 text-[color:var(--muted)] transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[100] w-[min(22rem,calc(100vw-2rem))] rounded-[24px] border border-[color:var(--border-strong)] bg-[color:var(--surface-elevated)] p-4 shadow-xl backdrop-blur-xl">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xl font-bold text-brand-strong">
                          {initials(user.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold text-[color:var(--foreground)]">
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-[color:var(--muted)]">
                            {user.jobTitle}
                          </p>
                        </div>
                      </div>
                      <div className="mb-4 mt-3 flex items-center gap-2">
                        <Badge variant="muted">{humanizeEnum(user.role)}</Badge>
                      </div>
                      <div className="border-t border-[color:var(--border-strong)] py-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-[color:var(--foreground)]">
                              Theme
                            </p>
                            <p className="mt-1 text-xs text-[color:var(--muted)]">
                              Choose light, dark, or follow the device setting.
                            </p>
                          </div>
                          <ThemeToggle />
                        </div>
                      </div>
                      {accountActions ? (
                        <div className="border-t border-[color:var(--border-strong)] pt-4">
                          {accountActions}
                        </div>
                      ) : null}
                    </div>
                  </details>

                  {primaryAction && (
                    <Link
                      href={primaryAction.href}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-brand-strong hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] focus-visible:ring-offset-2 sm:w-auto"
                    >
                      <primaryAction.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{primaryAction.label}</span>
                    </Link>
                  )}
                </div>
              </div>

              <div className="grid gap-4">
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

                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="cyan-subtle">{activeSection.label}</Badge>
                    {breadcrumbs.length > 1 && (
                      <nav
                        aria-label="Breadcrumb"
                        className="hidden items-center gap-2 text-sm text-[color:var(--muted)] sm:flex"
                      >
                        <span className="text-[color:var(--border-strong)]">/</span>
                        <span className="font-medium text-[color:var(--foreground)]">
                          {currentPage.label}
                        </span>
                      </nav>
                    )}
                  </div>

                  <h1 className="mt-3 font-display text-[clamp(1.5rem,4vw,2.25rem)] font-semibold tracking-tight text-[color:var(--foreground)]">
                    {currentPage.label}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)] sm:text-base">
                    {currentPage.summary}
                  </p>
                </div>

                {visibleLocalNavigation.length > 1 && (
                  <nav
                    aria-label={`${activeSection.label} pages`}
                    className="flex gap-2 overflow-x-auto rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-2"
                  >
                    {visibleLocalNavigation.map((item: NavigationChild) => {
                      const active = pathname === item.href;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]",
                            active
                              ? "bg-[color:var(--surface-strong)] text-[color:var(--foreground)] shadow-sm ring-1 ring-[color:var(--border)]"
                              : "text-[color:var(--muted)] hover:bg-[color:var(--surface)] hover:text-[color:var(--foreground)]",
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>
                )}
              </div>
            </div>
          </header>

          <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6">
            {children}
          </main>
        </div>
      </div>

      {assistantSnapshot ? (
        <AssistantDock
          canGenerate={canGenerateContent(user.role)}
          canReview={canReviewContent(user.role)}
          defaultsSummary={assistantSnapshot.defaults.summary}
          suggestions={assistantSnapshot.suggestions}
          reviewInbox={assistantSnapshot.reviewInbox}
        />
      ) : null}
    </div>
  );
}
