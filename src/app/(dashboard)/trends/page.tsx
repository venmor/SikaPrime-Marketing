import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  explainTrendOpportunity,
  getTrendCollections,
} from "@/lib/engines/trends/service";
import { formatRelativeDate, humanizeEnum } from "@/lib/utils";
import { refreshTrendSignalsAction } from "@/server/actions/trends";

export default async function TrendsPage() {
  const trends = await getTrendCollections();

  return (
    <div className="grid gap-6">
      <SectionCard
        title="Trend Detection Engine"
        description="Freshness-first attention tracking using live sources plus seeded data. Signals are filtered for relevance, social safety, and brand fit before the assistant adapts them."
        action={
          <form action={refreshTrendSignalsAction}>
            <SubmitButton pendingLabel="Refreshing trends...">
              Refresh trends
            </SubmitButton>
          </form>
        }
      >
        <div className="flex flex-wrap gap-4 text-sm text-[color:var(--muted)]">
          <span>Last updated: {formatRelativeDate(trends.lastUpdated)}</span>
          <span>Local signals: {trends.local.length}</span>
          <span>Global signals: {trends.global.length}</span>
          <span>Unsafe or low-value topics are filtered out before recommendation use</span>
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
            description="Signals are scored for relevance, freshness, fit with Sika Prime Loans, and whether they can be adapted safely."
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
                      className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
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
                      <div className="mt-4 grid gap-3 rounded-2xl bg-[color:rgba(18,62,74,0.05)] p-4 text-sm">
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
