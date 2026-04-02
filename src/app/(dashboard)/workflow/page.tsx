import Link from "next/link";
import { WorkflowStage } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  canGenerateContent,
  canPublishContent,
  canReviewContent,
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
  const [items, reviewers] = await Promise.all([
    prisma.contentItem.findMany({
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
    <div className="grid gap-6">
      <SectionCard
        title="Content Workflow Manager"
        description="Ideas, drafts, reviews, approvals, scheduling, publishing, and archives stay visible in a shared workspace with role-based actions."
      >
        <div className="grid gap-3 text-sm text-[color:var(--muted)] md:grid-cols-3">
          <p>Creators move ideas into draft mode and request review.</p>
          <p>Reviewers protect tone, compliance, and product accuracy.</p>
          <p>Managers publish immediately or schedule when the calendar is ready.</p>
        </div>
      </SectionCard>

      <SectionCard
        title="Idea Pool"
        description="Saved campaign ideas can be refined or converted into full drafts when the team is ready."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ideas.length ? (
            ideas.map((item) => (
              <Link
                key={item.id}
                href={`/content/${item.id}`}
                className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4 transition hover:border-[color:var(--brand)]"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="muted">Idea</Badge>
                  <Badge>{humanizeEnum(item.channel)}</Badge>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {item.draft}
                </p>
                <div className="mt-4 grid gap-1 text-sm text-[color:var(--muted)]">
                  <span>Owner: {item.owner.name}</span>
                  <span>Updated {formatRelativeDate(item.updatedAt)}</span>
                  {item.product ? <span>Product: {item.product.name}</span> : null}
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-[color:var(--border)] p-6 text-sm text-[color:var(--muted)]">
              No saved ideas yet. Generate a few in the Content Lab to start the pipeline.
            </div>
          )}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-3">
        {activeStages.map((stage) => (
          <SectionCard
            key={stage}
            title={humanizeEnum(stage)}
            description={`${activeGroups[stage].length} item${activeGroups[stage].length === 1 ? "" : "s"} currently in this stage.`}
          >
            <div className="grid gap-4">
              {activeGroups[stage].length ? (
                activeGroups[stage].map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant={stageVariant(item.stage)}>
                        {humanizeEnum(item.stage)}
                      </Badge>
                      <Badge variant="muted">
                        {humanizeEnum(item.contentType)}
                      </Badge>
                    </div>
                    <Link
                      href={`/content/${item.id}`}
                      className="mt-3 block font-display text-lg font-semibold hover:text-[color:var(--brand)]"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      {item.brief}
                    </p>
                    <div className="mt-4 grid gap-1 text-sm text-[color:var(--muted)]">
                      <span>Owner: {item.owner.name}</span>
                      <span>Reviewer: {item.reviewer?.name ?? "Unassigned"}</span>
                      <span>Updated {formatRelativeDate(item.updatedAt)}</span>
                      {item.scheduledFor ? (
                        <span>Scheduled: {formatDateTime(item.scheduledFor)}</span>
                      ) : null}
                      {item.revisionCount ? (
                        <span>Revision cycles: {item.revisionCount}</span>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-3">
                      {(item.stage === WorkflowStage.DRAFT ||
                        item.stage === WorkflowStage.NEEDS_REVISION) &&
                      canGenerateContent(session.role) ? (
                        <form action={submitForReviewAction} className="grid gap-2">
                          <input type="hidden" name="id" value={item.id} />
                          <select
                            name="reviewerId"
                            defaultValue={item.reviewerId ?? reviewers[0]?.id ?? ""}
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
                          />
                          <SubmitButton pendingLabel="Sending...">
                            Send to review
                          </SubmitButton>
                        </form>
                      ) : null}

                      {item.stage === WorkflowStage.IN_REVIEW &&
                      canReviewContent(session.role) ? (
                        <>
                          <form action={approveContentAction} className="grid gap-2">
                            <input type="hidden" name="id" value={item.id} />
                            <input
                              name="approvalNotes"
                              placeholder="Approved and ready to publish"
                            />
                            <SubmitButton pendingLabel="Approving...">
                              Approve
                            </SubmitButton>
                          </form>
                          <form action={sendBackToDraftAction} className="grid gap-2">
                            <input type="hidden" name="id" value={item.id} />
                            <input
                              name="revisionNotes"
                              placeholder="What should change?"
                            />
                            <SubmitButton
                              pendingLabel="Returning..."
                              className="bg-[color:var(--accent)] text-[color:#1f1a12] hover:bg-[color:#bd7d26]"
                            >
                              Request revision
                            </SubmitButton>
                          </form>
                        </>
                      ) : null}

                      {item.stage === WorkflowStage.APPROVED &&
                      canPublishContent(session.role) ? (
                        <form action={publishContentAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="channel" value={item.channel} />
                          <SubmitButton pendingLabel="Publishing...">
                            Publish now
                          </SubmitButton>
                        </form>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[color:var(--muted)]">
                  Nothing is currently in this stage.
                </p>
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
            <div className="grid gap-4">
              {closedGroups[stage].length ? (
                closedGroups[stage].map((item) => (
                  <Link
                    key={item.id}
                    href={`/content/${item.id}`}
                    className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4 transition hover:border-[color:var(--brand)]"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant={stageVariant(item.stage)}>
                        {humanizeEnum(item.stage)}
                      </Badge>
                      <Badge variant="muted">
                        {humanizeEnum(item.channel)}
                      </Badge>
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      {item.brief}
                    </p>
                    <div className="mt-4 grid gap-1 text-sm text-[color:var(--muted)]">
                      <span>Owner: {item.owner.name}</span>
                      <span>Last updated {formatRelativeDate(item.updatedAt)}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-[color:var(--muted)]">
                  Nothing has reached this stage yet.
                </p>
              )}
            </div>
          </SectionCard>
        ))}
      </section>
    </div>
  );
}
