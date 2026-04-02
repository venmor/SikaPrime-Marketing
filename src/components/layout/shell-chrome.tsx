"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, Menu, Search, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

import { AppLogo } from "@/components/branding/app-logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Badge } from "@/components/ui/badge";
import { navigationItems } from "@/lib/constants";
import { humanizeEnum, initials } from "@/lib/utils";

const pageDescriptions: Record<string, string> = {
  "/dashboard": "Monitor campaigns, trends, approvals, and performance from one polished workspace.",
  "/trends": "Track safe social signals, local relevance, and brand-ready adaptation opportunities.",
  "/content": "Create proactive, seasonal, or trend-adaptive content with stronger creative direction.",
  "/workflow": "Keep drafts, reviews, and approvals moving with less friction.",
  "/calendar": "Plan posting rhythm, rebalance content, and protect campaigns from going stale.",
  "/publishing": "Ship content to live channels with clarity, control, and status visibility.",
  "/library": "Reuse what worked, repurpose what can improve, and archive what no longer fits.",
  "/analytics": "Read performance patterns, channel lift, and the content themes worth repeating.",
  "/recommendations": "See what the assistant wants to create next and why it matters now.",
  "/knowledge": "Update the business context that powers safe, aligned generation everywhere.",
};

function resolveCurrentItem(pathname: string) {
  return (
    navigationItems.find((item) =>
      item.href === "/dashboard"
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? navigationItems[0]
  );
}

export function ShellChrome({
  user,
  accountActions,
  children,
}: {
  user: { name: string; role: string; jobTitle: string; avatarSeed: string };
  accountActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentItem = useMemo(() => resolveCurrentItem(pathname), [pathname]);
  const pageDescription =
    pageDescriptions[currentItem.href] ??
    "Operate campaigns, approvals, and content intelligence from one space.";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(230,62,140,0.16),transparent_26%),radial-gradient(circle_at_top_right,rgba(33,198,217,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.1),transparent_22%),linear-gradient(180deg,#fcfdff_0%,#f5f8fc_55%,#f3f6fb_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,rgba(255,255,255,0.6),transparent)]" />

      <div className="relative flex min-h-screen">
        <div className="hidden w-[320px] shrink-0 p-4 xl:block">
          <SidebarNav user={user} accountActions={accountActions} />
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 xl:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative h-full w-[min(86vw,340px)] p-3">
              <SidebarNav
                user={user}
                accountActions={accountActions}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        ) : null}

        <div className="relative flex min-h-screen min-w-0 flex-1 flex-col p-3 sm:p-4 xl:p-5">
          <header className="sticky top-3 z-40 mb-5 rounded-[30px] border border-[color:var(--border-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(248,250,252,0.76))] px-4 py-4 shadow-[var(--shadow-panel)] backdrop-blur-2xl sm:px-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <button
                    type="button"
                    aria-label="Open navigation"
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-[color:var(--border)] bg-white/80 text-[color:var(--foreground)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] xl:hidden"
                    onClick={() => setMobileOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </button>

                  <div className="xl:hidden">
                    <AppLogo compact />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="cyan-subtle">Control center</Badge>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
                        {currentItem.label}
                      </span>
                    </div>
                    <h1 className="mt-3 font-display text-[1.65rem] font-semibold leading-tight text-[color:var(--foreground)] sm:text-[1.9rem]">
                      {currentItem.label === "Dashboard"
                        ? "A brighter, faster way to run content operations."
                        : `${currentItem.label} workspace`}
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--muted)] sm:text-[0.96rem]">
                      {pageDescription}
                    </p>
                  </div>
                </div>

                <div className="hidden items-center gap-3 lg:flex">
                  <Link
                    href="/content"
                    className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--brand),#ff74a7)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(230,62,140,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_46px_rgba(230,62,140,0.3)]"
                  >
                    <Sparkles className="h-4 w-4" />
                    New content
                  </Link>
                  <button
                    type="button"
                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-[color:var(--border)] bg-white/75 text-[color:var(--foreground)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
                  >
                    <Bell className="h-4 w-4" />
                    <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[color:var(--brand)] shadow-[0_0_0_4px_rgba(230,62,140,0.16)]" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <label className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
                  <input
                    type="search"
                    placeholder="Search campaigns, products, ideas, or workflow items"
                    className="h-12 pl-11"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="hidden rounded-[22px] border border-[color:var(--border)] bg-white/72 px-4 py-2.5 text-sm shadow-[var(--shadow-soft)] sm:flex sm:items-center sm:gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,rgba(230,62,140,0.12),rgba(33,198,217,0.14))] font-semibold text-[color:var(--foreground)]">
                      {initials(user.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[color:var(--foreground)]">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-[color:var(--muted)]">
                        {humanizeEnum(user.role)} · {user.jobTitle}
                      </p>
                    </div>
                  </div>

                  <div className="sm:hidden">{accountActions}</div>
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto flex w-full max-w-[1540px] flex-1 flex-col gap-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
