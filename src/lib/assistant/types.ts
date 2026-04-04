import type { ContentTone, PublishingChannel } from "@prisma/client";

import type { UserRole } from "@/lib/auth/roles";

export type AssistantUserDefaults = {
  preferredChannel: PublishingChannel;
  preferredTone: ContentTone;
  preferredProductId: string | null;
  preferredProductName: string | null;
  preferredAudienceSegmentId: string | null;
  preferredAudienceName: string | null;
  preferredGoalId: string | null;
  preferredGoalTitle: string | null;
  hiddenTones: ContentTone[];
  summary: string;
};

export type AssistantSuggestion = {
  id: string;
  label: string;
  prompt: string;
  detail: string;
};

export type AssistantTrendCard = {
  id: string;
  title: string;
  description: string | null;
  source: string;
  matchedProductName: string | null;
  prompt: string;
  relevanceScore: number;
};

export type AssistantNextAction = {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
};

export type AssistantReviewInboxItem = {
  id: string;
  title: string;
  brief: string;
  ownerName: string;
  ownerRole: UserRole;
  updatedAt: Date;
};

export type AssistantHomeSnapshot = {
  defaults: AssistantUserDefaults;
  nextAction: AssistantNextAction;
  suggestions: AssistantSuggestion[];
  trendsForYou: AssistantTrendCard[];
  reviewInbox: AssistantReviewInboxItem[];
  fullPlan: {
    draftCount: number;
    reviewCount: number;
    readyCount: number;
    scheduledCount: number;
    topRecommendationTitles: string[];
  };
};
