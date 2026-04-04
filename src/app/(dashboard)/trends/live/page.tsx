import { OpenAssistantButton } from "@/components/assistant/open-assistant-button";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { prisma } from "@/lib/db";
import { getLiveTrends } from "@/lib/engines/trends/service";
import { formatRelativeDate } from "@/lib/utils";
import { refreshLiveTrendsAction } from "@/server/actions/trends";

export default async function LiveTrendsPage() {
  const [liveTrends, profile, audiences] = await Promise.all([
    getLiveTrends(18),
    prisma.businessProfile.findUnique({
      where: { id: 1 },
      include: {
        values: true,
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
    prisma.audienceSegment.findMany({
      orderBy: { priority: "desc" },
    }),
  ]);

  return (
    <div className="grid gap-6">
      <SectionCard
        title="Live trends"
        description="Watch recent finance, lending, and market conversations, then turn a strong signal into a guided AI draft."
        action={
          <form action={refreshLiveTrendsAction}>
            <SubmitButton pendingLabel="Refreshing live trends...">
              Refresh live trends
            </SubmitButton>
          </form>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: "Signals",
              value: liveTrends.length,
              hint: "Live trend records stored right now",
            },
            {
              label: "Offers in play",
              value: profile?.offers.length ?? 0,
              hint: "Offer context available for AI prompts",
            },
            {
              label: "Audience targets",
              value: audiences.length,
              hint: "Segments ready for guided generation",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[24px] border border-[color:var(--border)] bg-white p-4 shadow-sm"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)]">
                {stat.label}
              </p>
              <p className="mt-3 font-display text-3xl font-semibold text-[color:var(--foreground)]">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{stat.hint}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        {liveTrends.length ? (
          liveTrends.map((trend) => (
            <SectionCard
              key={trend.id}
              title={trend.title}
              description={trend.description ?? "Live trend signal without a summary."}
              action={
                <OpenAssistantButton
                  label="Create post about this"
                  prompt={`Create a post about this trend: ${trend.title}. Use the best-fit Sika Prime product automatically, keep it constructive, and make it ready for publishing.`}
                  autoSend
                />
              }
            >
              <div className="grid gap-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="brand-subtle">{trend.source}</Badge>
                  <Badge variant="muted">Score {Math.round(trend.relevanceScore)}</Badge>
                  <Badge variant="muted">
                    {formatRelativeDate(trend.createdAt)}
                  </Badge>
                </div>
                {trend.sourceUrl ? (
                  <a
                    href={trend.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-brand transition-colors hover:text-brand-strong"
                  >
                    Open source
                  </a>
                ) : null}
              </div>
            </SectionCard>
          ))
        ) : (
          <div className="empty-state xl:col-span-2">
            No live trends are stored yet. Refresh the live trend service to pull
            the latest external signals.
          </div>
        )}
      </div>
    </div>
  );
}
