import type { ContentTone, PublishingChannel } from "@prisma/client";

export type AIGenerationChannelSelection =
  | "FACEBOOK"
  | "WHATSAPP"
  | "BOTH";

export type ChannelOption = Extract<PublishingChannel, "FACEBOOK" | "WHATSAPP">;

export type LiveTrendPreview = {
  id: string;
  title: string;
  description: string | null;
  source: string;
  sourceUrl: string | null;
  relevanceScore: number;
  createdAt: string;
};

export type AIGenerationSubjectDetails = {
  productId?: string | null;
  offerId?: string | null;
  audienceSegmentId?: string | null;
  goalId?: string | null;
  tone: ContentTone;
  customInstructions?: string | null;
};

export type FacebookChannelPayload = {
  kind: "FACEBOOK";
  body: string;
  caption: string;
  engagementComments: string[];
};

export type WhatsAppChannelPayload = {
  kind: "WHATSAPP";
  message: string;
  buttons?: string[];
};

export type GeneratedChannelPayload =
  | FacebookChannelPayload
  | WhatsAppChannelPayload;

export type AIGeneratedChannelPreview = {
  contentItemId: string;
  channel: ChannelOption;
  title: string;
  stage: "DRAFT" | "IN_REVIEW";
  callToAction: string;
  hashtags: string[];
  themeLabel: string;
  rationale: string;
  promptMetadata: {
    objective: string;
    productName?: string | null;
    offerName?: string | null;
    audienceName?: string | null;
    goalTitle?: string | null;
    selectedTrendIds: string[];
    selectedTrendTitles: string[];
  };
  payload: GeneratedChannelPayload;
};

export type AIGenerationResult =
  | {
      status: "success";
      message: string;
      items: AIGeneratedChannelPreview[];
      usedLiveTrends: LiveTrendPreview[];
    }
  | {
      status: "error";
      message: string;
      items?: never;
      usedLiveTrends?: LiveTrendPreview[];
    };

export type AIGenerationSaveInput = {
  items: AIGeneratedChannelPreview[];
  submitForReview?: boolean;
};

export type AssistantInterpretationResult =
  | {
      status: "ready";
      channelSelection: AIGenerationChannelSelection;
      subjectDetails: AIGenerationSubjectDetails;
      trendIds: string[];
      explanation: string;
    }
  | {
      status: "needs_clarification";
      question: string;
      partial: {
        channelSelection: AIGenerationChannelSelection;
        subjectDetails: AIGenerationSubjectDetails;
        trendIds: string[];
      };
      explanation: string;
    };

export type AssistantRunResult =
  | {
      status: "success";
      message: string;
      items: AIGeneratedChannelPreview[];
      usedLiveTrends: LiveTrendPreview[];
      explanation: string;
      defaultsSummary: string;
    }
  | {
      status: "needs_clarification";
      question: string;
      explanation: string;
      defaultsSummary: string;
    }
  | {
      status: "error";
      message: string;
    };
