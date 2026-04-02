import { scoreTrend } from "@/lib/engines/trends/scoring";

describe("trend scoring", () => {
  it("rewards fresh, relevant, brand-fit signals", () => {
    const recent = new Date();
    recent.setHours(recent.getHours() - 4);

    const score = scoreTrend({
      text: "Small business cash flow and school fees budgeting are trending in Zambia",
      publishedAt: recent,
      businessTerms: ["zambia", "school", "business", "cash", "budget"],
      interestTerms: ["school fees", "small business", "cash flow", "budget"],
      sourceKeywords: ["zambia", "market"],
    });

    expect(score.relevanceScore).toBeGreaterThan(60);
    expect(score.freshnessScore).toBeGreaterThan(80);
    expect(score.brandFitScore).toBeGreaterThan(60);
    expect(score.totalScore).toBeGreaterThan(70);
  });

  it("penalizes stale or unsafe signals", () => {
    const older = new Date();
    older.setDate(older.getDate() - 30);

    const score = scoreTrend({
      text: "Election scandal and fraud dominate the news cycle",
      publishedAt: older,
      businessTerms: ["trust", "family", "budget"],
      interestTerms: ["loan", "budget", "family"],
      sourceKeywords: ["politics"],
    });

    expect(score.freshnessScore).toBeLessThan(20);
    expect(score.brandFitScore).toBeLessThan(45);
    expect(score.totalScore).toBeLessThan(50);
  });
});
