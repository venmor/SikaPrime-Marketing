import { PublicationStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function getAnalyticsSnapshot() {
  const publications = await prisma.publication.findMany({
    where: {
      status: {
        in: [PublicationStatus.PUBLISHED, PublicationStatus.SIMULATED],
      },
    },
    include: {
      metrics: true,
      contentItem: {
        include: {
          product: true,
          trend: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totals = publications.flatMap((publication) => publication.metrics).reduce(
    (accumulator, metric) => {
      accumulator.impressions += metric.impressions;
      accumulator.clicks += metric.clicks;
      accumulator.leads += metric.leads;
      accumulator.engagementRate += metric.engagementRate;
      accumulator.count += 1;
      return accumulator;
    },
    { impressions: 0, clicks: 0, leads: 0, engagementRate: 0, count: 0 },
  );

  const themeMap = new Map<
    string,
    { themeLabel: string; engagementRate: number; leads: number; count: number }
  >();
  const channelMap = new Map<
    string,
    { channel: string; impressions: number; leads: number; engagementRate: number; count: number }
  >();
  const productMap = new Map<
    string,
    { productName: string; leads: number; impressions: number; count: number }
  >();
  const postingHourMap = new Map<
    number,
    { hour: number; engagementRate: number; leads: number; count: number }
  >();
  const trendMap = new Map<
    string,
    { trendTitle: string; leads: number; engagementRate: number; count: number }
  >();

  for (const publication of publications) {
    for (const metric of publication.metrics) {
      const theme = themeMap.get(metric.themeLabel) ?? {
        themeLabel: metric.themeLabel,
        engagementRate: 0,
        leads: 0,
        count: 0,
      };
      theme.engagementRate += metric.engagementRate;
      theme.leads += metric.leads;
      theme.count += 1;
      themeMap.set(metric.themeLabel, theme);

      const channel = channelMap.get(publication.channel) ?? {
        channel: publication.channel,
        impressions: 0,
        leads: 0,
        engagementRate: 0,
        count: 0,
      };
      channel.impressions += metric.impressions;
      channel.leads += metric.leads;
      channel.engagementRate += metric.engagementRate;
      channel.count += 1;
      channelMap.set(publication.channel, channel);

      if (publication.contentItem.product?.name) {
        const product = productMap.get(publication.contentItem.product.name) ?? {
          productName: publication.contentItem.product.name,
          leads: 0,
          impressions: 0,
          count: 0,
        };
        product.leads += metric.leads;
        product.impressions += metric.impressions;
        product.count += 1;
        productMap.set(publication.contentItem.product.name, product);
      }

      if (publication.publishedAt) {
        const hour = publication.publishedAt.getHours();
        const postingWindow = postingHourMap.get(hour) ?? {
          hour,
          engagementRate: 0,
          leads: 0,
          count: 0,
        };
        postingWindow.engagementRate += metric.engagementRate;
        postingWindow.leads += metric.leads;
        postingWindow.count += 1;
        postingHourMap.set(hour, postingWindow);
      }

      if (publication.contentItem.trend?.title) {
        const trend = trendMap.get(publication.contentItem.trend.title) ?? {
          trendTitle: publication.contentItem.trend.title,
          leads: 0,
          engagementRate: 0,
          count: 0,
        };
        trend.leads += metric.leads;
        trend.engagementRate += metric.engagementRate;
        trend.count += 1;
        trendMap.set(publication.contentItem.trend.title, trend);
      }
    }
  }

  const themePerformance = [...themeMap.values()]
    .map((theme) => ({
      themeLabel: theme.themeLabel,
      averageEngagementRate: theme.engagementRate / Math.max(theme.count, 1),
      leads: theme.leads,
    }))
    .sort((left, right) => right.leads - left.leads);

  const channelPerformance = [...channelMap.values()].map((channel) => ({
    channel: channel.channel,
    impressions: channel.impressions,
    leads: channel.leads,
    averageEngagementRate: channel.engagementRate / Math.max(channel.count, 1),
  }));

  const productPerformance = [...productMap.values()]
    .sort((left, right) => right.leads - left.leads)
    .map((product) => ({
      productName: product.productName,
      leads: product.leads,
      impressions: product.impressions,
    }));

  const bestPostingWindows = [...postingHourMap.values()]
    .sort(
      (left, right) =>
        right.leads + right.engagementRate - (left.leads + left.engagementRate),
    )
    .slice(0, 3)
    .map((window) => ({
      label: `${String(window.hour).padStart(2, "0")}:00`,
      leads: window.leads,
      averageEngagementRate: window.engagementRate / Math.max(window.count, 1),
    }));

  const trendPerformance = [...trendMap.values()]
    .sort((left, right) => right.leads - left.leads)
    .map((trend) => ({
      trendTitle: trend.trendTitle,
      leads: trend.leads,
      averageEngagementRate: trend.engagementRate / Math.max(trend.count, 1),
    }));

  const insights = [
    themePerformance[0]
      ? `${themePerformance[0].themeLabel} is your strongest theme so far, leading on engagement and lead volume.`
      : "More published performance data is needed to identify winning themes.",
    productPerformance[0]
      ? `${productPerformance[0].productName} is currently attracting the most lead interest.`
      : "No product-level leader is available yet.",
    bestPostingWindows[0]
      ? `Posts around ${bestPostingWindows[0].label} are currently producing the best response pattern.`
      : "No clear best posting window is available yet.",
  ];

  return {
    totals: {
      impressions: totals.impressions,
      clicks: totals.clicks,
      leads: totals.leads,
      averageEngagementRate:
        totals.count > 0 ? totals.engagementRate / totals.count : 0,
    },
    themePerformance,
    channelPerformance,
    productPerformance,
    bestPostingWindows,
    trendPerformance,
    insights,
    timeline: publications
      .flatMap((publication) =>
        publication.metrics.map((metric) => ({
          label: publication.contentItem.title,
          impressions: metric.impressions,
          leads: metric.leads,
          engagementRate: metric.engagementRate,
        })),
      )
      .slice(0, 6)
      .reverse(),
  };
}
