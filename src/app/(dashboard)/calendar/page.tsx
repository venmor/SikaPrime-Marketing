import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { getCalendarSnapshot } from "@/lib/calendar/service";
import { formatDateTime, humanizeEnum } from "@/lib/utils";

export default async function CalendarPage() {
  const calendar = await getCalendarSnapshot();

  return (
    <div className="grid gap-6">
      <SectionCard
        title="Content Calendar and Scheduling"
        description="Plan approved content across time, channel, campaign, and audience while keeping the schedule balanced and timely."
        action={
          <Link
            href="/publishing"
            className="text-sm font-semibold text-[color:var(--brand)]"
          >
            Open publishing
          </Link>
        }
      >
        <div className="grid gap-3 text-sm text-[color:var(--muted)] md:grid-cols-3">
          <p>See scheduled content by day and spot gaps early.</p>
          <p>Warnings surface duplicate themes, stale trends, and promotional overload.</p>
          <p>Posting-slot recommendations use historical performance data.</p>
        </div>
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <SectionCard
          title="Scheduled Queue"
          description="Upcoming posts grouped by day for easier planning."
        >
          <div className="grid gap-4">
            {calendar.days.length ? (
              calendar.days.map((day) => (
                <div
                  key={day.date}
                  className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-xl font-semibold">{day.date}</h3>
                    <Badge variant="muted">
                      {day.items.length} scheduled
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-4">
                    {day.items.map((item) => (
                      <Link
                        key={item.id}
                        href={`/content/${item.id}`}
                        className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 transition hover:border-[color:var(--brand)]"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge>{humanizeEnum(item.channel)}</Badge>
                          <Badge variant="muted">
                            {humanizeEnum(item.contentType)}
                          </Badge>
                        </div>
                        <h4 className="mt-3 font-display text-lg font-semibold">
                          {item.title}
                        </h4>
                        <p className="mt-2 text-sm text-[color:var(--muted)]">
                          {item.scheduledFor
                            ? formatDateTime(item.scheduledFor)
                            : "Awaiting time assignment"}
                        </p>
                        <div className="mt-3 grid gap-1 text-sm text-[color:var(--muted)]">
                          {item.product ? <span>Product: {item.product.name}</span> : null}
                          {item.trend ? (
                            <span>
                              Trend: {item.trend.title} ({humanizeEnum(item.trend.lifecycle)})
                            </span>
                          ) : null}
                          <span>Owner: {item.owner.name}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-[color:var(--border)] p-6 text-sm text-[color:var(--muted)]">
                No content is currently scheduled. Approve content first, then assign it to a time slot.
              </div>
            )}
          </div>
        </SectionCard>

        <div className="grid gap-6">
          <SectionCard
            title="Calendar Watch"
            description="Warnings and recommendations that keep the schedule healthy."
          >
            <div className="grid gap-4">
              {calendar.recommendedWindows.length ? (
                calendar.recommendedWindows.map((window) => (
                  <div
                    key={window.label}
                    className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                      Recommended slot
                    </p>
                    <p className="mt-2 font-display text-2xl font-semibold">
                      {window.label}
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">
                      {window.supportingReason}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[color:var(--muted)]">
                  More published results are needed before time-slot recommendations become useful.
                </p>
              )}

              {calendar.warnings.length ? (
                calendar.warnings.map((warning) => (
                  <div
                    key={warning.message}
                    className={
                      warning.level === "warning"
                        ? "alert-warning rounded-[24px] p-4 text-sm"
                        : "rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm text-[color:var(--muted)]"
                    }
                  >
                    {warning.message}
                  </div>
                ))
              ) : (
                <div className="alert-success rounded-[24px] p-4 text-sm">
                  No duplicate, stale-trend, or overposting risks are currently flagged.
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Awaiting Schedule"
            description="Approved items that still need a date and time before they can flow into publishing."
          >
            <div className="grid gap-4">
              {calendar.unscheduledApproved.length ? (
                calendar.unscheduledApproved.map((item) => (
                  <Link
                    key={item.id}
                    href={`/content/${item.id}`}
                    className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4 transition hover:border-[color:var(--brand)]"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="success">Approved</Badge>
                      <Badge variant="muted">{humanizeEnum(item.channel)}</Badge>
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">
                      {item.brief}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-[color:var(--muted)]">
                  Nothing is currently waiting for a schedule slot.
                </p>
              )}
            </div>
          </SectionCard>
        </div>
      </section>
    </div>
  );
}
