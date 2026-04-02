import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { getDashboardSnapshot } from "@/lib/dashboard/service";
import { formatDateTime, formatRelativeDate, humanizeEnum } from "@/lib/utils";

export default async function DashboardPage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {snapshot.stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Trend Pulse"
          description="The strongest opportunities now, split between local Zambian context and broader global finance conversations."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: "Top Local Trend", trend: snapshot.topLocalTrend },
              { label: "Top Global Trend", trend: snapshot.topGlobalTrend },
            ].map(({ label, trend }) =>
              trend ? (
                <div
                  key={label}
                  className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.7)] p-4"
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
                      <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                        Relevance
                      </p>
                      <p className="mt-1 font-semibold">{trend.relevanceScore}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                        Freshness
                      </p>
                      <p className="mt-1 font-semibold">{trend.freshnessScore}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                        Brand Fit
                      </p>
                      <p className="mt-1 font-semibold">{trend.brandFitScore}</p>
                    </div>
                  </div>
                </div>
              ) : null,
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Recommended Next Moves"
          description="Suggestions generated from current trends, product priorities, goals, and past performance."
          action={
            <Link
              href="/recommendations"
              className="text-sm font-semibold text-[color:var(--brand)]"
            >
              View all
            </Link>
          }
        >
          <div className="grid gap-4">
            {snapshot.recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.7)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge>{humanizeEnum(recommendation.channel)}</Badge>
                  <p className="text-sm font-semibold text-[color:var(--brand)]">
                    Score {recommendation.priorityScore}
                  </p>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">
                  {recommendation.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {recommendation.rationale}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Recent Content"
          description="The latest items moving through the pipeline."
          action={
            <Link href="/content" className="text-sm font-semibold text-[color:var(--brand)]">
              Open content lab
            </Link>
          }
        >
          <div className="grid gap-4">
            {snapshot.recentContent.map((item) => (
              <Link
                key={item.id}
                href={`/content/${item.id}`}
                className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.7)] p-4 transition hover:border-[color:var(--brand)]"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="muted">{humanizeEnum(item.stage)}</Badge>
                  <Badge>{humanizeEnum(item.contentType)}</Badge>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {item.brief}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-[color:var(--muted)]">
                  <span>Owner: {item.owner.name}</span>
                  <span>Updated {formatRelativeDate(item.updatedAt)}</span>
                  {item.product ? <span>Product: {item.product.name}</span> : null}
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Queue Watch"
          description="Review and scheduled items that need attention soon."
          action={
            <Link href="/workflow" className="text-sm font-semibold text-[color:var(--brand)]">
              Open workflow
            </Link>
          }
        >
          <div className="grid gap-4">
            {snapshot.scheduledItems.map((item) => (
              <div
                key={item.id}
                className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.7)] p-4"
              >
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
                <h3 className="mt-3 font-display text-lg font-semibold">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-[color:var(--muted)]">{item.brief}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Recent Activity"
          description="Traceability across edits, reviews, scheduling, publishing, and knowledge updates."
        >
          <div className="grid gap-4">
            {snapshot.recentActivity.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="muted">{entry.action}</Badge>
                  <span className="text-sm text-[color:var(--muted)]">
                    {entry.actor?.name ?? "System"}
                  </span>
                  <span className="text-sm text-[color:var(--muted)]">
                    {formatRelativeDate(entry.createdAt)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--foreground)]">
                  {entry.summary}
                </p>
                {entry.details ? (
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {entry.details}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Calendar Watch"
          description="The scheduler flags content balance issues and timing opportunities before a post goes stale."
        >
          <div className="grid gap-4">
            {snapshot.bestPostingWindow ? (
              <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Best posting window
                </p>
                <p className="mt-2 font-display text-2xl font-semibold">
                  {snapshot.bestPostingWindow.label}
                </p>
              </div>
            ) : null}

            {snapshot.calendarWarnings.length ? (
              snapshot.calendarWarnings.map((warning) => (
                <div
                  key={warning.message}
                  className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
                >
                  {warning.message}
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                No urgent calendar risks are currently flagged.
              </div>
            )}
          </div>
        </SectionCard>
      </section>
    </>
  );
}
