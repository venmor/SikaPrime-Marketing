import Link from "next/link";
import { Prisma, WorkflowStage } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  PenSquare,
  Rocket,
  Sparkles,
} from "lucide-react";

import { OpenAssistantButton } from "@/components/assistant/open-assistant-button";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  canPublishContent,
  canViewWorkflow,
  shouldScopeWorkflowToOwnedItems,
} from "@/lib/auth/access";
import { USER_ROLES } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatDateTime, formatRelativeDate, humanizeEnum } from "@/lib/utils";
import {
  approveContentAction,
  scheduleContentAction,
  sendBackToDraftAction,
  submitForReviewAction,
} from "@/server/actions/content";
import { publishContentAction } from "@/server/actions/publishing";

type WorkflowItem = Prisma.ContentItemGetPayload<{
  include: {
    owner: {
      select: {
        name: true;
      };
    };
    reviewer: {
      select: {
        name: true;
      };
    };
    product: {
      select: {
        name: true;
      };
    };
    reviews: {
      select: {
        notes: true;
        status: true;
        createdAt: true;
      };
    };
    publications: {
      select: {
        status: true;
        errorMessage: true;
        scheduledFor: true;
        publishedAt: true;
      };
    };
  };
}>;

const metricCardClass =
  "rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 shadow-sm";
const actionCardClass = "nested-panel p-5";
const secondaryLinkClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-strong)] px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)] transition-[transform,box-shadow,background-color,border-color] hover:-translate-y-0.5 hover:border-[color:var(--muted)] hover:shadow-md";

function compareByNewestUpdate(a: { updatedAt: Date }, b: { updatedAt: Date }) {
  return b.updatedAt.getTime() - a.updatedAt.getTime();
}

function compareByOldestUpdate(a: { updatedAt: Date }, b: { updatedAt: Date }) {
  return a.updatedAt.getTime() - b.updatedAt.getTime();
}

function compareBySchedule(a: { scheduledFor: Date | null }, b: { scheduledFor: Date | null }) {
  const left = a.scheduledFor?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const right = b.scheduledFor?.getTime() ?? Number.MAX_SAFE_INTEGER;

  return left - right;
}

function compareByPublishedAt(
  a: { publishedAt: Date | null; updatedAt: Date },
  b: { publishedAt: Date | null; updatedAt: Date },
) {
  const left = a.publishedAt?.getTime() ?? a.updatedAt.getTime();
  const right = b.publishedAt?.getTime() ?? b.updatedAt.getTime();

  return right - left;
}

function toDateTimeLocalValue(date?: Date | string | null) {
  const value = date ? new Date(date) : new Date();

  if (!date) {
    value.setHours(value.getHours() + 2, 0, 0, 0);
  }

  const offset = value.getTimezoneOffset();

  return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function latestReview(item: Pick<WorkflowItem, "reviews">) {
  return item.reviews[0] ?? null;
}

function latestPublication(item: Pick<WorkflowItem, "publications">) {
  return item.publications[0] ?? null;
}

export default async function WorkflowPage() {
  const session = await requireSession();

  if (!canViewWorkflow(session.role)) {
    redirect("/dashboard");
  }

  const creatorScoped = shouldScopeWorkflowToOwnedItems(session.role);
  const canPublish = canPublishContent(session.role);

  const items = await prisma.contentItem.findMany({
    where: creatorScoped ? { ownerId: session.userId } : undefined,
    include: {
      owner: {
        select: {
          name: true,
        },
      },
      reviewer: {
        select: {
          name: true,
        },
      },
      product: {
        select: {
          name: true,
        },
      },
      reviews: {
        select: {
          notes: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      publications: {
        select: {
          status: true,
          errorMessage: true,
          scheduledFor: true,
          publishedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  const ideas = items
    .filter((item) => item.stage === WorkflowStage.IDEA)
    .sort(compareByNewestUpdate);
  const draftQueue = items
    .filter(
      (item) =>
        item.stage === WorkflowStage.DRAFT ||
        item.stage === WorkflowStage.NEEDS_REVISION,
    )
    .sort(compareByNewestUpdate);
  const reviewCandidates = items
    .filter((item) => item.stage === WorkflowStage.IN_REVIEW)
    .sort(compareByOldestUpdate);
  const reviewQueue =
    session.role === USER_ROLES.REVIEWER
      ? reviewCandidates.filter(
          (item) => item.reviewerId === session.userId || !item.reviewerId,
        )
      : reviewCandidates;
  const approvedQueue = items
    .filter((item) => item.stage === WorkflowStage.APPROVED)
    .sort(compareByNewestUpdate);
  const scheduledQueue = items
    .filter((item) => item.stage === WorkflowStage.SCHEDULED)
    .sort(compareBySchedule);
  const publishedQueue = items
    .filter((item) => item.stage === WorkflowStage.PUBLISHED)
    .sort(compareByPublishedAt)
    .slice(0, 4);

  if (session.role === USER_ROLES.CREATOR) {
    return (
      <div className="grid gap-6">
        <SectionCard
          title="My workflow lane"
          description="Finish drafts, hand off clean review notes, and keep light-pressure ideas close by."
          action={
            <OpenAssistantButton
              label="Create with AI"
              prompt="Create the next best post for my usual channel and product."
              autoSend
            />
          }
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <div className="rounded-[30px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-6 shadow-sm">
              <Badge variant="brand-subtle">Create to review</Badge>
              <h3 className="mt-4 font-display text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
                Keep the queue moving without losing the thread.
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
                You have {draftQueue.length} active draft
                {draftQueue.length === 1 ? "" : "s"} and {reviewQueue.length} item
                {reviewQueue.length === 1 ? "" : "s"} already waiting on review.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge variant="muted">{ideas.length} ideas saved</Badge>
                <Badge variant="warning">
                  {draftQueue.filter((item) => item.stage === WorkflowStage.NEEDS_REVISION).length}{" "}
                  need revision
                </Badge>
                <Badge variant="cyan-subtle">{reviewQueue.length} with reviewers</Badge>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                {
                  label: "Ideas",
                  value: ideas.length,
                  hint: "Low-pressure starts for your next batch",
                },
                {
                  label: "Drafts",
                  value: draftQueue.length,
                  hint: "Ready for polish or a quick revision pass",
                },
                {
                  label: "Submitted",
                  value: reviewQueue.length,
                  hint: "Already with a reviewer or waiting to be picked up",
                },
              ].map((item) => (
                <div key={item.label} className={metricCardClass}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)]">
                    {item.label}
                  </p>
                  <p className="mt-3 font-display text-3xl font-semibold text-[color:var(--foreground)]">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
          <SectionCard
            title="Drafts needing your pass"
            description="Revision notes stay attached to the draft so you can fix the right thing fast."
          >
            <div className="grid gap-4">
              {draftQueue.length ? (
                draftQueue.map((item) => {
                  const lastReview = latestReview(item);

                  return (
                    <div key={item.id} className={actionCardClass}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            item.stage === WorkflowStage.NEEDS_REVISION
                              ? "warning"
                              : "muted"
                          }
                        >
                          {humanizeEnum(item.stage)}
                        </Badge>
                        <Badge variant="cyan-subtle">{humanizeEnum(item.channel)}</Badge>
                        {item.reviewer ? (
                          <Badge variant="brand-subtle">{item.reviewer.name}</Badge>
                        ) : null}
                      </div>
                      <Link
                        href={`/content/${item.id}`}
                        className="mt-3 block font-display text-lg font-semibold text-[color:var(--foreground)] transition-colors hover:text-brand"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                        {item.brief}
                      </p>
                      {item.stage === WorkflowStage.NEEDS_REVISION && lastReview ? (
                        <div className="mt-4 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)]">
                            Latest review note
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[color:var(--foreground)]">
                            {lastReview.notes}
                          </p>
                          <p className="mt-2 text-xs text-[color:var(--muted)]">
                            {humanizeEnum(lastReview.status)} {formatRelativeDate(lastReview.createdAt)}
                          </p>
                        </div>
                      ) : null}
                      <div className="mt-4 grid gap-1 text-sm text-[color:var(--muted)]">
                        <span>Updated {formatRelativeDate(item.updatedAt)}</span>
                        <span>{item.product?.name ?? "General content"}</span>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link href={`/content/${item.id}`} className={secondaryLinkClass}>
                          Edit draft
                        </Link>
                        <form action={submitForReviewAction}>
                          <input type="hidden" name="id" value={item.id} />
                          {item.reviewerId ? (
                            <input
                              type="hidden"
                              name="reviewerId"
                              value={item.reviewerId}
                            />
                          ) : null}
                          <input
                            type="hidden"
                            name="reviewNotes"
                            value="Ready for review from the creator workflow lane."
                          />
                          <SubmitButton pendingLabel="Submitting...">
                            Send to review
                          </SubmitButton>
                        </form>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  No drafts need attention. Open the content lab or generate the next piece with AI.
                </div>
              )}
            </div>
          </SectionCard>

          <div className="grid gap-6">
            <SectionCard
              title="Waiting on review"
              description="Submitted work stays visible until a reviewer clears it."
            >
              <div className="grid gap-4">
                {reviewQueue.length ? (
                  reviewQueue.map((item) => (
                    <div key={item.id} className={actionCardClass}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="warning">In review</Badge>
                        {item.reviewer ? (
                          <Badge variant="brand-subtle">{item.reviewer.name}</Badge>
                        ) : (
                          <Badge variant="muted">Unassigned reviewer</Badge>
                        )}
                      </div>
                      <Link
                        href={`/content/${item.id}`}
                        className="mt-3 block font-display text-lg font-semibold text-[color:var(--foreground)] transition-colors hover:text-brand"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                        {item.brief}
                      </p>
                      <p className="mt-4 text-sm text-[color:var(--muted)]">
                        Updated {formatRelativeDate(item.updatedAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    Nothing is waiting with a reviewer right now.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Idea shelf"
              description="Save promising directions here until they deserve a full draft."
            >
              <div className="grid gap-4">
                {ideas.length ? (
                  ideas.map((item) => (
                    <Link
                      key={item.id}
                      href={`/content/${item.id}`}
                      className={`${actionCardClass} transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:shadow-md`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="muted">Idea</Badge>
                        <Badge variant="cyan-subtle">{humanizeEnum(item.channel)}</Badge>
                      </div>
                      <p className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                        {item.brief}
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="empty-state">
                    No ideas are parked right now. Generate a fresh batch when you need more starting points.
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </section>
      </div>
    );
  }

  if (session.role === USER_ROLES.REVIEWER) {
    return (
      <div className="grid gap-6">
        <SectionCard
          title="Review lane"
          description="Assigned decisions and ready-to-ship work now sit in one operating surface."
          action={
            <Link href="/publishing" className={secondaryLinkClass}>
              Open publishing board
            </Link>
          }
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <div className="rounded-[30px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-6 shadow-sm">
              <Badge variant="warning">Reviewer focus</Badge>
              <h3 className="mt-4 font-display text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
                Clear the oldest review first, then move approved work out.
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
                Your inbox shows items assigned to you plus unassigned drafts, so nothing stalls in
                the handoff.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge variant="warning">{reviewQueue.length} waiting for your call</Badge>
                <Badge variant="success">{approvedQueue.length} approved and ready</Badge>
                <Badge variant="cyan-subtle">{scheduledQueue.length} already scheduled</Badge>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                {
                  label: "Waiting now",
                  value: reviewQueue.length,
                  hint: "Assigned or still needing pickup",
                },
                {
                  label: "Approved",
                  value: approvedQueue.length,
                  hint: "Ready for publish or schedule",
                },
                {
                  label: "Scheduled",
                  value: scheduledQueue.length,
                  hint: "Already placed on the calendar",
                },
              ].map((item) => (
                <div key={item.label} className={metricCardClass}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)]">
                    {item.label}
                  </p>
                  <p className="mt-3 font-display text-3xl font-semibold text-[color:var(--foreground)]">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
          <SectionCard
            title="Waiting for your decision"
            description="Oldest requests first. Unassigned items stay visible until someone claims them."
          >
            <div className="grid gap-4">
              {reviewQueue.length ? (
                reviewQueue.map((item) => (
                  <div key={item.id} className={actionCardClass}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="warning">In review</Badge>
                      <Badge variant="cyan-subtle">{humanizeEnum(item.channel)}</Badge>
                      <Badge variant="muted">{formatRelativeDate(item.updatedAt)}</Badge>
                    </div>
                    <h3 className="mt-4 font-display text-xl font-semibold text-[color:var(--foreground)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      {item.brief}
                    </p>
                    <div className="mt-4 grid gap-1 text-sm text-[color:var(--muted)]">
                      <span>Owner: {item.owner.name}</span>
                      <span>{item.product?.name ?? "General content"}</span>
                    </div>
                    <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                      <form action={sendBackToDraftAction} className="grid gap-3">
                        <input type="hidden" name="id" value={item.id} />
                        <label>
                          Revision note
                          <textarea
                            name="revisionNotes"
                            placeholder="Say exactly what should change."
                            required
                          />
                        </label>
                        <SubmitButton pendingLabel="Sending back..." variant="secondary">
                          Request changes
                        </SubmitButton>
                      </form>
                      <div className="grid gap-3 self-end">
                        <form action={approveContentAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <input
                            type="hidden"
                            name="approvalNotes"
                            value="Approved from reviewer workflow lane."
                          />
                          <SubmitButton pendingLabel="Approving..." variant="success">
                            Approve
                          </SubmitButton>
                        </form>
                        <Link href={`/content/${item.id}`} className={secondaryLinkClass}>
                          Open detail
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  Nothing is waiting for your review right now.
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Approved and ready to move"
            description="Schedule or publish directly from the lane instead of switching pages."
          >
            <div className="grid gap-4">
              {approvedQueue.length ? (
                approvedQueue.map((item) => (
                  <div key={item.id} className={actionCardClass}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="success">Approved</Badge>
                      <Badge variant="cyan-subtle">{humanizeEnum(item.channel)}</Badge>
                      <Badge variant="muted">{humanizeEnum(item.contentType)}</Badge>
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 line-clamp-4 text-sm leading-6 text-[color:var(--muted)]">
                      {item.finalCopy ?? item.draft}
                    </p>
                    <div className="mt-4 grid gap-1 text-sm text-[color:var(--muted)]">
                      <span>Owner: {item.owner.name}</span>
                      <span>Product: {item.product?.name ?? "General content"}</span>
                    </div>
                    <div className="mt-5 grid gap-4">
                      <form
                        action={publishContentAction}
                        className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4"
                      >
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="channel" value={item.channel} />
                        <div className="grid gap-3">
                          <label>
                            Publish destination
                            <input
                              name="distributionTarget"
                              defaultValue={item.distributionTarget ?? ""}
                              placeholder={
                                item.channel === "WHATSAPP"
                                  ? "2609XXXXXXXX"
                                  : "Optional audience or destination label"
                              }
                            />
                          </label>
                          <SubmitButton pendingLabel="Publishing...">
                            Publish now
                          </SubmitButton>
                        </div>
                      </form>
                      <form
                        action={scheduleContentAction}
                        className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4"
                      >
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="channel" value={item.channel} />
                        <div className="grid gap-3">
                          <label>
                            Schedule time
                            <input
                              name="scheduledFor"
                              type="datetime-local"
                              defaultValue={toDateTimeLocalValue(item.scheduledFor)}
                              required
                            />
                          </label>
                          <SubmitButton pendingLabel="Scheduling..." variant="secondary">
                            Schedule instead
                          </SubmitButton>
                        </div>
                      </form>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  Nothing is approved yet. The next item you approve will appear here immediately.
                </div>
              )}
            </div>
          </SectionCard>
        </section>

        <SectionCard
          title="Scheduled next"
          description="Keep an eye on what is already placed on the calendar."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {scheduledQueue.length ? (
              scheduledQueue.map((item) => (
                <div key={item.id} className={actionCardClass}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warning">Scheduled</Badge>
                    <Badge variant="cyan-subtle">{humanizeEnum(item.channel)}</Badge>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {item.scheduledFor
                      ? `Scheduled for ${formatDateTime(item.scheduledFor)}`
                      : "No time selected yet"}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[color:var(--muted)]">
                    {item.finalCopy ?? item.draft}
                  </p>
                </div>
              ))
            ) : (
              <div className="empty-state md:col-span-2">
                Nothing is waiting in the scheduled queue right now.
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <SectionCard
        title="Workflow cockpit"
        description="See creation, review, and publishing bottlenecks in one pass."
        action={
          <div className="flex flex-wrap gap-3">
            <OpenAssistantButton
              label="Create with AI"
              prompt="Create the next best post for the team using our best product and the current top trend."
              autoSend
            />
            {canPublish ? (
              <Link href="/publishing" className={secondaryLinkClass}>
                Open publishing board
              </Link>
            ) : null}
          </div>
        }
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
          <div className="rounded-[30px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-6 shadow-sm">
            <Badge variant="brand-subtle">Team workflow</Badge>
            <h3 className="mt-4 font-display text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
              Move work from draft to publish without hopping between disconnected queues.
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
              Review items are sorted oldest first, approved content can be scheduled inline, and
              the next publish window stays visible beside the queue.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="muted">{ideas.length} ideas waiting</Badge>
              <Badge variant="warning">{draftQueue.length} drafts in progress</Badge>
              <Badge variant="cyan-subtle">{reviewQueue.length} in review</Badge>
              <Badge variant="success">{approvedQueue.length} ready to ship</Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Ideas", value: ideas.length, icon: Sparkles },
              { label: "Drafts", value: draftQueue.length, icon: PenSquare },
              { label: "Review", value: reviewQueue.length, icon: Clock3 },
              { label: "Approved", value: approvedQueue.length, icon: CheckCircle2 },
              { label: "Scheduled", value: scheduledQueue.length, icon: CalendarClock },
              { label: "Published", value: publishedQueue.length, icon: Rocket },
            ].map((item) => (
              <div key={item.label} className={metricCardClass}>
                <item.icon className="h-5 w-5 text-brand" />
                <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)]">
                  {item.label}
                </p>
                <p className="mt-2 font-display text-3xl font-semibold text-[color:var(--foreground)]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Draft lane"
          description="Ideas, drafts, and revision loops still waiting on creators."
        >
          <div className="grid gap-4">
            {draftQueue.length ? (
              draftQueue.slice(0, 4).map((item) => {
                const lastReview = latestReview(item);

                return (
                  <Link
                    key={item.id}
                    href={`/content/${item.id}`}
                    className={`${actionCardClass} transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:shadow-md`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          item.stage === WorkflowStage.NEEDS_REVISION ? "warning" : "muted"
                        }
                      >
                        {humanizeEnum(item.stage)}
                      </Badge>
                      <Badge variant="cyan-subtle">{humanizeEnum(item.channel)}</Badge>
                    </div>
                    <p className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      {item.brief}
                    </p>
                    <div className="mt-4 grid gap-1 text-sm text-[color:var(--muted)]">
                      <span>Owner: {item.owner.name}</span>
                      <span>Updated {formatRelativeDate(item.updatedAt)}</span>
                      {lastReview ? <span>Last note: {lastReview.notes}</span> : null}
                    </div>
                  </Link>
                );
              })
            ) : ideas.length ? (
              ideas.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  href={`/content/${item.id}`}
                  className={`${actionCardClass} transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:shadow-md`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="muted">Idea</Badge>
                    <Badge variant="cyan-subtle">{humanizeEnum(item.channel)}</Badge>
                  </div>
                  <p className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {item.brief}
                  </p>
                </Link>
              ))
            ) : (
              <div className="empty-state">The draft lane is clear right now.</div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Review lane"
          description="Oldest submissions first so approval bottlenecks are obvious."
        >
          <div className="grid gap-4">
            {reviewQueue.length ? (
              reviewQueue.slice(0, 4).map((item) => (
                <div key={item.id} className={actionCardClass}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warning">In review</Badge>
                    <Badge variant="muted">{formatRelativeDate(item.updatedAt)}</Badge>
                  </div>
                  <Link
                    href={`/content/${item.id}`}
                    className="mt-3 block font-display text-lg font-semibold text-[color:var(--foreground)] transition-colors hover:text-brand"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">{item.owner.name}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <form action={approveContentAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input
                        type="hidden"
                        name="approvalNotes"
                        value="Approved from workflow cockpit."
                      />
                      <SubmitButton pendingLabel="Approving..." variant="success">
                        Approve
                      </SubmitButton>
                    </form>
                    <Link href={`/content/${item.id}`} className={secondaryLinkClass}>
                      Open detail
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">The review queue is clear.</div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Ready lane"
          description="Approved content can be scheduled or published without another handoff."
        >
          <div className="grid gap-4">
            {approvedQueue.length ? (
              approvedQueue.slice(0, 4).map((item) => (
                <div key={item.id} className={actionCardClass}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="success">Approved</Badge>
                    <Badge variant="cyan-subtle">{humanizeEnum(item.channel)}</Badge>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[color:var(--muted)]">
                    {item.finalCopy ?? item.draft}
                  </p>
                  {canPublish ? (
                    <div className="mt-5 grid gap-4">
                      <form
                        action={scheduleContentAction}
                        className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4"
                      >
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="channel" value={item.channel} />
                        <div className="grid gap-3">
                          <label>
                            Schedule time
                            <input
                              name="scheduledFor"
                              type="datetime-local"
                              defaultValue={toDateTimeLocalValue(item.scheduledFor)}
                              required
                            />
                          </label>
                          <SubmitButton pendingLabel="Scheduling..." variant="secondary">
                            Schedule
                          </SubmitButton>
                        </div>
                      </form>
                      <form action={publishContentAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="channel" value={item.channel} />
                        <input
                          type="hidden"
                          name="distributionTarget"
                          value={item.distributionTarget ?? ""}
                        />
                        <SubmitButton pendingLabel="Publishing...">Publish now</SubmitButton>
                      </form>
                    </div>
                  ) : (
                    <div className="mt-5">
                      <Link href={`/content/${item.id}`} className={secondaryLinkClass}>
                        Open detail
                      </Link>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state">Nothing is approved yet.</div>
            )}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
        <SectionCard
          title="Scheduled next"
          description="Work already placed on the calendar."
        >
          <div className="grid gap-4">
            {scheduledQueue.length ? (
              scheduledQueue.slice(0, 4).map((item) => (
                <div key={item.id} className={actionCardClass}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warning">Scheduled</Badge>
                    <Badge variant="cyan-subtle">{humanizeEnum(item.channel)}</Badge>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {item.scheduledFor
                      ? `Scheduled for ${formatDateTime(item.scheduledFor)}`
                      : "No time selected yet"}
                  </p>
                </div>
              ))
            ) : (
              <div className="empty-state">No work is currently scheduled.</div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Recently completed"
          description="Recent outcomes stay visible so the queue feels end to end."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {publishedQueue.length ? (
              publishedQueue.map((item) => {
                const publication = latestPublication(item);

                return (
                  <div key={item.id} className={actionCardClass}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="success">Published</Badge>
                      <Badge variant="cyan-subtle">{humanizeEnum(item.channel)}</Badge>
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">
                      {item.publishedAt
                        ? `Published ${formatDateTime(item.publishedAt)}`
                        : publication?.publishedAt
                          ? `Published ${formatDateTime(publication.publishedAt)}`
                          : `Updated ${formatRelativeDate(item.updatedAt)}`}
                    </p>
                    {publication?.errorMessage ? (
                      <p className="mt-2 text-sm text-[color:var(--warning-strong)]">
                        {publication.errorMessage}
                      </p>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="empty-state md:col-span-2">
                Published items will start appearing here once the latest batch ships.
              </div>
            )}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
