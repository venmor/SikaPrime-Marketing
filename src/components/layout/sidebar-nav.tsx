"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppLogo } from "@/components/branding/app-logo";
import { Badge } from "@/components/ui/badge";
import { appName, navigationItems } from "@/lib/constants";
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
    <div className="flex h-full flex-col gap-5 rounded-[32px] border border-[color:var(--border-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.82))] p-4 shadow-[var(--shadow-panel)] backdrop-blur-xl md:p-5">
      <div className="rounded-[28px] border border-[color:rgba(255,255,255,0.32)] bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(46,55,88,0.96)_42%,rgba(111,29,92,0.94)_100%)] p-5 text-white shadow-[0_28px_70px_rgba(122,39,104,0.28)]">
        <AppLogo theme="dark" />
        <h1 className="mt-5 font-display text-[1.55rem] font-semibold leading-tight">
          {appName}
        </h1>
        <p className="mt-3 text-sm leading-7 text-white/72">
          Premium content operations for campaigns, approvals, publishing, and
          always-on audience growth.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge variant="brand-subtle">Always on</Badge>
          <Badge variant="cyan-subtle">AI assisted</Badge>
        </div>
      </div>

      <div className="rounded-[28px] border border-[color:var(--border)] bg-white/80 p-4 shadow-[var(--shadow-soft)]">
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
        <div className="mt-4 flex items-center justify-between gap-3">
          <Badge variant="muted">{humanizeEnum(user.role)}</Badge>
          <span className="text-xs font-medium text-[color:var(--muted)]">
            Team access
          </span>
        </div>
      </div>

      <div className="grid gap-5">
        {[
          { title: "Workspace", items: primaryItems },
          { title: "Intelligence", items: intelligenceItems },
        ].map((group) => (
          <nav key={group.title} className="grid gap-2">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
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
                    "group flex items-center gap-3 rounded-[22px] px-3 py-3.5 text-sm font-medium transition duration-200 ease-out",
                    active
                      ? "bg-[linear-gradient(135deg,rgba(230,62,140,0.14),rgba(33,198,217,0.12))] text-[color:var(--foreground)] shadow-[inset_0_0_0_1px_rgba(230,62,140,0.12)]"
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
                  <div className="min-w-0">
                    <span className="block truncate">{item.label}</span>
                    {active ? (
                      <span className="mt-0.5 block text-xs font-medium text-[color:var(--muted)]">
                        Current workspace
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </nav>
        ))}
      </div>

      <div className="mt-auto rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,247,251,0.9))] p-4 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
          Daily focus
        </p>
        <p className="mt-3 text-sm leading-6 text-[color:var(--foreground)]">
          Keep the content mix balanced, make trends feel safe, and move drafts
          to publish-ready faster.
        </p>
        {accountActions ? <div className="mt-4">{accountActions}</div> : null}
      </div>
    </div>
  );
}
