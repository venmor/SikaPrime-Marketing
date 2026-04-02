import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  getPlanningAssistantAnswer,
  getRecommendations,
} from "@/lib/engines/recommendations/service";
import { getTrendCollections } from "@/lib/engines/trends/service";
import { humanizeEnum } from "@/lib/utils";
import { refreshRecommendationsAction } from "@/server/actions/recommendations";

function firstValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const question =
    firstValue(resolvedSearchParams.question).trim() ||
    "What content should we post this week?";

  const [recommendations, trends, planningAnswer] = await Promise.all([
    getRecommendations(),
    getTrendCollections(),
    getPlanningAssistantAnswer(question),
  ]);

  return (
    <div className="grid gap-6">
      <SectionCard
        title="Recommendation Engine"
        description="Content recommendations combine trend freshness, company goals, audience needs, product priorities, calendar gaps, and performance history."
        action={
          <form action={refreshRecommendationsAction}>
            <SubmitButton pendingLabel="Refreshing recommendations...">
              Refresh recommendations
            </SubmitButton>
          </form>
        }
      >
        <div className="grid gap-3 text-sm text-[color:var(--muted)] md:grid-cols-3">
          <p>Live trend momentum guides timing and creative angle selection.</p>
          <p>Product priorities and business goals shape what gets suggested first.</p>
          <p>Past winners and scheduling gaps keep the plan practical, not generic.</p>
        </div>
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Smart Planning Assistant"
          description="Ask what to post next and the system explains the recommendation instead of only listing ideas."
        >
          <form className="grid gap-4">
            <label>
              Planning question
              <input
                name="question"
                defaultValue={question}
                placeholder="What should we post this week?"
              />
            </label>
            <SubmitButton pendingLabel="Thinking...">Ask planner</SubmitButton>
          </form>

          <div className="mt-6 rounded-[28px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
              {planningAnswer.headline}
            </p>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              {planningAnswer.explanation}
            </p>
            <div className="mt-4 grid gap-3">
              {planningAnswer.actions.map((action) => (
                <div
                  key={action}
                  className="rounded-[20px] bg-[color:var(--surface-strong)] px-4 py-3 text-sm text-[color:var(--foreground)]"
                >
                  {action}
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Trend Drivers"
          description="The local and international trend signals currently feeding recommendation logic."
        >
          <div className="grid gap-4">
            {[...trends.local.slice(0, 2), ...trends.global.slice(0, 2)].map((trend) => (
              <div
                key={trend.id}
                className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={trend.status === "RISING" ? "success" : "warning"}>
                    {humanizeEnum(trend.status)}
                  </Badge>
                  <Badge variant="muted">{humanizeEnum(trend.lifecycle)}</Badge>
                  <Badge variant="muted">{humanizeEnum(trend.region)}</Badge>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">
                  {trend.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {trend.summary}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <SectionCard
        title="Recommended Content Ideas"
        description="These stored ideas are ranked by how well they match what is fresh, useful, and proven for Sika Prime Loans."
      >
        <div className="grid gap-4">
          {recommendations.length ? (
            recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge>{humanizeEnum(recommendation.channel)}</Badge>
                  <Badge variant="muted">{humanizeEnum(recommendation.contentType)}</Badge>
                  <Badge variant="muted">{humanizeEnum(recommendation.tone)}</Badge>
                  <span className="text-sm font-semibold text-[color:var(--brand)]">
                    Score {recommendation.priorityScore}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold">
                  {recommendation.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {recommendation.rationale}
                </p>
                <p className="mt-3 text-sm text-[color:var(--muted)]">
                  <span className="font-semibold text-[color:var(--foreground)]">
                    Based on:
                  </span>{" "}
                  {recommendation.basedOn}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-[color:var(--muted)]">
              No recommendations are available yet. Refresh the recommendation engine
              after adding trends, products, and performance data.
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
