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
import {
  buildAssistantOpportunities,
  getContentLaneLabel,
  type AssistantOpportunity,
  type ContentBalanceSnapshot,
  type ContentLane,
} from "@/lib/engines/content/strategy";

type RecommendationDraft = Omit<Recommendation, "id" | "createdAt">;

const promotionalTypes = new Set<ContentType>([
  ContentType.AD_COPY,
  ContentType.PRODUCT_PROMOTION,
  ContentType.FACEBOOK_POST,
  ContentType.WHATSAPP_MESSAGE,
  ContentType.CAPTION,
]);

const laneToContentType: Record<ContentLane, ContentType> = {
  PROMOTIONAL: ContentType.PRODUCT_PROMOTION,
  EDUCATIONAL: ContentType.EDUCATIONAL,
  TRUST_BUILDING: ContentType.TRUST_BUILDING,
  YOUTH_EMPOWERMENT: ContentType.FACEBOOK_POST,
  VALUE_BASED: ContentType.FACEBOOK_POST,
  ENGAGEMENT: ContentType.FACEBOOK_POST,
  SEASONAL: ContentType.FACEBOOK_POST,
  CAMPAIGN_SUPPORT: ContentType.CAPTION,
  COMMUNITY: ContentType.FACEBOOK_POST,
  INSPIRATIONAL: ContentType.FACEBOOK_POST,
};

const laneToTone: Record<ContentLane, ContentTone> = {
  PROMOTIONAL: ContentTone.PERSUASIVE,
  EDUCATIONAL: ContentTone.PROFESSIONAL,
  TRUST_BUILDING: ContentTone.PROFESSIONAL,
  YOUTH_EMPOWERMENT: ContentTone.YOUTHFUL,
  VALUE_BASED: ContentTone.PROFESSIONAL,
  ENGAGEMENT: ContentTone.LOCALIZED,
  SEASONAL: ContentTone.LOCALIZED,
  CAMPAIGN_SUPPORT: ContentTone.PERSUASIVE,
  COMMUNITY: ContentTone.LOCALIZED,
  INSPIRATIONAL: ContentTone.PROFESSIONAL,
};

function dedupeRecommendationDrafts(drafts: RecommendationDraft[]) {
  const bestByTitle = new Map<string, RecommendationDraft>();

  for (const draft of drafts) {
    const key = draft.title.toLowerCase();
    const existing = bestByTitle.get(key);

    if (!existing || draft.priorityScore > existing.priorityScore) {
      bestByTitle.set(key, draft);
    }
  }

  return [...bestByTitle.values()].sort(
    (left, right) => right.priorityScore - left.priorityScore,
  );
}

function buildTrendRecommendationDraft(input: {
  trend: TrendSignal;
  bestProduct?: { name: string; priority: number };
  bestGoal?: { title: string; priority: number };
  theme?: { themeLabel: string; averageEngagement: number; leads: number };
}) {
  const contentType =
    input.trend.region === "LOCAL"
      ? ContentType.FACEBOOK_POST
      : ContentType.EDUCATIONAL;
  const channel =
    input.trend.topic.toLowerCase().includes("digital") ||
    input.trend.topic.toLowerCase().includes("conversation")
      ? PublishingChannel.FACEBOOK
      : PublishingChannel.WHATSAPP;
  const tone =
    input.trend.region === "LOCAL" ? ContentTone.LOCALIZED : ContentTone.PROFESSIONAL;

  return {
    title: `Adapt "${input.trend.title}" into a safe ${channel === PublishingChannel.WHATSAPP ? "WhatsApp" : "Facebook"} angle`,
    rationale: [
      `${input.trend.title} is active enough to use as a hook, but the message should still stay constructive and brand-safe.`,
      input.bestGoal
        ? `This supports the goal "${input.bestGoal.title}".`
        : null,
      input.bestProduct
        ? `Anchor the angle around ${input.bestProduct.name} without forcing the trend.`
        : null,
      input.theme
        ? `It can borrow from the already-performing "${input.theme.themeLabel}" theme.`
        : null,
    ]
      .filter(Boolean)
      .join(" "),
    contentType,
    tone,
    channel,
    priorityScore: Math.round(
      input.trend.totalScore * 0.6 +
        (input.bestProduct?.priority ?? 60) * 0.2 +
        (input.theme?.leads ?? 20) * 0.2,
    ),
    basedOn: `Source: Trend | Trend: ${input.trend.title} | Product: ${input.bestProduct?.name ?? "General"} | Theme: ${input.theme?.themeLabel ?? "No historical theme"}`,
  } satisfies RecommendationDraft;
}

function buildOpportunityRecommendationDraft(input: {
  opportunity: AssistantOpportunity;
  bestProduct?: { name: string; priority: number };
  bestGoal?: { title: string; priority: number };
  theme?: { themeLabel: string; averageEngagement: number; leads: number };
}) {
  const contentType = laneToContentType[input.opportunity.lane];

  return {
    title: input.opportunity.title,
    rationale: [
      input.opportunity.summary,
      input.opportunity.rationale,
      input.bestGoal
        ? `This supports the goal "${input.bestGoal.title}".`
        : null,
      input.theme
        ? `The "${input.theme.themeLabel}" theme has already shown traction.`
        : null,
    ]
      .filter(Boolean)
      .join(" "),
    contentType,
    tone: input.opportunity.tone,
    channel: input.opportunity.channel,
    priorityScore: Math.round(
      input.opportunity.score * 0.65 +
        (input.bestProduct?.priority ?? 60) * 0.15 +
        (input.theme?.leads ?? 20) * 0.2,
    ),
    basedOn: `Source: ${input.opportunity.source} | Lane: ${getContentLaneLabel(input.opportunity.lane)} | Product: ${input.bestProduct?.name ?? "General"} | Theme: ${input.theme?.themeLabel ?? "No historical theme"}`,
  } satisfies RecommendationDraft;
}

function buildBalanceRecommendationDraft(input: {
  lane: ContentLane;
  balance: ContentBalanceSnapshot;
  bestGoal?: { title: string; priority: number };
  underPromotedProduct?: { name: string; priority: number };
}) {
  return {
    title: `Rebalance the content mix with a ${getContentLaneLabel(input.lane).toLowerCase()} post`,
    rationale: [
      input.balance.guidance,
      input.underPromotedProduct
        ? `${input.underPromotedProduct.name} is still under-promoted and can be featured softly in this lane.`
        : null,
      input.bestGoal
        ? `This still supports "${input.bestGoal.title}" while reducing repetition.`
        : null,
    ]
      .filter(Boolean)
      .join(" "),
    contentType: laneToContentType[input.lane],
    tone: laneToTone[input.lane],
    channel: PublishingChannel.FACEBOOK,
    priorityScore: Math.round(
      74 + (input.balance.promotionalShare >= 0.55 ? 12 : 4),
    ),
    basedOn: `Source: Balance | Lane: ${getContentLaneLabel(input.lane)} | Guidance: ${input.balance.guidance}`,
  } satisfies RecommendationDraft;
}

export function buildRecommendationDrafts(input: {
  trends: TrendSignal[];
  opportunities: AssistantOpportunity[];
  balance: ContentBalanceSnapshot;
  topThemes: Array<{ themeLabel: string; averageEngagement: number; leads: number }>;
  productPriorities: Array<{ name: string; priority: number }>;
  goals: Array<{ title: string; priority: number }>;
  underPromotedProduct?: { name: string; priority: number };
}) {
  const bestGoal = [...input.goals].sort((left, right) => right.priority - left.priority)[0];
  const bestProduct = [...input.productPriorities].sort(
    (left, right) => right.priority - left.priority,
  )[0];

  const trendDrafts = input.trends.slice(0, 4).map((trend, index) =>
    buildTrendRecommendationDraft({
      trend,
      bestProduct,
      bestGoal,
      theme: input.topThemes[index % Math.max(input.topThemes.length, 1)],
    }),
  );

  const proactiveDrafts = input.opportunities.slice(0, 5).map((opportunity, index) =>
    buildOpportunityRecommendationDraft({
      opportunity,
      bestProduct: input.productPriorities[index % Math.max(input.productPriorities.length, 1)],
      bestGoal,
      theme: input.topThemes[index % Math.max(input.topThemes.length, 1)],
    }),
  );

  const balanceDrafts = input.balance.recommendedLanes.slice(0, 2).map((lane) =>
    buildBalanceRecommendationDraft({
      lane,
      balance: input.balance,
      bestGoal,
      underPromotedProduct: input.underPromotedProduct,
    }),
  );

  return dedupeRecommendationDrafts([
    ...proactiveDrafts,
    ...trendDrafts,
    ...balanceDrafts,
  ]).slice(0, 8);
}

export async function getRecommendations() {
  return prisma.recommendation.findMany({
    orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
  });
}

export async function refreshRecommendations() {
  const [trends, profile, recentContent, analytics, calendar] = await Promise.all([
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
    prisma.businessProfile.findUnique({
      where: { id: 1 },
      include: {
        products: {
          where: { active: true },
          orderBy: { priority: "desc" },
        },
        audienceSegments: {
          orderBy: { priority: "desc" },
        },
        offers: {
          where: { active: true },
          orderBy: { priority: "desc" },
        },
        goals: {
          where: { active: true },
          orderBy: { priority: "desc" },
        },
      },
    }),
    prisma.contentItem.findMany({
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take: 24,
      select: {
        title: true,
        objective: true,
        themeLabel: true,
        contentType: true,
        channel: true,
      },
    }),
    getAnalyticsSnapshot(),
    getCalendarSnapshot(),
  ]);

  if (!profile) {
    throw new Error("Business profile has not been configured yet.");
  }

  const topThemes = analytics.themePerformance.map((theme) => ({
    themeLabel: theme.themeLabel,
    averageEngagement: theme.averageEngagementRate,
    leads: theme.leads,
  }));

  const assistant = buildAssistantOpportunities({
    products: profile.products,
    audiences: profile.audienceSegments,
    goals: profile.goals,
    offers: profile.offers,
    recentContent,
  });

  const scheduledProductNames = new Set(
    calendar.days
      .flatMap((day) => day.items)
      .map((item) => item.product?.name)
      .filter((value): value is string => Boolean(value)),
  );

  const underPromotedProduct =
    profile.products.find((product) => !scheduledProductNames.has(product.name)) ??
    profile.products[0];

  const recommendations = buildRecommendationDrafts({
    trends,
    opportunities: assistant.opportunities,
    balance: assistant.balance,
    topThemes,
    productPriorities: profile.products.map((product) => ({
      name: product.name,
      priority: product.priority,
    })),
    goals: profile.goals.map((goal) => ({
      title: goal.title,
      priority: goal.priority,
    })),
    underPromotedProduct: underPromotedProduct
      ? {
          name: underPromotedProduct.name,
          priority: underPromotedProduct.priority,
        }
      : undefined,
  });

  await prisma.$transaction([
    prisma.recommendation.deleteMany(),
    prisma.recommendation.createMany({ data: recommendations }),
  ]);

  return getRecommendations();
}

export async function getPlanningAssistantAnswer(question: string) {
  const normalizedQuestion = question.trim().toLowerCase();

  const [recommendations, analytics, calendar, profile, recentContent] =
    await Promise.all([
      getRecommendations(),
      getAnalyticsSnapshot(),
      getCalendarSnapshot(),
      prisma.businessProfile.findUnique({
        where: { id: 1 },
        include: {
          products: {
            where: { active: true },
            orderBy: { priority: "desc" },
          },
          audienceSegments: {
            orderBy: { priority: "desc" },
          },
          offers: {
            where: { active: true },
            orderBy: { priority: "desc" },
          },
          goals: {
            where: { active: true },
            orderBy: { priority: "desc" },
          },
        },
      }),
      prisma.contentItem.findMany({
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        take: 24,
        select: {
          title: true,
          objective: true,
          themeLabel: true,
          contentType: true,
          channel: true,
        },
      }),
    ]);

  if (!profile) {
    return {
      headline: "Planning assistant unavailable",
      explanation:
        "The business profile needs to be configured before planning guidance can be generated.",
      actions: ["Complete the knowledge base setup first."],
    };
  }

  const assistant = buildAssistantOpportunities({
    products: profile.products,
    audiences: profile.audienceSegments,
    goals: profile.goals,
    offers: profile.offers,
    recentContent,
  });

  const topRecommendation = recommendations[0];
  const topTheme = analytics.themePerformance[0];
  const topProduct = analytics.productPerformance[0];
  const bestWindow = analytics.bestPostingWindows[0];
  const topOpportunity = assistant.opportunities[0];
  const topOccasion = assistant.occasionOpportunities[0];
  const scheduledPromotionalShare =
    calendar.days.flatMap((day) => day.items).filter((item) =>
      promotionalTypes.has(item.contentType),
    ).length / Math.max(calendar.days.flatMap((day) => day.items).length, 1);

  const underPromotedProduct =
    profile.products.find(
      (product) =>
        !calendar.days
          .flatMap((day) => day.items)
          .some((item) => item.productId === product.id) &&
        product.name !== topProduct?.productName,
    ) ?? profile.products[0];

  if (normalizedQuestion.includes("week")) {
    return {
      headline: "Recommended weekly content plan",
      explanation:
        "This plan balances proactive, trend-adaptive, and soft-sell content so the calendar stays active without becoming repetitive.",
      actions: [
        topRecommendation
          ? `Lead with: ${topRecommendation.title}.`
          : "Start with the strongest current recommendation.",
        topOccasion
          ? `Use the active occasion angle "${topOccasion.title}" for one timely post this week.`
          : "Use one proactive seasonal or always-on post even if no strong trend is available.",
        assistant.balance.promotionalShare > 0.55
          ? "The mix is sales-heavy right now. Add one educational or trust-building post next."
          : `Add one softer support post around "${topTheme?.themeLabel ?? "financial education"}" to keep the mix healthy.`,
        underPromotedProduct
          ? `Give ${underPromotedProduct.name} at least one focused but non-repetitive appearance.`
          : "Review product coverage and give underused products a slot.",
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
        "The system is checking product gaps, historical performance, and whether softer support content should come before the next direct promotion.",
      actions: [
        topProduct
          ? `${topProduct.productName} is the current performance leader and can anchor a proven campaign.`
          : "Use your current best-performing product as the anchor.",
        underPromotedProduct
          ? `${underPromotedProduct.name} looks under-promoted right now and is a good candidate for the next content sequence.`
          : "Review products that are not yet visible in the current calendar.",
        topOpportunity
          ? `Support the product push with a ${getContentLaneLabel(topOpportunity.lane).toLowerCase()} angle such as "${topOpportunity.title}".`
          : "Support the next product push with an educational or trust-led companion post.",
      ],
    };
  }

  if (
    normalizedQuestion.includes("trend") ||
    normalizedQuestion.includes("social")
  ) {
    return {
      headline: "Trend adaptation guidance",
      explanation:
        "Trends are treated as optional hooks, not mandatory starting points, and they are filtered for business and reputation safety before they shape content.",
      actions: [
        topRecommendation
          ? `Top safe adaptation angle: ${topRecommendation.title}.`
          : "Refresh recommendations to load the strongest trend-adaptive ideas.",
        "Use live phrases or attention patterns only when they can be translated into constructive, respectful, and relevant messaging.",
        topOccasion
          ? `If no strong trend survives filtering, fall back to the proactive opportunity "${topOccasion.title}".`
          : "If no safe trend stands out, use proactive calendar and audience moments instead.",
      ],
    };
  }

  return {
    headline: "Smart planning answer",
    explanation:
      "This answer blends proactive opportunities, live trends, what is already scheduled, and what has worked for Sika Prime Loans.",
    actions: [
      topRecommendation
        ? `Priority suggestion: ${topRecommendation.title}.`
        : "Refresh recommendations to get a stronger next-step suggestion.",
      topOpportunity
        ? `Always-on content option: ${topOpportunity.title}.`
        : "Add one proactive educational, trust-building, or engagement post next.",
      scheduledPromotionalShare > 0.6
        ? "The queue is currently heavy on promotional content. Add more trust-building or educational posts next."
        : assistant.balance.guidance,
      bestWindow
        ? `Your best posting window currently looks like ${bestWindow.label}.`
        : "Gather more published results to sharpen timing recommendations.",
      calendar.warnings[0]?.message ??
        "No urgent scheduling risk is currently flagged.",
    ],
  };
}
