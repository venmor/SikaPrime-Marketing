import { TrendRegion } from "@prisma/client";

export type TrendSourceConfig = {
  name: string;
  url: string;
  region: TrendRegion;
  topic: string;
  keywords: string[];
};

export type ConfigurableTrendFeed = {
  name: string;
  toggleKey: string;
  urlKey: string;
  region: TrendRegion;
  topic: string;
  keywords: string[];
};

export const interestKeywords = [
  "loan",
  "lending",
  "salary",
  "payday",
  "small business",
  "entrepreneur",
  "restock",
  "market",
  "cash flow",
  "mobile money",
  "budget",
  "school fees",
  "family",
  "personal finance",
  "savings",
  "emergency",
  "housing",
  "transport",
  "cost of living",
  "youth",
  "student",
  "social media",
  "viral",
  "conversation",
  "online",
  "phrase",
  "challenge",
  "trend",
  "community",
];

export const blockedKeywords = [
  "murder",
  "crime",
  "arrest",
  "fraud",
  "violence",
  "election",
  "war",
  "death",
  "scandal",
  "lawsuit",
  "racist",
  "porn",
  "suicide",
  "drug",
  "exploit",
  "abuse",
  "corruption",
  "tribal",
  "hate",
  "explicit",
];

export const defaultTrendSources: TrendSourceConfig[] = [
  {
    name: "Diggers News",
    url: "https://diggers.news/feed/",
    region: TrendRegion.LOCAL,
    topic: "Zambian current affairs and household money pressure",
    keywords: ["zambia", "cost of living", "business", "budget", "market"],
  },
  {
    name: "Lusaka Times",
    url: "https://www.lusakatimes.com/feed/",
    region: TrendRegion.LOCAL,
    topic: "Local conversations, SMEs, and family finance",
    keywords: ["zambia", "school", "small business", "transport", "market"],
  },
  {
    name: "BBC Business",
    url: "https://feeds.bbci.co.uk/news/business/rss.xml",
    region: TrendRegion.GLOBAL,
    topic: "Global finance, work, and consumer spending",
    keywords: ["finance", "consumer", "lending", "salary", "market"],
  },
  {
    name: "BBC Technology",
    url: "https://feeds.bbci.co.uk/news/technology/rss.xml",
    region: TrendRegion.GLOBAL,
    topic: "Digital behavior, fintech, and online consumer trends",
    keywords: ["technology", "fintech", "payments", "digital", "mobile"],
  },
];

export const configurableTrendFeeds: ConfigurableTrendFeed[] = [
  {
    name: "Google Trends Signals",
    toggleKey: "social.google_trends_enabled",
    urlKey: "social.google_trends_feed",
    region: TrendRegion.GLOBAL,
    topic: "Search momentum around finance, youth, school, and budgeting behavior",
    keywords: ["trends", "search", "youth", "school fees", "money", "business"],
  },
  {
    name: "Meta Insight Signals",
    toggleKey: "social.meta_insights_enabled",
    urlKey: "social.meta_signals_feed",
    region: TrendRegion.LOCAL,
    topic: "High-performing audience attention patterns from approved Meta insight feeds",
    keywords: ["facebook", "meta", "engagement", "phrase", "audience", "conversation"],
  },
  {
    name: "Instagram Signal Feed",
    toggleKey: "social.instagram_signals_enabled",
    urlKey: "social.instagram_signals_feed",
    region: TrendRegion.GLOBAL,
    topic: "Visual and phrase-based social attention patterns from Instagram-friendly monitoring feeds",
    keywords: ["instagram", "reels", "caption", "phrase", "viral", "style"],
  },
  {
    name: "TikTok Signal Feed",
    toggleKey: "social.tiktok_signals_enabled",
    urlKey: "social.tiktok_signals_feed",
    region: TrendRegion.GLOBAL,
    topic: "Short-form social phrases, challenges, and audience obsessions from TikTok monitoring feeds",
    keywords: ["tiktok", "challenge", "sound", "viral", "phrase", "trend"],
  },
  {
    name: "Approved Monitoring Feed",
    toggleKey: "social.monitoring_enabled",
    urlKey: "social.monitoring_webhook",
    region: TrendRegion.LOCAL,
    topic: "Approved monitoring provider feed for social-safe trend signals",
    keywords: ["conversation", "audience", "hook", "engagement", "attention", "social"],
  },
];
