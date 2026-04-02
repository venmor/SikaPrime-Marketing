"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/audit/service";
import { requireSession } from "@/lib/auth/session";
import { refreshRecommendations } from "@/lib/engines/recommendations/service";

export async function refreshRecommendationsAction() {
  const session = await requireSession();
  const recommendations = await refreshRecommendations();

  await logActivity({
    actorId: session.userId,
    entityType: "recommendation_refresh",
    entityId: "global",
    action: "recommendations.refreshed",
    summary: `Refreshed ${recommendations.length} recommendation records`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/recommendations");
}
