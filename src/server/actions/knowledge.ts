"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canManageKnowledge } from "@/lib/auth/access";
import { logActivity } from "@/lib/audit/service";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

async function ensureKnowledgeAccess() {
  const session = await requireSession();

  if (!canManageKnowledge(session.role)) {
    redirect("/dashboard");
  }

  return session;
}

function refreshKnowledgeSurfaces() {
  revalidatePath("/knowledge");
  revalidatePath("/content");
  revalidatePath("/recommendations");
}

export async function saveBusinessProfileAction(formData: FormData) {
  const session = await ensureKnowledgeAccess();

  await prisma.businessProfile.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      companyName: text(formData, "companyName"),
      brandPromise: text(formData, "brandPromise"),
      mission: text(formData, "mission"),
      valueProposition: text(formData, "valueProposition"),
      toneSummary: text(formData, "toneSummary"),
      primaryGoal: text(formData, "primaryGoal"),
      coreNarrative: text(formData, "coreNarrative"),
      complianceSummary: text(formData, "complianceSummary"),
      heroMessage: text(formData, "heroMessage"),
    },
    update: {
      companyName: text(formData, "companyName"),
      brandPromise: text(formData, "brandPromise"),
      mission: text(formData, "mission"),
      valueProposition: text(formData, "valueProposition"),
      toneSummary: text(formData, "toneSummary"),
      primaryGoal: text(formData, "primaryGoal"),
      coreNarrative: text(formData, "coreNarrative"),
      complianceSummary: text(formData, "complianceSummary"),
      heroMessage: text(formData, "heroMessage"),
    },
  });

  await logActivity({
    actorId: session.userId,
    entityType: "business_profile",
    entityId: "1",
    action: "knowledge.profile_saved",
    summary: "Updated core business profile settings",
  });

  refreshKnowledgeSurfaces();
}

export async function saveCompanyValueAction(formData: FormData) {
  const session = await ensureKnowledgeAccess();

  const id = optionalText(formData, "id");
  const data = {
    name: text(formData, "name"),
    description: text(formData, "description"),
    profileId: 1,
  };

  if (id) {
    await prisma.companyValue.update({
      where: { id },
      data,
    });
  } else {
    await prisma.companyValue.create({ data });
  }

  await logActivity({
    actorId: session.userId,
    entityType: "company_value",
    entityId: id ?? data.name,
    action: "knowledge.value_saved",
    summary: `Saved company value "${data.name}"`,
  });

  refreshKnowledgeSurfaces();
}

export async function saveProductAction(formData: FormData) {
  const session = await ensureKnowledgeAccess();

  const id = optionalText(formData, "id");
  const name = text(formData, "name");
  const data = {
    profileId: 1,
    slug: optionalText(formData, "slug") ?? slugify(name),
    name,
    category: text(formData, "category"),
    description: text(formData, "description"),
    keyBenefits: text(formData, "keyBenefits"),
    eligibilityNotes: text(formData, "eligibilityNotes"),
    callToAction: text(formData, "callToAction"),
    priority: Number(text(formData, "priority") || 50),
    active: checked(formData, "active"),
  };

  if (id) {
    await prisma.product.update({
      where: { id },
      data,
    });
  } else {
    await prisma.product.create({ data });
  }

  await logActivity({
    actorId: session.userId,
    entityType: "product",
    entityId: id ?? data.slug,
    action: "knowledge.product_saved",
    summary: `Saved product "${data.name}"`,
  });

  refreshKnowledgeSurfaces();
}

export async function saveAudienceSegmentAction(formData: FormData) {
  const session = await ensureKnowledgeAccess();

  const id = optionalText(formData, "id");
  const data = {
    profileId: 1,
    name: text(formData, "name"),
    description: text(formData, "description"),
    painPoints: text(formData, "painPoints"),
    needs: text(formData, "needs"),
    preferredChannels: text(formData, "preferredChannels"),
    messagingAngles: text(formData, "messagingAngles"),
    priority: Number(text(formData, "priority") || 50),
  };

  if (id) {
    await prisma.audienceSegment.update({
      where: { id },
      data,
    });
  } else {
    await prisma.audienceSegment.create({ data });
  }

  await logActivity({
    actorId: session.userId,
    entityType: "audience_segment",
    entityId: id ?? data.name,
    action: "knowledge.audience_saved",
    summary: `Saved audience segment "${data.name}"`,
  });

  refreshKnowledgeSurfaces();
}

export async function saveComplianceRuleAction(formData: FormData) {
  const session = await ensureKnowledgeAccess();

  const id = optionalText(formData, "id");
  const data = {
    profileId: 1,
    title: text(formData, "title"),
    ruleText: text(formData, "ruleText"),
    guidance: text(formData, "guidance"),
    severity: text(formData, "severity"),
  };

  if (id) {
    await prisma.complianceRule.update({
      where: { id },
      data,
    });
  } else {
    await prisma.complianceRule.create({ data });
  }

  await logActivity({
    actorId: session.userId,
    entityType: "compliance_rule",
    entityId: id ?? data.title,
    action: "knowledge.compliance_saved",
    summary: `Saved compliance rule "${data.title}"`,
  });

  refreshKnowledgeSurfaces();
}

export async function saveOfferAction(formData: FormData) {
  const session = await ensureKnowledgeAccess();

  const id = optionalText(formData, "id");
  const data = {
    profileId: 1,
    name: text(formData, "name"),
    description: text(formData, "description"),
    callToAction: text(formData, "callToAction"),
    startDate: optionalText(formData, "startDate")
      ? new Date(text(formData, "startDate"))
      : null,
    endDate: optionalText(formData, "endDate")
      ? new Date(text(formData, "endDate"))
      : null,
    active: checked(formData, "active"),
    priority: Number(text(formData, "priority") || 50),
  };

  if (id) {
    await prisma.offer.update({
      where: { id },
      data,
    });
  } else {
    await prisma.offer.create({ data });
  }

  await logActivity({
    actorId: session.userId,
    entityType: "offer",
    entityId: id ?? data.name,
    action: "knowledge.offer_saved",
    summary: `Saved offer "${data.name}"`,
  });

  refreshKnowledgeSurfaces();
}

export async function saveStrategicGoalAction(formData: FormData) {
  const session = await ensureKnowledgeAccess();

  const id = optionalText(formData, "id");
  const data = {
    profileId: 1,
    title: text(formData, "title"),
    description: text(formData, "description"),
    priority: Number(text(formData, "priority") || 50),
    active: checked(formData, "active"),
  };

  if (id) {
    await prisma.strategicGoal.update({
      where: { id },
      data,
    });
  } else {
    await prisma.strategicGoal.create({ data });
  }

  await logActivity({
    actorId: session.userId,
    entityType: "strategic_goal",
    entityId: id ?? data.title,
    action: "knowledge.goal_saved",
    summary: `Saved strategic goal "${data.title}"`,
  });

  refreshKnowledgeSurfaces();
}

export async function saveGuardrailTermAction(formData: FormData) {
  const session = await ensureKnowledgeAccess();

  const id = optionalText(formData, "id");
  const data = {
    profileId: 1,
    phrase: text(formData, "phrase"),
    explanation: text(formData, "explanation"),
    type: text(formData, "type") as
      | "PROHIBITED_WORD"
      | "MISLEADING_CLAIM"
      | "REVIEW_TRIGGER",
    severity: text(formData, "severity"),
    active: checked(formData, "active"),
  };

  if (id) {
    await prisma.guardrailTerm.update({
      where: { id },
      data,
    });
  } else {
    await prisma.guardrailTerm.create({ data });
  }

  await logActivity({
    actorId: session.userId,
    entityType: "guardrail_term",
    entityId: id ?? data.phrase,
    action: "knowledge.guardrail_saved",
    summary: `Saved guardrail term "${data.phrase}"`,
  });

  refreshKnowledgeSurfaces();
}
