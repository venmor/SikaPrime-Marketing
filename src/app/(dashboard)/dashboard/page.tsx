import Link from "next/link";
import { ChevronDown, CheckCircle2, Clock3, Sparkles } from "lucide-react";

import { OpenAssistantButton } from "@/components/assistant/open-assistant-button";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { canGenerateContent, canReviewContent } from "@/lib/auth/access";
import { getAssistantHomeSnapshot } from "@/lib/assistant/service";
import { requireSession } from "@/lib/auth/session";
import { formatRelativeDate, humanizeEnum } from "@/lib/utils";
import {
  approveContentAction,
  sendBackToDraftAction,
} from "@/server/actions/content";

export default async function DashboardPage() {
  const session = await requireSession();
  const snapshot = await getAssistantHomeSnapshot({
    userId: session.userId,
    role: session.role,
  });
  const canGenerate = canGenerateContent(session.role);
  const spotlightReview = canReviewContent(session.role)
    ? snapshot.reviewInbox[0] ?? null
    : null;

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <SectionCard
          title="Your next best action"
          description="The assistant keeps the daily queue small so you always know what to do next."
          action={
            <Link
              href={snapshot.nextAction.href}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-strong hover:shadow-md"
            >
              <Sparkles className="h-4 w-4" />
              {snapshot.nextAction.ctaLabel}
            </Link>
          }
        >
          <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[28px] bg-brand-soft p-6">
              <Badge variant="brand-subtle">Priority</Badge>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-brand-strong sm:text-4xl">
                {snapshot.nextAction.title}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--foreground)]">
                {snapshot.nextAction.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={snapshot.nextAction.href}
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-strong hover:shadow-md"
                >
                  {snapshot.nextAction.ctaLabel}
                </Link>
                {canGenerate ? (
                  <OpenAssistantButton
                    label="Quick generate"
                    prompt={`Create the next best ${snapshot.defaults.preferredChannel.toLowerCase()} post for ${snapshot.defaults.preferredProductName ?? "our best product"} in a ${snapshot.defaults.preferredTone.toLowerCase()} tone.`}
                    autoSend
                    className="bg-surface-strong text-[color:var(--foreground)] hover:bg-[color:var(--surface-soft)]"
                  />
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {[
                {
                  label: "Default channel",
                  value: humanizeEnum(snapshot.defaults.preferredChannel),
                  hint: "Picked from your recent behavior",
                },
                {
                  label: "Favorite product",
                  value: snapshot.defaults.preferredProductName ?? "Auto-pick when needed",
                  hint: "Will be used unless the prompt says otherwise",
                },
                {
                  label: "Preferred tone",
                  value: humanizeEnum(snapshot.defaults.preferredTone),
                  hint: "Advanced options stay hidden until needed",
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-[24px] border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)]">
                    {card.label}
                  </p>
                  <p className="mt-3 font-display text-xl font-semibold text-[color:var(--foreground)]">
                    {card.value}
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {card.hint}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {canGenerate ? (
          <SectionCard
            title="AI suggests you create"
            description="One click is enough. The assistant already knows your likely product, channel, and tone."
          >
            <div className="grid gap-4">
              {snapshot.suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="rounded-[24px] border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold text-[color:var(--foreground)]">
                    {suggestion.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {suggestion.detail}
                  </p>
                  <div className="mt-4">
                    <OpenAssistantButton
                      label="Create"
                      prompt={suggestion.prompt}
                      autoSend
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : (
          <SectionCard
            title="Focused today"
            description="Creation is hidden for your role so you can stay on decision-making and measurement."
          >
            <div className="rounded-[24px] border border-[color:var(--border)] bg-surface-strong p-5 shadow-sm">
              <p className="text-base leading-7 text-[color:var(--foreground)]">
                Use the sidebar to open the queue or performance pages relevant to your role. The assistant keeps creation controls out of your way here.
              </p>
            </div>
          </SectionCard>
        )}
      </section>

      {canGenerate ? (
        <SectionCard
          title="Trends for you"
          description="Fresh signals are paired with the product most likely to fit, so nobody has to hunt through a trend list first."
        >
          <div className="flex gap-4 overflow-x-auto pb-2">
            {snapshot.trendsForYou.map((trend) => (
              <div
                key={trend.id}
                className="min-w-[18rem] rounded-[24px] border border-[color:var(--border)] bg-surface-strong p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="cyan-subtle">{trend.source}</Badge>
                  <Badge variant="muted">{Math.round(trend.relevanceScore)}</Badge>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-[color:var(--foreground)]">
                  {trend.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[color:var(--muted)]">
                  {trend.description ?? "Live conversation without a long summary yet."}
                </p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Best fit: {trend.matchedProductName ?? "Auto-select"}
                </p>
                <div className="mt-4">
                  <OpenAssistantButton
                    label="Create post about this"
                    prompt={trend.prompt}
                    autoSend
                    className="w-full justify-center"
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {spotlightReview ? (
        <SectionCard
          title="One pending review"
          description="Reviewers stay in flow with one clear approval decision instead of a long table."
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <div className="rounded-[24px] border border-[color:var(--border)] bg-surface-strong p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="warning">Waiting</Badge>
                <Badge variant="muted">{formatRelativeDate(spotlightReview.updatedAt)}</Badge>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-[color:var(--foreground)]">
                {spotlightReview.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                {spotlightReview.brief}
              </p>
              <p className="mt-4 text-sm text-[color:var(--muted)]">
                Submitted by {spotlightReview.ownerName}
              </p>
            </div>

            <div className="grid gap-3">
              <form action={approveContentAction} className="grid gap-3 rounded-[24px] border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm">
                <input type="hidden" name="id" value={spotlightReview.id} />
                <input
                  type="hidden"
                  name="approvalNotes"
                  value="Approved from dashboard spotlight."
                />
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </button>
              </form>

              <form action={sendBackToDraftAction} className="grid gap-3 rounded-[24px] border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm">
                <input type="hidden" name="id" value={spotlightReview.id} />
                <label>
                  Revision note
                  <textarea
                    name="revisionNotes"
                    placeholder="Tell the creator what should change."
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[color:var(--border-strong)] bg-surface-strong px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)] transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Clock3 className="h-4 w-4" />
                  Request changes
                </button>
              </form>

              <Link
                href="/workflow"
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-brand transition-colors hover:text-brand-strong"
              >
                Open full review queue
              </Link>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <details className="group rounded-[28px] border border-[color:var(--border)] bg-surface-strong p-5 shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[color:var(--foreground)]">
              Show full plan
            </p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Queue counts, recommendations, and backlog context for power users.
            </p>
          </div>
          <ChevronDown className="h-5 w-5 text-[color:var(--muted)] transition-transform group-open:rotate-180" />
        </summary>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Drafts",
              value: snapshot.fullPlan.draftCount,
            },
            {
              label: "In review",
              value: snapshot.fullPlan.reviewCount,
            },
            {
              label: "Ready",
              value: snapshot.fullPlan.readyCount,
            },
            {
              label: "Scheduled",
              value: snapshot.fullPlan.scheduledCount,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[22px] bg-[color:var(--surface-soft)] p-4"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)]">
                {item.label}
              </p>
              <p className="mt-3 font-display text-3xl font-semibold text-[color:var(--foreground)]">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
          <p className="text-sm font-semibold text-[color:var(--foreground)]">
            Top plan ideas
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {snapshot.fullPlan.topRecommendationTitles.map((title) => (
              <Badge key={title} variant="muted">
                {title}
              </Badge>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
