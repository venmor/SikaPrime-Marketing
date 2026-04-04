import { TrendRegion } from "@prisma/client";
import Parser from "rss-parser";
import { subDays } from "date-fns";

import { prisma } from "@/lib/db";
import {
  defaultTrendSources,
  interestKeywords,
  type TrendSourceConfig,
} from "@/lib/engines/trends/source-registry";
import { countKeywordMatches, scoreTrend } from "@/lib/engines/trends/scoring";
import {
  fetchWithObservability,
  logOperationalEvent,
} from "@/lib/operations/service";
import { humanizeEnum, splitList, truncate } from "@/lib/utils";

type FeedItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  content?: string;
  contentSnippet?: string;
  summary?: string;
};

const parser = new Parser<Record<string, never>, FeedItem>();

function stripHtml(value?: string) {
  return (value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function isSafeTrendText(text: string) {
  const normalized = text.toLowerCase();
  const riskyPhrases = [
    "graphic",
    "shocking",
    "exposed",
    "leaked",
    "attack",
    "riot",
    "sexual",
    "political violence",
    "betting scandal",
  ];

  return !riskyPhrases.some((phrase) => normalized.includes(phrase));
}

async function collectBusinessTerms() {
  const profile = await prisma.businessProfile.findUnique({
    where: { id: 1 },
    include: {
      values: true,
      products: true,
      audienceSegments: true,
      goals: true,
      offers: true,
    },
  });

  if (!profile) {
    return [];
  }

  return [
    profile.companyName,
    profile.brandPromise,
    profile.primaryGoal,
    ...profile.values.flatMap((value) => [value.name, value.description]),
    ...profile.products.flatMap((product) => [product.name, product.category]),
    ...profile.audienceSegments.flatMap((segment) => [
      segment.name,
      ...splitList(segment.needs),
    ]),
    ...profile.goals.map((goal) => goal.title),
    ...profile.offers.map((offer) => offer.name),
  ]
    .join(" ")
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 3);
}

async function fetchSource(source: TrendSourceConfig, businessTerms: string[]) {
  const response = await fetchWithObservability(
    source.url,
    {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    },
    {
      source: source.name,
      operation: "refresh_trend_source",
      retries: 1,
      metadata: {
        region: source.region,
        topic: source.topic,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`${source.name} returned HTTP ${response.status}.`);
  }

  const feed = await parser.parseString(await response.text());
  const freshnessCutoff = subDays(new Date(), 45);

  return (feed.items ?? [])
    .map((item) => {
      const title = item.title?.trim();
      const publishedAt = new Date(item.isoDate ?? item.pubDate ?? Date.now());
      const summary = stripHtml(
        item.contentSnippet ?? item.summary ?? item.content ?? "",
      );

      if (!title || Number.isNaN(publishedAt.getTime()) || publishedAt < freshnessCutoff) {
        return null;
      }

      const combinedText = `${title} ${summary}`.trim();
      const keywordHits = countKeywordMatches(
        combinedText,
        [...interestKeywords, ...source.keywords],
      );

      if (keywordHits === 0 || !isSafeTrendText(combinedText)) {
        return null;
      }

      const score = scoreTrend({
        text: combinedText,
        publishedAt,
        businessTerms,
        interestTerms: interestKeywords,
        sourceKeywords: source.keywords,
      });

      return {
        title,
        summary: truncate(summary || source.topic, 240),
        sourceName: source.name,
        sourceUrl: item.link ?? source.url,
        region: source.region,
        topic: source.topic,
        keywords: source.keywords.join(", "),
        publishedAt,
        detectedAt: new Date(),
        ...score,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function dedupeSignals<T extends { title: string; totalScore: number }>(signals: T[]) {
  const bestByTitle = new Map<string, T>();

  for (const signal of signals) {
    const key = signal.title.toLowerCase();
    const existing = bestByTitle.get(key);

    if (!existing || signal.totalScore > existing.totalScore) {
      bestByTitle.set(key, signal);
    }
  }

  return [...bestByTitle.values()];
}

export async function getTrendCollections() {
  const trends = await prisma.trendSignal.findMany({
    orderBy: [{ totalScore: "desc" }, { freshnessScore: "desc" }],
  });

  return {
    local: trends.filter((trend) => trend.region === TrendRegion.LOCAL),
    global: trends.filter((trend) => trend.region === TrendRegion.GLOBAL),
    lastUpdated: trends[0]?.detectedAt ?? null,
  };
}

export function explainTrendOpportunity(input: {
  trend: {
    title: string;
    topic: string;
    region: string;
    lifecycle: string;
    totalScore: number;
  };
  companyName: string;
}) {
  const whyItMatters = [
    `${input.trend.title} is currently ${input.trend.lifecycle.toLowerCase()}, which means the audience conversation is still usable.`,
    input.trend.region === "LOCAL"
      ? "It reflects a local Zambian context that can make Sika Prime feel more relevant and practical."
      : "It offers a broader market signal that can be localized into trusted finance messaging.",
    `Its overall score of ${input.trend.totalScore} suggests strong timing and business relevance.`,
    "It passed the current safety filter, so it can be adapted without chasing harmful or brand-risky attention.",
  ].join(" ");

  const adaptationIdea =
    input.trend.region === "LOCAL"
      ? `${input.companyName} can connect this trend to everyday borrowing moments, budgeting pressure, and responsible support in Zambia.`
      : `${input.companyName} can translate this global theme into locally grounded trust-building or educational content.`;

  return {
    whyItMatters,
    adaptationIdea,
    regionLabel: humanizeEnum(input.trend.region),
    lifecycleLabel: humanizeEnum(input.trend.lifecycle),
  };
}

export async function refreshTrendSignals() {
  const businessTerms = await collectBusinessTerms();

  const fetched = await Promise.allSettled(
    defaultTrendSources.map((source) => fetchSource(source, businessTerms)),
  );
  const failedSources = fetched.flatMap((result, index) =>
    result.status === "rejected" && defaultTrendSources[index]
      ? [defaultTrendSources[index].name]
      : [],
  );

  const signals = dedupeSignals(
    fetched.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    ),
  )
    .sort((left, right) => right.totalScore - left.totalScore)
    .slice(0, 24);

  if (failedSources.length) {
    await logOperationalEvent({
      severity: "warning",
      source: "trend_engine",
      operation: "refresh_trends",
      message: `Trend refresh completed with ${failedSources.length} source failure(s).`,
      metadata: {
        failedSources,
      },
    });
  }

  if (!signals.length) {
    await logOperationalEvent({
      severity: "warning",
      source: "trend_engine",
      operation: "refresh_trends",
      message: "Trend refresh produced no safe or relevant signals.",
      metadata: {
        failedSources,
        sourceCount: defaultTrendSources.length,
      },
    });

    return getTrendCollections();
  }

  await prisma.$transaction([
    prisma.trendSignal.deleteMany(),
    prisma.trendSignal.createMany({ data: signals }),
  ]);

  return getTrendCollections();
}
