import {
  ContentTone,
  ContentType,
  PublishingChannel,
  WorkflowStage,
} from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db";
import {
  buildFallbackDraft,
  buildFallbackIdeas,
  buildGenerationPrompt,
  buildIdeaPrompt,
} from "@/lib/engines/content/prompt-builder";

const generationSchema = z.object({
  title: z.string().trim().optional().nullable(),
  brief: z.string().trim().min(12),
  objective: z.string().trim().optional().nullable(),
  campaignLabel: z.string().trim().optional().nullable(),
  distributionTarget: z.string().trim().optional().nullable(),
  assetReference: z.string().trim().optional().nullable(),
  contentType: z.nativeEnum(ContentType),
  tone: z.nativeEnum(ContentTone),
  channel: z.nativeEnum(PublishingChannel),
  ownerId: z.string().trim().min(1),
  reviewerId: z.string().trim().optional().nullable(),
  productId: z.string().trim().optional().nullable(),
  audienceSegmentId: z.string().trim().optional().nullable(),
  trendId: z.string().trim().optional().nullable(),
});

const ideaSchema = z.object({
  objective: z.string().trim().min(8),
  campaignLabel: z.string().trim().optional().nullable(),
  distributionTarget: z.string().trim().optional().nullable(),
  channel: z.nativeEnum(PublishingChannel),
  tone: z.nativeEnum(ContentTone),
  ownerId: z.string().trim().min(1),
  reviewerId: z.string().trim().optional().nullable(),
  productId: z.string().trim().optional().nullable(),
  audienceSegmentId: z.string().trim().optional().nullable(),
  trendId: z.string().trim().optional().nullable(),
  numberOfIdeas: z.coerce.number().int().min(2).max(6).default(4),
});

const ideaToDraftSchema = z.object({
  ideaId: z.string().trim().min(1),
  contentType: z.nativeEnum(ContentType),
  tone: z.nativeEnum(ContentTone),
  channel: z.nativeEnum(PublishingChannel),
  reviewerId: z.string().trim().optional().nullable(),
});

const aiOutputSchema = z.object({
  title: z.string().min(4),
  copy: z.string().min(30),
  cta: z.string().min(4),
  hashtags: z.array(z.string()).min(1).max(8),
  rationale: z.string().min(8),
  complianceChecklist: z.array(z.string()).min(1),
  themeLabel: z.string().min(2),
});

const ideaOutputSchema = z.object({
  ideas: z.array(
    z.object({
      title: z.string().min(4),
      idea: z.string().min(12),
      hook: z.string().min(8),
      cta: z.string().min(4),
      rationale: z.string().min(8),
      themeLabel: z.string().min(2),
    }),
  ),
});

function extractResponseText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const maybePayload = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  if (typeof maybePayload.output_text === "string" && maybePayload.output_text) {
    return maybePayload.output_text;
  }

  if (Array.isArray(maybePayload.output)) {
    const collected = maybePayload.output
      .flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .join("\n")
      .trim();

    return collected || null;
  }

  return null;
}

function parseAiJson<T>(raw: string, schema: z.ZodType<T>) {
  const match = raw.match(/\{[\s\S]*\}/);

  if (!match) return null;

  try {
    return schema.parse(JSON.parse(match[0]));
  } catch {
    return null;
  }
}

async function generateWithOpenAI(prompt: string) {
  if (!process.env.OPENAI_API_KEY) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: prompt,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return extractResponseText(payload);
}

async function loadGenerationContext(input: {
  productId?: string | null;
  audienceSegmentId?: string | null;
  trendId?: string | null;
}) {
  const profile = await prisma.businessProfile.findUnique({
    where: { id: 1 },
    include: {
      offers: {
        where: { active: true },
        orderBy: { priority: "desc" },
      },
      goals: {
        where: { active: true },
        orderBy: { priority: "desc" },
      },
      complianceRules: true,
      guardrailTerms: {
        where: { active: true },
      },
    },
  });

  if (!profile) {
    throw new Error("Business profile has not been configured yet.");
  }

  const [product, audience, trend] = await Promise.all([
    input.productId
      ? prisma.product.findUnique({ where: { id: input.productId } })
      : Promise.resolve(null),
    input.audienceSegmentId
      ? prisma.audienceSegment.findUnique({
          where: { id: input.audienceSegmentId },
        })
      : Promise.resolve(null),
    input.trendId
      ? prisma.trendSignal.findUnique({ where: { id: input.trendId } })
      : Promise.resolve(null),
  ]);

  return {
    profile,
    product,
    audience,
    trend,
    offers: profile.offers,
    goals: profile.goals,
    complianceRules: profile.complianceRules,
    guardrailTerms: profile.guardrailTerms,
  };
}

export async function generateContentDraft(
  rawInput: z.input<typeof generationSchema>,
) {
  const input = generationSchema.parse(rawInput);
  const context = await loadGenerationContext(input);

  const prompt = buildGenerationPrompt({
    title: input.title,
    brief: input.brief,
    contentType: input.contentType,
    tone: input.tone,
    channel: input.channel,
    context,
  });

  const aiResponse = await generateWithOpenAI(prompt);
  const parsedAi = aiResponse ? parseAiJson(aiResponse, aiOutputSchema) : null;
  const fallback = buildFallbackDraft({
    title: input.title,
    brief: input.brief,
    contentType: input.contentType,
    tone: input.tone,
    channel: input.channel,
    context,
  });

  const result = parsedAi ?? fallback;

  return prisma.contentItem.create({
    data: {
      title: result.title,
      brief: input.brief,
      objective: input.objective || null,
      campaignLabel: input.campaignLabel || null,
      distributionTarget: input.distributionTarget || null,
      contentType: input.contentType,
      tone: input.tone,
      channel: input.channel,
      draft: result.copy,
      callToAction: result.cta,
      hashtags: result.hashtags.join(" "),
      assetReference: input.assetReference || null,
      aiModel: process.env.OPENAI_API_KEY
        ? process.env.OPENAI_MODEL ?? "openai"
        : "fallback-template",
      aiSummary: `${result.rationale}\n\nChecklist:\n${result.complianceChecklist.join("\n")}`,
      themeLabel: result.themeLabel,
      ownerId: input.ownerId,
      reviewerId: input.reviewerId || null,
      productId: input.productId || null,
      audienceSegmentId: input.audienceSegmentId || null,
      trendId: input.trendId || null,
    },
  });
}

export async function generateContentIdeas(rawInput: z.input<typeof ideaSchema>) {
  const input = ideaSchema.parse(rawInput);
  const context = await loadGenerationContext(input);

  const prompt = buildIdeaPrompt({
    objective: input.objective,
    channel: input.channel,
    tone: input.tone,
    numberOfIdeas: input.numberOfIdeas,
    context,
  });

  const aiResponse = await generateWithOpenAI(prompt);
  const parsedIdeas = aiResponse
    ? parseAiJson(aiResponse, ideaOutputSchema)
    : null;
  const fallbackIdeas = buildFallbackIdeas({
    objective: input.objective,
    channel: input.channel,
    tone: input.tone,
    numberOfIdeas: input.numberOfIdeas,
    context,
  });

  const ideas = parsedIdeas?.ideas ?? fallbackIdeas;

  await prisma.contentItem.createMany({
    data: ideas.map((idea) => ({
      title: idea.title,
      brief: input.objective,
      objective: input.objective,
      campaignLabel: input.campaignLabel || null,
      distributionTarget: input.distributionTarget || null,
      contentType: ContentType.CAMPAIGN_IDEA,
      tone: input.tone,
      channel: input.channel,
      stage: WorkflowStage.IDEA,
      draft: `Hook: ${idea.hook}\n\nConcept: ${idea.idea}`,
      callToAction: idea.cta,
      aiModel: process.env.OPENAI_API_KEY
        ? process.env.OPENAI_MODEL ?? "openai"
        : "fallback-idea-generator",
      aiSummary: idea.rationale,
      themeLabel: idea.themeLabel,
      ownerId: input.ownerId,
      reviewerId: input.reviewerId || null,
      productId: input.productId || null,
      audienceSegmentId: input.audienceSegmentId || null,
      trendId: input.trendId || null,
    })),
  });

  return prisma.contentItem.findMany({
    where: {
      ownerId: input.ownerId,
      stage: WorkflowStage.IDEA,
      objective: input.objective,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: input.numberOfIdeas,
  });
}

export async function convertIdeaToDraft(
  rawInput: z.input<typeof ideaToDraftSchema>,
) {
  const input = ideaToDraftSchema.parse(rawInput);

  const idea = await prisma.contentItem.findUnique({
    where: { id: input.ideaId },
  });

  if (!idea) {
    throw new Error("Idea not found.");
  }

  const context = await loadGenerationContext({
    productId: idea.productId,
    audienceSegmentId: idea.audienceSegmentId,
    trendId: idea.trendId,
  });

  const prompt = buildGenerationPrompt({
    title: idea.title,
    brief: `${idea.brief}\n\nSelected idea:\n${idea.draft}`,
    contentType: input.contentType,
    tone: input.tone,
    channel: input.channel,
    context,
  });

  const aiResponse = await generateWithOpenAI(prompt);
  const parsedAi = aiResponse ? parseAiJson(aiResponse, aiOutputSchema) : null;
  const fallback = buildFallbackDraft({
    title: idea.title,
    brief: `${idea.brief}\n\nSelected idea:\n${idea.draft}`,
    contentType: input.contentType,
    tone: input.tone,
    channel: input.channel,
    context,
  });

  const result = parsedAi ?? fallback;

  return prisma.contentItem.update({
    where: { id: input.ideaId },
    data: {
      contentType: input.contentType,
      tone: input.tone,
      channel: input.channel,
      stage: WorkflowStage.DRAFT,
      draft: result.copy,
      finalCopy: null,
      callToAction: result.cta,
      hashtags: result.hashtags.join(" "),
      aiModel: process.env.OPENAI_API_KEY
        ? process.env.OPENAI_MODEL ?? "openai"
        : "fallback-template",
      aiSummary: `${result.rationale}\n\nConverted from idea workflow.`,
      themeLabel: result.themeLabel,
      reviewerId: input.reviewerId || idea.reviewerId,
    },
  });
}
