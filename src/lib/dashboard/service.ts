import { WorkflowStage } from "@prisma/client";

import { getAnalyticsSnapshot } from "@/lib/analytics/service";
import { getRecentActivity } from "@/lib/audit/service";
import { getCalendarSnapshot } from "@/lib/calendar/service";
import { prisma } from "@/lib/db";
import { getRecommendations } from "@/lib/engines/recommendations/service";
import { getTrendCollections } from "@/lib/engines/trends/service";

export async function getDashboardSnapshot() {
  const [
    trends,
    analytics,
    recommendations,
    contentItems,
    scheduledItems,
    recentActivity,
    calendar,
  ] =
    await Promise.all([
      getTrendCollections(),
      getAnalyticsSnapshot(),
      getRecommendations(),
      prisma.contentItem.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
          owner: true,
          trend: true,
          product: true,
        },
      }),
      prisma.contentItem.findMany({
        where: {
          stage: {
            in: [WorkflowStage.SCHEDULED, WorkflowStage.IN_REVIEW],
          },
        },
        orderBy: [{ scheduledFor: "asc" }, { updatedAt: "desc" }],
        take: 5,
      }),
      getRecentActivity(),
      getCalendarSnapshot(),
    ]);

  const workflowCounts = await prisma.contentItem.groupBy({
    by: ["stage"],
    _count: true,
  });

  const countLookup = new Map(
    workflowCounts.map((row) => [row.stage, row._count]),
  );

  return {
    stats: [
      {
        label: "Local Trends",
        value: trends.local.filter((trend) => trend.status === "RISING").length,
      },
      {
        label: "In Review",
        value: countLookup.get(WorkflowStage.IN_REVIEW) ?? 0,
      },
      {
        label: "Revisions",
        value: countLookup.get(WorkflowStage.NEEDS_REVISION) ?? 0,
      },
      {
        label: "Scheduled",
        value: countLookup.get(WorkflowStage.SCHEDULED) ?? 0,
      },
    ],
    topLocalTrend: trends.local[0] ?? null,
    topGlobalTrend: trends.global[0] ?? null,
    recommendations: recommendations.slice(0, 4),
    recentContent: contentItems,
    scheduledItems,
    recentActivity,
    calendarWarnings: calendar.warnings.slice(0, 3),
    bestPostingWindow: analytics.bestPostingWindows[0] ?? null,
  };
}
