"use server";

import { PublicationStatus, PublishingChannel, WorkflowStage } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canPublishContent } from "@/lib/auth/access";
import { logActivity } from "@/lib/audit/service";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { sendSlackNotification } from "@/lib/notifications/service";
import {
  publishContentItem,
  runDuePublications,
  syncRecentPublicationMetrics,
} from "@/lib/publishing/service";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseScheduleDate(command: string, now = new Date()) {
  const normalized = command.toLowerCase();
  const result = new Date(now);
  let matched = false;

  if (normalized.includes("tomorrow")) {
    result.setDate(result.getDate() + 1);
    matched = true;
  }

  const weekdays = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const requestedWeekday = weekdays.find((weekday) =>
    normalized.includes(weekday),
  );

  if (requestedWeekday) {
    const target = weekdays.indexOf(requestedWeekday);
    let delta = (target - now.getDay() + 7) % 7;

    if (delta === 0) {
      delta = 7;
    }

    result.setDate(now.getDate() + delta);
    matched = true;
  }

  const timeMatch = normalized.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);

  if (timeMatch) {
    let hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2] ?? "0");
    const meridian = timeMatch[3];

    if (meridian === "pm" && hours < 12) {
      hours += 12;
    }

    if (meridian === "am" && hours === 12) {
      hours = 0;
    }

    result.setHours(hours, minutes, 0, 0);
    matched = true;
  } else {
    result.setHours(9, 0, 0, 0);
  }

  return matched ? result : null;
}

export async function publishContentAction(formData: FormData) {
  const session = await requireSession();

  if (!canPublishContent(session.role)) {
    redirect("/dashboard");
  }

  const id = value(formData, "id");
  const channel = value(formData, "channel") || undefined;
  const distributionTarget = value(formData, "distributionTarget") || undefined;

  const publication = await publishContentItem(id, channel as never, {
    distributionTarget: distributionTarget ?? null,
  });

  await logActivity({
    actorId: session.userId,
    entityType: "content_item",
    entityId: id,
    action: "content.published",
    summary: `Published content via ${publication.channel}`,
    details: publication.status,
  });

  if (publication.status === "FAILED") {
    await sendSlackNotification({
      title: `Publishing failed for ${publication.channel}`,
      body: `Content item ${id} could not be published. Status: ${publication.status}.`,
    });
  }

  revalidatePath("/publishing");
  revalidatePath("/workflow");
  revalidatePath("/analytics");
  revalidatePath("/dashboard");
}

export async function runDuePublicationsAction() {
  const session = await requireSession();

  if (!canPublishContent(session.role)) {
    redirect("/dashboard");
  }

  const publications = await runDuePublications();
  await syncRecentPublicationMetrics();

  for (const publication of publications) {
    await logActivity({
      actorId: session.userId,
      entityType: "content_item",
      entityId: publication.contentItemId,
      action: "content.published_by_job",
      summary: `Processed scheduled publication via ${publication.channel}`,
      details: publication.status,
    });
  }

  if (publications.some((publication) => publication.status === "FAILED")) {
    await sendSlackNotification({
      title: "Scheduled publishing needs attention",
      body: `${publications.filter((publication) => publication.status === "FAILED").length} scheduled publication(s) failed during the latest job run.`,
    });
  }

  revalidatePath("/publishing");
  revalidatePath("/workflow");
  revalidatePath("/analytics");
  revalidatePath("/dashboard");
}

export async function syncPerformanceAction() {
  const session = await requireSession();

  if (!canPublishContent(session.role)) {
    redirect("/dashboard");
  }

  const syncedPublicationIds = await syncRecentPublicationMetrics();

  for (const publicationId of syncedPublicationIds) {
    await logActivity({
      actorId: session.userId,
      entityType: "publication",
      entityId: publicationId,
      action: "publication.metrics_synced",
      summary: "Synced live Facebook performance metrics",
    });
  }

  revalidatePath("/analytics");
  revalidatePath("/publishing");
  revalidatePath("/dashboard");
}

export async function applyPublishingCommandAction(formData: FormData) {
  const session = await requireSession();

  if (!canPublishContent(session.role)) {
    redirect("/dashboard");
  }

  const command = value(formData, "command");
  const normalized = command.toLowerCase();
  const channel = normalized.includes("whatsapp")
    ? PublishingChannel.WHATSAPP
    : normalized.includes("facebook")
      ? PublishingChannel.FACEBOOK
      : null;
  const scheduleDate = parseScheduleDate(normalized);
  const shouldPublishNow =
    normalized.includes("publish") &&
    !normalized.includes("schedule") &&
    !scheduleDate;

  const items = await prisma.contentItem.findMany({
    where: {
      stage: WorkflowStage.APPROVED,
      ...(channel ? { channel } : {}),
    },
    orderBy: [{ updatedAt: "asc" }],
    take: 20,
  });

  if (!items.length) {
    revalidatePath("/publishing");
    return;
  }

  if (shouldPublishNow) {
    for (const item of items) {
      await publishContentItem(item.id, item.channel, {
        distributionTarget: item.distributionTarget ?? null,
      });
    }

    await logActivity({
      actorId: session.userId,
      entityType: "publishing_batch",
      entityId: items[0].id,
      action: "content.batch_published",
      summary: `Published ${items.length} approved item${items.length === 1 ? "" : "s"} from the command bar.`,
      details: command,
    });
  } else if (scheduleDate) {
    for (const [index, item] of items.entries()) {
      const scheduledFor = new Date(
        scheduleDate.getTime() + index * 15 * 60 * 1000,
      );

      await prisma.contentItem.update({
        where: { id: item.id },
        data: {
          stage: WorkflowStage.SCHEDULED,
          scheduledFor,
        },
      });

      await prisma.publication.deleteMany({
        where: {
          contentItemId: item.id,
          status: PublicationStatus.SCHEDULED,
        },
      });

      await prisma.publication.create({
        data: {
          contentItemId: item.id,
          channel: item.channel,
          status: PublicationStatus.SCHEDULED,
          caption: item.finalCopy ?? item.draft,
          payload: JSON.stringify({
            title: item.title,
            hashtags: item.hashtags,
          }),
          scheduledFor,
        },
      });
    }

    await logActivity({
      actorId: session.userId,
      entityType: "publishing_batch",
      entityId: items[0].id,
      action: "content.batch_scheduled",
      summary: `Scheduled ${items.length} approved item${items.length === 1 ? "" : "s"} from the command bar.`,
      details: command,
    });
  }

  revalidatePath("/publishing");
  revalidatePath("/workflow");
  revalidatePath("/dashboard");
}
