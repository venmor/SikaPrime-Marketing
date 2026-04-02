import {
  ContentTone,
  ContentType,
  PublishingChannel,
} from "@prisma/client";

const dayMs = 24 * 60 * 60 * 1000;

const promotionalTypes = new Set<ContentType>([
  ContentType.AD_COPY,
  ContentType.PRODUCT_PROMOTION,
  ContentType.FACEBOOK_POST,
  ContentType.WHATSAPP_MESSAGE,
  ContentType.CAPTION,
]);

const primaryBalanceLanes = [
  "PROMOTIONAL",
  "EDUCATIONAL",
  "TRUST_BUILDING",
  "YOUTH_EMPOWERMENT",
  "ENGAGEMENT",
  "SEASONAL",
] as const;

export const generationModeOptions = [
  {
    value: "BALANCED",
    label: "Balanced assistant",
    description: "Blend proactive ideas, live trends, and content-balance guidance.",
  },
  {
    value: "PROACTIVE",
    label: "Proactive mode",
    description: "Prioritize evergreen, seasonal, and always-on brand content.",
  },
  {
    value: "TREND_ADAPTIVE",
    label: "Trend-adaptive mode",
    description: "Use safe, relevant attention signals as hooks without forcing them.",
  },
] as const;

export type GenerationMode = (typeof generationModeOptions)[number]["value"];

export const contentLaneOptions = [
  {
    value: "PROMOTIONAL",
    label: "Promotional",
    description: "Direct product or offer-led marketing with a clear call to action.",
  },
  {
    value: "EDUCATIONAL",
    label: "Educational",
    description: "Helpful money guidance, responsible borrowing, and smart planning.",
  },
  {
    value: "TRUST_BUILDING",
    label: "Trust building",
    description: "Clarity, transparency, reassurance, and proof of responsible messaging.",
  },
  {
    value: "YOUTH_EMPOWERMENT",
    label: "Youth empowerment",
    description: "Opportunity, discipline, ambition, and progress for youth audiences.",
  },
  {
    value: "VALUE_BASED",
    label: "Value based",
    description: "Brand values, purpose, and the bigger meaning behind the service.",
  },
  {
    value: "ENGAGEMENT",
    label: "Engagement",
    description: "Questions, conversation starters, and audience participation prompts.",
  },
  {
    value: "SEASONAL",
    label: "Seasonal or occasion-based",
    description: "Calendar moments such as Youth Day, month-end, or school periods.",
  },
  {
    value: "CAMPAIGN_SUPPORT",
    label: "Campaign support",
    description: "Supporting content for an active promotion, sequence, or campaign.",
  },
  {
    value: "COMMUNITY",
    label: "Community focused",
    description: "Socially positive, audience-centered, and community-aware messaging.",
  },
  {
    value: "INSPIRATIONAL",
    label: "Inspirational",
    description: "Encouraging life growth, discipline, confidence, and resilience.",
  },
] as const;

export type ContentLane = (typeof contentLaneOptions)[number]["value"];

export type AssistantContentRecord = {
  title?: string | null;
  objective?: string | null;
  themeLabel?: string | null;
  contentType: ContentType;
  channel?: PublishingChannel | null;
};

export type AssistantProduct = {
  id: string;
  name: string;
  category: string;
  description: string;
  keyBenefits: string;
  priority: number;
};

export type AssistantAudience = {
  id: string;
  name: string;
  description: string;
  painPoints: string;
  needs: string;
  preferredChannels: string;
  messagingAngles: string;
  priority: number;
};

export type AssistantGoal = {
  id: string;
  title: string;
  description: string;
  priority: number;
};

export type AssistantOffer = {
  id: string;
  name: string;
  description: string;
  priority: number;
};

export type AssistantOpportunity = {
  key: string;
  title: string;
  summary: string;
  rationale: string;
  source: "OCCASION" | "EVERGREEN" | "BALANCE";
  lane: ContentLane;
  tone: ContentTone;
  channel: PublishingChannel;
  score: number;
};

export type ContentBalanceSnapshot = {
  totalItems: number;
  promotionalShare: number;
  dominantLane: ContentLane | null;
  missingLanes: ContentLane[];
  recommendedLanes: ContentLane[];
  laneCounts: Record<ContentLane, number>;
  guidance: string;
};

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function differenceInCalendarDays(left: Date, right: Date) {
  return Math.round(
    (startOfDay(left).getTime() - startOfDay(right).getTime()) / dayMs,
  );
}

function includesAny(text: string, keywords: string[]) {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function getLaneConfig(lane: ContentLane) {
  return (
    contentLaneOptions.find((option) => option.value === lane) ?? contentLaneOptions[0]
  );
}

export function getContentLaneLabel(lane: ContentLane) {
  return getLaneConfig(lane).label;
}

function createRecurringDate(referenceDate: Date, month: number, day: number) {
  return new Date(referenceDate.getFullYear(), month, day);
}

function pickProductByKeywords(products: AssistantProduct[], keywords: string[]) {
  return products.find((product) =>
    includesAny(
      [product.name, product.category, product.description, product.keyBenefits]
        .filter(Boolean)
        .join(" "),
      keywords,
    ),
  );
}

function pickAudienceByKeywords(
  audiences: AssistantAudience[],
  keywords: string[],
) {
  return audiences.find((audience) =>
    includesAny(
      [
        audience.name,
        audience.description,
        audience.needs,
        audience.painPoints,
        audience.messagingAngles,
      ]
        .filter(Boolean)
        .join(" "),
      keywords,
    ),
  );
}

function normalizeSelectedLane(
  lane: string | null | undefined,
): ContentLane | null {
  if (!lane) {
    return null;
  }

  return (
    contentLaneOptions.find((option) => option.value === lane)?.value ?? null
  );
}

function inferLaneFromRecord(record: AssistantContentRecord): ContentLane {
  if (record.contentType === ContentType.EDUCATIONAL) {
    return "EDUCATIONAL";
  }

  if (record.contentType === ContentType.TRUST_BUILDING) {
    return "TRUST_BUILDING";
  }

  if (promotionalTypes.has(record.contentType)) {
    const text = [
      record.title,
      record.objective,
      record.themeLabel,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (includesAny(text, ["trust", "clarity", "transparent", "honest"])) {
      return "TRUST_BUILDING";
    }

    if (includesAny(text, ["youth", "student", "young", "future", "career"])) {
      return "YOUTH_EMPOWERMENT";
    }

    if (includesAny(text, ["question", "share", "comment", "poll", "tell us"])) {
      return "ENGAGEMENT";
    }

    if (
      includesAny(text, [
        "women",
        "independence",
        "school",
        "exam",
        "month-end",
        "season",
        "holiday",
      ])
    ) {
      return "SEASONAL";
    }

    if (includesAny(text, ["value", "purpose", "respect", "responsible"])) {
      return "VALUE_BASED";
    }

    if (includesAny(text, ["community", "family", "supporting"])) {
      return "COMMUNITY";
    }

    if (includesAny(text, ["discipline", "growth", "progress", "encourage"])) {
      return "INSPIRATIONAL";
    }

    return "PROMOTIONAL";
  }

  return "CAMPAIGN_SUPPORT";
}

export function summarizeContentBalance(
  records: AssistantContentRecord[],
): ContentBalanceSnapshot {
  const laneCounts = contentLaneOptions.reduce(
    (accumulator, lane) => {
      accumulator[lane.value] = 0;
      return accumulator;
    },
    {} as Record<ContentLane, number>,
  );

  for (const record of records) {
    const lane = inferLaneFromRecord(record);
    laneCounts[lane] += 1;
  }

  const totalItems = records.length;
  const promotionalShare =
    totalItems > 0 ? laneCounts.PROMOTIONAL / totalItems : 0;
  const dominantLane =
    totalItems > 0
      ? (Object.entries(laneCounts).sort((left, right) => right[1] - left[1])[0]?.[0] as
          | ContentLane
          | undefined) ?? null
      : null;

  const missingLanes = primaryBalanceLanes.filter((lane) => laneCounts[lane] === 0);

  const recommendedLanes: ContentLane[] = [];

  if (promotionalShare >= 0.55) {
    recommendedLanes.push("EDUCATIONAL", "TRUST_BUILDING", "YOUTH_EMPOWERMENT");
  }

  if (laneCounts.SEASONAL === 0) {
    recommendedLanes.push("SEASONAL");
  }

  if (laneCounts.ENGAGEMENT === 0) {
    recommendedLanes.push("ENGAGEMENT");
  }

  if (laneCounts.VALUE_BASED === 0) {
    recommendedLanes.push("VALUE_BASED");
  }

  if (laneCounts.INSPIRATIONAL === 0) {
    recommendedLanes.push("INSPIRATIONAL");
  }

  const dedupedRecommended = [...new Set(recommendedLanes)].slice(0, 4);

  const guidance =
    promotionalShare >= 0.55
      ? "Recent output leans heavily promotional. Shift the next posts toward education, trust, and youth or community value."
      : missingLanes.length >= 3
        ? "Several content lanes are underused. Add seasonal, engagement, and softer value-led content to keep the page lively."
        : "The mix is reasonably healthy. Keep alternating promotion with useful, trust-led, and conversation-friendly posts.";

  return {
    totalItems,
    promotionalShare,
    dominantLane,
    missingLanes,
    recommendedLanes: dedupedRecommended,
    laneCounts,
    guidance,
  };
}

function buildOccasionOpportunities(input: {
  now: Date;
  products: AssistantProduct[];
  audiences: AssistantAudience[];
}) {
  const { now, products, audiences } = input;
  const opportunities: AssistantOpportunity[] = [];

  const womenAudience =
    pickAudienceByKeywords(audiences, ["women", "mother", "caregiver"]) ??
    audiences[0];
  const youthAudience =
    pickAudienceByKeywords(audiences, ["youth", "student", "young", "graduate"]) ??
    audiences[0];
  const schoolProduct =
    pickProductByKeywords(products, ["school", "fees", "education", "student"]) ??
    products[0];
  const salaryProduct =
    pickProductByKeywords(products, ["salary", "month-end", "payday", "transport"]) ??
    products[0];
  const businessProduct =
    pickProductByKeywords(products, ["business", "stock", "restock", "trade"]) ??
    products[0];

  const fixedOccasions = [
    {
      key: "international-womens-day",
      label: "International Women's Day",
      date: createRecurringDate(now, 2, 8),
      windowBefore: 12,
      windowAfter: 2,
      lane: "COMMUNITY" as ContentLane,
      tone: ContentTone.PROFESSIONAL,
      summary: `Celebrate women building families, businesses, and financial resilience${womenAudience ? ` in ${womenAudience.name}` : ""}.`,
    },
    {
      key: "zambia-youth-day",
      label: "Zambia Youth Day",
      date: createRecurringDate(now, 2, 12),
      windowBefore: 10,
      windowAfter: 2,
      lane: "YOUTH_EMPOWERMENT" as ContentLane,
      tone: ContentTone.YOUTHFUL,
      summary: `Connect responsible borrowing and financial discipline to youth ambition, hustle, and opportunity${youthAudience ? ` for ${youthAudience.name}` : ""}.`,
    },
    {
      key: "zambia-independence-day",
      label: "Zambia Independence Day",
      date: createRecurringDate(now, 9, 24),
      windowBefore: 10,
      windowAfter: 2,
      lane: "COMMUNITY" as ContentLane,
      tone: ContentTone.LOCALIZED,
      summary: "Create constructive, patriotic content around progress, dignity, and practical financial support.",
    },
  ];

  for (const occasion of fixedOccasions) {
    const daysFromOccasion = differenceInCalendarDays(occasion.date, now);
    if (
      daysFromOccasion >= -occasion.windowAfter &&
      daysFromOccasion <= occasion.windowBefore
    ) {
      opportunities.push({
        key: occasion.key,
        title: `${occasion.label} content opportunity`,
        summary: occasion.summary,
        rationale: `This occasion is close enough to feel timely without needing a viral trend. Pair it with a safe, constructive brand angle${occasion.key === "zambia-youth-day" && youthAudience ? ` for ${youthAudience.name}` : ""}${occasion.key === "international-womens-day" && womenAudience ? ` and stories that respect ${womenAudience.name}` : ""}.`,
        source: "OCCASION",
        lane: occasion.lane,
        tone: occasion.tone,
        channel: PublishingChannel.FACEBOOK,
        score: Math.max(72, 96 - Math.abs(daysFromOccasion) * 3),
      });
    }
  }

  const dayOfMonth = now.getDate();
  const lastDayOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();

  if (dayOfMonth >= lastDayOfMonth - 6 || dayOfMonth <= 3) {
    opportunities.push({
      key: "month-end-money-pressure",
      title: "Month-end money pressure support",
      summary: `Use relatable month-end budgeting, transport, rent, or salary-gap messaging${salaryProduct ? ` around ${salaryProduct.name}` : ""}.`,
      rationale:
        "Month-end is a dependable attention window for practical, high-intent finance content even when no social trend is leading the conversation.",
      source: "OCCASION",
      lane: "SEASONAL",
      tone: ContentTone.LOCALIZED,
      channel: PublishingChannel.FACEBOOK,
      score: dayOfMonth >= lastDayOfMonth - 3 || dayOfMonth <= 1 ? 94 : 84,
    });
  }

  if ([0, 4, 8].includes(now.getMonth())) {
    opportunities.push({
      key: "term-start-school-readiness",
      title: "Term-start and school readiness content",
      summary: `Create school planning, caregiver support, and responsible borrowing posts${schoolProduct ? ` around ${schoolProduct.name}` : ""}.`,
      rationale:
        "Back-to-school moments drive recurring household attention and work well for educational, trust-led, or campaign-support content.",
      source: "OCCASION",
      lane: "SEASONAL",
      tone: ContentTone.LOCALIZED,
      channel: PublishingChannel.FACEBOOK,
      score: 86,
    });
  }

  if ([4, 5, 9, 10].includes(now.getMonth())) {
    opportunities.push({
      key: "exam-and-fees-planning",
      title: "Exam pressure and fees planning support",
      summary:
        "Offer calm, practical guidance for exam-time budgeting, planning, and family readiness.",
      rationale:
        "Exam periods create a predictable need for disciplined, helpful content instead of hard-sell promotion.",
      source: "OCCASION",
      lane: "EDUCATIONAL",
      tone: ContentTone.PROFESSIONAL,
      channel: PublishingChannel.FACEBOOK,
      score: 80,
    });
  }

  if (now.getMonth() >= 10) {
    opportunities.push({
      key: "year-end-reset",
      title: "Year-end reset and responsible planning",
      summary:
        "Focus on smart money habits, planning ahead, and entering the new season with discipline.",
      rationale:
        "Year-end audiences respond well to reflective, aspirational, and practical content that goes beyond direct product promotion.",
      source: "OCCASION",
      lane: "INSPIRATIONAL",
      tone: ContentTone.PROFESSIONAL,
      channel: PublishingChannel.FACEBOOK,
      score: 78,
    });
  }

  if (businessProduct) {
    opportunities.push({
      key: "restock-and-business-momentum",
      title: "Restock and business momentum push",
      summary: `Support traders and SME owners with practical stock, cash-flow, and resilience messaging around ${businessProduct.name}.`,
      rationale:
        "Small business audiences often need always-on campaign support content that feels grounded in daily hustle, not only in broad trends.",
      source: "OCCASION",
      lane: "CAMPAIGN_SUPPORT",
      tone: ContentTone.LOCALIZED,
      channel: PublishingChannel.FACEBOOK,
      score: 76,
    });
  }

  return opportunities.sort((left, right) => right.score - left.score);
}

function buildEvergreenOpportunities(input: {
  products: AssistantProduct[];
  audiences: AssistantAudience[];
  goals: AssistantGoal[];
  offers: AssistantOffer[];
  balance: ContentBalanceSnapshot;
}) {
  const { products, audiences, goals, offers, balance } = input;
  const opportunities: AssistantOpportunity[] = [];

  const topGoal = [...goals].sort((left, right) => right.priority - left.priority)[0];
  const topProduct = [...products].sort(
    (left, right) => right.priority - left.priority,
  )[0];
  const topAudience = [...audiences].sort(
    (left, right) => right.priority - left.priority,
  )[0];
  const youthAudience =
    pickAudienceByKeywords(audiences, ["youth", "student", "young", "graduate"]) ??
    topAudience;

  if (balance.promotionalShare >= 0.55 || balance.laneCounts.EDUCATIONAL === 0) {
    opportunities.push({
      key: "smart-money-habits",
      title: "Smart money habits education post",
      summary: `Teach budgeting, planning, and responsible borrowing habits${topAudience ? ` for ${topAudience.name}` : ""}.`,
      rationale:
        "Educational content keeps channels active without needing a trend and helps soften a promotion-heavy content mix.",
      source: balance.promotionalShare >= 0.55 ? "BALANCE" : "EVERGREEN",
      lane: "EDUCATIONAL",
      tone: ContentTone.PROFESSIONAL,
      channel: PublishingChannel.FACEBOOK,
      score: balance.promotionalShare >= 0.55 ? 94 : 80,
    });
  }

  if (balance.promotionalShare >= 0.55 || balance.laneCounts.TRUST_BUILDING === 0) {
    opportunities.push({
      key: "trust-and-clarity",
      title: "Trust-first clarity message",
      summary:
        "Explain how Sika Prime communicates clearly, reviews responsibly, and avoids misleading promises.",
      rationale:
        "Trust-building content protects brand reputation and keeps the page from feeling overly sales-focused.",
      source: balance.promotionalShare >= 0.55 ? "BALANCE" : "EVERGREEN",
      lane: "TRUST_BUILDING",
      tone: ContentTone.PROFESSIONAL,
      channel: PublishingChannel.FACEBOOK,
      score: balance.promotionalShare >= 0.55 ? 92 : 79,
    });
  }

  if (youthAudience || balance.laneCounts.YOUTH_EMPOWERMENT === 0) {
    opportunities.push({
      key: "youth-opportunity",
      title: "Youth opportunity and discipline angle",
      summary: `Create encouraging content around hustle, growth, smart decisions, and financial discipline${youthAudience ? ` for ${youthAudience.name}` : ""}.`,
      rationale:
        "Youth-centered empowerment content keeps the brand relevant even when there is no trend worth adapting.",
      source: "EVERGREEN",
      lane: "YOUTH_EMPOWERMENT",
      tone: ContentTone.YOUTHFUL,
      channel: PublishingChannel.FACEBOOK,
      score: 83,
    });
  }

  opportunities.push({
    key: "engagement-question",
    title: "Question-led engagement post",
    summary:
      "Ask a grounded question about month-end pressure, restocking, school planning, or money discipline.",
    rationale:
      "Engagement content helps keep Facebook active and gives the team fresh conversation hooks without forcing hard promotion.",
    source: balance.laneCounts.ENGAGEMENT === 0 ? "BALANCE" : "EVERGREEN",
    lane: "ENGAGEMENT",
    tone: ContentTone.LOCALIZED,
    channel: PublishingChannel.FACEBOOK,
    score: balance.laneCounts.ENGAGEMENT === 0 ? 88 : 74,
  });

  opportunities.push({
    key: "brand-values-story",
    title: "Brand values and responsible support story",
    summary:
      "Translate Sika Prime's values into a short post about dignity, clarity, and practical progress.",
    rationale:
      "Value-based content strengthens reputation and keeps the brand human between campaign pushes.",
    source: "EVERGREEN",
    lane: "VALUE_BASED",
    tone: ContentTone.PROFESSIONAL,
    channel: PublishingChannel.FACEBOOK,
    score: 77,
  });

  if (offers[0] || topGoal || topProduct) {
    opportunities.push({
      key: "campaign-support-sequence",
      title: "Campaign support follow-up",
      summary: `Build a softer support post around ${offers[0]?.name ?? topGoal?.title ?? topProduct?.name ?? "the current priority"} so the campaign stays visible without repeating the same sales language.`,
      rationale:
        "Campaign support posts extend active promotions with more context, trust, and narrative variety.",
      source: "EVERGREEN",
      lane: "CAMPAIGN_SUPPORT",
      tone: ContentTone.PERSUASIVE,
      channel: PublishingChannel.FACEBOOK,
      score: 75,
    });
  }

  opportunities.push({
    key: "encouraging-life-growth",
    title: "Encouraging life-growth message",
    summary:
      "Create a short, uplifting post around progress, responsibility, and taking practical next steps.",
    rationale:
      "Inspirational content helps the page stay lively and algorithm-friendly while still aligning with financial responsibility.",
    source: "EVERGREEN",
    lane: "INSPIRATIONAL",
    tone: ContentTone.PROFESSIONAL,
    channel: PublishingChannel.FACEBOOK,
    score: 72,
  });

  return opportunities.sort((left, right) => right.score - left.score);
}

export function buildAssistantOpportunities(input: {
  products: AssistantProduct[];
  audiences: AssistantAudience[];
  goals: AssistantGoal[];
  offers: AssistantOffer[];
  recentContent: AssistantContentRecord[];
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const balance = summarizeContentBalance(input.recentContent);
  const occasionOpportunities = buildOccasionOpportunities({
    now,
    products: input.products,
    audiences: input.audiences,
  });
  const evergreenOpportunities = buildEvergreenOpportunities({
    products: input.products,
    audiences: input.audiences,
    goals: input.goals,
    offers: input.offers,
    balance,
  });

  return {
    balance,
    occasionOpportunities,
    evergreenOpportunities,
    opportunities: [...occasionOpportunities, ...evergreenOpportunities].sort(
      (left, right) => right.score - left.score,
    ),
  };
}

export function pickAssistantOpportunity(input: {
  occasionKey?: string | null;
  contentLane?: string | null;
  generationMode?: string | null;
  opportunities: AssistantOpportunity[];
}) {
  if (input.occasionKey) {
    const selected = input.opportunities.find(
      (opportunity) => opportunity.key === input.occasionKey,
    );

    if (selected) {
      return selected;
    }
  }

  const normalizedLane = normalizeSelectedLane(input.contentLane);
  const mode =
    generationModeOptions.find((option) => option.value === input.generationMode)
      ?.value ?? "BALANCED";

  const filtered = input.opportunities.filter((opportunity) => {
    if (mode === "PROACTIVE" && opportunity.source === "OCCASION") {
      return true;
    }

    if (mode === "TREND_ADAPTIVE" && opportunity.source === "BALANCE") {
      return false;
    }

    return true;
  });

  if (normalizedLane) {
    return (
      filtered.find((opportunity) => opportunity.lane === normalizedLane) ??
      input.opportunities.find((opportunity) => opportunity.lane === normalizedLane) ??
      null
    );
  }

  return filtered[0] ?? input.opportunities[0] ?? null;
}
