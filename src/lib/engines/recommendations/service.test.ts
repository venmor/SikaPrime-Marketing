import {
  ContentTone,
  PublishingChannel,
  TrendLifecycle,
  TrendRegion,
  TrendStatus,
} from "@prisma/client";

import { buildRecommendationDrafts } from "@/lib/engines/recommendations/service";

describe("recommendation builder", () => {
  it("blends proactive opportunities, safe trends, performance, and product priorities", () => {
    const recommendations = buildRecommendationDrafts({
      trends: [
        {
          id: "trend-1",
          title: "Back-to-school budgeting is rising",
          summary: "Families are actively discussing term-start financial pressure.",
          sourceName: "Demo",
          sourceUrl: "https://example.com",
          region: TrendRegion.LOCAL,
          topic: "Family finance",
          keywords: "school fees, budget",
          publishedAt: new Date(),
          detectedAt: new Date(),
          relevanceScore: 88,
          freshnessScore: 90,
          brandFitScore: 93,
          totalScore: 90,
          status: TrendStatus.RISING,
          lifecycle: TrendLifecycle.EMERGING,
        },
      ],
      opportunities: [
        {
          key: "month-end-money-pressure",
          title: "Month-end money pressure support",
          summary: "Use practical month-end budgeting and salary-gap messaging.",
          rationale: "Month-end is a recurring attention window even without a viral trend.",
          source: "OCCASION",
          lane: "SEASONAL",
          tone: ContentTone.LOCALIZED,
          channel: PublishingChannel.FACEBOOK,
          score: 94,
        },
        {
          key: "trust-and-clarity",
          title: "Trust-first clarity message",
          summary: "Explain the company approach to honest, responsible communication.",
          rationale: "Trust content softens a promotion-heavy mix.",
          source: "BALANCE",
          lane: "TRUST_BUILDING",
          tone: ContentTone.PROFESSIONAL,
          channel: PublishingChannel.FACEBOOK,
          score: 92,
        },
      ],
      balance: {
        totalItems: 8,
        promotionalShare: 0.75,
        dominantLane: "PROMOTIONAL",
        missingLanes: ["EDUCATIONAL", "TRUST_BUILDING", "SEASONAL"],
        recommendedLanes: ["EDUCATIONAL", "TRUST_BUILDING"],
        laneCounts: {
          PROMOTIONAL: 6,
          EDUCATIONAL: 0,
          TRUST_BUILDING: 0,
          YOUTH_EMPOWERMENT: 0,
          VALUE_BASED: 1,
          ENGAGEMENT: 1,
          SEASONAL: 0,
          CAMPAIGN_SUPPORT: 0,
          COMMUNITY: 0,
          INSPIRATIONAL: 0,
        },
        guidance:
          "Recent output leans heavily promotional. Shift the next posts toward education, trust, and youth or community value.",
      },
      topThemes: [
        { themeLabel: "family preparedness", averageEngagement: 6.2, leads: 31 },
        { themeLabel: "trust-led promotion", averageEngagement: 4.8, leads: 19 },
      ],
      productPriorities: [{ name: "School Fees Bridge", priority: 90 }],
      goals: [{ title: "Increase qualified leads", priority: 95 }],
      underPromotedProduct: { name: "Business Booster Loan", priority: 85 },
    });

    expect(recommendations.length).toBeGreaterThanOrEqual(3);
    expect(recommendations[0].priorityScore).toBeGreaterThan(80);
    expect(
      recommendations.some((item) =>
        item.title.toLowerCase().includes("month-end"),
      ),
    ).toBe(true);
    expect(
      recommendations.some((item) => item.basedOn.includes("Source: Balance")),
    ).toBe(true);
  });

  it("still returns recommendations when there are no active trends", () => {
    const recommendations = buildRecommendationDrafts({
      trends: [],
      opportunities: [
        {
          key: "youth-opportunity",
          title: "Youth opportunity and discipline angle",
          summary: "Create encouraging content around hustle and smart decisions.",
          rationale: "Youth-centered content keeps the brand useful without a trend.",
          source: "EVERGREEN",
          lane: "YOUTH_EMPOWERMENT",
          tone: ContentTone.YOUTHFUL,
          channel: PublishingChannel.FACEBOOK,
          score: 83,
        },
      ],
      balance: {
        totalItems: 4,
        promotionalShare: 0.25,
        dominantLane: "EDUCATIONAL",
        missingLanes: ["SEASONAL", "ENGAGEMENT"],
        recommendedLanes: ["SEASONAL", "ENGAGEMENT"],
        laneCounts: {
          PROMOTIONAL: 1,
          EDUCATIONAL: 2,
          TRUST_BUILDING: 1,
          YOUTH_EMPOWERMENT: 0,
          VALUE_BASED: 0,
          ENGAGEMENT: 0,
          SEASONAL: 0,
          CAMPAIGN_SUPPORT: 0,
          COMMUNITY: 0,
          INSPIRATIONAL: 0,
        },
        guidance:
          "Several content lanes are underused. Add seasonal, engagement, and softer value-led content to keep the page lively.",
      },
      topThemes: [],
      productPriorities: [{ name: "Salary Advance", priority: 88 }],
      goals: [{ title: "Stay consistently visible", priority: 90 }],
    });

    expect(recommendations.length).toBeGreaterThan(0);
    expect(
      recommendations.some((item) => item.tone === ContentTone.YOUTHFUL),
    ).toBe(true);
    expect(
      recommendations.some((item) => item.title.toLowerCase().includes("rebalance")),
    ).toBe(true);
  });
});
