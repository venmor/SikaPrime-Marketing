import Link from "next/link";
import {
  ContentTone,
  ContentType,
  PublishingChannel,
  WorkflowStage,
} from "@prisma/client";
import { format } from "date-fns";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { getEntityActivity } from "@/lib/audit/service";
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
  archiveContentAction,
  convertIdeaToDraftAction,
  scheduleContentAction,
  sendBackToDraftAction,
  submitForReviewAction,
  updateContentAction,
} from "@/server/actions/content";

function stageVariant(stage: WorkflowStage) {
  if (
    stage === WorkflowStage.APPROVED ||
    stage === WorkflowStage.PUBLISHED
  ) {
    return "success" as const;
  }

  if (
    stage === WorkflowStage.IN_REVIEW ||
    stage === WorkflowStage.NEEDS_REVISION ||
    stage === WorkflowStage.SCHEDULED
  ) {
    return "warning" as const;
  }

  return "muted" as const;
}

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const content = await prisma.contentItem.findUnique({
    where: { id },
    include: {
      owner: true,
      reviewer: true,
      trend: true,
      product: true,
      audienceSegment: true,
      reviews: {
        include: {
          reviewer: true,
        },
        orderBy: { createdAt: "desc" },
      },
      publications: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!content) {
    notFound();
  }

  const [reviewers, activity] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "STRATEGIST", "REVIEWER"],
        },
      },
      orderBy: { name: "asc" },
    }),
    getEntityActivity("content_item", content.id),
  ]);

  const canEdit = canGenerateContent(session.role);
  const canReview = canReviewContent(session.role);
  const canPublish = canPublishContent(session.role);
  const isIdea = content.stage === WorkflowStage.IDEA;
  const scheduledValue = content.scheduledFor
    ? format(content.scheduledFor, "yyyy-MM-dd'T'HH:mm")
    : "";

  if (!canEdit && !canReview && !canPublish) {
    redirect("/dashboard");
  }

  return (
    <div className="grid gap-6">
      <SectionCard
        title={content.title}
        description={content.brief}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={stageVariant(content.stage)}>
              {humanizeEnum(content.stage)}
            </Badge>
            {content.trend ? (
              <Badge variant="muted">
                {humanizeEnum(content.trend.lifecycle)}
              </Badge>
            ) : null}
          </div>
        }
      >
        <div className="flex flex-wrap gap-4 text-sm text-[color:var(--muted)]">
          <span>Owner: {content.owner.name}</span>
          <span>Reviewer: {content.reviewer?.name ?? "Unassigned"}</span>
          <span>Channel: {humanizeEnum(content.channel)}</span>
          <span>Type: {humanizeEnum(content.contentType)}</span>
          {content.objective ? <span>Objective: {content.objective}</span> : null}
          {content.campaignLabel ? (
            <span>Campaign: {content.campaignLabel}</span>
          ) : null}
          <span>Revisions: {content.revisionCount}</span>
        </div>
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title={isIdea ? "Idea Workspace" : "Draft Editor"}
          description={
            isIdea
              ? "Refine the idea, then convert it into a platform-specific draft when the concept is ready."
              : "Refine the AI output, tune the CTA, and keep notes visible for review."
          }
        >
          <form action={updateContentAction} className="grid gap-4">
            <input type="hidden" name="id" value={content.id} />
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                Title
                <input name="title" defaultValue={content.title} required />
              </label>
              <label>
                Campaign label
                <input
                  name="campaignLabel"
                  defaultValue={content.campaignLabel ?? ""}
                />
              </label>
            </div>
            <label>
              Objective
              <textarea
                name="objective"
                defaultValue={content.objective ?? ""}
                placeholder="What should this content achieve?"
              />
            </label>
            <label>
              Brief
              <textarea name="brief" defaultValue={content.brief} required />
            </label>
            <label>
              {isIdea ? "Idea outline" : "Draft copy"}
              <textarea name="draft" defaultValue={content.draft} required />
            </label>
            {!isIdea ? (
              <label>
                Final copy
                <textarea
                  name="finalCopy"
                  defaultValue={content.finalCopy ?? ""}
                />
              </label>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                Call to action
                <input
                  name="callToAction"
                  defaultValue={content.callToAction ?? ""}
                />
              </label>
              <label>
                Hashtags
                <input name="hashtags" defaultValue={content.hashtags ?? ""} />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                Asset reference
                <input
                  name="assetReference"
                  defaultValue={content.assetReference ?? ""}
                  placeholder="Design brief, image note, or asset filename"
                />
              </label>
              <label>
                Distribution target
                <input
                  name="distributionTarget"
                  defaultValue={content.distributionTarget ?? ""}
                  placeholder="WhatsApp number, list reference, or audience label"
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                Reviewer
                <select name="reviewerId" defaultValue={content.reviewerId ?? ""}>
                  <option value="">Assign later</option>
                  {reviewers.map((reviewer) => (
                    <option key={reviewer.id} value={reviewer.id}>
                      {reviewer.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Notes
              <textarea name="notes" defaultValue={content.notes ?? ""} />
            </label>
            {canEdit ? (
              <SubmitButton pendingLabel={isIdea ? "Saving idea..." : "Saving draft..."}>
                {isIdea ? "Save idea" : "Save draft"}
              </SubmitButton>
            ) : null}
          </form>
        </SectionCard>

        <div className="grid gap-6">
          <SectionCard
            title="Context"
            description="The structured business data, trend signal, and AI notes behind this item."
          >
            <div className="grid gap-3 text-sm leading-7 text-[color:var(--muted)]">
              <p>Product: {content.product?.name ?? "General company context"}</p>
              <p>
                Audience: {content.audienceSegment?.name ?? "General audience"}
              </p>
              <p>Trend: {content.trend?.title ?? "No specific trend linked"}</p>
              <p>
                Trend lifecycle:{" "}
                {content.trend ? humanizeEnum(content.trend.lifecycle) : "Not linked"}
              </p>
              <p>
                Asset reference: {content.assetReference ?? "No asset direction yet"}
              </p>
              <p>
                Distribution target:{" "}
                {content.distributionTarget ?? "No live destination configured"}
              </p>
              <p className="whitespace-pre-wrap">
                AI summary: {content.aiSummary ?? "No AI notes available"}
              </p>
            </div>
          </SectionCard>

          {isIdea ? (
            <SectionCard
              title="Convert Idea to Draft"
              description="Turn this saved idea into a platform-ready draft without losing the original concept."
            >
              {canEdit ? (
                <form action={convertIdeaToDraftAction} className="grid gap-4">
                  <input type="hidden" name="ideaId" value={content.id} />
                  <div className="grid gap-4 md:grid-cols-3">
                    <label>
                      Draft type
                      <select
                        name="contentType"
                        defaultValue={ContentType.FACEBOOK_POST}
                      >
                        {Object.values(ContentType)
                          .filter((type) => type !== ContentType.CAMPAIGN_IDEA)
                          .map((type) => (
                            <option key={type} value={type}>
                              {humanizeEnum(type)}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      Tone
                      <select name="tone" defaultValue={content.tone}>
                        {Object.values(ContentTone).map((tone) => (
                          <option key={tone} value={tone}>
                            {humanizeEnum(tone)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Channel
                      <select name="channel" defaultValue={content.channel}>
                        {Object.values(PublishingChannel).map((channel) => (
                          <option key={channel} value={channel}>
                            {humanizeEnum(channel)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label>
                    Reviewer
                    <select name="reviewerId" defaultValue={content.reviewerId ?? ""}>
                      <option value="">Assign later</option>
                      {reviewers.map((reviewer) => (
                        <option key={reviewer.id} value={reviewer.id}>
                          {reviewer.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <SubmitButton pendingLabel="Converting idea...">
                    Convert to draft
                  </SubmitButton>
                </form>
              ) : (
                <p className="text-sm text-[color:var(--muted)]">
                  Your current role cannot convert ideas into drafts.
                </p>
              )}
            </SectionCard>
          ) : (
            <SectionCard
              title="Workflow Controls"
              description="Move this item through review, approval, scheduling, publishing, or archive."
            >
              <div className="grid gap-4">
                {canEdit ? (
                  <form action={submitForReviewAction} className="grid gap-3">
                    <input type="hidden" name="id" value={content.id} />
                    <input
                      type="hidden"
                      name="reviewerId"
                      value={content.reviewerId ?? ""}
                    />
                    <label>
                      Review note
                      <input
                        name="reviewNotes"
                        placeholder="What should the reviewer focus on?"
                      />
                    </label>
                    <SubmitButton pendingLabel="Sending to review...">
                      Submit for review
                    </SubmitButton>
                  </form>
                ) : null}

                {canReview ? (
                  <>
                    <form action={approveContentAction} className="grid gap-3">
                      <input type="hidden" name="id" value={content.id} />
                      <label>
                        Approval note
                        <input
                          name="approvalNotes"
                          placeholder="Approved for scheduling and publishing."
                        />
                      </label>
                      <SubmitButton pendingLabel="Approving...">
                        Approve content
                      </SubmitButton>
                    </form>

                    <form action={sendBackToDraftAction} className="grid gap-3">
                      <input type="hidden" name="id" value={content.id} />
                      <label>
                        Revision note
                        <input
                          name="revisionNotes"
                          placeholder="What should change before approval?"
                        />
                      </label>
                      <SubmitButton
                        pendingLabel="Returning for revision..."
                        className="bg-[color:var(--accent)] text-[color:#1f1a12] hover:bg-[color:#bd7d26]"
                      >
                        Send for revision
                      </SubmitButton>
                    </form>
                  </>
                ) : null}

                {canPublish ? (
                  <form action={scheduleContentAction} className="grid gap-3">
                    <input type="hidden" name="id" value={content.id} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <label>
                        Schedule time
                        <input
                          name="scheduledFor"
                          type="datetime-local"
                          defaultValue={scheduledValue}
                          required
                        />
                      </label>
                      <label>
                        Channel
                        <select name="channel" defaultValue={content.channel}>
                          {Object.values(PublishingChannel).map((channel) => (
                            <option key={channel} value={channel}>
                              {humanizeEnum(channel)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <SubmitButton pendingLabel="Scheduling...">
                      Schedule publication
                    </SubmitButton>
                  </form>
                ) : null}

                {canEdit ? (
                  <form action={archiveContentAction}>
                    <input type="hidden" name="id" value={content.id} />
                    <SubmitButton
                      pendingLabel="Archiving..."
                      className="bg-[color:#6b7280] hover:bg-[color:#4b5563]"
                    >
                      Archive item
                    </SubmitButton>
                  </form>
                ) : null}
              </div>
            </SectionCard>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Review History"
          description="Track approval notes, requested changes, and revision cycles."
        >
          <div className="grid gap-4">
            {content.reviews.length ? (
              content.reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge
                      variant={
                        review.status === "APPROVED"
                          ? "success"
                          : review.status === "REQUESTED" ||
                              review.status === "COMMENTED"
                            ? "warning"
                            : "muted"
                      }
                    >
                      {humanizeEnum(review.status)}
                    </Badge>
                    <span className="text-sm text-[color:var(--muted)]">
                      {review.reviewer.name}
                    </span>
                    <span className="text-sm text-[color:var(--muted)]">
                      {formatRelativeDate(review.createdAt)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                    {review.notes}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[color:var(--muted)]">
                No review history yet.
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Publishing History"
          description="Every publish attempt, schedule, and external reference is stored here."
          action={
            <Link
              href="/publishing"
              className="text-sm font-semibold text-[color:var(--brand)]"
            >
              Go to publishing
            </Link>
          }
        >
          <div className="grid gap-4">
            {content.publications.length ? (
              content.publications.map((publication) => (
                <div
                  key={publication.id}
                  className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="muted">{humanizeEnum(publication.status)}</Badge>
                    <Badge>{humanizeEnum(publication.channel)}</Badge>
                    <span className="text-sm text-[color:var(--muted)]">
                      {publication.publishedAt
                        ? formatDateTime(publication.publishedAt)
                        : publication.scheduledFor
                          ? `Scheduled for ${formatDateTime(publication.scheduledFor)}`
                          : "Not published yet"}
                    </span>
                  </div>
                  {publication.publishUrl ? (
                    <a
                      href={publication.publishUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-sm font-semibold text-[color:var(--brand)]"
                    >
                      Open external post
                    </a>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-[color:var(--muted)]">
                No publishing history yet.
              </p>
            )}
          </div>
        </SectionCard>
      </section>

      <SectionCard
        title="Activity Log"
        description="A trace of updates, approvals, scheduling, publishing, and reuse events for this item."
      >
        <div className="grid gap-4">
          {activity.length ? (
            activity.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="muted">{entry.action}</Badge>
                  <span className="text-sm text-[color:var(--muted)]">
                    {entry.actor?.name ?? "System"}
                  </span>
                  <span className="text-sm text-[color:var(--muted)]">
                    {formatRelativeDate(entry.createdAt)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--foreground)]">
                  {entry.summary}
                </p>
                {entry.details ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[color:var(--muted)]">
                    {entry.details}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-[color:var(--muted)]">
              No activity has been logged for this item yet.
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
