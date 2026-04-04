import "server-only";

import { z } from "zod";

import type {
  AIGenerationSubjectDetails,
  ChannelOption,
  FacebookChannelPayload,
  LiveTrendPreview,
  WhatsAppChannelPayload,
} from "@/lib/ai/types";
import { prisma } from "@/lib/db";
import { getLiveTrends, getLiveTrendsByIds } from "@/lib/engines/trends/liveTrendService";
import { getIntegrationSettingValue } from "@/lib/integrations/service";
import { fetchWithObservability } from "@/lib/operations/service";
import { splitList } from "@/lib/utils";

const facebookSchema = z.object({
  title: z.string().min(6),
  body: z.string().min(40),
  caption: z.string().min(16),
  engagementComments: z.array(z.string().min(6)).min(2).max(3),
  callToAction: z.string().min(4),
  hashtags: z.array(z.string().min(2)).min(2).max(8),
  themeLabel: z.string().min(3),
  rationale: z.string().min(12),
});

const whatsappSchema = z.object({
  title: z.string().min(6),
  message: z.string().min(24),
  buttons: z.array(z.string().min(2)).max(3).optional(),
  callToAction: z.string().min(4),
  hashtags: z.array(z.string().min(2)).min(1).max(6),
  themeLabel: z.string().min(3),
  rationale: z.string().min(12),
});

type ResolvedContext = {
  profile: {
    companyName: string;
    toneSummary: string;
    brandPromise: string;
    primaryGoal: string;
    coreNarrative: string;
    complianceSummary: string;
    valueProposition: string;
    values: string[];
    complianceRules: string[];
    guardrails: string[];
  };
  product: {
    id: string;
    name: string;
    description: string;
    benefits: string[];
    callToAction: string;
  } | null;
  offer: {
    id: string;
    name: string;
    description: string;
    callToAction: string;
  } | null;
  audience: {
    id: string;
    name: string;
    description: string;
    needs: string[];
    angles: string[];
  } | null;
  goal: {
    id: string;
    title: string;
    description: string;
  } | null;
};

type GenerationTrace = {
  channel: ChannelOption;
  prompt: string;
  requestPayload: string;
  responsePayload: string;
  responseText: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

type GeneratedOutput = {
  channel: ChannelOption;
  title: string;
  callToAction: string;
  hashtags: string[];
  themeLabel: string;
  rationale: string;
  payload: FacebookChannelPayload | WhatsAppChannelPayload;
};

export type GeneratedMarketingContent = {
  provider: string;
  model: string;
  objective: string;
  context: ResolvedContext;
  usedLiveTrends: LiveTrendPreview[];
  outputs: GeneratedOutput[];
  traces: GenerationTrace[];
};

function normalizeHashtags(tags: string[]) {
  return tags
    .map((tag) => tag.trim().replace(/^#*/, ""))
    .filter(Boolean)
    .map((tag) => `#${tag.replace(/\s+/g, "")}`);
}

function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const maybePayload = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  if (typeof maybePayload.output_text === "string" && maybePayload.output_text) {
    return maybePayload.output_text;
  }

  if (Array.isArray(maybePayload.output)) {
    return maybePayload.output
      .flatMap((item) => item.content ?? [])
      .map((item) => item.text ?? "")
      .join("\n")
      .trim();
  }

  return "";
}

function extractUsage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const usage = (payload as {
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      total_tokens?: number;
    };
  }).usage;

  return {
    promptTokens: usage?.input_tokens,
    completionTokens: usage?.output_tokens,
    totalTokens: usage?.total_tokens,
  };
}

function parseJson<T>(raw: string, schema: z.ZodType<T>) {
  const match = raw.match(/\{[\s\S]*\}/);

  if (!match) {
    return null;
  }

  try {
    return schema.parse(JSON.parse(match[0]));
  } catch {
    return null;
  }
}

async function loadResolvedContext(
  subjectDetails: AIGenerationSubjectDetails,
): Promise<ResolvedContext> {
  const profile = await prisma.businessProfile.findUnique({
    where: { id: 1 },
    include: {
      values: true,
      complianceRules: true,
      guardrailTerms: {
        where: { active: true },
      },
      products: {
        where: { active: true },
      },
      offers: {
        where: { active: true },
      },
      audienceSegments: true,
      goals: {
        where: { active: true },
      },
    },
  });

  if (!profile) {
    throw new Error("Business knowledge is not configured yet.");
  }

  const product = subjectDetails.productId
    ? profile.products.find((item) => item.id === subjectDetails.productId) ?? null
    : null;
  const offer = subjectDetails.offerId
    ? profile.offers.find((item) => item.id === subjectDetails.offerId) ?? null
    : null;
  const audience = subjectDetails.audienceSegmentId
    ? profile.audienceSegments.find(
        (item) => item.id === subjectDetails.audienceSegmentId,
      ) ?? null
    : null;
  const goal = subjectDetails.goalId
    ? profile.goals.find((item) => item.id === subjectDetails.goalId) ?? null
    : null;

  return {
    profile: {
      companyName: profile.companyName,
      toneSummary: profile.toneSummary,
      brandPromise: profile.brandPromise,
      primaryGoal: profile.primaryGoal,
      coreNarrative: profile.coreNarrative,
      complianceSummary: profile.complianceSummary,
      valueProposition: profile.valueProposition,
      values: profile.values.map((value) => `${value.name}: ${value.description}`),
      complianceRules: profile.complianceRules.map(
        (rule) => `${rule.title}: ${rule.ruleText} (${rule.guidance})`,
      ),
      guardrails: profile.guardrailTerms.map(
        (guardrail) => `${guardrail.phrase}: ${guardrail.explanation}`,
      ),
    },
    product: product
      ? {
          id: product.id,
          name: product.name,
          description: product.description,
          benefits: splitList(product.keyBenefits),
          callToAction: product.callToAction,
        }
      : null,
    offer: offer
      ? {
          id: offer.id,
          name: offer.name,
          description: offer.description,
          callToAction: offer.callToAction,
        }
      : null,
    audience: audience
      ? {
          id: audience.id,
          name: audience.name,
          description: audience.description,
          needs: splitList(audience.needs),
          angles: splitList(audience.messagingAngles),
        }
      : null,
    goal: goal
      ? {
          id: goal.id,
          title: goal.title,
          description: goal.description,
        }
      : null,
  };
}

async function resolveLiveTrends(trendIds: string[]) {
  const [selected, current] = await Promise.all([
    getLiveTrendsByIds(trendIds),
    getLiveTrends(3),
  ]);

  const merged = [...selected, ...current];
  const seen = new Set<string>();

  return merged
    .filter((trend) => {
      if (seen.has(trend.id)) {
        return false;
      }

      seen.add(trend.id);
      return true;
    })
    .slice(0, 3)
    .map((trend) => ({
      id: trend.id,
      title: trend.title,
      description: trend.description,
      source: trend.source,
      sourceUrl: trend.sourceUrl,
      relevanceScore: trend.relevanceScore,
      createdAt: trend.createdAt.toISOString(),
    }));
}

function buildObjective(context: ResolvedContext, customInstructions?: string | null) {
  const goalLine = context.goal?.title
    ? `Primary goal: ${context.goal.title}. ${context.goal.description}`
    : `Primary goal: ${context.profile.primaryGoal}`;
  const customLine = customInstructions?.trim()
    ? `Custom direction: ${customInstructions.trim()}`
    : null;

  return [goalLine, customLine].filter(Boolean).join(" ");
}

function buildSystemPrompt(channel: ChannelOption, context: ResolvedContext, trends: LiveTrendPreview[]) {
  const channelRules =
    channel === "FACEBOOK"
      ? [
          "Return JSON only.",
          "Generate a premium but readable Facebook post.",
          "Include body, caption, and 2 to 3 suggested engagement comments.",
          "Keep the copy safe for a regulated lending brand and avoid spammy phrasing.",
        ]
      : [
          "Return JSON only.",
          "Generate a WhatsApp-safe message that feels direct, conversational, and compliant.",
          "Do not use manipulative urgency or misleading claims.",
          "If buttons are included, keep them short and generic because interactive delivery may be added later.",
        ];

  return [
    `You are the senior marketing copy engine for ${context.profile.companyName}.`,
    `Brand promise: ${context.profile.brandPromise}`,
    `Brand voice: ${context.profile.toneSummary}`,
    `Core narrative: ${context.profile.coreNarrative}`,
    `Value proposition: ${context.profile.valueProposition}`,
    `Company values: ${context.profile.values.join(" | ")}`,
    `Compliance summary: ${context.profile.complianceSummary}`,
    `Compliance rules: ${context.profile.complianceRules.join(" | ")}`,
    `Prohibited or risky terms to avoid entirely: ${context.profile.guardrails.join(" | ")}`,
    `Selected live trends: ${trends.map((trend) => `${trend.title} (${trend.source})`).join(" | ") || "No live trend selected"}`,
    ...channelRules,
  ].join("\n");
}

function buildUserPrompt(input: {
  channel: ChannelOption;
  subjectDetails: AIGenerationSubjectDetails;
  context: ResolvedContext;
  trends: LiveTrendPreview[];
  objective: string;
}) {
  return [
    `Channel: ${input.channel}`,
    `Objective: ${input.objective}`,
    `Product: ${input.context.product?.name ?? "General brand message"}`,
    `Product description: ${input.context.product?.description ?? "General business support"}`,
    `Product benefits: ${input.context.product?.benefits.join(" | ") ?? "Use the broader value proposition"}`,
    `Offer: ${input.context.offer ? `${input.context.offer.name} - ${input.context.offer.description}` : "No specific offer"}`,
    `Audience: ${input.context.audience ? `${input.context.audience.name} - ${input.context.audience.description}` : "General audience"}`,
    `Audience needs: ${input.context.audience?.needs.join(" | ") ?? "Use broad trust-building needs"}`,
    `Messaging angles: ${input.context.audience?.angles.join(" | ") ?? "Use the overall brand narrative"}`,
    `Tone: ${input.subjectDetails.tone}`,
    `Live trend details: ${input.trends.map((trend) => `${trend.title}: ${trend.description ?? "No description"}`).join(" | ") || "Use evergreen relevance only"}`,
    input.channel === "FACEBOOK"
      ? 'Return JSON with keys: title, body, caption, engagementComments, callToAction, hashtags, themeLabel, rationale.'
      : 'Return JSON with keys: title, message, buttons, callToAction, hashtags, themeLabel, rationale.',
  ].join("\n");
}

async function runGeneration(channel: ChannelOption, prompt: string, systemPrompt: string) {
  const [apiKey, model] = await Promise.all([
    getIntegrationSettingValue("openai.api_key", process.env.OPENAI_API_KEY ?? ""),
    getIntegrationSettingValue(
      "openai.text_model",
      process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    ),
  ]);

  if (!apiKey) {
    throw new Error("AI generation is not configured yet. Add an OpenAI API key in Integrations.");
  }

  const requestPayload = {
    model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: systemPrompt,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: prompt,
          },
        ],
      },
    ],
  };

  const response = await fetchWithObservability(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestPayload),
      cache: "no-store",
    },
    {
      source: "openai",
      operation: "generate_ai_marketing_content",
      retries: 1,
      metadata: {
        channel,
        model,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`AI generation failed with status ${response.status}.`);
  }

  const responsePayload = await response.json();
  const responseText = extractResponseText(responsePayload);

  if (!responseText) {
    throw new Error("AI generation returned an empty response.");
  }

  return {
    model,
    requestPayload: JSON.stringify(requestPayload),
    responsePayload: JSON.stringify(responsePayload),
    responseText,
    ...extractUsage(responsePayload),
  };
}

export async function generateMarketingContent(input: {
  channelSelection: "FACEBOOK" | "WHATSAPP" | "BOTH";
  subjectDetails: AIGenerationSubjectDetails;
  trendIds?: string[];
}) {
  const channels: ChannelOption[] =
    input.channelSelection === "BOTH"
      ? ["FACEBOOK", "WHATSAPP"]
      : [input.channelSelection];
  const [context, liveTrends] = await Promise.all([
    loadResolvedContext(input.subjectDetails),
    resolveLiveTrends(input.trendIds ?? []),
  ]);
  const objective = buildObjective(context, input.subjectDetails.customInstructions);
  const provider = "openai";
  const traces: GenerationTrace[] = [];
  const outputs: GeneratedOutput[] = [];

  for (const channel of channels) {
    const systemPrompt = buildSystemPrompt(channel, context, liveTrends);
    const userPrompt = buildUserPrompt({
      channel,
      subjectDetails: input.subjectDetails,
      context,
      trends: liveTrends,
      objective,
    });
    const generated = await runGeneration(channel, userPrompt, systemPrompt);

    traces.push({
      channel,
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      requestPayload: generated.requestPayload,
      responsePayload: generated.responsePayload,
      responseText: generated.responseText,
      promptTokens: generated.promptTokens,
      completionTokens: generated.completionTokens,
      totalTokens: generated.totalTokens,
    });

    if (channel === "FACEBOOK") {
      const parsed = parseJson(generated.responseText, facebookSchema);

      if (!parsed) {
        throw new Error("AI returned Facebook content in an unexpected format.");
      }

      outputs.push({
        channel,
        title: parsed.title,
        callToAction: parsed.callToAction,
        hashtags: normalizeHashtags(parsed.hashtags),
        themeLabel: parsed.themeLabel,
        rationale: parsed.rationale,
        payload: {
          kind: "FACEBOOK",
          body: parsed.body,
          caption: parsed.caption,
          engagementComments: parsed.engagementComments,
        },
      });
      continue;
    }

    const parsed = parseJson(generated.responseText, whatsappSchema);

    if (!parsed) {
      throw new Error("AI returned WhatsApp content in an unexpected format.");
    }

    outputs.push({
      channel,
      title: parsed.title,
      callToAction: parsed.callToAction,
      hashtags: normalizeHashtags(parsed.hashtags),
      themeLabel: parsed.themeLabel,
      rationale: parsed.rationale,
      payload: {
        kind: "WHATSAPP",
        message: parsed.message,
        buttons: parsed.buttons?.filter(Boolean),
      },
    });
  }

  return {
    provider,
    model: traces[0]?.prompt ? await getIntegrationSettingValue(
      "openai.text_model",
      process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    ) : "openai",
    objective,
    context,
    usedLiveTrends: liveTrends,
    outputs,
    traces,
  } satisfies GeneratedMarketingContent;
}
