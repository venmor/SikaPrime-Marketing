"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppLogo } from "@/components/branding/app-logo";
import { Badge } from "@/components/ui/badge";
import { navigationItems } from "@/lib/constants";
import { cn, humanizeEnum, initials } from "@/lib/utils";

export function SidebarNav({
  user,
  accountActions,
  onNavigate,
}: {
  user: { name: string; role: string; jobTitle: string; avatarSeed: string };
  accountActions?: React.ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const primaryItems = navigationItems.slice(0, 6);
  const intelligenceItems = navigationItems.slice(6);

  return (
    <div className="flex h-full flex-col gap-4 rounded-[30px] border border-[color:var(--border-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.84))] p-4 shadow-[var(--shadow-panel)] backdrop-blur-xl">
      <div className="rounded-[26px] border border-[color:var(--border)] bg-white/88 p-4 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between gap-3">
          <AppLogo compact />
          <Badge variant="brand-subtle">Live</Badge>
        </div>
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
            Sika Prime Loans
          </p>
          <h1 className="mt-1 font-display text-[1.15rem] font-semibold text-[color:var(--foreground)]">
            Marketing Agent
          </h1>
        </div>
      </div>

      <div className="rounded-[24px] border border-[color:var(--border)] bg-white/82 p-3.5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,rgba(230,62,140,0.14),rgba(33,198,217,0.16))] font-semibold text-[color:var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            {initials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[color:var(--foreground)]">
              {user.name}
            </p>
            <p className="truncate text-sm text-[color:var(--muted)]">
              {user.jobTitle}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <Badge variant="muted">{humanizeEnum(user.role)}</Badge>
          <span className="text-xs font-medium text-[color:var(--muted)]">
            Signed in
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        {[
          { title: "Workspace", items: primaryItems },
          { title: "Intelligence", items: intelligenceItems },
        ].map((group) => (
          <nav key={group.title} className="grid gap-2">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-[color:var(--muted)]">
              {group.title}
            </p>
            {group.items.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-[20px] px-3 py-3 text-sm font-medium transition duration-200 ease-out",
                    active
                      ? "bg-[linear-gradient(135deg,rgba(230,62,140,0.14),rgba(33,198,217,0.12))] text-[color:var(--foreground)] shadow-[var(--shadow-soft)]"
                      : "text-[color:var(--muted)] hover:bg-white hover:text-[color:var(--foreground)] hover:shadow-[var(--shadow-soft)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-[16px] border transition",
                      active
                        ? "border-[color:rgba(230,62,140,0.18)] bg-[linear-gradient(135deg,rgba(230,62,140,0.18),rgba(33,198,217,0.18))] text-[color:var(--brand)]"
                        : "border-transparent bg-[color:rgba(148,163,184,0.08)] text-[color:var(--muted)] group-hover:border-[color:var(--border)] group-hover:bg-white",
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        ))}
      </div>

      {accountActions ? (
        <div className="mt-auto rounded-[24px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(244,247,251,0.9))] p-3 shadow-[var(--shadow-soft)]">
          {accountActions}
        </div>
      ) : null}
    </div>
  );
}
