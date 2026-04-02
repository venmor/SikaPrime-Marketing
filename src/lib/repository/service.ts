import { ContentType, PublishingChannel, WorkflowStage } from "@prisma/client";

import { prisma } from "@/lib/db";

type RepositoryFilters = {
  query?: string;
  channel?: string;
  productId?: string;
  contentType?: string;
  performance?: "all" | "high" | "medium" | "low";
};

export async function getPublishedRepository(filters: RepositoryFilters = {}) {
  const items = await prisma.contentItem.findMany({
    where: {
      stage: WorkflowStage.PUBLISHED,
      ...(filters.query
        ? {
            OR: [
              { title: { contains: filters.query } },
              { brief: { contains: filters.query } },
              { themeLabel: { contains: filters.query } },
              { campaignLabel: { contains: filters.query } },
            ],
          }
        : {}),
      ...(filters.channel
        ? { channel: filters.channel as PublishingChannel }
        : {}),
      ...(filters.productId ? { productId: filters.productId } : {}),
      ...(filters.contentType
        ? { contentType: filters.contentType as ContentType }
        : {}),
    },
    include: {
      product: true,
      trend: true,
      publications: {
        include: {
          metrics: true,
        },
        orderBy: {
          publishedAt: "desc",
        },
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  const hydrated = items.map((item) => {
    const metrics = item.publications.flatMap((publication) => publication.metrics);
    const leads = metrics.reduce((sum, metric) => sum + metric.leads, 0);
    const impressions = metrics.reduce((sum, metric) => sum + metric.impressions, 0);
    const averageEngagementRate =
      metrics.reduce((sum, metric) => sum + metric.engagementRate, 0) /
      Math.max(metrics.length, 1);

    const performanceLevel =
      leads >= 30 || averageEngagementRate >= 5
        ? "high"
        : leads >= 10 || averageEngagementRate >= 2.5
          ? "medium"
          : "low";

    return {
      ...item,
      repositoryMetrics: {
        leads,
        impressions,
        averageEngagementRate,
        performanceLevel,
      },
    };
  });

  return hydrated.filter((item) =>
    filters.performance && filters.performance !== "all"
      ? item.repositoryMetrics.performanceLevel === filters.performance
      : true,
  );
}
