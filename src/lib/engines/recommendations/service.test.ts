import { ContentTone, ContentType, PublishingChannel, TrendRegion, TrendStatus } from "@prisma/client";

import { buildRecommendationDrafts } from "@/lib/engines/recommendations/service";

describe("recommendation builder", () => {
  it("blends trend, performance, product, and goal inputs into recommendation cards", () => {
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
        },
        {
          id: "trend-2",
          title: "Trust-first fintech storytelling is trending",
          summary: "Global finance brands are leaning into transparent messaging.",
          sourceName: "Demo",
          sourceUrl: "https://example.com",
          region: TrendRegion.GLOBAL,
          topic: "Fintech trust",
          keywords: "trust, transparency",
          publishedAt: new Date(),
          detectedAt: new Date(),
          relevanceScore: 76,
          freshnessScore: 79,
          brandFitScore: 88,
          totalScore: 81,
          status: TrendStatus.WATCH,
        },
      ],
      topThemes: [
        { themeLabel: "family preparedness", averageEngagement: 6.2, leads: 31 },
        { themeLabel: "trust-led promotion", averageEngagement: 4.8, leads: 19 },
      ],
      productPriorities: [{ name: "School Fees Bridge", priority: 90 }],
      goals: [{ title: "Increase qualified leads", priority: 95 }],
    });

    expect(recommendations).toHaveLength(2);
    expect(recommendations[0].priorityScore).toBeGreaterThan(70);
    expect(recommendations[0].tone).toBe(ContentTone.LOCALIZED);
    expect(recommendations[1].tone).toBe(ContentTone.PROFESSIONAL);
    expect(recommendations.some((item) => item.channel === PublishingChannel.WHATSAPP)).toBe(true);
    expect(recommendations.some((item) => item.contentType === ContentType.EDUCATIONAL)).toBe(true);
  });
});
