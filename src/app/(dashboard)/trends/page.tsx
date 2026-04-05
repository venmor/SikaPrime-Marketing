import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  explainTrendOpportunity,
  getLiveTrends,
  getTrendCollections,
} from "@/lib/engines/trends/service";
import { formatRelativeDate, humanizeEnum } from "@/lib/utils";
import { refreshTrendSignalsAction } from "@/server/actions/trends";

export default async function TrendsPage() {
  const [trends, liveTrends] = await Promise.all([
    getTrendCollections(),
    getLiveTrends(4),
  ]);

  return (
    <div className="grid gap-6">
      <SectionCard
        title="Trend watch"
        description="Review live signals that are fresh, relevant, and safe to adapt."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/trends/live"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-surface-strong px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] shadow-sm hover:-translate-y-0.5 hover:shadow-md"
            >
              Open live trends
            </Link>
            <form action={refreshTrendSignalsAction}>
              <SubmitButton pendingLabel="Refreshing trends...">
                Refresh trends
              </SubmitButton>
            </form>
          </div>
        }
      >
        <div className="flex flex-wrap gap-4 text-sm text-[color:var(--muted)]">
          <span>Last updated: {formatRelativeDate(trends.lastUpdated)}</span>
          <span>Local signals: {trends.local.length}</span>
          <span>Global signals: {trends.global.length}</span>
          <span>Unsafe or low-value topics are filtered out before recommendation use</span>
        </div>
      </SectionCard>

      <SectionCard
        title="Live trend handoff"
        description="Fresh external signals feed directly into AI generation so the team can move from trend watch to content creation without losing context."
        action={
          <Link
            href="/trends/live"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition-colors hover:text-brand-strong"
          >
            View all live trends
          </Link>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {liveTrends.length ? (
            liveTrends.map((trend) => (
              <div
                key={trend.id}
                className="rounded-[24px] border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand-subtle">{trend.source}</Badge>
                  <Badge variant="muted">Score {Math.round(trend.relevanceScore)}</Badge>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                  {trend.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {trend.description ?? "This live trend is ready to be used as AI prompt context."}
                </p>
              </div>
            ))
          ) : (
            <div className="empty-state md:col-span-2 xl:col-span-4">
              No live trends are stored yet. Open the live trends screen and
              refresh the external feed to start using them in AI generation.
            </div>
          )}
        </div>
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-2">
        {[
          { label: "Local Zambia trends", items: trends.local },
          { label: "Global trends", items: trends.global },
        ].map(({ label, items }) => (
          <SectionCard
            key={label}
            title={label}
            description="Each signal is scored before it is recommended for use."
          >
            <div className="grid gap-4">
              {items.map((trend) => (
                (() => {
                  const explanation = explainTrendOpportunity({
                    trend,
                    companyName: "Sika Prime Loans",
                  });

                  return (
                    <div
                      key={trend.id}
                      className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant={trend.status === "RISING" ? "success" : "warning"}>
                          {humanizeEnum(trend.status)}
                        </Badge>
                        <Badge variant="muted">{explanation.lifecycleLabel}</Badge>
                        <Badge variant="muted">{trend.sourceName}</Badge>
                        <span className="text-sm text-[color:var(--muted)]">
                          {formatRelativeDate(trend.publishedAt)}
                        </span>
                      </div>
                      <h3 className="mt-3 font-display text-xl font-semibold">
                        {trend.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                        {trend.summary}
                      </p>
                      <div className="mt-4 grid gap-3 rounded-2xl bg-[color:var(--surface-soft)] p-4 text-sm">
                        <p className="font-semibold text-[color:var(--foreground)]">
                          Why it matters
                        </p>
                        <p className="leading-6 text-[color:var(--muted)]">
                          {explanation.whyItMatters}
                        </p>
                        <p className="font-semibold text-[color:var(--foreground)]">
                          Suggested adaptation
                        </p>
                        <p className="leading-6 text-[color:var(--muted)]">
                          {explanation.adaptationIdea}
                        </p>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl bg-[color:var(--surface-strong)] p-3 text-sm">
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
                            Brand fit
                          </p>
                          <p className="mt-1 font-semibold">{trend.brandFitScore}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ))}
            </div>
          </SectionCard>
        ))}
      </section>
    </div>
  );
}
