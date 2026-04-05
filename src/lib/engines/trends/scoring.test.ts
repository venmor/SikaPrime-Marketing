import { countKeywordMatches, scoreTrend } from "@/lib/engines/trends/scoring";

describe("countKeywordMatches", () => {
  it("counts exact and partial matches", () => {
    expect(countKeywordMatches("the quick brown fox", ["quick", "fox", "dog"])).toBe(2);
    expect(countKeywordMatches("apples and oranges", ["apple", "orange", "banana"])).toBe(2);
  });

  it("is case insensitive", () => {
    expect(countKeywordMatches("The Quick Brown Fox", ["QUICK", "Fox", "DOG"])).toBe(2);
  });

  it("handles special characters by replacing them with spaces", () => {
    expect(countKeywordMatches("test-word, another! word", ["test word", "another  word"])).toBe(2);
    expect(countKeywordMatches("user@domain.com", ["user domain com"])).toBe(1);
  });

  it("handles empty inputs", () => {
    expect(countKeywordMatches("", ["test", "words"])).toBe(0);
    expect(countKeywordMatches("some text", [])).toBe(0);
    expect(countKeywordMatches("", [])).toBe(0);
  });
});

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
