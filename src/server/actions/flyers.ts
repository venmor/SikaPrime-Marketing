"use server";

import {
  AssetStatus,
  ContentTone,
  ContentType,
  PublishingChannel,
} from "@prisma/client";
import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logActivity } from "@/lib/audit/service";
import { canGenerateContent } from "@/lib/auth/access";
import { requireSession } from "@/lib/auth/session";
import {
  createContentItemFromFlyerConcept,
  generateFlyerProject,
  updateBrandAssetStatus,
  uploadBrandAsset,
} from "@/lib/flyers/service";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalValue(formData: FormData, key: string) {
  const current = value(formData, key);
  return current || null;
}

function toDataUrl(file: File, buffer: ArrayBuffer) {
  return `data:${file.type};base64,${Buffer.from(buffer).toString("base64")}`;
}

async function requireFlyerSession() {
  const session = await requireSession();

  if (!canGenerateContent(session.role)) {
    redirect("/dashboard");
  }

  return session;
}

export async function uploadBrandAssetAction(formData: FormData) {
  const session = await requireFlyerSession();
  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/flyers?error=missing-file");
  }

  if (!file.type.startsWith("image/")) {
    redirect("/flyers?error=invalid-file");
  }

  if (file.size > 6 * 1024 * 1024) {
    redirect("/flyers?error=file-too-large");
  }

  const title = value(formData, "title") || file.name.replace(/\.[^.]+$/, "");
  const imageData = toDataUrl(file, await file.arrayBuffer());

  const asset = await uploadBrandAsset({
    title,
    fileName: file.name,
    mimeType: file.type,
    imageData,
    ownerId: session.userId,
    productId: optionalValue(formData, "productId"),
  });

  await logActivity({
    actorId: session.userId,
    entityType: "brand_asset",
    entityId: asset.id,
    action: "flyer.reference_uploaded",
    summary: `Uploaded flyer reference "${asset.title}".`,
    details: asset.analysisSummary,
  });

  revalidatePath("/flyers");
  redirect("/flyers?asset=uploaded");
}

export async function updateBrandAssetStatusAction(formData: FormData) {
  const session = await requireFlyerSession();
  const assetId = value(formData, "assetId");
  const status = value(formData, "status") as AssetStatus;

  if (!assetId || !status) {
    redirect("/flyers");
  }

  const asset = await updateBrandAssetStatus(assetId, status);

  await logActivity({
    actorId: session.userId,
    entityType: "brand_asset",
    entityId: asset.id,
    action: "flyer.asset_status_changed",
    summary: `Updated flyer asset "${asset.title}" to ${status.toLowerCase()}.`,
  });

  revalidatePath("/flyers");
  redirect("/flyers");
}

export async function generateFlyerProjectAction(formData: FormData) {
  const session = await requireFlyerSession();

  const project = await generateFlyerProject({
    title: value(formData, "title"),
    objective: value(formData, "objective"),
    ownerId: session.userId,
    tone: value(formData, "tone") as ContentTone,
    channel: value(formData, "channel") as PublishingChannel,
    contentType: value(formData, "contentType") as ContentType,
    distributionTarget: optionalValue(formData, "distributionTarget"),
    productId: optionalValue(formData, "productId"),
    audienceSegmentId: optionalValue(formData, "audienceSegmentId"),
    specialDayKey: optionalValue(formData, "specialDayKey"),
    campaignTemplateId: optionalValue(formData, "campaignTemplateId"),
  });

  await logActivity({
    actorId: session.userId,
    entityType: "flyer_project",
    entityId: project.id,
    action: "flyer.project_generated",
    summary: `Generated flyer project "${project.title}" with ${project.concepts.length} concepts.`,
    details: project.objective,
  });

  revalidatePath("/flyers");
  revalidatePath("/content");
  redirect(`/flyers?project=${project.id}`);
}

export async function createFlyerDraftAction(formData: FormData) {
  const session = await requireFlyerSession();
  const conceptId = value(formData, "conceptId");

  if (!conceptId) {
    redirect("/flyers");
  }

  const content = await createContentItemFromFlyerConcept(conceptId);

  await logActivity({
    actorId: session.userId,
    entityType: "content_item",
    entityId: content.id,
    action: "flyer.concept_converted",
    summary: `Converted flyer concept into content draft "${content.title}".`,
    details: content.assetReference ? "Includes generated flyer preview." : null,
  });

  revalidatePath("/flyers");
  revalidatePath("/content");
  revalidatePath(`/content/${content.id}`);
  redirect(`/content/${content.id}`);
}
