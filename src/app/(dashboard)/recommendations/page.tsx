import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { prisma } from "@/lib/db";
import {
  buildAssistantOpportunities,
  getContentLaneLabel,
} from "@/lib/engines/content/strategy";
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

  const [recommendations, trends, planningAnswer, profile, recentContent] = await Promise.all([
    getRecommendations(),
    getTrendCollections(),
    getPlanningAssistantAnswer(question),
    prisma.businessProfile.findUnique({
      where: { id: 1 },
      include: {
        products: {
          where: { active: true },
          orderBy: { priority: "desc" },
        },
        audienceSegments: {
          orderBy: { priority: "desc" },
        },
        offers: {
          where: { active: true },
          orderBy: { priority: "desc" },
        },
        goals: {
          where: { active: true },
          orderBy: { priority: "desc" },
        },
      },
    }),
    prisma.contentItem.findMany({
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take: 24,
      select: {
        title: true,
        objective: true,
        themeLabel: true,
        contentType: true,
        channel: true,
      },
    }),
  ]);

  const assistant =
    profile
      ? buildAssistantOpportunities({
          products: profile.products,
          audiences: profile.audienceSegments,
          goals: profile.goals,
          offers: profile.offers,
          recentContent,
        })
      : null;

  return (
    <div className="grid gap-6">
      <SectionCard
        title="Content plan"
        description="See what the assistant recommends next and why."
        action={
          <form action={refreshRecommendationsAction}>
            <SubmitButton pendingLabel="Refreshing recommendations...">
              Refresh recommendations
            </SubmitButton>
          </form>
        }
      >
        <div className="grid gap-3 text-sm text-[color:var(--muted)] md:grid-cols-3">
          <p>Proactive opportunities keep the channels active even when no strong trend is available.</p>
          <p>Safe trend adaptation adds timely hooks without letting virality override brand fit.</p>
          <p>Performance history and content-balance gaps keep the plan practical, not repetitive.</p>
        </div>
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Ask the planner"
          description="Ask what to post next and get a reasoned answer."
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
          title="Opportunity Drivers"
          description="These are the signals currently shaping the plan."
        >
          <div className="grid gap-4">
            {assistant?.opportunities.slice(0, 2).map((opportunity) => (
              <div
                key={opportunity.key}
                className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge>{opportunity.source}</Badge>
                  <Badge variant="muted">{getContentLaneLabel(opportunity.lane)}</Badge>
                  <span className="text-sm font-semibold text-[color:var(--brand)]">
                    Score {opportunity.score}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">
                  {opportunity.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {opportunity.summary}
                </p>
              </div>
            ))}

            {[...trends.local.slice(0, 1), ...trends.global.slice(0, 1)].map((trend) => (
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
        title="Recommended ideas"
        description="Saved ideas ranked by usefulness, freshness, and fit."
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
