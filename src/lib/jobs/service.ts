import { refreshRecommendations } from "@/lib/engines/recommendations/service";
import { refreshTrendSignals } from "@/lib/engines/trends/service";
import { logOperationalEvent } from "@/lib/operations/service";
import {
  runDuePublications,
  syncRecentPublicationMetrics,
} from "@/lib/publishing/service";

export type DailyMaintenanceResult = {
  completedAt: string;
  localTrendCount: number;
  globalTrendCount: number;
  recommendationCount: number;
  publishedCount: number;
  syncedPerformanceCount: number;
  errors: Array<{
    step: "trends-and-recommendations" | "publishing-and-performance";
    message: string;
  }>;
};

export async function runDailyMaintenance(): Promise<DailyMaintenanceResult> {
  const [trendRefreshResult, publishingResult] = await Promise.allSettled([
    (async () => {
      const trends = await refreshTrendSignals();
      const recommendations = await refreshRecommendations();

      return {
        localTrendCount: trends.local.length,
        globalTrendCount: trends.global.length,
        recommendationCount: recommendations.length,
      };
    })(),
    (async () => {
      const publications = await runDuePublications();
      const syncedPublicationIds = await syncRecentPublicationMetrics();

      return {
        publishedCount: publications.length,
        syncedPerformanceCount: syncedPublicationIds.length,
      };
    })(),
  ]);

  const errors: DailyMaintenanceResult["errors"] = [];

  if (trendRefreshResult.status === "rejected") {
    errors.push({
      step: "trends-and-recommendations",
      message:
        trendRefreshResult.reason instanceof Error
          ? trendRefreshResult.reason.message
          : "Trend refresh failed.",
    });
  }

  if (publishingResult.status === "rejected") {
    errors.push({
      step: "publishing-and-performance",
      message:
        publishingResult.reason instanceof Error
          ? publishingResult.reason.message
          : "Publishing sync failed.",
    });
  }

  for (const error of errors) {
    await logOperationalEvent({
      severity: "error",
      source: "daily_maintenance",
      operation: error.step,
      message: error.message,
    });
  }

  return {
    completedAt: new Date().toISOString(),
    localTrendCount:
      trendRefreshResult.status === "fulfilled"
        ? trendRefreshResult.value.localTrendCount
        : 0,
    globalTrendCount:
      trendRefreshResult.status === "fulfilled"
        ? trendRefreshResult.value.globalTrendCount
        : 0,
    recommendationCount:
      trendRefreshResult.status === "fulfilled"
        ? trendRefreshResult.value.recommendationCount
        : 0,
    publishedCount:
      publishingResult.status === "fulfilled"
        ? publishingResult.value.publishedCount
        : 0,
    syncedPerformanceCount:
      publishingResult.status === "fulfilled"
        ? publishingResult.value.syncedPerformanceCount
        : 0,
    errors,
  };
}
