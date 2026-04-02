import {
  ContentTone,
  ContentType,
  PublishingChannel,
  TrendLifecycle,
  TrendStatus,
  type Recommendation,
  type TrendSignal,
} from "@prisma/client";

import { getAnalyticsSnapshot } from "@/lib/analytics/service";
import { getCalendarSnapshot } from "@/lib/calendar/service";
import { prisma } from "@/lib/db";

type RecommendationDraft = Omit<Recommendation, "id" | "createdAt">;

const promotionalTypes = new Set<ContentType>([
  ContentType.AD_COPY,
  ContentType.PRODUCT_PROMOTION,
  ContentType.FACEBOOK_POST,
  ContentType.WHATSAPP_MESSAGE,
  ContentType.CAPTION,
]);

export function buildRecommendationDrafts(input: {
  trends: TrendSignal[];
  topThemes: Array<{ themeLabel: string; averageEngagement: number; leads: number }>;
  productPriorities: Array<{ name: string; priority: number }>;
  goals: Array<{ title: string; priority: number }>;
}) {
  const bestGoal = input.goals.sort((left, right) => right.priority - left.priority)[0];
  const bestProduct = input.productPriorities.sort(
    (left, right) => right.priority - left.priority,
  )[0];

  return input.trends.slice(0, 6).map((trend, index) => {
    const theme = input.topThemes[index % Math.max(input.topThemes.length, 1)];
    const contentType =
      index % 3 === 0
        ? ContentType.EDUCATIONAL
        : index % 3 === 1
          ? ContentType.WHATSAPP_MESSAGE
          : ContentType.PRODUCT_PROMOTION;
    const channel =
      contentType === ContentType.WHATSAPP_MESSAGE
        ? PublishingChannel.WHATSAPP
        : PublishingChannel.FACEBOOK;
    const tone =
      trend.region === "LOCAL" ? ContentTone.LOCALIZED : ContentTone.PROFESSIONAL;

    return {
      title: `${trend.topic}: build a ${contentType === ContentType.WHATSAPP_MESSAGE ? "WhatsApp" : "Facebook"} angle around ${bestProduct?.name ?? "your priority product"}`,
      rationale: [
        `${trend.title} is scoring well for freshness and brand fit.`,
        bestGoal ? `This supports the goal "${bestGoal.title}".` : null,
        theme
          ? `Your ${theme.themeLabel} theme is already converting with ${theme.averageEngagement.toFixed(1)}% engagement.`
          : null,
      ]
        .filter(Boolean)
        .join(" "),
      contentType,
      tone,
      channel,
      priorityScore: Math.round(
        trend.totalScore * 0.6 +
          (bestProduct?.priority ?? 60) * 0.2 +
          (theme?.leads ?? 20) * 0.2,
      ),
      basedOn: `Trend: ${trend.title} | Product: ${bestProduct?.name ?? "General"} | Theme: ${theme?.themeLabel ?? "No historical theme"}`,
    } satisfies RecommendationDraft;
  });
}

export async function getRecommendations() {
  return prisma.recommendation.findMany({
    orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
  });
}

export async function refreshRecommendations() {
  const [trends, products, goals, publications] = await Promise.all([
    prisma.trendSignal.findMany({
      where: {
        status: {
          in: [TrendStatus.RISING, TrendStatus.WATCH],
        },
        lifecycle: {
          in: [TrendLifecycle.EMERGING, TrendLifecycle.ACTIVE],
        },
      },
      orderBy: [{ totalScore: "desc" }, { freshnessScore: "desc" }],
      take: 8,
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { priority: "desc" },
      select: { name: true, priority: true },
    }),
    prisma.strategicGoal.findMany({
      where: { active: true },
      orderBy: { priority: "desc" },
      select: { title: true, priority: true },
    }),
    prisma.publication.findMany({
      include: { metrics: true },
      where: {
        status: {
          in: ["PUBLISHED", "SIMULATED"],
        },
      },
    }),
  ]);

  const themeMap = new Map<
    string,
    { themeLabel: string; totalEngagement: number; leads: number; count: number }
  >();

  for (const publication of publications) {
    for (const metric of publication.metrics) {
      const existing = themeMap.get(metric.themeLabel) ?? {
        themeLabel: metric.themeLabel,
        totalEngagement: 0,
        leads: 0,
        count: 0,
      };

      existing.totalEngagement += metric.engagementRate;
      existing.leads += metric.leads;
      existing.count += 1;

      themeMap.set(metric.themeLabel, existing);
    }
  }

  const topThemes = [...themeMap.values()]
    .map((theme) => ({
      themeLabel: theme.themeLabel,
      averageEngagement: theme.totalEngagement / Math.max(theme.count, 1),
      leads: theme.leads,
    }))
    .sort((left, right) => right.leads - left.leads);

  const recommendations = buildRecommendationDrafts({
    trends,
    topThemes,
    productPriorities: products,
    goals,
  });

  await prisma.$transaction([
    prisma.recommendation.deleteMany(),
    prisma.recommendation.createMany({ data: recommendations }),
  ]);

  return getRecommendations();
}

export async function getPlanningAssistantAnswer(question: string) {
  const normalizedQuestion = question.trim().toLowerCase();

  const [recommendations, analytics, calendar, products] = await Promise.all([
    getRecommendations(),
    getAnalyticsSnapshot(),
    getCalendarSnapshot(),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { priority: "desc" },
    }),
  ]);

  const topRecommendation = recommendations[0];
  const topTheme = analytics.themePerformance[0];
  const topProduct = analytics.productPerformance[0];
  const bestWindow = analytics.bestPostingWindows[0];
  const scheduledPromotionalShare =
    calendar.days.flatMap((day) => day.items).filter((item) =>
      promotionalTypes.has(item.contentType),
    ).length / Math.max(calendar.days.flatMap((day) => day.items).length, 1);

  const underPromotedProduct =
    products.find(
      (product) =>
        !calendar.days
          .flatMap((day) => day.items)
          .some((item) => item.productId === product.id) &&
        product.name !== topProduct?.productName,
    ) ?? products[0];

  if (normalizedQuestion.includes("week")) {
    return {
      headline: "Recommended weekly content plan",
      explanation:
        "This plan balances promotions with trust and education so the calendar stays useful and not overly sales-heavy.",
      actions: [
        topRecommendation
          ? `Lead the week with: ${topRecommendation.title}.`
          : "Start with your strongest current recommendation.",
        `Add one educational or trust-building post to support the winning theme "${topTheme?.themeLabel ?? "financial education"}".`,
        underPromotedProduct
          ? `Give ${underPromotedProduct.name} at least one focused post so high-priority products do not stay under-promoted.`
          : "Review product coverage and boost anything not yet in the schedule.",
        bestWindow
          ? `Prefer posting around ${bestWindow.label}, since that window is currently outperforming others.`
          : "Use recent engagement data to confirm the best posting window.",
      ],
    };
  }

  if (
    normalizedQuestion.includes("product") ||
    normalizedQuestion.includes("promote")
  ) {
    return {
      headline: "Product promotion guidance",
      explanation:
        "The system is looking for product gaps, performance leaders, and what is already overrepresented in the queue.",
      actions: [
        topProduct
          ? `${topProduct.productName} is the current performance leader and can anchor a proven campaign.`
          : "Use your current best-performing product as the anchor.",
        underPromotedProduct
          ? `${underPromotedProduct.name} looks under-promoted right now and is a good candidate for the next content sequence.`
          : "Review products that are not yet visible in the current calendar.",
        topRecommendation
          ? `Use this recommendation as the starting angle: ${topRecommendation.title}.`
          : "Generate a fresh recommendation batch before deciding.",
      ],
    };
  }

  return {
    headline: "Smart planning answer",
    explanation:
      "This recommendation blends live trends, what is already scheduled, and what has performed well for Sika Prime Loans.",
    actions: [
      topRecommendation
        ? `Priority suggestion: ${topRecommendation.title}.`
        : "Refresh recommendations to get a stronger next-step suggestion.",
      scheduledPromotionalShare > 0.6
        ? "The queue is currently heavy on promotional content. Add more trust-building or educational posts next."
        : "The content mix is reasonably balanced. Keep combining promotion with education.",
      bestWindow
        ? `Your best posting window currently looks like ${bestWindow.label}.`
        : "Gather more published results to sharpen timing recommendations.",
      calendar.warnings[0]?.message ??
        "No urgent scheduling risk is currently flagged.",
    ],
  };
}
