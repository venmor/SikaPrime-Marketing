import Link from "next/link";
import { ArrowRight, Sparkles, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { getDashboardSnapshot } from "@/lib/dashboard/service";
import { formatDateTime, formatRelativeDate, humanizeEnum } from "@/lib/utils";

export default async function DashboardPage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <>
      <section className="grid gap-6 xl:grid-cols-[1.22fr_0.78fr]">
        <div className="surface-panel relative overflow-hidden rounded-[36px] p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.1),transparent_40%),radial-gradient(circle_at_top_right,rgba(230,62,140,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(33,198,217,0.16),transparent_32%)]" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="brand-subtle">Marketing control center</Badge>
              <Badge variant="cyan-subtle">Live overview</Badge>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
              <div>
                <h2 className="max-w-2xl font-display text-[2.3rem] font-semibold leading-[1.02] tracking-[-0.05em] text-[color:var(--foreground)] sm:text-[2.8rem]">
                  Keep campaigns active, elegant, and easier to move from idea to publish.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-8 text-[color:var(--muted)] sm:text-[1rem]">
                  See what deserves attention right now, what the assistant wants
                  to create next, and where the content pipeline needs a cleaner
                  rhythm.
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
                    href="/calendar"
                    className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/80 px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
                  >
                    Open calendar
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="nested-panel rounded-[28px] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,rgba(230,62,140,0.14),rgba(33,198,217,0.16))] text-[color:var(--foreground)]">
                      <Zap className="h-5 w-5" />
                    </div>
                    <Badge variant="muted">
                      {snapshot.bestPostingWindow?.label ?? "Learning"}
                    </Badge>
                  </div>
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
                    Best posting window
                  </p>
                  <p className="mt-2 font-display text-[2rem] font-semibold tracking-[-0.04em] text-[color:var(--foreground)]">
                    {snapshot.bestPostingWindow?.label ?? "Building signal"}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                    Use high-performing windows to keep content visible without
                    guessing.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {snapshot.calendarWarnings.slice(0, 2).map((warning) => (
                    <div
                      key={warning.message}
                      className="rounded-[26px] border border-[color:rgba(245,158,11,0.26)] bg-[linear-gradient(180deg,rgba(255,251,235,0.92),rgba(255,247,217,0.86))] p-4 shadow-[var(--shadow-soft)]"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-amber-700">
                        Queue watch
                      </p>
                      <p className="mt-3 text-sm leading-7 text-amber-900">
                        {warning.message}
                      </p>
                    </div>
                  ))}
                  {!snapshot.calendarWarnings.length ? (
                    <div className="rounded-[26px] border border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.96),rgba(220,252,231,0.9))] p-4 shadow-[var(--shadow-soft)] sm:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-700">
                        Queue watch
                      </p>
                      <p className="mt-3 text-sm leading-7 text-emerald-900">
                        No urgent calendar risks are currently flagged.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <SectionCard
          title="Recommended Next Moves"
          description="The assistant blends proactive opportunities, safe trend hooks, and product priorities into a clear next move."
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
                className="nested-panel card-hover rounded-[26px] p-4"
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
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  {recommendation.rationale}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

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
                  className="nested-panel card-hover rounded-[28px] p-5"
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
          title="Recent Activity"
          description="Traceability across edits, reviews, scheduling, publishing, and knowledge updates."
        >
          <div className="grid gap-4">
            {snapshot.recentActivity.slice(0, 4).map((entry) => (
              <div
                key={entry.id}
                className="nested-panel card-hover rounded-[26px] p-4"
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
                <p className="mt-3 text-sm leading-7 text-[color:var(--foreground)]">
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
                className="nested-panel card-hover rounded-[26px] p-4"
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
                className="nested-panel rounded-[26px] p-4"
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
          title="Calendar Watch"
          description="The scheduler flags content balance issues and timing opportunities before a post goes stale."
        >
          <div className="grid gap-4">
            {snapshot.bestPostingWindow ? (
              <div className="rounded-[26px] border border-[color:rgba(33,198,217,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(238,251,252,0.92))] p-5 shadow-[var(--shadow-soft)]">
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
                  className="rounded-[24px] border border-amber-200 bg-amber-50/92 p-4 text-sm text-amber-800 shadow-[var(--shadow-soft)]"
                >
                  {warning.message}
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/92 p-4 text-sm text-emerald-800 shadow-[var(--shadow-soft)]">
                No urgent calendar risks are currently flagged.
              </div>
            )}
          </div>
        </SectionCard>
      </section>
    </>
  );
}
