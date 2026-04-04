import Link from "next/link";
import { WorkflowStage } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  PenSquare,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  canGenerateContent,
  canPublishContent,
  canReviewContent,
  canViewWorkflow,
  shouldScopeWorkflowToOwnedItems,
} from "@/lib/auth/access";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatDateTime, formatRelativeDate, humanizeEnum } from "@/lib/utils";
import {
  approveContentAction,
  sendBackToDraftAction,
  submitForReviewAction,
} from "@/server/actions/content";
import { publishContentAction } from "@/server/actions/publishing";

function stageVariant(stage: WorkflowStage) {
  if (
    stage === WorkflowStage.APPROVED ||
    stage === WorkflowStage.PUBLISHED
  ) {
    return "success" as const;
  }

  if (
    stage === WorkflowStage.NEEDS_REVISION ||
    stage === WorkflowStage.IN_REVIEW ||
    stage === WorkflowStage.SCHEDULED
  ) {
    return "warning" as const;
  }

  return "muted" as const;
}

export default async function WorkflowPage() {
  const session = await requireSession();

  if (!canViewWorkflow(session.role)) {
    redirect("/dashboard");
  }

  const contentScope = shouldScopeWorkflowToOwnedItems(session.role)
    ? { ownerId: session.userId }
    : undefined;

  const [items, reviewers] = await Promise.all([
    prisma.contentItem.findMany({
      where: contentScope,
      include: {
        owner: true,
        reviewer: true,
        product: true,
      },
      orderBy: [{ updatedAt: "desc" }],
    }),
    prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "STRATEGIST", "REVIEWER"],
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const ideas = items.filter((item) => item.stage === WorkflowStage.IDEA);
  const draftQueue = items.filter(
    (item) =>
      item.stage === WorkflowStage.DRAFT ||
      item.stage === WorkflowStage.NEEDS_REVISION,
  );
  const reviewQueue = items.filter(
    (item) => item.stage === WorkflowStage.IN_REVIEW,
  );
  const readyQueue = items.filter(
    (item) =>
      item.stage === WorkflowStage.APPROVED ||
      item.stage === WorkflowStage.SCHEDULED,
  );
  const publishedQueue = items.filter(
    (item) =>
      item.stage === WorkflowStage.PUBLISHED ||
      item.stage === WorkflowStage.ARCHIVED,
  );

  const nextMove = reviewQueue.length
    ? "Review queue needs attention before more work is pushed forward."
    : readyQueue.length
      ? "Approved work is ready for publishing or calendar placement."
      : draftQueue.length
        ? "Drafts are in progress. Push the strongest ones into review next."
        : ideas.length
          ? "The idea pool is ready. Convert the best concept into a draft."
          : "The workflow is clear. Start a fresh draft or generate a new idea.";

  const activeLanes = [
    {
      key: "drafts",
      title: "Create and revise",
      description: "Drafts being written or returned for another pass.",
      icon: PenSquare,
      badge: `${draftQueue.length} active`,
      items: draftQueue,
      empty:
        "No drafts need writing right now. New ideas can move straight into this lane.",
    },
    {
      key: "review",
      title: "Review queue",
      description: "Items waiting for approval or feedback.",
      icon: Clock3,
      badge: `${reviewQueue.length} waiting`,
      items: reviewQueue,
      empty:
        "Nothing is waiting for review. This lane clears automatically when reviewers are caught up.",
    },
    {
      key: "ready",
      title: "Ready to publish",
      description: "Approved or scheduled work prepared for release.",
      icon: CheckCircle2,
      badge: `${readyQueue.length} ready`,
      items: readyQueue,
      empty:
        "No items are approved yet. Reviewers will move strong drafts here.",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-8">
      <SectionCard
        title="Workflow command center"
        description="Move work from idea to live post without losing track of the next owner."
        action={
          <Link
            href="/content"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-strong hover:shadow-md"
          >
            <Sparkles className="h-4 w-4" />
            Open content lab
          </Link>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Ideas", value: ideas.length, hint: "Saved for later" },
              { label: "Drafts", value: draftQueue.length, hint: "Writing lane" },
              { label: "Review", value: reviewQueue.length, hint: "Needs approval" },
              { label: "Ready", value: readyQueue.length, hint: "Approved or scheduled" },
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

          <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand-subtle">Next move</Badge>
              {shouldScopeWorkflowToOwnedItems(session.role) ? (
                <Badge variant="muted">Your queue only</Badge>
              ) : (
                <Badge variant="muted">Shared team queue</Badge>
              )}
            </div>
            <p className="mt-4 text-base leading-7 text-[color:var(--foreground)]">
              {nextMove}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              {[
                "Idea",
                "Draft",
                "Review",
                "Publish",
              ].map((step, index) => (
                <div
                  key={step}
                  className="rounded-[20px] border border-[color:var(--border)] bg-white px-4 py-3 text-center"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)]">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Idea pool"
        description="Use saved ideas as the quiet planning lane before real drafting starts."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ideas.length ? (
            ideas.map((item) => (
              <Link
                key={item.id}
                href={`/content/${item.id}`}
                className="nested-panel card-hover group p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="muted">Idea</Badge>
                  <Badge variant="cyan-subtle">{humanizeEnum(item.channel)}</Badge>
                </div>
                <h3 className="mt-3 font-display text-base font-semibold text-[color:var(--foreground)] group-hover:text-brand transition-colors">
                  {item.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[color:var(--muted)]">
                  {item.draft}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-[color:var(--muted)]">
                  <span>{item.owner.name}</span>
                  <span>{formatRelativeDate(item.updatedAt)}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="empty-state md:col-span-2 xl:col-span-3">
              No saved ideas yet. Generate a few in the Content Lab so the team
              always has a starting point.
            </div>
          )}
        </div>
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-3">
        {activeLanes.map((lane) => (
          <SectionCard
            key={lane.key}
            title={lane.title}
            description={lane.description}
            action={<Badge variant="muted">{lane.badge}</Badge>}
          >
            <div className="flex flex-col gap-4">
              {lane.items.length ? (
                lane.items.map((item) => (
                  <div key={item.id} className="nested-panel p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={stageVariant(item.stage)}>
                        {humanizeEnum(item.stage)}
                      </Badge>
                      <Badge variant="cyan-subtle">
                        {humanizeEnum(item.contentType)}
                      </Badge>
                    </div>

                    <Link
                      href={`/content/${item.id}`}
                      className="mt-3 block font-display text-base font-semibold text-[color:var(--foreground)] transition-colors hover:text-brand"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[color:var(--muted)]">
                      {item.brief}
                    </p>

                    <div className="mt-4 grid gap-1 text-xs text-[color:var(--muted)]">
                      <div className="flex justify-between gap-3">
                        <span>Owner</span>
                        <span className="font-medium text-[color:var(--foreground)]">
                          {item.owner.name}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Reviewer</span>
                        <span className="font-medium text-[color:var(--foreground)]">
                          {item.reviewer?.name ?? "Unassigned"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Updated</span>
                        <span>{formatRelativeDate(item.updatedAt)}</span>
                      </div>
                      {item.scheduledFor ? (
                        <div className="flex justify-between gap-3">
                          <span>Scheduled</span>
                          <span>{formatDateTime(item.scheduledFor)}</span>
                        </div>
                      ) : null}
                      {item.revisionCount > 0 ? (
                        <div className="flex justify-between gap-3">
                          <span>Revisions</span>
                          <span className="font-medium text-amber-700">
                            {item.revisionCount}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-5 flex flex-col gap-3">
                      {(item.stage === WorkflowStage.DRAFT ||
                        item.stage === WorkflowStage.NEEDS_REVISION) &&
                      canGenerateContent(session.role) ? (
                        <form
                          action={submitForReviewAction}
                          className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4"
                        >
                          <input type="hidden" name="id" value={item.id} />
                          <div className="grid gap-3">
                            <select
                              name="reviewerId"
                              defaultValue={item.reviewerId ?? reviewers[0]?.id ?? ""}
                              className="bg-white text-sm"
                            >
                              <option value="">Assign reviewer</option>
                              {reviewers.map((reviewer) => (
                                <option key={reviewer.id} value={reviewer.id}>
                                  {reviewer.name}
                                </option>
                              ))}
                            </select>
                            <input
                              name="reviewNotes"
                              placeholder="What should the reviewer focus on?"
                              className="bg-white text-sm"
                            />
                            <SubmitButton
                              className="w-full"
                              pendingLabel="Sending..."
                            >
                              Send to review
                            </SubmitButton>
                          </div>
                        </form>
                      ) : null}

                      {item.stage === WorkflowStage.IN_REVIEW &&
                      canReviewContent(session.role) ? (
                        <div className="grid gap-3 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                          <form action={approveContentAction} className="grid gap-2">
                            <input type="hidden" name="id" value={item.id} />
                            <input
                              name="approvalNotes"
                              placeholder="Approval notes (optional)"
                              className="bg-white text-sm"
                            />
                            <SubmitButton className="w-full" pendingLabel="Approving...">
                              Approve draft
                            </SubmitButton>
                          </form>
                          <form action={sendBackToDraftAction} className="grid gap-2">
                            <input type="hidden" name="id" value={item.id} />
                            <input
                              name="revisionNotes"
                              placeholder="What needs to change?"
                              required
                              className="bg-white text-sm"
                            />
                            <SubmitButton
                              variant="secondary"
                              className="w-full"
                              pendingLabel="Returning..."
                            >
                              Request revision
                            </SubmitButton>
                          </form>
                        </div>
                      ) : null}

                      {item.stage === WorkflowStage.APPROVED &&
                      canPublishContent(session.role) ? (
                        <form
                          action={publishContentAction}
                          className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4"
                        >
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="channel" value={item.channel} />
                          <SubmitButton
                            className="w-full"
                            pendingLabel="Publishing..."
                          >
                            Publish immediately
                          </SubmitButton>
                        </form>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">{lane.empty}</div>
              )}
            </div>
          </SectionCard>
        ))}
      </section>

      <SectionCard
        title="Closed loop"
        description="Published work and archived items stay easy to revisit without cluttering the active queue."
        action={
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition-colors hover:text-brand-strong"
          >
            Open library
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {publishedQueue.length ? (
            publishedQueue.map((item) => (
              <Link
                key={item.id}
                href={`/content/${item.id}`}
                className="nested-panel card-hover group p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={stageVariant(item.stage)}>
                    {humanizeEnum(item.stage)}
                  </Badge>
                  <Badge variant="cyan-subtle">{humanizeEnum(item.channel)}</Badge>
                </div>
                <h3 className="mt-3 font-display text-base font-semibold text-[color:var(--foreground)] transition-colors group-hover:text-brand">
                  {item.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[color:var(--muted)]">
                  {item.brief}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-[color:var(--muted)]">
                  <span>{item.owner.name}</span>
                  <span>{formatRelativeDate(item.updatedAt)}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="empty-state md:col-span-2 xl:col-span-3">
              Nothing has reached the published or archived lane yet.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
