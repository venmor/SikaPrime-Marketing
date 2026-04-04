import "server-only";

import { subHours } from "date-fns";

import { prisma } from "@/lib/db";
import {
  getIntegrationSettingBoolean,
  getIntegrationSettingValue,
} from "@/lib/integrations/service";
import {
  fetchWithObservability,
  logOperationalEvent,
} from "@/lib/operations/service";
import { clamp, splitList, truncate } from "@/lib/utils";

type LiveTrendDraft = {
  title: string;
  description: string | null;
  source: string;
  sourceUrl: string | null;
  relevanceScore: number;
};

type RedditSearchResponse = {
  data?: {
    children?: Array<{
      data?: {
        title?: string;
        selftext?: string;
        permalink?: string;
        subreddit_name_prefixed?: string;
        created_utc?: number;
        score?: number;
      };
    }>;
  };
};

type GNewsSearchResponse = {
  articles?: Array<{
    title?: string;
    description?: string;
    url?: string;
    publishedAt?: string;
    source?: {
      name?: string;
    };
  }>;
};

async function getKnowledgeKeywordPool() {
  const [profile, keywordOverride] = await Promise.all([
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
    getIntegrationSettingValue("social.live_keywords", ""),
  ]);

  const fromProfile = profile
    ? [
        profile.companyName,
        profile.primaryGoal,
        ...profile.products.flatMap((product) => [
          product.name,
          product.category,
          product.description,
        ]),
        ...profile.audienceSegments.flatMap((audience) => [
          audience.name,
          audience.description,
          audience.needs,
        ]),
        ...profile.offers.flatMap((offer) => [offer.name, offer.description]),
        ...profile.goals.flatMap((goal) => [goal.title, goal.description]),
      ]
    : [];

  return Array.from(
    new Set(
      [...fromProfile, keywordOverride]
        .flatMap((value) => splitList(value))
        .flatMap((value) => value.split(/\s+/))
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.length >= 4),
    ),
  );
}

function buildSearchQueries(keywords: string[]) {
  const curated = [
    "zambia loans",
    "digital lending zambia",
    "small business finance zambia",
    "salary advance zambia",
    "financial literacy zambia",
  ];
  const dynamic = keywords.slice(0, 8).map((keyword) => `${keyword} zambia`);

  return Array.from(new Set([...curated, ...dynamic])).slice(0, 8);
}

function scoreLiveTrend(input: {
  title: string;
  description: string;
  keywords: string[];
  publishedAt?: Date | null;
  sourceWeight: number;
  rawScore?: number;
}) {
  const text = `${input.title} ${input.description}`.toLowerCase();
  const keywordHits = input.keywords.filter((keyword) => text.includes(keyword)).length;
  const freshnessBoost =
    input.publishedAt && input.publishedAt > subHours(new Date(), 18)
      ? 16
      : input.publishedAt && input.publishedAt > subHours(new Date(), 48)
        ? 8
        : 2;
  const scoreBoost = input.rawScore ? Math.min(Math.round(input.rawScore / 8), 14) : 0;

  return clamp(keywordHits * 12 + freshnessBoost + scoreBoost + input.sourceWeight, 24, 100);
}

function dedupeLiveTrendDrafts(drafts: LiveTrendDraft[]) {
  const bestByTitle = new Map<string, LiveTrendDraft>();

  for (const draft of drafts) {
    const key = draft.title.toLowerCase();
    const existing = bestByTitle.get(key);

    if (!existing || draft.relevanceScore > existing.relevanceScore) {
      bestByTitle.set(key, draft);
    }
  }

  return [...bestByTitle.values()].sort(
    (left, right) => right.relevanceScore - left.relevanceScore,
  );
}

async function fetchRedditTrends(keywords: string[]) {
  const enabled = await getIntegrationSettingBoolean("social.reddit_enabled", true);

  if (!enabled) {
    return [];
  }

  const queries = buildSearchQueries(keywords).slice(0, 4);
  const responses = await Promise.allSettled(
    queries.map(async (query) => {
      const url = new URL("https://www.reddit.com/search.json");
      url.searchParams.set("q", query);
      url.searchParams.set("sort", "top");
      url.searchParams.set("t", "day");
      url.searchParams.set("limit", "6");

      const response = await fetchWithObservability(
        url,
        {
          headers: {
            "User-Agent": "SikaPrimeMarketingAgent/1.0",
            Accept: "application/json",
          },
          cache: "no-store",
        },
        {
          source: "reddit_live_search",
          operation: "fetch_live_trends",
          retries: 1,
          metadata: { query },
        },
      );

      if (!response.ok) {
        throw new Error(`Reddit search failed with status ${response.status}`);
      }

      const payload = (await response.json()) as RedditSearchResponse;

      return (payload.data?.children ?? []).flatMap((item) => {
        const entry = item.data;
        const title = entry?.title?.trim();

        if (!title) {
          return [];
        }

        const description = truncate(entry?.selftext?.trim() || query, 220);
        const publishedAt = entry?.created_utc
          ? new Date(entry.created_utc * 1000)
          : null;

        return [
          {
            title,
            description,
            source: entry?.subreddit_name_prefixed
              ? `Reddit ${entry.subreddit_name_prefixed}`
              : "Reddit Search",
            sourceUrl: entry?.permalink
              ? `https://www.reddit.com${entry.permalink}`
              : null,
            relevanceScore: scoreLiveTrend({
              title,
              description,
              keywords,
              publishedAt,
              rawScore: entry?.score,
              sourceWeight: 14,
            }),
          } satisfies LiveTrendDraft,
        ];
      });
    }),
  );

  return responses.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );
}

async function fetchGNewsTrends(keywords: string[]) {
  const apiKey = await getIntegrationSettingValue("social.gnews_api_key", "");

  if (!apiKey) {
    return [];
  }

  const queries = buildSearchQueries(keywords).slice(0, 3);
  const responses = await Promise.allSettled(
    queries.map(async (query) => {
      const url = new URL("https://gnews.io/api/v4/search");
      url.searchParams.set("q", query);
      url.searchParams.set("lang", "en");
      url.searchParams.set("country", "zm");
      url.searchParams.set("max", "6");
      url.searchParams.set("token", apiKey);

      const response = await fetchWithObservability(
        url,
        {
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        },
        {
          source: "gnews_live_search",
          operation: "fetch_live_trends",
          retries: 1,
          metadata: { query },
        },
      );

      if (!response.ok) {
        throw new Error(`GNews search failed with status ${response.status}`);
      }

      const payload = (await response.json()) as GNewsSearchResponse;

      return (payload.articles ?? []).flatMap((article) => {
        const title = article.title?.trim();

        if (!title) {
          return [];
        }

        const description = truncate(article.description?.trim() || query, 220);
        const publishedAt = article.publishedAt
          ? new Date(article.publishedAt)
          : null;

        return [
          {
            title,
            description,
            source: article.source?.name
              ? `GNews ${article.source.name}`
              : "GNews",
            sourceUrl: article.url ?? null,
            relevanceScore: scoreLiveTrend({
              title,
              description,
              keywords,
              publishedAt,
              sourceWeight: 18,
            }),
          } satisfies LiveTrendDraft,
        ];
      });
    }),
  );

  return responses.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );
}

function buildKeywordFallback(keywords: string[]) {
  return keywords.slice(0, 6).map((keyword, index) => ({
    title: `${keyword.replace(/\b\w/g, (character) => character.toUpperCase())} conversations are rising`,
    description: `Fallback live signal based on knowledge-base keywords for ${keyword}. Review and adapt carefully before using it in public content.`,
    source: "Keyword fallback",
    sourceUrl: null,
    relevanceScore: clamp(62 - index * 4, 40, 62),
  }));
}

export async function refreshLiveTrends() {
  const keywords = await getKnowledgeKeywordPool();
  const [redditDrafts, gnewsDrafts] = await Promise.all([
    fetchRedditTrends(keywords),
    fetchGNewsTrends(keywords),
  ]);

  const drafts = dedupeLiveTrendDrafts([
    ...gnewsDrafts,
    ...redditDrafts,
  ]).slice(0, 24);
  const fallbackDrafts = drafts.length ? [] : buildKeywordFallback(keywords);
  const finalDrafts = drafts.length ? drafts : fallbackDrafts;

  if (!finalDrafts.length) {
    await logOperationalEvent({
      severity: "warning",
      source: "live_trends",
      operation: "refresh_live_trends",
      message: "Live trend refresh returned no results.",
    });

    return [];
  }

  await prisma.liveTrend.deleteMany({
    where: {
      createdAt: {
        lt: subHours(new Date(), 72),
      },
    },
  });

  await prisma.liveTrend.createMany({
    data: finalDrafts,
  });

  return listLiveTrends(12);
}

async function listLiveTrends(limit: number) {
  return prisma.liveTrend.findMany({
    orderBy: [{ createdAt: "desc" }, { relevanceScore: "desc" }],
    take: limit,
  });
}

export async function getLiveTrends(limit = 12) {
  const latest = await prisma.liveTrend.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!latest || latest.createdAt < subHours(new Date(), 6)) {
    try {
      await refreshLiveTrends();
    } catch (error) {
      await logOperationalEvent({
        severity: "warning",
        source: "live_trends",
        operation: "refresh_on_read",
        message:
          error instanceof Error
            ? error.message
            : "Live trends could not be refreshed on read.",
      });
    }
  }

  return listLiveTrends(limit);
}

export async function getLiveTrendsByIds(ids: string[]) {
  if (!ids.length) {
    return [];
  }

  return prisma.liveTrend.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    orderBy: [{ relevanceScore: "desc" }, { createdAt: "desc" }],
  });
}
