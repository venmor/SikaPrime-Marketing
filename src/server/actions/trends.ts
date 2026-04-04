"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/audit/service";
import { requireSession } from "@/lib/auth/session";
import { refreshRecommendations } from "@/lib/engines/recommendations/service";
import {
  refreshLiveTrends,
  refreshTrendSignals,
} from "@/lib/engines/trends/service";

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

export async function refreshLiveTrendsAction() {
  const session = await requireSession();
  const trends = await refreshLiveTrends();

  await logActivity({
    actorId: session.userId,
    entityType: "live_trend_refresh",
    entityId: "global",
    action: "live_trends.refreshed",
    summary: `Refreshed ${trends.length} live trends`,
  });

  revalidatePath("/trends");
  revalidatePath("/trends/live");
  revalidatePath("/content");
}
