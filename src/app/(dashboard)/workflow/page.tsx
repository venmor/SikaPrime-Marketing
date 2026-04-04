import Link from "next/link";
import { WorkflowStage } from "@prisma/client";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, PenSquare, Sparkles } from "lucide-react";

import { OpenAssistantButton } from "@/components/assistant/open-assistant-button";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  canViewWorkflow,
  shouldScopeWorkflowToOwnedItems,
} from "@/lib/auth/access";
import { USER_ROLES } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatRelativeDate, humanizeEnum } from "@/lib/utils";
import {
  approveContentAction,
  sendBackToDraftAction,
  submitForReviewAction,
} from "@/server/actions/content";

export default async function WorkflowPage() {
  const session = await requireSession();

  if (!canViewWorkflow(session.role)) {
    redirect("/dashboard");
  }

  const creatorScoped = shouldScopeWorkflowToOwnedItems(session.role);

  const items = await prisma.contentItem.findMany({
    where: creatorScoped ? { ownerId: session.userId } : undefined,
    include: {
      owner: true,
      reviewer: true,
      product: true,
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  const ideas = items.filter((item) => item.stage === WorkflowStage.IDEA);
  const draftQueue = items.filter(
    (item) =>
      item.stage === WorkflowStage.DRAFT ||
      item.stage === WorkflowStage.NEEDS_REVISION,
  );
  const reviewQueue = items.filter((item) => item.stage === WorkflowStage.IN_REVIEW);
  const readyQueue = items.filter(
    (item) =>
      item.stage === WorkflowStage.APPROVED ||
      item.stage === WorkflowStage.SCHEDULED,
  );

  if (session.role === USER_ROLES.CREATOR) {
    return (
      <div className="grid gap-6">
        <SectionCard
          title="My draft queue"
          description="Only the work you can move forward is shown here."
          action={
            <OpenAssistantButton
              label="Create with AI"
              prompt="Create the next best post for my usual channel and product."
              autoSend
            />
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Ideas", value: ideas.length, hint: "Saved for later" },
              { label: "Drafts", value: draftQueue.length, hint: "Needs your touch" },
              {
                label: "Submitted",
                value: reviewQueue.length,
                hint: "Waiting on reviewer",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm"
              >
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
        </SectionCard>

        <SectionCard
          title="Ready to submit"
          description="Drafts and revisions that still need your final pass."
        >
          <div className="grid gap-4">
            {draftQueue.length ? (
              draftQueue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-[color:var(--border)] bg-surface-strong p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.stage === WorkflowStage.NEEDS_REVISION ? "warning" : "muted"}>
                      {humanizeEnum(item.stage)}
                    </Badge>
                    <Badge variant="cyan-subtle">{humanizeEnum(item.channel)}</Badge>
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
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[color:var(--muted)]">
                    <span>{formatRelativeDate(item.updatedAt)}</span>
                    <span>{item.product?.name ?? "General content"}</span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/content/${item.id}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-surface-strong px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)] transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      Edit draft
                    </Link>
                    <form action={submitForReviewAction}>
                      <input type="hidden" name="id" value={item.id} />
                      {item.reviewerId ? (
                        <input type="hidden" name="reviewerId" value={item.reviewerId} />
                      ) : null}
                      <input
                        type="hidden"
                        name="reviewNotes"
                        value="Ready for review from the creator queue."
                      />
                      <SubmitButton pendingLabel="Submitting...">
                        Ready to submit
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                No drafts need attention. Create the next piece with AI or start a manual draft.
              </div>
            )}
          </div>
        </SectionCard>

        {ideas.length ? (
          <SectionCard
            title="Idea shelf"
            description="Low-pressure ideas waiting for you to turn them into real drafts."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {ideas.map((item) => (
                <Link
                  key={item.id}
                  href={`/content/${item.id}`}
                  className="rounded-[22px] border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="text-sm font-semibold text-[color:var(--foreground)]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {item.brief}
                  </p>
                </Link>
              ))}
            </div>
          </SectionCard>
        ) : null}
      </div>
    );
  }

  if (session.role === USER_ROLES.REVIEWER) {
    return (
      <div className="grid gap-6">
        <SectionCard
          title="Review inbox"
          description="Only the work that needs your decision is shown here."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Waiting now", value: reviewQueue.length, hint: "Needs your review" },
              { label: "Approved", value: readyQueue.length, hint: "Ready for publish" },
              { label: "Recent ideas", value: ideas.length, hint: "Visible for context" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm"
              >
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
        </SectionCard>

        <SectionCard
          title="Waiting for your decision"
          description="Approve or send back each draft without scanning unrelated stages."
        >
          <div className="grid gap-4">
            {reviewQueue.length ? (
              reviewQueue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-[color:var(--border)] bg-surface-strong p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warning">In review</Badge>
                    <Badge variant="muted">{humanizeEnum(item.channel)}</Badge>
                    <Badge variant="muted">{formatRelativeDate(item.updatedAt)}</Badge>
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold text-[color:var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {item.brief}
                  </p>
                  <p className="mt-4 text-sm text-[color:var(--muted)]">
                    Owner: {item.owner.name}
                  </p>
                  <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
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
                    <form action={approveContentAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input
                        type="hidden"
                        name="approvalNotes"
                        value="Approved from reviewer inbox."
                      />
                      <SubmitButton pendingLabel="Approving...">
                        Approve
                      </SubmitButton>
                    </form>
                    <Link
                      href={`/content/${item.id}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-surface-strong px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)] transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      Open detail
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                Nothing is waiting for review right now.
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
        title="Workflow overview"
        description="Strategists and admins get the cross-team picture, but the next decision still stays simple."
        action={
          <OpenAssistantButton
            label="Create with AI"
            prompt="Create the next best post for the team using our best product and the current top trend."
            autoSend
          />
        }
      >
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Ideas", value: ideas.length, icon: Sparkles },
            { label: "Drafts", value: draftQueue.length, icon: PenSquare },
            { label: "Review", value: reviewQueue.length, icon: Clock3 },
            { label: "Ready", value: readyQueue.length, icon: CheckCircle2 },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[24px] border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm"
            >
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
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Needs review"
          description="Oldest items first."
        >
          <div className="grid gap-4">
            {reviewQueue.length ? (
              reviewQueue.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-[color:var(--border)] bg-surface-strong p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="warning">In review</Badge>
                    <span className="text-sm text-[color:var(--muted)]">
                      {formatRelativeDate(item.updatedAt)}
                    </span>
                  </div>
                  <Link
                    href={`/content/${item.id}`}
                    className="mt-3 block font-display text-lg font-semibold text-[color:var(--foreground)] transition-colors hover:text-brand"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {item.owner.name}
                  </p>
                </div>
              ))
            ) : (
              <div className="empty-state">
                The review queue is clear.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Ready to publish"
          description="Approved or scheduled items that can move out now."
        >
          <div className="grid gap-4">
            {readyQueue.length ? (
              readyQueue.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  href={`/content/${item.id}`}
                  className="rounded-[24px] border border-[color:var(--border)] bg-surface-strong p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="success">{humanizeEnum(item.stage)}</Badge>
                    <span className="text-sm text-[color:var(--muted)]">
                      {item.product?.name ?? "General"}
                    </span>
                  </div>
                  <p className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {item.owner.name}
                  </p>
                </Link>
              ))
            ) : (
              <div className="empty-state">
                Nothing is approved yet.
              </div>
            )}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
