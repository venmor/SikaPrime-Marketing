"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { appName, navigationItems } from "@/lib/constants";
import { cn, humanizeEnum, initials } from "@/lib/utils";

export function SidebarNav({
  user,
}: {
  user: { name: string; role: string; jobTitle: string; avatarSeed: string };
}) {
  const pathname = usePathname();

  return (
    <aside className="border-b border-[color:var(--border)] bg-[color:rgba(255,253,248,0.88)] p-4 backdrop-blur md:min-h-screen md:w-80 md:border-b-0 md:border-r md:p-6">
      <div className="rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(160deg,rgba(18,62,74,0.96),rgba(20,93,88,0.96))] p-5 text-white shadow-[0_30px_60px_rgba(18,62,74,0.28)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
          Sika Prime Loans
        </p>
        <h1 className="mt-3 font-display text-2xl font-semibold leading-tight">
          {appName}
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/80">
          A trend-aware content operating system for loan marketing, workflow,
          publishing, and performance planning.
        </p>
      </div>

      <div className="mt-5 rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--surface-strong)] font-semibold text-[color:var(--brand)]">
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
        <div className="mt-4">
          <Badge variant="muted">{humanizeEnum(user.role)}</Badge>
        </div>
      </div>

      <nav className="mt-5 grid gap-2 md:block">
        {navigationItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-[color:var(--brand)] text-white shadow-[0_14px_28px_rgba(18,62,74,0.24)]"
                  : "text-[color:var(--muted)] hover:bg-[color:rgba(18,62,74,0.06)] hover:text-[color:var(--foreground)]",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
