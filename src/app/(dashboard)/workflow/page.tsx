import Link from "next/link";
import { WorkflowStage } from "@prisma/client";
import { redirect } from "next/navigation";

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

const activeStages = [
  WorkflowStage.DRAFT,
  WorkflowStage.NEEDS_REVISION,
  WorkflowStage.IN_REVIEW,
  WorkflowStage.APPROVED,
  WorkflowStage.SCHEDULED,
] as const;

const closedStages = [WorkflowStage.PUBLISHED, WorkflowStage.ARCHIVED] as const;

function stageVariant(stage: WorkflowStage) {
  if (stage === WorkflowStage.APPROVED || stage === WorkflowStage.PUBLISHED) {
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
  const activeGroups = Object.fromEntries(
    activeStages.map((stage) => [stage, items.filter((item) => item.stage === stage)]),
  ) as Record<(typeof activeStages)[number], typeof items>;
  const closedGroups = Object.fromEntries(
    closedStages.map((stage) => [stage, items.filter((item) => item.stage === stage)]),
  ) as Record<(typeof closedStages)[number], typeof items>;

  return (
    <div className="flex flex-col gap-8">
      <SectionCard
        title="Content Workflow Manager"
        description="Ideas, drafts, reviews, approvals, scheduling, publishing, and archives stay visible in a shared workspace with role-based actions."
      >
        {shouldScopeWorkflowToOwnedItems(session.role) ? (
          <div className="mb-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4 text-sm text-[color:var(--muted)]">
            You are seeing the workflow items you own. Review and publishing teams keep the wider queue.
          </div>
        ) : null}
        <div className="grid gap-6 text-sm text-[color:var(--muted)] md:grid-cols-3 mt-4">
          <div className="rounded-xl bg-white p-4 shadow-sm border border-[color:var(--border)]">
            <span className="block font-semibold text-[color:var(--foreground)] mb-1">Creators</span>
            Move ideas into draft mode and request review.
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-[color:var(--border)]">
            <span className="block font-semibold text-[color:var(--foreground)] mb-1">Reviewers</span>
            Protect tone, compliance, and product accuracy.
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-[color:var(--border)]">
            <span className="block font-semibold text-[color:var(--foreground)] mb-1">Managers</span>
             Publish immediately or schedule when the calendar is ready.
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Idea Pool"
        description="Saved campaign ideas can be refined or converted into full drafts when the team is ready."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-4">
          {ideas.length ? (
            ideas.map((item) => (
              <Link
                key={item.id}
                href={`/content/${item.id}`}
                className="nested-panel card-hover group p-5"
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="muted">Idea</Badge>
                  <Badge variant="cyan-subtle">{humanizeEnum(item.channel)}</Badge>
                </div>
                <h3 className="font-display text-base font-semibold text-[color:var(--foreground)] group-hover:text-brand transition-colors">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)] line-clamp-2">
                  {item.draft}
                </p>
                <div className="mt-4 pt-4 border-t border-[color:var(--border)] flex flex-col gap-1 text-xs text-[color:var(--muted)]">
                  <div className="flex justify-between">
                    <span>Owner:</span>
                    <span className="font-medium text-[color:var(--foreground)]">{item.owner.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated:</span>
                    <span>{formatRelativeDate(item.updatedAt)}</span>
                  </div>
                  {item.product && (
                    <div className="flex justify-between">
                      <span>Product:</span>
                      <span className="truncate max-w-[120px]" title={item.product.name}>{item.product.name}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <div className="empty-state md:col-span-2 xl:col-span-3">
              No saved ideas yet. Generate a few in the Content Lab to start the pipeline.
            </div>
          )}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-3 items-start">
        {activeStages.map((stage) => (
          <SectionCard
            key={stage}
            title={humanizeEnum(stage)}
            description={`${activeGroups[stage].length} item${activeGroups[stage].length === 1 ? "" : "s"} currently in this stage.`}
          >
            <div className="flex flex-col gap-4 mt-4">
              {activeGroups[stage].length ? (
                activeGroups[stage].map((item) => (
                  <div
                    key={item.id}
                    className="nested-panel p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant={stageVariant(item.stage)}>
                        {humanizeEnum(item.stage)}
                      </Badge>
                      <Badge variant="cyan-subtle">
                        {humanizeEnum(item.contentType)}
                      </Badge>
                    </div>
                    <Link
                      href={`/content/${item.id}`}
                      className="block font-display text-base font-semibold text-[color:var(--foreground)] hover:text-brand transition-colors"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)] line-clamp-2">
                      {item.brief}
                    </p>

                    <div className="mt-4 pt-4 border-t border-[color:var(--border)] flex flex-col gap-1.5 text-xs text-[color:var(--muted)]">
                      <div className="flex justify-between">
                        <span>Owner:</span>
                        <span className="font-medium text-[color:var(--foreground)]">{item.owner.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reviewer:</span>
                        <span className="font-medium text-[color:var(--foreground)]">{item.reviewer?.name ?? "Unassigned"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Updated:</span>
                        <span>{formatRelativeDate(item.updatedAt)}</span>
                      </div>
                      {item.scheduledFor && (
                        <div className="flex justify-between">
                          <span>Scheduled:</span>
                          <span className="font-medium text-[color:var(--foreground)]">{formatDateTime(item.scheduledFor)}</span>
                        </div>
                      )}
                      {item.revisionCount > 0 && (
                        <div className="flex justify-between">
                          <span>Revisions:</span>
                          <span className="text-amber-600 font-medium">{item.revisionCount}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex flex-col gap-3">
                      {(item.stage === WorkflowStage.DRAFT ||
                        item.stage === WorkflowStage.NEEDS_REVISION) &&
                      canGenerateContent(session.role) ? (
                        <form action={submitForReviewAction} className="flex flex-col gap-3 bg-[color:var(--surface)] p-4 rounded-xl border border-[color:var(--border)]">
                          <input type="hidden" name="id" value={item.id} />
                          <div className="flex flex-col gap-2">
                             <select
                              name="reviewerId"
                              defaultValue={item.reviewerId ?? reviewers[0]?.id ?? ""}
                              className="text-sm py-2 px-3 bg-white"
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
                              placeholder="Review focus or context"
                              className="text-sm py-2 px-3 bg-white"
                            />
                          </div>
                          <SubmitButton className="w-full text-xs" pendingLabel="Sending...">
                            Send to review
                          </SubmitButton>
                        </form>
                      ) : null}

                      {item.stage === WorkflowStage.IN_REVIEW &&
                      canReviewContent(session.role) ? (
                        <div className="flex flex-col gap-3 bg-[color:var(--surface)] p-4 rounded-xl border border-[color:var(--border)]">
                          <form action={approveContentAction} className="flex flex-col gap-2">
                            <input type="hidden" name="id" value={item.id} />
                            <input
                              name="approvalNotes"
                              placeholder="Approval notes (optional)"
                              className="text-sm py-2 px-3 bg-white"
                            />
                            <SubmitButton variant="primary" className="w-full text-xs" pendingLabel="Approving...">
                              Approve Draft
                            </SubmitButton>
                          </form>

                          <div className="relative py-2 flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[color:var(--border-strong)]"></div></div>
                            <div className="relative bg-[color:var(--surface)] px-2 text-[10px] uppercase font-bold tracking-widest text-[color:var(--muted)]">Or</div>
                          </div>

                          <form action={sendBackToDraftAction} className="flex flex-col gap-2">
                            <input type="hidden" name="id" value={item.id} />
                            <input
                              name="revisionNotes"
                              placeholder="What needs to change?"
                              required
                              className="text-sm py-2 px-3 bg-white"
                            />
                            <SubmitButton
                              variant="secondary"
                              className="w-full text-xs hover:border-amber-400 hover:text-amber-700"
                              pendingLabel="Returning..."
                            >
                              Request Revision
                            </SubmitButton>
                          </form>
                        </div>
                      ) : null}

                      {item.stage === WorkflowStage.APPROVED &&
                      canPublishContent(session.role) ? (
                        <form action={publishContentAction} className="bg-[color:var(--surface)] p-4 rounded-xl border border-[color:var(--border)]">
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="channel" value={item.channel} />
                          <SubmitButton className="w-full text-xs" pendingLabel="Publishing...">
                            Publish Immediately
                          </SubmitButton>
                        </form>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  Nothing is currently in this stage.
                </div>
              )}
            </div>
          </SectionCard>
        ))}
      </div>

      <section className="grid gap-6 xl:grid-cols-2">
        {closedStages.map((stage) => (
          <SectionCard
            key={stage}
            title={humanizeEnum(stage)}
            description={`${closedGroups[stage].length} item${closedGroups[stage].length === 1 ? "" : "s"} in the closed loop.`}
          >
            <div className="flex flex-col gap-4 mt-4">
              {closedGroups[stage].length ? (
                closedGroups[stage].map((item) => (
                  <Link
                    key={item.id}
                    href={`/content/${item.id}`}
                    className="nested-panel card-hover group p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant={stageVariant(item.stage)}>
                        {humanizeEnum(item.stage)}
                      </Badge>
                      <Badge variant="cyan-subtle">
                        {humanizeEnum(item.channel)}
                      </Badge>
                    </div>
                    <h3 className="font-display text-base font-semibold text-[color:var(--foreground)] group-hover:text-brand transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)] line-clamp-2">
                      {item.brief}
                    </p>
                    <div className="mt-4 pt-4 border-t border-[color:var(--border)] flex items-center justify-between text-xs text-[color:var(--muted)]">
                      <span>Owner: <span className="font-medium text-[color:var(--foreground)]">{item.owner.name}</span></span>
                      <span>Last updated {formatRelativeDate(item.updatedAt)}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="empty-state">
                  Nothing has reached this stage yet.
                </div>
              )}
            </div>
          </SectionCard>
        ))}
      </section>
    </div>
  );
}
