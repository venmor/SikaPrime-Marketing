import Link from "next/link";
import { WorkflowStage } from "@prisma/client";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { canPublishContent } from "@/lib/auth/access";
import { requireSession } from "@/lib/auth/session";
import { getCalendarSnapshot } from "@/lib/calendar/service";
import { prisma } from "@/lib/db";
import { formatDateTime, humanizeEnum } from "@/lib/utils";
import {
  applyPublishingCommandAction,
  publishContentAction,
  runDuePublicationsAction,
  syncPerformanceAction,
} from "@/server/actions/publishing";

function publicationVariant(status: string) {
  if (status === "PUBLISHED") {
    return "success" as const;
  }

  if (status === "FAILED") {
    return "warning" as const;
  }

  if (status === "SIMULATED") {
    return "brand-subtle" as const;
  }

  return "muted" as const;
}

export default async function PublishingPage() {
  const session = await requireSession();

  if (!canPublishContent(session.role)) {
    redirect("/dashboard");
  }

  const [readyItems, publications, calendar] = await Promise.all([
    prisma.contentItem.findMany({
      where: {
        stage: {
          in: [WorkflowStage.APPROVED, WorkflowStage.SCHEDULED],
        },
      },
      include: {
        product: true,
      },
      orderBy: [{ scheduledFor: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.publication.findMany({
      include: {
        contentItem: true,
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    getCalendarSnapshot(),
  ]);

  const approvedNow = readyItems.filter(
    (item) => item.stage === WorkflowStage.APPROVED,
  );
  const scheduledQueue = readyItems.filter(
    (item) => item.stage === WorkflowStage.SCHEDULED,
  );
  const whatsappItems = readyItems.filter((item) => item.channel === "WHATSAPP");
  const failedPublications = publications.filter(
    (publication) => publication.status === "FAILED",
  );

  return (
    <div className="grid gap-8">
      <SectionCard
        title="Publishing control center"
        description="Use one command to batch publish or schedule the approved queue, then drop into details only when you need to."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <form action={syncPerformanceAction}>
              <SubmitButton pendingLabel="Syncing...">
                Sync performance
              </SubmitButton>
            </form>
            <form action={runDuePublicationsAction}>
              <SubmitButton pendingLabel="Running...">
                Run due items
              </SubmitButton>
            </form>
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Publish now",
                value: approvedNow.length,
                hint: "Approved and ready",
              },
              {
                label: "Scheduled",
                value: scheduledQueue.length,
                hint: "Waiting for time slot",
              },
              {
                label: "WhatsApp",
                value: whatsappItems.length,
                hint: "Manual or assisted send",
              },
              {
                label: "Recent failures",
                value: failedPublications.length,
                hint: "Needs follow-up",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 shadow-sm"
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
              <Badge variant="brand-subtle">Command bar</Badge>
              <Badge variant="muted">Publish or schedule in one sentence</Badge>
            </div>
            <p className="mt-4 text-base leading-7 text-[color:var(--foreground)]">
              {approvedNow.length
                ? "Try “Publish all approved Facebook posts tomorrow at 9 AM” or “Schedule the WhatsApp message for Friday 3 PM.”"
                : scheduledQueue.length
                  ? "The queue is mostly scheduled. Check timing guidance and let the runner clear due posts."
                  : "The publishing board is calm. Push more work through review when the next batch is ready."}
            </p>
            <form action={applyPublishingCommandAction} className="mt-5 grid gap-3">
              <label>
                Publishing command
                <input
                  name="command"
                  placeholder="Publish all approved Facebook posts tomorrow at 9 AM"
                  required
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  "Publish all approved Facebook posts tomorrow at 9 AM",
                  "Schedule the WhatsApp message for Friday 3 PM",
                ].map((example) => (
                  <span
                    key={example}
                    className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-xs text-[color:var(--muted)]"
                  >
                    {example}
                  </span>
                ))}
              </div>
              <SubmitButton pendingLabel="Applying command...">
                Run command
              </SubmitButton>
            </form>
          </div>
        </div>
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        <SectionCard
          title="Publish now"
          description="Items already approved and waiting for a final destination."
          action={<Badge variant="muted">{approvedNow.length} item{approvedNow.length === 1 ? "" : "s"}</Badge>}
        >
          <div className="grid gap-4">
            {approvedNow.length ? (
              approvedNow.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-sm"
                >
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
                    {item.product ? <span>Product: {item.product.name}</span> : null}
                    <span>
                      Distribution target:{" "}
                      {item.distributionTarget ?? "No destination configured"}
                    </span>
                    {item.hashtags ? (
                      <span className="font-medium text-brand-strong">{item.hashtags}</span>
                    ) : null}
                  </div>
                  <form action={publishContentAction} className="mt-5 grid gap-3">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="channel" value={item.channel} />
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
                  </form>
                </div>
              ))
            ) : (
              <div className="empty-state">
                No approved items are waiting for immediate release.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Queue guidance"
          description="Balance checks, timing suggestions, and unscheduled work that still needs placement."
        >
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              {calendar.recommendedWindows.length ? (
                calendar.recommendedWindows.map((window) => (
                  <div
                    key={window.label}
                    className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 shadow-sm"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)]">
                      Suggested window
                    </p>
                    <p className="mt-2 font-display text-2xl font-semibold text-[color:var(--foreground)]">
                      {window.label}
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">
                      {window.supportingReason}
                    </p>
                  </div>
                ))
              ) : (
                <div className="empty-state md:col-span-2">
                  Posting windows will appear once more live performance data is available.
                </div>
              )}
            </div>

            {calendar.warnings.length ? (
              <div className="grid gap-3">
                {calendar.warnings.map((warning) => (
                  <div
                    key={warning.message}
                    className={
                      warning.level === "warning"
                        ? "alert-warning rounded-[22px] p-4 text-sm"
                        : "rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4 text-sm text-[color:var(--muted)]"
                    }
                  >
                    {warning.message}
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert-success rounded-[22px] p-4 text-sm">
                The current queue looks balanced.
              </div>
            )}

            <div className="rounded-[24px] border border-dashed border-[color:var(--border)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[color:var(--foreground)]">
                  Unscheduled approved items
                </p>
                <Link
                  href="/calendar"
                  className="text-sm font-semibold text-brand transition-colors hover:text-brand-strong"
                >
                  Open calendar
                </Link>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-[color:var(--muted)]">
                {calendar.unscheduledApproved.length ? (
                  calendar.unscheduledApproved.map((item) => (
                    <Link
                      key={item.id}
                      href={`/content/${item.id}`}
                      className="rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 transition-colors hover:text-brand"
                    >
                      {item.title}
                    </Link>
                  ))
                ) : (
                  <span>No approved items are waiting for a schedule slot.</span>
                )}
              </div>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
        <SectionCard
          title="Scheduled queue"
          description="Items already placed on the calendar and waiting for their publish window."
          action={<Badge variant="muted">{scheduledQueue.length} scheduled</Badge>}
        >
          <div className="grid gap-4">
            {scheduledQueue.length ? (
              scheduledQueue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warning">Scheduled</Badge>
                    <Badge variant="cyan-subtle">{humanizeEnum(item.channel)}</Badge>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    Scheduled for{" "}
                    {item.scheduledFor
                      ? formatDateTime(item.scheduledFor)
                      : "No time selected"}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[color:var(--muted)]">
                    {item.finalCopy ?? item.draft}
                  </p>
                </div>
              ))
            ) : (
              <div className="empty-state">
                Nothing is waiting in the scheduled queue right now.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Publishing history"
          description="Recent published, simulated, queued, and failed delivery attempts."
          action={
            <Link
              href="/analytics"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition-colors hover:text-brand-strong"
            >
              <CheckCircle2 className="h-4 w-4" />
              View analytics
            </Link>
          }
        >
          <div className="grid gap-4">
            {publications.length ? (
              publications.map((publication) => (
                <div
                  key={publication.id}
                  className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={publicationVariant(publication.status)}>
                      {humanizeEnum(publication.status)}
                    </Badge>
                    <Badge variant="cyan-subtle">
                      {humanizeEnum(publication.channel)}
                    </Badge>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                    {publication.contentItem.title}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {publication.publishedAt
                      ? `Published ${formatDateTime(publication.publishedAt)}`
                      : publication.scheduledFor
                        ? `Scheduled for ${formatDateTime(publication.scheduledFor)}`
                        : "Waiting for next action"}
                  </p>
                  {publication.errorMessage ? (
                    <p className="mt-2 text-sm text-[color:var(--warning-strong)]">
                      Error: {publication.errorMessage}
                    </p>
                  ) : null}
                  {publication.publishUrl ? (
                    <a
                      href={publication.publishUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-sm font-semibold text-brand"
                    >
                      Open live post
                    </a>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="empty-state">
                No publishing history exists yet.
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      <SectionCard
        title="WhatsApp handoff"
        description="Keep WhatsApp messaging short, consistent, and easy for the team to copy into manual or assisted distribution."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {whatsappItems.length ? (
            whatsappItems.map((item) => (
              <div
                key={item.id}
                className="nested-panel p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="muted">{humanizeEnum(item.stage)}</Badge>
                  <Badge variant="cyan-subtle">WhatsApp</Badge>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                  {item.title}
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[color:var(--muted)]">
                  {item.finalCopy ?? item.draft}
                </p>
                <p className="mt-4 text-xs uppercase tracking-widest text-[color:var(--muted)]">
                  Keep the CTA unchanged when sharing.
                </p>
              </div>
            ))
          ) : (
            <div className="empty-state md:col-span-2 xl:col-span-3">
              No WhatsApp-ready content is currently queued.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
