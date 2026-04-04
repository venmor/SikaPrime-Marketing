import "server-only";

import { ContentTone, PublishingChannel, WorkflowStage } from "@prisma/client";

import {
  canGenerateContent,
  canViewAnalytics,
  canPublishContent,
  canReviewContent,
} from "@/lib/auth/access";
import type { UserRole } from "@/lib/auth/roles";
import type {
  AssistantHomeSnapshot,
  AssistantReviewInboxItem,
  AssistantSuggestion,
  AssistantTrendCard,
  AssistantUserDefaults,
} from "@/lib/assistant/types";
import { prisma } from "@/lib/db";
import { getRecommendations } from "@/lib/engines/recommendations/service";
import { getLiveTrends } from "@/lib/engines/trends/service";
import {
  buildAssistantOpportunities,
  type AssistantAudience,
  type AssistantContentRecord,
  type AssistantGoal,
  type AssistantOffer,
  type AssistantProduct,
} from "@/lib/engines/content/strategy";

type FrequencyValue<T> = {
  value: T | null;
  count: number;
};

function modeValue<T>(values: (T | null | undefined)[]): FrequencyValue<T> {
  const counter = new Map<T, number>();

  for (const value of values) {
    if (value == null) {
      continue;
    }

    counter.set(value, (counter.get(value) ?? 0) + 1);
  }

  let selected: T | null = null;
  let count = 0;

  for (const [value, currentCount] of counter) {
    if (currentCount > count) {
      selected = value;
      count = currentCount;
    }
  }

  return {
    value: selected,
    count,
  };
}

function compactText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function buildProductsForAssistant(input: {
  products: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    keyBenefits: string;
    priority: number;
  }>;
}) {
  return input.products.map(
    (product) =>
      ({
        id: product.id,
        name: product.name,
        category: product.category,
        description: product.description,
        keyBenefits: product.keyBenefits,
        priority: product.priority,
      }) satisfies AssistantProduct,
  );
}

function buildAudiencesForAssistant(input: {
  audiences: Array<{
    id: string;
    name: string;
    description: string;
    painPoints: string;
    needs: string;
    preferredChannels: string;
    messagingAngles: string;
    priority: number;
  }>;
}) {
  return input.audiences.map(
    (audience) =>
      ({
        id: audience.id,
        name: audience.name,
        description: audience.description,
        painPoints: audience.painPoints,
        needs: audience.needs,
        preferredChannels: audience.preferredChannels,
        messagingAngles: audience.messagingAngles,
        priority: audience.priority,
      }) satisfies AssistantAudience,
  );
}

function scoreTrendAgainstProduct(input: {
  title: string;
  description: string;
  product: AssistantProduct;
  preferredProductId: string | null;
}) {
  const haystack = `${input.title} ${input.description}`.toLowerCase();
  const productWords = [
    input.product.name,
    input.product.category,
    input.product.description,
    input.product.keyBenefits,
  ]
    .join(" ")
    .toLowerCase();

  let score = Math.max(5, input.product.priority / 2);

  if (input.preferredProductId === input.product.id) {
    score += 18;
  }

  for (const term of input.product.name.toLowerCase().split(/\s+/)) {
    if (term.length > 3 && haystack.includes(term)) {
      score += 10;
    }
  }

  for (const term of input.product.category.toLowerCase().split(/\s+/)) {
    if (term.length > 3 && haystack.includes(term)) {
      score += 6;
    }
  }

  if (
    haystack.includes("business") &&
    productWords.includes("business")
  ) {
    score += 12;
  }

  if (
    haystack.includes("student") &&
    productWords.includes("student")
  ) {
    score += 12;
  }

  if (
    haystack.includes("school") &&
    productWords.includes("school")
  ) {
    score += 10;
  }

  if (
    haystack.includes("digital") &&
    productWords.includes("digital")
  ) {
    score += 8;
  }

  return score;
}

async function getKnowledgeBaseSummary() {
  return prisma.businessProfile.findUnique({
    where: { id: 1 },
    include: {
      products: {
        where: { active: true },
        orderBy: { priority: "desc" },
      },
      audienceSegments: {
        orderBy: { priority: "desc" },
      },
      goals: {
        where: { active: true },
        orderBy: { priority: "desc" },
      },
      offers: {
        where: { active: true },
        orderBy: { priority: "desc" },
      },
    },
  });
}

export async function getAssistantUserDefaults(userId: string) {
  const [recentItems, profile, publicationMetrics] = await Promise.all([
    prisma.contentItem.findMany({
      where: { ownerId: userId },
      include: {
        product: true,
        audienceSegment: true,
      },
      orderBy: { createdAt: "desc" },
      take: 18,
    }),
    getKnowledgeBaseSummary(),
    prisma.performanceSnapshot.findMany({
      orderBy: { capturedAt: "desc" },
      take: 18,
      include: {
        publication: {
          include: {
            contentItem: {
              include: {
                product: true,
                audienceSegment: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const preferredChannel = modeValue(recentItems.map((item) => item.channel)).value;
  const preferredTone = modeValue(recentItems.map((item) => item.tone)).value;
  const preferredProductId = modeValue(recentItems.map((item) => item.productId)).value;
  const preferredAudienceSegmentId = modeValue(
    recentItems.map((item) => item.audienceSegmentId),
  ).value;

  const topPerformingProduct = publicationMetrics
    .map((snapshot) => {
      const contentItem = snapshot.publication.contentItem;
      const weightedScore =
        snapshot.conversions * 6 +
        snapshot.leads * 5 +
        snapshot.clicks * 2 +
        snapshot.comments +
        snapshot.shares * 2 +
        snapshot.saves * 2;

      return {
        productId: contentItem.productId,
        productName: contentItem.product?.name ?? null,
        audienceSegmentId: contentItem.audienceSegmentId,
        audienceName: contentItem.audienceSegment?.name ?? null,
        weightedScore,
      };
    })
    .filter((item) => item.productId)
    .sort((left, right) => right.weightedScore - left.weightedScore)[0];

  const fallbackProduct =
    profile?.products.find((product) => product.id === preferredProductId) ??
    profile?.products.find((product) => product.id === topPerformingProduct?.productId) ??
    profile?.products[0] ??
    null;

  const fallbackAudience =
    profile?.audienceSegments.find(
      (segment) => segment.id === preferredAudienceSegmentId,
    ) ??
    profile?.audienceSegments.find(
      (segment) => segment.id === topPerformingProduct?.audienceSegmentId,
    ) ??
    profile?.audienceSegments[0] ??
    null;

  const preferredGoal = profile?.goals[0] ?? null;
  const hiddenTones = (
    Object.values(ContentTone) as ContentTone[]
  ).filter((tone) => !recentItems.some((item) => item.tone === tone));

  const resolvedChannel = preferredChannel ?? PublishingChannel.FACEBOOK;
  const resolvedTone = preferredTone ?? ContentTone.PROFESSIONAL;

  return {
    preferredChannel: resolvedChannel,
    preferredTone: resolvedTone,
    preferredProductId: fallbackProduct?.id ?? null,
    preferredProductName: fallbackProduct?.name ?? null,
    preferredAudienceSegmentId: fallbackAudience?.id ?? null,
    preferredAudienceName: fallbackAudience?.name ?? null,
    preferredGoalId: preferredGoal?.id ?? null,
    preferredGoalTitle: preferredGoal?.title ?? null,
    hiddenTones,
    summary: [
      `Usually ${resolvedChannel.toLowerCase()} first`,
      fallbackProduct?.name ? `leans on ${fallbackProduct.name}` : null,
      `tone ${resolvedTone.toLowerCase()}`,
    ]
      .filter(Boolean)
      .join(" · "),
  } satisfies AssistantUserDefaults;
}

function buildSuggestionPrompt(input: {
  idea: string;
  productName?: string | null;
  audienceName?: string | null;
  tone: ContentTone;
  channel: PublishingChannel;
}) {
  return [
    `Create a ${input.channel.toLowerCase()} post about ${input.idea}.`,
    input.productName ? `Use ${input.productName} as the main product.` : null,
    input.audienceName ? `Target ${input.audienceName}.` : null,
    `Keep the tone ${input.tone.toLowerCase()}.`,
    "Use the strongest live finance trend if it helps the message.",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function getAssistantHomeSnapshot(input: {
  userId: string;
  role: UserRole;
}) {
  const defaults = await getAssistantUserDefaults(input.userId);

  const [
    liveTrends,
    recommendations,
    profile,
    workflowCounts,
    reviewInboxRaw,
    approvedItem,
    draftNeedingAttention,
    recentContent,
  ] = await Promise.all([
    getLiveTrends(5),
    getRecommendations(),
    getKnowledgeBaseSummary(),
    prisma.contentItem.groupBy({
      by: ["stage"],
      _count: true,
    }),
    canReviewContent(input.role)
      ? prisma.contentItem.findMany({
          where: { stage: WorkflowStage.IN_REVIEW },
          include: {
            owner: true,
          },
          orderBy: { updatedAt: "asc" },
          take: 3,
        })
      : Promise.resolve([]),
    canPublishContent(input.role)
      ? prisma.contentItem.findFirst({
          where: { stage: WorkflowStage.APPROVED },
          orderBy: { updatedAt: "asc" },
        })
      : Promise.resolve(null),
    canGenerateContent(input.role)
      ? prisma.contentItem.findFirst({
          where: {
            ownerId: input.userId,
            stage: {
              in: [WorkflowStage.DRAFT, WorkflowStage.NEEDS_REVISION],
            },
          },
          orderBy: { updatedAt: "asc" },
        })
      : Promise.resolve(null),
    prisma.contentItem.findMany({
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take: 18,
      select: {
        title: true,
        objective: true,
        themeLabel: true,
        contentType: true,
        channel: true,
      },
    }),
  ]);

  const countLookup = new Map(
    workflowCounts.map((row) => [row.stage, row._count]),
  );

  const products = buildProductsForAssistant({
    products: profile?.products ?? [],
  });
  const audiences = buildAudiencesForAssistant({
    audiences: profile?.audienceSegments ?? [],
  });
  const opportunities = buildAssistantOpportunities({
    products,
    audiences,
    goals:
      (profile?.goals ?? []).map(
        (goal) =>
          ({
            id: goal.id,
            title: goal.title,
            description: goal.description,
            priority: goal.priority,
          }) satisfies AssistantGoal,
      ) ?? [],
    offers:
      (profile?.offers ?? []).map(
        (offer) =>
          ({
            id: offer.id,
            name: offer.name,
            description: offer.description,
            priority: offer.priority,
          }) satisfies AssistantOffer,
      ) ?? [],
    recentContent: recentContent as AssistantContentRecord[],
  });

  const suggestionSeed = [
    recommendations[0]
      ? {
          id: `recommendation-${recommendations[0].id}`,
          label: recommendations[0].title,
          prompt: buildSuggestionPrompt({
            idea: recommendations[0].title,
            productName: defaults.preferredProductName,
            audienceName: defaults.preferredAudienceName,
            tone: defaults.preferredTone,
            channel: recommendations[0].channel,
          }),
          detail: recommendations[0].rationale,
        }
      : null,
    liveTrends[0]
      ? {
          id: `trend-${liveTrends[0].id}`,
          label: `Use trend: ${liveTrends[0].title}`,
          prompt: buildSuggestionPrompt({
            idea: `${liveTrends[0].title} for today's audience attention`,
            productName: defaults.preferredProductName,
            audienceName: defaults.preferredAudienceName,
            tone: defaults.preferredTone,
            channel: defaults.preferredChannel,
          }),
          detail: liveTrends[0].description ?? "Turn the strongest signal into a practical post.",
        }
      : null,
    opportunities.opportunities[0]
      ? {
          id: `opportunity-${opportunities.opportunities[0].key}`,
          label: opportunities.opportunities[0].title,
          prompt: buildSuggestionPrompt({
            idea: opportunities.opportunities[0].title,
            productName: defaults.preferredProductName,
            audienceName: defaults.preferredAudienceName,
            tone: opportunities.opportunities[0].tone,
            channel: opportunities.opportunities[0].channel,
          }),
          detail: opportunities.opportunities[0].summary,
        }
      : null,
  ].filter(Boolean) as AssistantSuggestion[];

  const trendsForYou = liveTrends.map((trend) => {
    const matchedProduct =
      products
        .map((product) => ({
          product,
          score: scoreTrendAgainstProduct({
            title: trend.title,
            description: compactText(trend.description),
            product,
            preferredProductId: defaults.preferredProductId,
          }),
        }))
        .sort((left, right) => right.score - left.score)[0]?.product ?? null;

    return {
      id: trend.id,
      title: trend.title,
      description: trend.description,
      source: trend.source,
      matchedProductName: matchedProduct?.name ?? defaults.preferredProductName,
      prompt: buildSuggestionPrompt({
        idea: trend.title,
        productName: matchedProduct?.name ?? defaults.preferredProductName,
        audienceName: defaults.preferredAudienceName,
        tone: defaults.preferredTone,
        channel: defaults.preferredChannel,
      }),
      relevanceScore: trend.relevanceScore,
    } satisfies AssistantTrendCard;
  });

  const reviewInbox = reviewInboxRaw.map(
    (item) =>
      ({
        id: item.id,
        title: item.title,
        brief: item.brief,
        ownerName: item.owner.name,
        ownerRole: item.owner.role,
        updatedAt: item.updatedAt,
      }) satisfies AssistantReviewInboxItem,
  );

  const nextAction = canReviewContent(input.role) && reviewInbox[0]
    ? {
        title: `Review "${reviewInbox[0].title}"`,
        description: `Oldest waiting item from ${reviewInbox[0].ownerName}. Approve it or request changes right from your inbox.`,
        href: "/workflow",
        ctaLabel: "Review now",
      }
    : canPublishContent(input.role) && approvedItem
      ? {
          title: `Publish "${approvedItem.title}"`,
          description: "The queue already has approved work ready to go live. Release it now or batch-schedule it.",
          href: "/publishing",
          ctaLabel: "Publish queue",
        }
      : draftNeedingAttention
      ? {
          title: `Finish "${draftNeedingAttention.title}"`,
          description: "Your oldest draft is still waiting. Tighten it up and send it for review before starting another piece.",
          href: `/content/${draftNeedingAttention.id}`,
          ctaLabel: "Open draft",
        }
        : canViewAnalytics(input.role)
          ? {
              title: "Check what is working",
              description: "Your role is focused on performance and insight, so the next useful move is in the analytics view.",
              href: "/analytics",
              ctaLabel: "Open analytics",
            }
        : {
            title: "Create the next post with AI",
            description: "The assistant already has your likely channel, product, and tone. Start from a prompt instead of a form.",
            href: "/content",
            ctaLabel: "Start creating",
          };

  return {
    defaults,
    nextAction,
    suggestions: suggestionSeed.slice(0, 3),
    trendsForYou: trendsForYou.slice(0, 5),
    reviewInbox,
    fullPlan: {
      draftCount:
        (countLookup.get(WorkflowStage.DRAFT) ?? 0) +
        (countLookup.get(WorkflowStage.NEEDS_REVISION) ?? 0),
      reviewCount: countLookup.get(WorkflowStage.IN_REVIEW) ?? 0,
      readyCount: countLookup.get(WorkflowStage.APPROVED) ?? 0,
      scheduledCount: countLookup.get(WorkflowStage.SCHEDULED) ?? 0,
      topRecommendationTitles: recommendations.slice(0, 4).map((item) => item.title),
    },
  } satisfies AssistantHomeSnapshot;
}
