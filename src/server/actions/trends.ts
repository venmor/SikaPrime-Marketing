"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/audit/service";
import { requireSession } from "@/lib/auth/session";
import { refreshRecommendations } from "@/lib/engines/recommendations/service";
import { refreshTrendSignals } from "@/lib/engines/trends/service";

export async function refreshTrendSignalsAction() {
  const session = await requireSession();
  const trends = await refreshTrendSignals();
  await refreshRecommendations();

  await logActivity({
    actorId: session.userId,
    entityType: "trend_refresh",
    entityId: "global",
    action: "trends.refreshed",
    summary: `Refreshed ${trends.local.length + trends.global.length} trend signals`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/trends");
  revalidatePath("/recommendations");
}
