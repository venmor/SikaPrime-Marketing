"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canPublishContent } from "@/lib/auth/access";
import { logActivity } from "@/lib/audit/service";
import { requireSession } from "@/lib/auth/session";
import { sendSlackNotification } from "@/lib/notifications/service";
import {
  publishContentItem,
  runDuePublications,
  syncRecentPublicationMetrics,
} from "@/lib/publishing/service";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
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
