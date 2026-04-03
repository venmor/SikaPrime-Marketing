import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { getDashboardSnapshot } from "@/lib/dashboard/service";
import { formatDateTime, formatRelativeDate, humanizeEnum } from "@/lib/utils";

export default async function DashboardPage() {
  const snapshot = await getDashboardSnapshot();

  const reviewCount = Number(
    snapshot.stats.find((stat) => stat.label === "In Review")?.value ?? 0,
  );
  const revisionCount = Number(
    snapshot.stats.find((stat) => stat.label === "Revisions")?.value ?? 0,
  );
  const scheduledCount = Number(
    snapshot.stats.find((stat) => stat.label === "Scheduled")?.value ?? 0,
  );

  const startHere = [
    {
      href: "/content",
      label: "Create a draft",
      detail: "Start from a fresh idea or a proactive campaign prompt.",
      icon: Sparkles,
    },
    {
      href: "/workflow",
      label: "Clear the review queue",
      detail: reviewCount
        ? `${reviewCount} item${reviewCount === 1 ? "" : "s"} waiting on review.`
        : "No items waiting on review right now.",
      icon: BookOpen,
    },
    {
      href: "/calendar",
      label: "Check the schedule",
      detail: scheduledCount
        ? `${scheduledCount} post${scheduledCount === 1 ? "" : "s"} already scheduled.`
        : "No posts scheduled yet for the current queue.",
      icon: CalendarDays,
    },
  ];

  const quickStatus = [
    {
      label: "Top local trend",
      value: snapshot.topLocalTrend?.title ?? "No active local signal",
      detail: snapshot.topLocalTrend
        ? humanizeEnum(snapshot.topLocalTrend.status)
        : "Refresh trends",
    },
    {
      label: "Best window",
      value: snapshot.bestPostingWindow?.label ?? "Learning",
      detail: "Use this slot for priority posts.",
    },
    {
      label: "Schedule health",
      value: snapshot.calendarWarnings.length
        ? `${snapshot.calendarWarnings.length} flag${
            snapshot.calendarWarnings.length === 1 ? "" : "s"
          }`
        : "All clear",
      detail:
        snapshot.calendarWarnings[0]?.message ??
        "No urgent balance or timing issues.",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-6 xl:grid-cols-[1.14fr_0.86fr]">
        <SectionCard
          title="Marketing Pipeline"
          className="bg-brand-soft border-brand-soft shadow-none"
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <Badge variant="brand-subtle" className="mb-4">Today</Badge>
              <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight text-brand-strong sm:text-4xl">
                One clear place to run the content pipeline.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[color:var(--foreground)] opacity-80">
                See what needs attention, keep the schedule healthy, and move
                ideas into publish-ready work faster.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/content"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-strong hover:shadow-md"
              >
                <Sparkles className="h-4 w-4" />
                Create content
              </Link>
              <Link
                href="/workflow"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-strong)] bg-white px-6 py-3 text-sm font-semibold text-[color:var(--foreground)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[color:var(--muted)] hover:shadow-md"
              >
                Open workflow
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {quickStatus.map((item) => (
                <div key={item.label} className="rounded-xl bg-white/60 p-4 backdrop-blur-md">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)]">
                    {item.label}
                  </p>
                  <p className="mt-2 line-clamp-2 font-display text-lg font-semibold text-[color:var(--foreground)]">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Start Here"
          description="Quick routes for the next step."
        >
          <div className="flex flex-col gap-4">
            {startHere.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nested-panel card-hover group flex items-start gap-4 p-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong transition-colors group-hover:bg-brand group-hover:text-white">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-semibold text-[color:var(--foreground)]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[color:var(--muted)]">
                    {item.detail}
                  </p>
                </div>
              </Link>
            ))}

            <div
              className={`rounded-xl border p-4 text-sm shadow-sm ${
                snapshot.calendarWarnings.length
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-emerald-200 bg-emerald-50 text-emerald-900"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest">
                Queue note
              </p>
              <p className="mt-2 leading-relaxed">
                {snapshot.calendarWarnings[0]?.message ??
                  "Everything scheduled so far looks balanced."}
              </p>
              {revisionCount > 0 && (
                <p className="mt-2 text-xs font-semibold">
                  {revisionCount} item{revisionCount === 1 ? "" : "s"} still
                  need revision.
                </p>
              )}
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {snapshot.stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <SectionCard
          title="Next Up"
          description="Ranked ideas worth acting on now."
          action={
            <Link
              href="/recommendations"
              className="text-sm font-semibold text-brand transition-colors hover:text-brand-strong"
            >
              View all
            </Link>
          }
        >
          <div className="flex flex-col gap-4">
            {snapshot.recommendations.slice(0, 3).map((recommendation) => (
              <div
                key={recommendation.id}
                className="nested-panel card-hover p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge>{humanizeEnum(recommendation.channel)}</Badge>
                  <span className="text-xs font-bold text-brand bg-brand-soft px-2 py-1 rounded-md">
                    Score: {recommendation.priorityScore}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-[color:var(--foreground)]">
                  {recommendation.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)]">
                  {recommendation.rationale}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Trend Pulse"
          description="Top local and global signals."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: "Local", trend: snapshot.topLocalTrend },
              { label: "Global", trend: snapshot.topGlobalTrend },
            ].map(({ label, trend }) =>
              trend ? (
                <div
                  key={label}
                  className="nested-panel card-hover p-5"
                >
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)]">
                      {label}
                    </p>
                    <Badge variant={trend.status === "RISING" ? "success" : "warning"}>
                      {humanizeEnum(trend.status)}
                    </Badge>
                  </div>
                  <h3 className="font-display text-xl font-semibold leading-tight text-[color:var(--foreground)]">
                    {trend.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)] line-clamp-3">
                    {trend.summary}
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[color:var(--border)] pt-4">
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)]">Rel</p>
                      <p className="mt-1 text-sm font-semibold">{trend.relevanceScore}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)]">Fresh</p>
                      <p className="mt-1 text-sm font-semibold">{trend.freshnessScore}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)]">Fit</p>
                      <p className="mt-1 text-sm font-semibold">{trend.brandFitScore}</p>
                    </div>
                  </div>
                </div>
              ) : null,
            )}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Recent Content"
          description="Latest items in motion."
          action={
            <Link href="/content" className="text-sm font-semibold text-brand hover:text-brand-strong transition-colors">
              Open content
            </Link>
          }
        >
          <div className="flex flex-col gap-4">
            {snapshot.recentContent.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={`/content/${item.id}`}
                className="nested-panel card-hover group p-5"
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="muted">{humanizeEnum(item.stage)}</Badge>
                  <Badge variant="cyan-subtle">{humanizeEnum(item.contentType)}</Badge>
                </div>
                <h3 className="font-display text-lg font-semibold text-[color:var(--foreground)] group-hover:text-brand transition-colors">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)] line-clamp-2">
                  {item.brief}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-[color:var(--muted)]">
                  <span className="font-medium">{item.owner.name}</span>
                  <span>{formatRelativeDate(item.updatedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Queue Watch"
          description="Items waiting on review or timing."
          action={
            <Link href="/workflow" className="text-sm font-semibold text-brand hover:text-brand-strong transition-colors">
              Open workflow
            </Link>
          }
        >
          <div className="flex flex-col gap-4">
            {snapshot.scheduledItems.slice(0, 3).map((item) => (
              <div key={item.id} className="nested-panel p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <Badge variant={item.stage === "IN_REVIEW" ? "warning" : "default"}>
                    {humanizeEnum(item.stage)}
                  </Badge>
                  {item.scheduledFor && (
                    <span className="text-xs font-medium text-[color:var(--muted)]">
                      {formatDateTime(item.scheduledFor)}
                    </span>
                  )}
                </div>
                <h3 className="font-display text-base font-semibold text-[color:var(--foreground)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)] line-clamp-2">
                  {item.brief}
                </p>
              </div>
            ))}

            {!snapshot.scheduledItems.length && (
              <div className="empty-state">
                No review or scheduled items need immediate attention.
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      <SectionCard
        title="Recent Activity"
        description="A short view of the latest team and system actions."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {snapshot.recentActivity.slice(0, 3).map((entry) => (
            <div key={entry.id} className="nested-panel p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <Badge variant="muted">{entry.action}</Badge>
                <span className="text-xs text-[color:var(--muted)]">
                  {formatRelativeDate(entry.createdAt)}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[color:var(--foreground)]">
                {entry.summary}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[color:var(--muted)]">
                <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                   {entry.actor?.name?.charAt(0) ?? "S"}
                </div>
                <span>{entry.actor?.name ?? "System"}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
