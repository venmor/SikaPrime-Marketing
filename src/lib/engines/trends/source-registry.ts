import { TrendRegion } from "@prisma/client";

export type TrendSourceConfig = {
  name: string;
  url: string;
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
