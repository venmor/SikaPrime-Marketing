"use server";

import {
  ContentReview,
  ContentTone,
  ContentType,
  PublishingChannel,
  ReviewStatus,
  WorkflowStage,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  canGenerateContent,
  canPublishContent,
  canReviewContent,
} from "@/lib/auth/access";
import { logActivity } from "@/lib/audit/service";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  convertIdeaToDraft,
  generateContentDraft,
  generateContentIdeas,
} from "@/lib/engines/content/service";
import { sendSlackNotification } from "@/lib/notifications/service";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalValue(formData: FormData, key: string) {
  const current = value(formData, key);
  return current || null;
}

type AssistantContentLane =
  | "PROMOTIONAL"
  | "EDUCATIONAL"
  | "TRUST_BUILDING"
  | "YOUTH_EMPOWERMENT"
  | "VALUE_BASED"
  | "ENGAGEMENT"
  | "SEASONAL"
  | "CAMPAIGN_SUPPORT"
  | "COMMUNITY"
  | "INSPIRATIONAL";

async function createReviewRecord(input: {
  contentItemId: string;
  reviewerId: string;
  status: ReviewStatus;
  notes: string;
}) {
  return prisma.contentReview.create({
    data: input satisfies Omit<ContentReview, "id" | "createdAt">,
  });
}

export async function generateContentAction(formData: FormData) {
  const session = await requireSession();

  if (!canGenerateContent(session.role)) {
    redirect("/dashboard");
  }

  const ownerId =
    session.role === "ADMIN" || session.role === "STRATEGIST"
      ? optionalValue(formData, "ownerId") ?? session.userId
      : session.userId;

  const content = await generateContentDraft({
    title: optionalValue(formData, "title"),
    brief: value(formData, "brief"),
    objective: optionalValue(formData, "objective"),
    campaignLabel: optionalValue(formData, "campaignLabel"),
    distributionTarget: optionalValue(formData, "distributionTarget"),
    assetReference: optionalValue(formData, "assetReference"),
    contentType: value(formData, "contentType") as ContentType,
    tone: value(formData, "tone") as ContentTone,
    channel: value(formData, "channel") as PublishingChannel,
    ownerId,
    reviewerId: optionalValue(formData, "reviewerId"),
    productId: optionalValue(formData, "productId"),
    audienceSegmentId: optionalValue(formData, "audienceSegmentId"),
    trendId: optionalValue(formData, "trendId"),
    generationMode: value(formData, "generationMode") as
      | "BALANCED"
      | "PROACTIVE"
      | "TREND_ADAPTIVE",
    contentLane: optionalValue(formData, "contentLane") as AssistantContentLane | null,
    occasionKey: optionalValue(formData, "occasionKey"),
  });

  await logActivity({
    actorId: session.userId,
    entityType: "content_item",
    entityId: content.id,
    action: "content.generated",
    summary: `Generated draft "${content.title}"`,
    details: content.brief,
  });

  revalidatePath("/content");
  revalidatePath("/workflow");
  revalidatePath("/dashboard");

  redirect(`/content/${content.id}`);
}

export async function updateContentAction(formData: FormData) {
  const session = await requireSession();

  if (!canGenerateContent(session.role)) {
    redirect("/dashboard");
  }

  const id = value(formData, "id");

  await prisma.contentItem.update({
    where: { id },
    data: {
      title: value(formData, "title"),
      brief: value(formData, "brief"),
      objective: optionalValue(formData, "objective"),
      campaignLabel: optionalValue(formData, "campaignLabel"),
      distributionTarget: optionalValue(formData, "distributionTarget"),
      draft: value(formData, "draft"),
      finalCopy: optionalValue(formData, "finalCopy"),
      callToAction: optionalValue(formData, "callToAction"),
      hashtags: optionalValue(formData, "hashtags"),
      assetReference: optionalValue(formData, "assetReference"),
      notes: optionalValue(formData, "notes"),
      reviewerId: optionalValue(formData, "reviewerId"),
    },
  });

  await logActivity({
    actorId: session.userId,
    entityType: "content_item",
    entityId: id,
    action: "content.updated",
    summary: `Updated content draft "${value(formData, "title")}"`,
    details: optionalValue(formData, "notes"),
  });

  revalidatePath(`/content/${id}`);
  revalidatePath("/content");
  revalidatePath("/workflow");
}

export async function submitForReviewAction(formData: FormData) {
  const session = await requireSession();

  if (!canGenerateContent(session.role)) {
    redirect("/dashboard");
  }

  const id = value(formData, "id");
  const reviewerId = optionalValue(formData, "reviewerId");

  await prisma.contentItem.update({
    where: { id },
    data: {
      stage: WorkflowStage.IN_REVIEW,
      reviewerId,
    },
  });

  if (reviewerId) {
    await createReviewRecord({
      contentItemId: id,
      reviewerId,
      status: ReviewStatus.REQUESTED,
      notes: value(formData, "reviewNotes") || "Please review this draft.",
    });
  }

  await logActivity({
    actorId: session.userId,
    entityType: "content_item",
    entityId: id,
    action: "content.submitted_for_review",
    summary: "Sent content to review queue",
    details: value(formData, "reviewNotes") || null,
  });

  await sendSlackNotification({
    title: "Content submitted for review",
    body: `Content item ${id} has moved to the review queue.`,
  });

  revalidatePath(`/content/${id}`);
  revalidatePath("/workflow");
  revalidatePath("/dashboard");
}

export async function approveContentAction(formData: FormData) {
  const session = await requireSession();

  if (!canReviewContent(session.role)) {
    redirect("/dashboard");
  }

  const id = value(formData, "id");
  const item = await prisma.contentItem.findUnique({
    where: { id },
  });

  if (!item) {
    redirect("/workflow");
  }

  await prisma.contentItem.update({
    where: { id },
    data: {
      stage: WorkflowStage.APPROVED,
      finalCopy: item.finalCopy ?? item.draft,
    },
  });

  if (item.reviewerId) {
    await createReviewRecord({
      contentItemId: id,
      reviewerId: item.reviewerId,
      status: ReviewStatus.APPROVED,
      notes: value(formData, "approvalNotes") || "Approved for scheduling or publishing.",
    });
  }

  await logActivity({
    actorId: session.userId,
    entityType: "content_item",
    entityId: id,
    action: "content.approved",
    summary: `Approved "${item.title}" for scheduling or publishing`,
    details: value(formData, "approvalNotes") || null,
  });

  await sendSlackNotification({
    title: "Content approved",
    body: `"${item.title}" is approved and ready for scheduling or publishing.`,
  });

  revalidatePath(`/content/${id}`);
  revalidatePath("/workflow");
  revalidatePath("/publishing");
}

export async function sendBackToDraftAction(formData: FormData) {
  const session = await requireSession();

  if (!canReviewContent(session.role)) {
    redirect("/dashboard");
  }

  const id = value(formData, "id");
  const item = await prisma.contentItem.findUnique({
    where: { id },
  });

  if (!item) {
    redirect("/workflow");
  }

  await prisma.contentItem.update({
    where: { id },
    data: {
      stage: WorkflowStage.NEEDS_REVISION,
      revisionCount: {
        increment: 1,
      },
    },
  });

  if (item.reviewerId) {
    await createReviewRecord({
      contentItemId: id,
      reviewerId: item.reviewerId,
      status: ReviewStatus.COMMENTED,
      notes: value(formData, "revisionNotes") || "Needs one more draft pass.",
    });
  }

  await logActivity({
    actorId: session.userId,
    entityType: "content_item",
    entityId: id,
    action: "content.needs_revision",
    summary: `Marked "${item.title}" as needing revision`,
    details: value(formData, "revisionNotes") || null,
  });

  await sendSlackNotification({
    title: "Content sent back for revision",
    body: `"${item.title}" needs another draft pass before it can be approved.`,
  });

  revalidatePath(`/content/${id}`);
  revalidatePath("/workflow");
}

export async function scheduleContentAction(formData: FormData) {
  const session = await requireSession();

  if (!canPublishContent(session.role)) {
    redirect("/dashboard");
  }

  const id = value(formData, "id");
  const scheduledFor = value(formData, "scheduledFor");
  const channel = value(formData, "channel");

  await prisma.contentItem.update({
    where: { id },
    data: {
      stage: WorkflowStage.SCHEDULED,
      scheduledFor: new Date(scheduledFor),
      channel: channel as PublishingChannel,
    },
  });

  await prisma.publication.deleteMany({
    where: {
      contentItemId: id,
      status: "SCHEDULED",
    },
  });

  const item = await prisma.contentItem.findUnique({
    where: { id },
  });

  if (item) {
    await prisma.publication.create({
      data: {
        contentItemId: item.id,
        channel: item.channel,
        status: "SCHEDULED",
        caption: item.finalCopy ?? item.draft,
        payload: JSON.stringify({
          title: item.title,
          hashtags: item.hashtags,
        }),
        scheduledFor: item.scheduledFor,
      },
    });
  }

  await logActivity({
    actorId: session.userId,
    entityType: "content_item",
    entityId: id,
    action: "content.scheduled",
    summary: "Scheduled content for publishing",
    details: `${scheduledFor} via ${channel}`,
  });

  revalidatePath(`/content/${id}`);
  revalidatePath("/workflow");
  revalidatePath("/publishing");
  revalidatePath("/dashboard");
}

export async function archiveContentAction(formData: FormData) {
  const session = await requireSession();

  if (!canGenerateContent(session.role)) {
    redirect("/dashboard");
  }

  const id = value(formData, "id");

  await prisma.contentItem.update({
    where: { id },
    data: {
      stage: WorkflowStage.ARCHIVED,
      archivedAt: new Date(),
    },
  });

  await logActivity({
    actorId: session.userId,
    entityType: "content_item",
    entityId: id,
    action: "content.archived",
    summary: "Archived content item",
  });

  revalidatePath("/workflow");
  revalidatePath(`/content/${id}`);
}

export async function generateIdeasAction(formData: FormData) {
  const session = await requireSession();

  if (!canGenerateContent(session.role)) {
    redirect("/dashboard");
  }

  const ownerId =
    session.role === "ADMIN" || session.role === "STRATEGIST"
      ? optionalValue(formData, "ownerId") ?? session.userId
      : session.userId;

  const objective = value(formData, "objective");

  const ideas = await generateContentIdeas({
    objective,
    campaignLabel: optionalValue(formData, "campaignLabel"),
    distributionTarget: optionalValue(formData, "distributionTarget"),
    channel: value(formData, "channel") as PublishingChannel,
    tone: value(formData, "tone") as ContentTone,
    ownerId,
    reviewerId: optionalValue(formData, "reviewerId"),
    productId: optionalValue(formData, "productId"),
    audienceSegmentId: optionalValue(formData, "audienceSegmentId"),
    trendId: optionalValue(formData, "trendId"),
    generationMode: value(formData, "generationMode") as
      | "BALANCED"
      | "PROACTIVE"
      | "TREND_ADAPTIVE",
    contentLane: optionalValue(formData, "contentLane") as AssistantContentLane | null,
    occasionKey: optionalValue(formData, "occasionKey"),
    numberOfIdeas: Number(value(formData, "numberOfIdeas") || 4),
  });

  await logActivity({
    actorId: session.userId,
    entityType: "idea_batch",
    entityId: ideas[0]?.id ?? session.userId,
    action: "ideas.generated",
    summary: `Generated ${ideas.length} ideas for "${objective}"`,
    details: optionalValue(formData, "campaignLabel"),
  });

  revalidatePath("/content");
  revalidatePath("/dashboard");
}

export async function convertIdeaToDraftAction(formData: FormData) {
  const session = await requireSession();

  if (!canGenerateContent(session.role)) {
    redirect("/dashboard");
  }

  const ideaId = value(formData, "ideaId");
  const content = await convertIdeaToDraft({
    ideaId,
    contentType: value(formData, "contentType") as ContentType,
    tone: value(formData, "tone") as ContentTone,
    channel: value(formData, "channel") as PublishingChannel,
    reviewerId: optionalValue(formData, "reviewerId"),
  });

  await logActivity({
    actorId: session.userId,
    entityType: "content_item",
    entityId: ideaId,
    action: "idea.converted_to_draft",
    summary: `Converted idea "${content.title}" into a draft`,
    details: content.brief,
  });

  revalidatePath("/content");
  revalidatePath(`/content/${ideaId}`);
  revalidatePath("/workflow");
}
