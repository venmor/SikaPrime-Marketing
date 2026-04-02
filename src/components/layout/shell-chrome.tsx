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
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(230,62,140,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(33,198,217,0.12),transparent_22%),linear-gradient(180deg,#fcfdff_0%,#f6f8fc_52%,#f2f6fb_100%)]" />
      <div className="relative flex min-h-screen">
        <div className="hidden w-[320px] shrink-0 p-4 xl:block">
          <SidebarNav user={user} accountActions={accountActions} />
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 xl:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-slate-950/36 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative h-full w-[min(88vw,340px)] p-3">
              <SidebarNav
                user={user}
                accountActions={accountActions}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        ) : null}

        <div className="relative flex min-h-screen min-w-0 flex-1 flex-col p-3 sm:p-4 xl:p-5">
          <header className="sticky top-3 z-40 mb-5 rounded-[28px] border border-[color:var(--border-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.8))] px-4 py-4 shadow-[var(--shadow-panel)] backdrop-blur-2xl sm:px-5">
            <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      aria-label="Open navigation"
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-[color:var(--border)] bg-white/80 text-[color:var(--foreground)] shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(230,62,140,0.16)] xl:hidden"
                      onClick={() => setMobileOpen(true)}
                    >
                      <Menu className="h-5 w-5" />
                    </button>

                    <div className="xl:hidden">
                      <AppLogo compact />
                    </div>

                    {backTarget ? (
                      <Link
                        href={backTarget.href}
                        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/78 px-3.5 py-2 text-sm font-semibold text-[color:var(--foreground)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[var(--shadow-card)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(230,62,140,0.16)]"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to {backTarget.label}
                      </Link>
                    ) : null}
                  </div>

                  <div className="mt-4 overflow-x-auto pb-1">
                    <nav
                      aria-label="Breadcrumb"
                      className="flex min-w-max items-center gap-2 whitespace-nowrap text-sm text-[color:var(--muted)]"
                    >
                      {breadcrumbs.map((crumb, index) => {
                        const isLast = index === breadcrumbs.length - 1;

                        return (
                          <div
                            key={`${crumb.href}-${crumb.label}`}
                            className="flex items-center gap-2"
                          >
                            {isLast ? (
                              <span className="font-medium text-[color:var(--muted-strong)]">
                                {crumb.label}
                              </span>
                            ) : (
                              <Link
                                href={crumb.href}
                                className="rounded-full px-1.5 py-0.5 transition hover:text-[color:var(--foreground)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(230,62,140,0.16)]"
                              >
                                {crumb.label}
                              </Link>
                            )}
                            {!isLast ? <span>/</span> : null}
                          </div>
                        );
                      })}
                    </nav>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="cyan-subtle">{activeSection.label}</Badge>
                  </div>
                  <h1 className="mt-3 font-display text-[1.7rem] font-semibold leading-tight text-[color:var(--foreground)] sm:text-[2rem]">
                    {currentPage.label}
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-[color:var(--muted)] sm:text-[0.97rem]">
                    {currentPage.summary}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <details className="group relative">
                    <summary className="flex list-none cursor-pointer items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/78 px-3.5 py-2.5 text-sm font-semibold text-[color:var(--muted-strong)] shadow-[var(--shadow-soft)] transition hover:bg-white hover:text-[color:var(--foreground)] hover:shadow-[var(--shadow-card)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(230,62,140,0.16)] [&::-webkit-details-marker]:hidden">
                      <span className="max-w-[11rem] truncate">{user.name}</span>
                      <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                    </summary>
                    <div className="absolute right-0 top-[calc(100%+0.7rem)] z-20 w-64 rounded-[22px] border border-[color:var(--border-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-4 shadow-[var(--shadow-panel)] backdrop-blur-xl">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
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
                      {accountActions ? <div className="mt-4">{accountActions}</div> : null}
                    </div>
                  </details>

                  {primaryAction ? (
                    <Link
                      href={primaryAction.href}
                      className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--brand),#ff74a7)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(230,62,140,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(230,62,140,0.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(230,62,140,0.2)]"
                    >
                      <primaryAction.icon className="h-4 w-4" />
                      {primaryAction.label}
                    </Link>
                  ) : null}
                </div>
              </div>

              {localNavigation.length > 1 ? (
                <nav
                  aria-label={`${activeSection.label} pages`}
                  className="overflow-x-auto border-t border-[color:rgba(148,163,184,0.14)] pt-4 pb-1"
                >
                  <div className="flex min-w-max gap-2 whitespace-nowrap">
                    {localNavigation.map((item: NavigationChild) => {
                      const active = pathname === item.href;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "inline-flex items-center rounded-full border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(230,62,140,0.16)]",
                            active
                              ? "border-transparent bg-[linear-gradient(135deg,rgba(230,62,140,0.14),rgba(33,198,217,0.14))] text-[color:var(--foreground)] shadow-[var(--shadow-soft)]"
                              : "border-[color:var(--border)] bg-white/72 text-[color:var(--muted-strong)] hover:bg-white hover:text-[color:var(--foreground)]",
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </nav>
              ) : null}
            </div>
          </header>

          <main className="mx-auto flex w-full max-w-[1380px] flex-1 flex-col gap-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
