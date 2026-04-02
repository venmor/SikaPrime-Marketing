import { ContentType, WorkflowStage } from "@prisma/client";
import { format } from "date-fns";

import { prisma } from "@/lib/db";

const promotionalTypes = new Set<ContentType>([
  ContentType.AD_COPY,
  ContentType.PRODUCT_PROMOTION,
  ContentType.FACEBOOK_POST,
  ContentType.WHATSAPP_MESSAGE,
  ContentType.CAPTION,
]);

export async function getCalendarSnapshot() {
  const [queueItems, analyticsSource] = await Promise.all([
    prisma.contentItem.findMany({
      where: {
        stage: {
          in: [WorkflowStage.APPROVED, WorkflowStage.SCHEDULED],
        },
      },
      include: {
        product: true,
        trend: true,
        owner: true,
      },
      orderBy: [{ scheduledFor: "asc" }, { updatedAt: "asc" }],
    }),
    prisma.publication.findMany({
      where: {
        publishedAt: {
          not: null,
        },
      },
      include: {
        metrics: true,
      },
    }),
  ]);

  const scheduledItems = queueItems.filter((item) => item.scheduledFor);
  const groupedByDay = new Map<string, typeof scheduledItems>();

  for (const item of scheduledItems) {
    const dayKey = format(item.scheduledFor!, "yyyy-MM-dd");
    const current = groupedByDay.get(dayKey) ?? [];
    current.push(item);
    groupedByDay.set(dayKey, current);
  }

  const warnings: Array<{ level: "warning" | "info"; message: string }> = [];

  for (const [day, items] of groupedByDay) {
    const themeCounts = new Map<string, number>();
    const productCounts = new Map<string, number>();

    for (const item of items) {
      if (item.themeLabel) {
        themeCounts.set(item.themeLabel, (themeCounts.get(item.themeLabel) ?? 0) + 1);
      }
      if (item.product?.name) {
        productCounts.set(item.product.name, (productCounts.get(item.product.name) ?? 0) + 1);
      }

      if (item.trend && ["SATURATED", "DEAD"].includes(item.trend.lifecycle)) {
        warnings.push({
          level: "warning",
          message: `"${item.title}" is scheduled with a ${item.trend.lifecycle.toLowerCase()} trend and may need a fresher angle.`,
        });
      }
    }

    for (const [themeLabel, count] of themeCounts) {
      if (count > 1) {
        warnings.push({
          level: "warning",
          message: `${day} has repeated theme usage for "${themeLabel}". Consider more variety.`,
        });
      }
    }

    for (const [productName, count] of productCounts) {
      if (count > 1) {
        warnings.push({
          level: "warning",
          message: `${day} repeats "${productName}" multiple times. This may feel overly promotional.`,
        });
      }
    }
  }

  const promotionalStreak = scheduledItems.reduce(
    (state, item) => {
      const currentIsPromotional = promotionalTypes.has(item.contentType);
      const nextStreak = currentIsPromotional ? state.streak + 1 : 0;

      if (nextStreak >= 3 && !state.warned) {
        warnings.push({
          level: "warning",
          message:
            "Three promotional posts are scheduled in a row. Add educational or trust-building content to rebalance the calendar.",
        });
      }

      return {
        streak: nextStreak,
        warned: state.warned || nextStreak >= 3,
      };
    },
    { streak: 0, warned: false },
  );

  void promotionalStreak;

  const channelCounts = scheduledItems.reduce(
    (accumulator, item) => {
      accumulator[item.channel] = (accumulator[item.channel] ?? 0) + 1;
      return accumulator;
    },
    {} as Record<string, number>,
  );

  const totalScheduled = scheduledItems.length;
  for (const [channel, count] of Object.entries(channelCounts)) {
    if (totalScheduled > 0 && count / totalScheduled > 0.75) {
      warnings.push({
        level: "info",
        message: `${channel} currently dominates the schedule. Consider balancing content across platforms.`,
      });
    }
  }

  const hourStats = new Map<
    number,
    { hour: number; leads: number; engagementRate: number; count: number }
  >();
  for (const publication of analyticsSource) {
    if (!publication.publishedAt) continue;
    const hour = publication.publishedAt.getHours();
    const current = hourStats.get(hour) ?? {
      hour,
      leads: 0,
      engagementRate: 0,
      count: 0,
    };
    current.count += 1;
    for (const metric of publication.metrics) {
      current.leads += metric.leads;
      current.engagementRate += metric.engagementRate;
    }
    hourStats.set(hour, current);
  }

  const recommendedWindows = [...hourStats.values()]
    .sort(
      (left, right) =>
        right.leads + right.engagementRate - (left.leads + left.engagementRate),
    )
    .slice(0, 3)
    .map((window) => ({
      label: `${String(window.hour).padStart(2, "0")}:00`,
      supportingReason: `Based on prior posts, this window has strong engagement and lead activity.`,
    }));

  return {
    days: [...groupedByDay.entries()].map(([date, items]) => ({
      date,
      items,
    })),
    warnings,
    recommendedWindows,
    unscheduledApproved: queueItems.filter((item) => item.stage === WorkflowStage.APPROVED),
  };
}
