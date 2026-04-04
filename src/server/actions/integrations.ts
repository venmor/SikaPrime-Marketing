"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logActivity } from "@/lib/audit/service";
import { canManageIntegrations } from "@/lib/auth/access";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function requireIntegrationSession() {
  const session = await requireSession();

  if (!canManageIntegrations(session.role)) {
    redirect("/dashboard");
  }

  return session;
}

export async function saveIntegrationSettingAction(formData: FormData) {
  const session = await requireIntegrationSession();
  const id = value(formData, "id");
  const key = value(formData, "key");
  const label = value(formData, "label");
  const groupLabel = value(formData, "groupLabel");
  const helpText = value(formData, "helpText") || null;
  const valueType = value(formData, "valueType");
  const rawValue = value(formData, "value");
  const normalizedValue =
    valueType === "boolean"
      ? rawValue === "true"
        ? "true"
        : "false"
      : rawValue;

  if (!key || !label || !groupLabel) {
    redirect("/integrations?error=invalid");
  }

  const setting = await prisma.integrationSetting.upsert({
    where: id ? { id } : { key },
    update: {
      label,
      groupLabel,
      helpText,
      value: normalizedValue || null,
    },
    create: {
      key,
      label,
      groupLabel,
      helpText,
      isSecret: value(formData, "isSecret") === "true",
      value: normalizedValue || null,
    },
  });

  await logActivity({
    actorId: session.userId,
    entityType: "integration_setting",
    entityId: setting.id,
    action: "integrations.setting_saved",
    summary: `Updated integration setting ${setting.key}.`,
  });

  revalidatePath("/integrations");
  redirect("/integrations?saved=1");
}
