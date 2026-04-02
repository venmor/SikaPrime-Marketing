import { TrendLifecycle, TrendStatus } from "@prisma/client";
import { differenceInHours } from "date-fns";

import { blockedKeywords } from "@/lib/engines/trends/source-registry";
import { clamp } from "@/lib/utils";

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

export function countKeywordMatches(text: string, keywords: string[]) {
  const normalized = normalizeText(text);

  return keywords.reduce((count, keyword) => {
    return normalized.includes(keyword.toLowerCase()) ? count + 1 : count;
  }, 0);
}

export function calculateFreshnessScore(publishedAt: Date, now = new Date()) {
  const hoursOld = Math.max(0, differenceInHours(now, publishedAt));
  const score = Math.round(100 * Math.exp(-hoursOld / 120));
  return clamp(score, 10, 100);
}

export function calculateRelevanceScore(
  text: string,
  interestTerms: string[],
  sourceKeywords: string[],
) {
  const matchCount = countKeywordMatches(text, interestTerms);
  const sourceMatchCount = countKeywordMatches(text, sourceKeywords);
  return clamp(18 + matchCount * 16 + sourceMatchCount * 10, 0, 100);
}

export function calculateBrandFitScore(text: string, businessTerms: string[]) {
  const positiveMatches = countKeywordMatches(text, businessTerms);
  const blockedMatches = countKeywordMatches(text, blockedKeywords);
  return clamp(42 + positiveMatches * 11 - blockedMatches * 22, 0, 100);
}

export function getTrendStatus(totalScore: number, freshnessScore: number) {
  if (totalScore >= 78 && freshnessScore >= 60) {
    return TrendStatus.RISING;
  }

  if (totalScore >= 50) {
    return TrendStatus.WATCH;
  }

  return TrendStatus.COOLING;
}

export function getTrendLifecycle(
  totalScore: number,
  freshnessScore: number,
  publishedAt: Date,
) {
  const ageInHours = Math.max(0, differenceInHours(new Date(), publishedAt));

  if (totalScore >= 78 && freshnessScore >= 82 && ageInHours <= 96) {
    return TrendLifecycle.EMERGING;
  }

  if (totalScore >= 62 && freshnessScore >= 45) {
    return TrendLifecycle.ACTIVE;
  }

  if (totalScore >= 38 && freshnessScore >= 18) {
    return TrendLifecycle.SATURATED;
  }

  return TrendLifecycle.DEAD;
}

export function scoreTrend(input: {
  text: string;
  publishedAt: Date;
  businessTerms: string[];
  interestTerms: string[];
  sourceKeywords: string[];
}) {
  const relevanceScore = calculateRelevanceScore(
    input.text,
    input.interestTerms,
    input.sourceKeywords,
  );
  const freshnessScore = calculateFreshnessScore(input.publishedAt);
  const brandFitScore = calculateBrandFitScore(input.text, input.businessTerms);
  const totalScore = Math.round(
    relevanceScore * 0.4 + freshnessScore * 0.3 + brandFitScore * 0.3,
  );

  return {
    relevanceScore,
    freshnessScore,
    brandFitScore,
    totalScore,
    status: getTrendStatus(totalScore, freshnessScore),
    lifecycle: getTrendLifecycle(totalScore, freshnessScore, input.publishedAt),
  };
}
