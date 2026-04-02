"use server";

import { PublishingChannel, WorkflowStage } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canGenerateContent } from "@/lib/auth/access";
import { logActivity } from "@/lib/audit/service";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { generateContentDraft } from "@/lib/engines/content/service";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function reusePublishedContentAction(formData: FormData) {
  const session = await requireSession();

  if (!canGenerateContent(session.role)) {
    redirect("/dashboard");
  }

  const id = value(formData, "id");
  const source = await prisma.contentItem.findUnique({
    where: { id },
  });

  if (!source) {
    redirect("/library");
  }

  const duplicated = await prisma.contentItem.create({
    data: {
      title: `${source.title} (Reuse Draft)`,
      brief: source.brief,
      objective: source.objective,
      campaignLabel: source.campaignLabel,
      distributionTarget: source.distributionTarget,
      contentType: source.contentType,
      tone: source.tone,
      channel: source.channel,
      stage: WorkflowStage.DRAFT,
      draft: source.finalCopy ?? source.draft,
      callToAction: source.callToAction,
      hashtags: source.hashtags,
      assetReference: source.assetReference,
      notes: `Reused from published content ${source.id}.`,
      aiModel: source.aiModel,
      aiSummary: source.aiSummary,
      themeLabel: source.themeLabel,
      ownerId: session.userId,
      reviewerId: source.reviewerId,
      trendId: source.trendId,
      productId: source.productId,
      audienceSegmentId: source.audienceSegmentId,
    },
  });

  await logActivity({
    actorId: session.userId,
    entityType: "content_item",
    entityId: duplicated.id,
    action: "content.reused",
    summary: `Reused published content from "${source.title}"`,
    details: `Source content id: ${source.id}`,
  });

  revalidatePath("/library");
  revalidatePath("/content");
}

export async function repurposePublishedContentAction(formData: FormData) {
  const session = await requireSession();

  if (!canGenerateContent(session.role)) {
    redirect("/dashboard");
  }

  const id = value(formData, "id");
  const targetChannel = value(formData, "targetChannel") as PublishingChannel;
  const source = await prisma.contentItem.findUnique({
    where: { id },
  });

  if (!source) {
    redirect("/library");
  }

  const repurposed = await generateContentDraft({
    title: `${source.title} (${targetChannel} version)`,
    brief: `Repurpose this published content for ${targetChannel}. Original brief: ${source.brief}. Original copy: ${source.finalCopy ?? source.draft}`,
    objective:
      source.objective ??
      `Repurpose a proven ${source.channel.toLowerCase()} post for ${targetChannel.toLowerCase()}.`,
    campaignLabel: source.campaignLabel,
    distributionTarget: source.distributionTarget,
    assetReference: source.assetReference,
    contentType: source.contentType,
    tone: source.tone,
    channel: targetChannel,
    ownerId: session.userId,
    reviewerId: source.reviewerId,
    productId: source.productId,
    audienceSegmentId: source.audienceSegmentId,
    trendId: source.trendId,
  });

  await logActivity({
    actorId: session.userId,
    entityType: "content_item",
    entityId: repurposed.id,
    action: "content.repurposed",
    summary: `Repurposed "${source.title}" into ${targetChannel}`,
    details: `Source content id: ${source.id}`,
  });

  revalidatePath("/library");
  revalidatePath("/content");
}
