import { TrendRegion } from "@prisma/client";
import Parser from "rss-parser";
import { subDays } from "date-fns";

import { prisma } from "@/lib/db";
import {
  configurableTrendFeeds,
  defaultTrendSources,
  interestKeywords,
  type TrendSourceConfig,
} from "@/lib/engines/trends/source-registry";
import {
  getIntegrationSettingBoolean,
  getIntegrationSettingValue,
} from "@/lib/integrations/service";
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

type JsonTrendFeedItem = {
  title?: string;
  summary?: string;
  description?: string;
  url?: string;
  link?: string;
  publishedAt?: string;
  published_at?: string;
};

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

function normalizeJsonItems(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload as JsonTrendFeedItem[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { items?: unknown[] }).items)
  ) {
    return (payload as { items: JsonTrendFeedItem[] }).items;
  }

  return [];
}

function mapToScoredSignal(
  source: TrendSourceConfig,
  businessTerms: string[],
  input: {
    title?: string | null;
    summary?: string | null;
    sourceUrl?: string | null;
    publishedAt?: Date | null;
  },
) {
  const title = input.title?.trim();
  const publishedAt = input.publishedAt ?? null;
  const freshnessCutoff = subDays(new Date(), 45);
  const summary = stripHtml(input.summary ?? "");

  if (
    !title ||
    !publishedAt ||
    Number.isNaN(publishedAt.getTime()) ||
    publishedAt < freshnessCutoff
  ) {
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
    sourceUrl: input.sourceUrl ?? source.url,
    region: source.region,
    topic: source.topic,
    keywords: source.keywords.join(", "),
    publishedAt,
    detectedAt: new Date(),
    ...score,
  };
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

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return normalizeJsonItems(await response.json())
      .map((item) =>
        mapToScoredSignal(source, businessTerms, {
          title: item.title,
          summary: item.summary ?? item.description,
          sourceUrl: item.url ?? item.link,
          publishedAt: item.publishedAt || item.published_at
            ? new Date(item.publishedAt ?? item.published_at ?? Date.now())
            : new Date(),
        }),
      )
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }

  const feed = await parser.parseString(await response.text());

  return (feed.items ?? [])
    .map((item) =>
      mapToScoredSignal(source, businessTerms, {
        title: item.title,
        summary: item.contentSnippet ?? item.summary ?? item.content ?? "",
        sourceUrl: item.link,
        publishedAt: new Date(item.isoDate ?? item.pubDate ?? Date.now()),
      }),
    )
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
  const configurableSources = (
    await Promise.all(
      configurableTrendFeeds.map(async (feed) => {
        const [enabled, url] = await Promise.all([
          getIntegrationSettingBoolean(feed.toggleKey, false),
          getIntegrationSettingValue(feed.urlKey),
        ]);

        if (!enabled || !url) {
          return null;
        }

        return {
          name: feed.name,
          url,
          region: feed.region,
          topic: feed.topic,
          keywords: feed.keywords,
        } satisfies TrendSourceConfig;
      }),
    )
  ).filter((item): item is TrendSourceConfig => Boolean(item));
  const activeSources = [...defaultTrendSources, ...configurableSources];

  const fetched = await Promise.allSettled(
    activeSources.map((source) => fetchSource(source, businessTerms)),
  );
  const failedSources = fetched.flatMap((result, index) =>
    result.status === "rejected" && activeSources[index]
      ? [activeSources[index].name]
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
        sourceCount: activeSources.length,
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
