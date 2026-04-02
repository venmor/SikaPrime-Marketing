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
    <>
      <section className="grid gap-6 xl:grid-cols-[1.14fr_0.86fr]">
        <div className="surface-panel relative overflow-hidden rounded-[34px] p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.08),transparent_40%),radial-gradient(circle_at_top_right,rgba(230,62,140,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(33,198,217,0.12),transparent_30%)]" />
          <div className="relative">
            <Badge variant="brand-subtle">Today</Badge>
            <h2 className="mt-5 max-w-3xl font-display text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.05em] text-[color:var(--foreground)] sm:text-[2.75rem]">
              One clear place to run the content pipeline.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--muted)] sm:text-[0.98rem]">
              See what needs attention, keep the schedule healthy, and move
              ideas into publish-ready work faster.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/content"
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--brand),#ff74a7)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(230,62,140,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_46px_rgba(230,62,140,0.28)]"
              >
                <Sparkles className="h-4 w-4" />
                Create content
              </Link>
              <Link
                href="/workflow"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/80 px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
              >
                Open workflow
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {quickStatus.map((item) => (
                <div key={item.label} className="nested-panel rounded-[24px] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                    {item.label}
                  </p>
                  <p className="mt-3 line-clamp-2 font-display text-lg font-semibold text-[color:var(--foreground)]">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <SectionCard
          title="Start Here"
          description="Quick routes for the next step."
        >
          <div className="grid gap-3">
            {startHere.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nested-panel card-hover rounded-[24px] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,rgba(230,62,140,0.14),rgba(33,198,217,0.14))] text-[color:var(--foreground)]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold text-[color:var(--foreground)]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                      {item.detail}
                    </p>
                  </div>
                </div>
              </Link>
            ))}

            <div
              className={`rounded-[24px] border p-4 text-sm shadow-[var(--shadow-soft)] ${
                snapshot.calendarWarnings.length
                  ? "border-amber-200 bg-amber-50/92 text-amber-900"
                  : "border-emerald-200 bg-emerald-50/92 text-emerald-900"
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]">
                Queue note
              </p>
              <p className="mt-2 leading-6">
                {snapshot.calendarWarnings[0]?.message ??
                  "Everything scheduled so far looks balanced."}
              </p>
              {revisionCount ? (
                <p className="mt-2 text-xs font-medium">
                  {revisionCount} item{revisionCount === 1 ? "" : "s"} still
                  need revision.
                </p>
              ) : null}
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              className="text-sm font-semibold text-[color:var(--brand)] transition hover:text-[color:var(--brand-strong)]"
            >
              View all
            </Link>
          }
        >
          <div className="grid gap-4">
            {snapshot.recommendations.slice(0, 3).map((recommendation) => (
              <div
                key={recommendation.id}
                className="nested-panel card-hover rounded-[24px] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge>{humanizeEnum(recommendation.channel)}</Badge>
                  <p className="text-sm font-semibold text-[color:var(--brand)]">
                    {recommendation.priorityScore}
                  </p>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                  {recommendation.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
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
                  className="nested-panel card-hover rounded-[24px] p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                      {label}
                    </p>
                    <Badge variant={trend.status === "RISING" ? "success" : "warning"}>
                      {humanizeEnum(trend.status)}
                    </Badge>
                  </div>
                  <h3 className="mt-3 font-display text-xl font-semibold text-[color:var(--foreground)]">
                    {trend.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {trend.summary}
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                        Relevance
                      </p>
                      <p className="mt-1 font-semibold">{trend.relevanceScore}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                        Freshness
                      </p>
                      <p className="mt-1 font-semibold">{trend.freshnessScore}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                        Brand fit
                      </p>
                      <p className="mt-1 font-semibold">{trend.brandFitScore}</p>
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
            <Link href="/content" className="text-sm font-semibold text-[color:var(--brand)]">
              Open content
            </Link>
          }
        >
          <div className="grid gap-4">
            {snapshot.recentContent.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={`/content/${item.id}`}
                className="nested-panel card-hover rounded-[24px] p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="muted">{humanizeEnum(item.stage)}</Badge>
                  <Badge>{humanizeEnum(item.contentType)}</Badge>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {item.brief}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-[color:var(--muted)]">
                  <span>{item.owner.name}</span>
                  <span>Updated {formatRelativeDate(item.updatedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Queue Watch"
          description="Items waiting on review or timing."
          action={
            <Link href="/workflow" className="text-sm font-semibold text-[color:var(--brand)]">
              Open workflow
            </Link>
          }
        >
          <div className="grid gap-4">
            {snapshot.scheduledItems.slice(0, 3).map((item) => (
              <div key={item.id} className="nested-panel rounded-[24px] p-4">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={item.stage === "IN_REVIEW" ? "warning" : "default"}>
                    {humanizeEnum(item.stage)}
                  </Badge>
                  {item.scheduledFor ? (
                    <span className="text-sm text-[color:var(--muted)]">
                      {formatDateTime(item.scheduledFor)}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {item.brief}
                </p>
              </div>
            ))}

            {!snapshot.scheduledItems.length ? (
              <div className="empty-state">
                No review or scheduled items need immediate attention.
              </div>
            ) : null}
          </div>
        </SectionCard>
      </section>

      <SectionCard
        title="Recent Activity"
        description="A short view of the latest team and system actions."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {snapshot.recentActivity.slice(0, 3).map((entry) => (
            <div key={entry.id} className="nested-panel rounded-[24px] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="muted">{entry.action}</Badge>
                <span className="text-sm text-[color:var(--muted)]">
                  {formatRelativeDate(entry.createdAt)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[color:var(--foreground)]">
                {entry.summary}
              </p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                {entry.actor?.name ?? "System"}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  );
}
