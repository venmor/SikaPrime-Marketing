import Link from "next/link";
import { WorkflowStage } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { getCalendarSnapshot } from "@/lib/calendar/service";
import { prisma } from "@/lib/db";
import { formatDateTime, humanizeEnum } from "@/lib/utils";
import {
  publishContentAction,
  runDuePublicationsAction,
  syncPerformanceAction,
} from "@/server/actions/publishing";

export default async function PublishingPage() {
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

  const whatsappItems = readyItems.filter((item) => item.channel === "WHATSAPP");

  return (
    <div className="grid gap-6">
      <SectionCard
        title="Publish content"
        description="Send approved posts live, run due items, and keep WhatsApp messages ready to share."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/calendar"
              className="text-sm font-semibold text-[color:var(--brand)]"
            >
              Open calendar
            </Link>
            <form action={syncPerformanceAction}>
              <SubmitButton pendingLabel="Syncing...">
                Sync live performance
              </SubmitButton>
            </form>
            <form action={runDuePublicationsAction}>
              <SubmitButton pendingLabel="Running job...">
                Run due publications
              </SubmitButton>
            </form>
          </div>
        }
      >
        <div className="grid gap-3 text-sm text-[color:var(--muted)] md:grid-cols-3">
          <p>Facebook items can auto-post when live credentials are configured.</p>
          <p>WhatsApp items remain easy to copy, package, and distribute safely.</p>
          <p>Every scheduled, simulated, failed, or successful event is stored in history.</p>
        </div>
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Ready to publish"
          description="Approved or scheduled items waiting for distribution."
        >
          <div className="grid gap-4">
            {readyItems.length ? (
              readyItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge
                      variant={item.stage === "SCHEDULED" ? "warning" : "success"}
                    >
                      {humanizeEnum(item.stage)}
                    </Badge>
                    <Badge>{humanizeEnum(item.channel)}</Badge>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[color:var(--muted)]">
                    {(item.finalCopy ?? item.draft).slice(0, 280)}
                  </p>
                  <div className="mt-4 grid gap-1 text-sm text-[color:var(--muted)]">
                    <span>
                      Schedule:{" "}
                      {item.scheduledFor
                        ? formatDateTime(item.scheduledFor)
                        : "Not scheduled yet"}
                    </span>
                    {item.product ? <span>Product: {item.product.name}</span> : null}
                    <span>
                      Asset reference: {item.assetReference ?? "No asset attached"}
                    </span>
                    <span>
                      Distribution target:{" "}
                      {item.distributionTarget ?? "No destination configured"}
                    </span>
                  </div>
                  <form action={publishContentAction} className="mt-4 grid gap-3">
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
              <p className="text-sm text-[color:var(--muted)]">
                No items are currently approved or scheduled.
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Schedule guidance"
          description="Recommended posting windows and queue warnings."
        >
          <div className="grid gap-4">
            {calendar.recommendedWindows.length ? (
              <div className="grid gap-3">
                {calendar.recommendedWindows.map((window) => (
                  <div
                    key={window.label}
                    className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                      Suggested posting slot
                    </p>
                    <p className="mt-2 font-display text-2xl font-semibold">
                      {window.label}
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">
                      {window.supportingReason}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {calendar.warnings.length ? (
              calendar.warnings.map((warning) => (
                <div
                  key={warning.message}
                  className={
                    warning.level === "warning"
                      ? "rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
                      : "rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4 text-sm text-[color:var(--muted)]"
                  }
                >
                  {warning.message}
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                The current publishing queue looks balanced.
              </div>
            )}

            <div className="rounded-[24px] border border-dashed border-[color:var(--border)] p-4">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">
                Unscheduled approved items
              </p>
              <div className="mt-3 grid gap-2 text-sm text-[color:var(--muted)]">
                {calendar.unscheduledApproved.length ? (
                  calendar.unscheduledApproved.map((item) => (
                    <Link
                      key={item.id}
                      href={`/content/${item.id}`}
                      className="hover:text-[color:var(--brand)]"
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

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="WhatsApp Preparation"
          description="Short, clear, and compliant messages ready for manual or assisted sharing."
        >
          <div className="grid gap-4">
            {whatsappItems.length ? (
              whatsappItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge>{humanizeEnum(item.stage)}</Badge>
                    <Badge variant="muted">WhatsApp</Badge>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[color:var(--muted)]">
                    {item.finalCopy ?? item.draft}
                  </p>
                  <p className="mt-3 text-sm text-[color:var(--muted)]">
                    Team use: copy this message into WhatsApp Business flows, pair it
                    with a flyer if needed, and keep the official CTA unchanged.
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[color:var(--muted)]">
                No WhatsApp-ready content is currently queued.
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Publishing History"
          description="Stored platform history for scheduled, simulated, failed, and published events."
        >
          <div className="grid gap-4">
            {publications.length ? (
              publications.map((publication) => (
                <div
                  key={publication.id}
                  className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="muted">{humanizeEnum(publication.status)}</Badge>
                    <Badge>{humanizeEnum(publication.channel)}</Badge>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold">
                    {publication.contentItem.title}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {publication.publishedAt
                      ? `Published ${formatDateTime(publication.publishedAt)}`
                      : publication.scheduledFor
                        ? `Scheduled for ${formatDateTime(publication.scheduledFor)}`
                        : "Awaiting publish"}
                  </p>
                  {publication.errorMessage ? (
                    <p className="mt-2 text-sm text-amber-700">
                      Error: {publication.errorMessage}
                    </p>
                  ) : null}
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
                No publishing history exists yet.
              </p>
            )}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
