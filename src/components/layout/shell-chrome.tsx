"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Menu,
  Share2,
  Sparkles,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { AppLogo } from "@/components/branding/app-logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Badge } from "@/components/ui/badge";
import { navigationItems } from "@/lib/constants";
import { cn, humanizeEnum } from "@/lib/utils";

const pageMeta: Record<string, { eyebrow: string; summary: string }> = {
  "/dashboard": {
    eyebrow: "Overview",
    summary: "Track pipeline health, trends, and what the team should do next.",
  },
  "/trends": {
    eyebrow: "Signals",
    summary: "Review local and global attention safely before adapting it.",
  },
  "/content": {
    eyebrow: "Creation",
    summary: "Generate ideas and drafts with less effort and less repetition.",
  },
  "/workflow": {
    eyebrow: "Review",
    summary: "Move ideas, drafts, approvals, and revisions through one queue.",
  },
  "/calendar": {
    eyebrow: "Planning",
    summary: "Keep timing, content mix, and campaign rhythm in balance.",
  },
  "/publishing": {
    eyebrow: "Distribution",
    summary: "Publish or package approved content with clear status tracking.",
  },
  "/library": {
    eyebrow: "Repository",
    summary: "Reuse high performers and retire what no longer fits.",
  },
  "/analytics": {
    eyebrow: "Performance",
    summary: "See what themes, products, and times are winning attention.",
  },
  "/recommendations": {
    eyebrow: "Planning",
    summary: "Get ranked next-step ideas based on trends, balance, and results.",
  },
  "/knowledge": {
    eyebrow: "Business context",
    summary: "Maintain the products, rules, and brand inputs behind every output.",
  },
};

const quickLinks = [
  { href: "/content", label: "Create", icon: Sparkles },
  { href: "/workflow", label: "Review", icon: BookOpen },
  { href: "/calendar", label: "Plan", icon: CalendarDays },
  { href: "/publishing", label: "Publish", icon: Share2 },
];

function resolveCurrentItem(pathname: string) {
  return (
    navigationItems.find((item) =>
      item.href === "/dashboard"
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? navigationItems[0]
  );
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
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

  const currentItem = resolveCurrentItem(pathname);
  const meta = pageMeta[currentItem.href] ?? {
    eyebrow: "Workspace",
    summary: "Operate campaigns, approvals, and publishing from one place.",
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(230,62,140,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(33,198,217,0.12),transparent_22%),linear-gradient(180deg,#fcfdff_0%,#f6f8fc_52%,#f2f6fb_100%)]" />
      <div className="relative flex min-h-screen">
        <div className="hidden w-[296px] shrink-0 p-4 xl:block">
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
            <div className="relative h-full w-[min(86vw,320px)] p-3">
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
            <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <button
                    type="button"
                    aria-label="Open navigation"
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-[color:var(--border)] bg-white/80 text-[color:var(--foreground)] shadow-[var(--shadow-soft)] xl:hidden"
                    onClick={() => setMobileOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </button>

                  <div className="xl:hidden">
                    <AppLogo compact />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="cyan-subtle">{meta.eyebrow}</Badge>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                        {currentItem.label}
                      </span>
                    </div>
                    <h1 className="mt-3 font-display text-[1.6rem] font-semibold leading-tight text-[color:var(--foreground)] sm:text-[1.85rem]">
                      {currentItem.label}
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                      {meta.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="muted" className="hidden md:inline-flex">
                    {humanizeEnum(user.role)}
                  </Badge>
                  <Link
                    href="/content"
                    className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--brand),#ff74a7)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(230,62,140,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(230,62,140,0.28)]"
                  >
                    <Sparkles className="h-4 w-4" />
                    New content
                  </Link>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <nav className="flex flex-wrap gap-2">
                  {quickLinks.map((link) => {
                    const active = isActivePath(pathname, link.href);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition",
                          active
                            ? "border-transparent bg-[linear-gradient(135deg,rgba(230,62,140,0.14),rgba(33,198,217,0.14))] text-[color:var(--foreground)] shadow-[var(--shadow-soft)]"
                            : "border-[color:var(--border)] bg-white/78 text-[color:var(--muted-strong)] hover:bg-white hover:text-[color:var(--foreground)]",
                        )}
                      >
                        <link.icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="flex items-center gap-3 text-sm text-[color:var(--muted)]">
                  <span className="hidden sm:inline">{user.name}</span>
                  <div className="sm:hidden">{accountActions}</div>
                </div>
              </div>
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
