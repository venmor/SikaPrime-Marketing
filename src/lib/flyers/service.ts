import "server-only";

import {
  AssetKind,
  AssetStatus,
  ContentTone,
  ContentType,
  FlyerConceptStatus,
  PublishingChannel,
  WorkflowStage,
} from "@prisma/client";
import OpenAI from "openai";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { buildAssistantOpportunities } from "@/lib/engines/content/strategy";
import { fetchWithObservability } from "@/lib/operations/service";
import { getIntegrationSettingValue } from "@/lib/integrations/service";

const brandAnalysisSchema = z.object({
  summary: z.string().min(12),
  brandKeywords: z.array(z.string()).min(3).max(8),
  colorPalette: z.array(z.string()).min(2).max(6),
});

const flyerConceptSchema = z.object({
  concepts: z.array(
    z.object({
      title: z.string().min(4),
      headline: z.string().min(6),
      bodyCopy: z.string().min(20),
      visualDirection: z.string().min(10),
      promptText: z.string().min(20),
      caption: z.string().min(20),
      hashtags: z.array(z.string()).min(3).max(8),
      engagementComments: z.array(z.string()).length(4),
    }),
  ).length(3),
});

function parseAiJson<T>(raw: string, schema: z.ZodType<T>) {
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

function extractResponseText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const maybePayload = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  if (typeof maybePayload.output_text === "string" && maybePayload.output_text) {
    return maybePayload.output_text;
  }

  if (Array.isArray(maybePayload.output)) {
    const combined = maybePayload.output
      .flatMap((item) => item.content ?? [])
      .map((item) => item.text ?? "")
      .join("\n")
      .trim();

    return combined || null;
  }

  return null;
}

function toDataUrl(mimeType: string, base64: string) {
  return `data:${mimeType};base64,${base64}`;
}

function normalizeHashtags(tags: string[]) {
  return tags
    .map((tag) => tag.trim().replace(/^#*/, ""))
    .filter(Boolean)
    .map((tag) => `#${tag.replace(/\s+/g, "")}`)
    .join(" ");
}

function normalizeComments(comments: string[]) {
  return comments.map((comment, index) => `${index + 1}. ${comment.trim()}`).join("\n");
}

function fallbackBrandAnalysis(title: string) {
  return {
    summary: `Reference flyer "${title}" uses confident finance branding, strong call-to-action hierarchy, and clear product-focused messaging.`,
    brandKeywords: ["trust", "finance", "clear CTA", "loan support"],
    colorPalette: ["magenta", "cyan", "clean white"],
  };
}

async function getOpenAITextConfig() {
  const [apiKey, model] = await Promise.all([
    getIntegrationSettingValue("openai.api_key", process.env.OPENAI_API_KEY ?? ""),
    getIntegrationSettingValue(
      "openai.text_model",
      process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    ),
  ]);

  return {
    apiKey,
    model,
  };
}

async function getOpenAIImageClient() {
  const apiKey = await getIntegrationSettingValue(
    "openai.api_key",
    process.env.OPENAI_API_KEY ?? "",
  );

  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
}

async function analyzeBrandImage(input: {
  title: string;
  imageData: string;
}) {
  const { apiKey, model } = await getOpenAITextConfig();

  if (!apiKey) {
    return fallbackBrandAnalysis(input.title);
  }

  const response = await fetchWithObservability(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "Analyze this flyer for reusable branding guidance. Return JSON only with keys: summary, brandKeywords (array), colorPalette (array). Focus on brand tone, typography mood, call-to-action style, color feel, and layout cues that should carry into future Sika Prime Loans flyers.",
              },
              {
                type: "input_image",
                image_url: input.imageData,
              },
            ],
          },
        ],
      }),
      cache: "no-store",
    },
    {
      source: "openai",
      operation: "analyze_flyer_branding",
      retries: 1,
      metadata: {
        title: input.title,
      },
    },
  );

  if (!response.ok) {
    return fallbackBrandAnalysis(input.title);
  }

  const raw = extractResponseText(await response.json()) ?? "";
  return parseAiJson(raw, brandAnalysisSchema) ?? fallbackBrandAnalysis(input.title);
}

function buildFallbackConcepts(input: {
  objective: string;
  brandGuide: string;
  specialDayLabel?: string | null;
}) {
  const dayContext = input.specialDayLabel
    ? ` tied to ${input.specialDayLabel}`
    : "";

  return {
    concepts: [
      {
        title: "Trust-first support flyer",
        headline: `Responsible support${dayContext}`,
        bodyCopy:
          "Show a calm, premium flyer that explains how Sika Prime Loans helps customers move forward with clarity, speed, and respect.",
        visualDirection:
          "Confident headline, bright branded frame, modern fintech layout, and clean CTA block.",
        promptText: `Premium portrait flyer for Sika Prime Loans. ${input.brandGuide}. Show confident finance branding, clean spacing, clear CTA, and a trustworthy tone.`,
        caption:
          "Need support without confusion? Sika Prime Loans keeps borrowing clear, respectful, and practical for real life moments.",
        hashtags: ["SikaPrimeLoans", "SmartMoney", "ResponsibleBorrowing", "ZambiaBusiness"],
        engagementComments: [
          "What financial moment would you plan for first?",
          "Tell us which flyer angle feels most trustworthy to you.",
          "What kind of support post should we create next?",
          "Would this work better for salaried workers or SME owners?",
        ],
      },
      {
        title: "Seasonal momentum flyer",
        headline: `${input.specialDayLabel ?? "This season"}, stay ready`,
        bodyCopy:
          "Position the flyer around the current season or occasion, linking it to practical money planning and trusted support.",
        visualDirection:
          "Celebratory but polished, with a strong hero phrase, modern shapes, and supportive finance cues.",
        promptText: `Branded seasonal flyer for Sika Prime Loans${dayContext}. ${input.brandGuide}. Use premium magenta and cyan accents, readable marketing text, and a modern portrait poster layout.`,
        caption:
          "Big moments deserve smart planning. Sika Prime Loans helps you stay ready with support that respects your goals.",
        hashtags: ["SikaPrimeLoans", "PlanAhead", "OpportunitySeason", "MoneyConfidence"],
        engagementComments: [
          "What seasonal moment matters most for your audience right now?",
          "Which version would stop the scroll fastest?",
          "Would you pair this with a WhatsApp follow-up?",
          "What CTA would make this even stronger?",
        ],
      },
      {
        title: "Growth and opportunity flyer",
        headline: "Move with confidence",
        bodyCopy:
          "Show borrowing as a tool for discipline, growth, school readiness, or business continuity without overpromising.",
        visualDirection:
          "Youthful but premium, using crisp editorial type, structured benefit blocks, and a strong closing CTA.",
        promptText: `Growth-focused Sika Prime Loans flyer. ${input.brandGuide}. Emphasize empowerment, financial discipline, and premium fintech presentation in portrait format.`,
        caption:
          "Opportunity grows when planning meets the right support. Let Sika Prime Loans help you keep moving with confidence.",
        hashtags: ["SikaPrimeLoans", "GrowthMindset", "MoneyDiscipline", "YouthOpportunity"],
        engagementComments: [
          "What growth message should we test next?",
          "Would this resonate more with youth or family audiences?",
          "Which design detail makes it feel premium?",
          "Should the next flyer lean more educational or promotional?",
        ],
      },
    ],
  };
}

async function generateConceptCopy(input: {
  title: string;
  objective: string;
  productName?: string | null;
  audienceName?: string | null;
  specialDayLabel?: string | null;
  campaignTemplateTitle?: string | null;
  brandGuide: string;
}) {
  const { apiKey, model } = await getOpenAITextConfig();

  if (!apiKey) {
    return buildFallbackConcepts({
      objective: input.objective,
      brandGuide: input.brandGuide,
      specialDayLabel: input.specialDayLabel,
    });
  }

  const response = await fetchWithObservability(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: `Create exactly 3 branded flyer concepts for Sika Prime Loans and return JSON only with a top-level "concepts" array.

Project title: ${input.title}
Objective: ${input.objective}
Product: ${input.productName ?? "General business priority"}
Audience: ${input.audienceName ?? "General audience"}
Occasion: ${input.specialDayLabel ?? "No special day selected"}
Campaign template: ${input.campaignTemplateTitle ?? "No fixed template selected"}
Brand guide: ${input.brandGuide}

Each concept must include:
- title
- headline
- bodyCopy
- visualDirection
- promptText
- caption
- hashtags (array of 4 to 6)
- engagementComments (array of exactly 4 first-comment ideas)

Make the 3 concepts clearly different:
1. direct promotional
2. trust or educational
3. occasion or community energy

Keep everything safe, constructive, premium, and aligned with responsible finance.`,
      }),
      cache: "no-store",
    },
    {
      source: "openai",
      operation: "generate_flyer_concepts",
      retries: 1,
      metadata: {
        title: input.title,
      },
    },
  );

  if (!response.ok) {
    return buildFallbackConcepts({
      objective: input.objective,
      brandGuide: input.brandGuide,
      specialDayLabel: input.specialDayLabel,
    });
  }

  const raw = extractResponseText(await response.json()) ?? "";
  return (
    parseAiJson(raw, flyerConceptSchema) ??
    buildFallbackConcepts({
      objective: input.objective,
      brandGuide: input.brandGuide,
      specialDayLabel: input.specialDayLabel,
    })
  );
}

async function renderConceptImage(input: {
  promptText: string;
  headline: string;
  bodyCopy: string;
}) {
  const openaiClient = await getOpenAIImageClient();

  if (!openaiClient) {
    return null;
  }

  const [imageModel, imageSize] = await Promise.all([
    getIntegrationSettingValue("openai.image_model", "gpt-image-1"),
    getIntegrationSettingValue("openai.image_size", "1024x1536"),
  ]);

  const response = await openaiClient.images.generate({
    model: imageModel,
    prompt: `${input.promptText}

Include readable branded poster text with:
Headline: ${input.headline}
Support text: ${input.bodyCopy}`,
    size:
      imageSize === "1536x1024" ||
      imageSize === "1024x1024" ||
      imageSize === "1024x1536"
        ? imageSize
        : "1024x1536",
    quality: "high",
    output_format: "png",
    background: "auto",
    n: 1,
    user: "sika-prime-flyer-studio",
  });

  const encoded = response.data?.[0]?.b64_json;

  if (!encoded) {
    return null;
  }

  return {
    mimeType: "image/png",
    imageData: toDataUrl("image/png", encoded),
  };
}

function summarizeBrandAssets(
  assets: Array<{
    title: string;
    analysisSummary: string | null;
    brandKeywords: string | null;
    colorPalette: string | null;
  }>,
) {
  if (!assets.length) {
    return "Use premium Sika Prime Loans branding with magenta and cyan accents, clean fintech spacing, trust-first messaging, and a confident CTA hierarchy.";
  }

  return assets
    .map((asset) =>
      [
        asset.title,
        asset.analysisSummary,
        asset.brandKeywords ? `Keywords: ${asset.brandKeywords}` : null,
        asset.colorPalette ? `Colors: ${asset.colorPalette}` : null,
      ]
        .filter(Boolean)
        .join(". "),
    )
    .join(" ");
}

export async function uploadBrandAsset(input: {
  title: string;
  fileName: string;
  mimeType: string;
  imageData: string;
  ownerId: string;
  productId?: string | null;
}) {
  const analysis = await analyzeBrandImage({
    title: input.title,
    imageData: input.imageData,
  });

  return prisma.brandAsset.create({
    data: {
      title: input.title,
      fileName: input.fileName,
      mimeType: input.mimeType,
      imageData: input.imageData,
      kind: AssetKind.FLYER_REFERENCE,
      status: AssetStatus.READY,
      analysisSummary: analysis.summary,
      brandKeywords: analysis.brandKeywords.join(", "),
      colorPalette: analysis.colorPalette.join(", "),
      ownerId: input.ownerId,
      productId: input.productId ?? null,
    },
  });
}

export async function updateBrandAssetStatus(assetId: string, status: AssetStatus) {
  return prisma.brandAsset.update({
    where: { id: assetId },
    data: { status },
  });
}

export async function generateFlyerProject(input: {
  title: string;
  objective: string;
  ownerId: string;
  tone: ContentTone;
  channel: PublishingChannel;
  contentType: ContentType;
  distributionTarget?: string | null;
  productId?: string | null;
  audienceSegmentId?: string | null;
  specialDayKey?: string | null;
  campaignTemplateId?: string | null;
}) {
  const [profile, product, audience, templates, assets, recentContent] = await Promise.all([
    prisma.businessProfile.findUnique({
      where: { id: 1 },
      include: {
        goals: { where: { active: true }, orderBy: { priority: "desc" } },
        offers: { where: { active: true }, orderBy: { priority: "desc" } },
        products: { where: { active: true }, orderBy: { priority: "desc" } },
        audienceSegments: { orderBy: { priority: "desc" } },
      },
    }),
    input.productId ? prisma.product.findUnique({ where: { id: input.productId } }) : Promise.resolve(null),
    input.audienceSegmentId
      ? prisma.audienceSegment.findUnique({ where: { id: input.audienceSegmentId } })
      : Promise.resolve(null),
    prisma.campaignTemplate.findMany({
      where: { active: true },
      orderBy: { priority: "desc" },
    }),
    prisma.brandAsset.findMany({
      where: {
        kind: AssetKind.FLYER_REFERENCE,
        status: {
          in: [AssetStatus.APPROVED, AssetStatus.READY],
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    prisma.contentItem.findMany({
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take: 18,
      select: {
        title: true,
        objective: true,
        themeLabel: true,
        contentType: true,
        channel: true,
      },
    }),
  ]);

  if (!profile) {
    throw new Error("Business profile has not been configured yet.");
  }

  const assistant = buildAssistantOpportunities({
    products: profile.products,
    audiences: profile.audienceSegments,
    goals: profile.goals,
    offers: profile.offers,
    recentContent,
  });
  const selectedOccasion =
    assistant.opportunities.find((item) => item.key === input.specialDayKey) ?? null;
  const selectedTemplate =
    templates.find((template) => template.id === input.campaignTemplateId) ?? null;
  const brandGuide = summarizeBrandAssets(assets);

  const conceptPack = await generateConceptCopy({
    title: input.title,
    objective: input.objective,
    productName: product?.name ?? null,
    audienceName: audience?.name ?? null,
    specialDayLabel: selectedOccasion?.title ?? null,
    campaignTemplateTitle: selectedTemplate?.title ?? null,
    brandGuide,
  });

  const project = await prisma.flyerProject.create({
    data: {
      title: input.title,
      objective: input.objective,
      specialDayKey: input.specialDayKey ?? null,
      campaignTemplateId: input.campaignTemplateId ?? null,
      distributionTarget: input.distributionTarget ?? null,
      tone: input.tone,
      channel: input.channel,
      contentType: input.contentType,
      status: AssetStatus.READY,
      productId: input.productId ?? null,
      audienceSegmentId: input.audienceSegmentId ?? null,
      ownerId: input.ownerId,
    },
  });

  for (const concept of conceptPack.concepts) {
    const rendered = await renderConceptImage({
      promptText: concept.promptText,
      headline: concept.headline,
      bodyCopy: concept.bodyCopy,
    });

    const asset = rendered
      ? await prisma.brandAsset.create({
          data: {
            title: concept.title,
            fileName: `${concept.title.toLowerCase().replace(/\s+/g, "-")}.png`,
            mimeType: rendered.mimeType,
            imageData: rendered.imageData,
            kind: AssetKind.GENERATED_FLYER,
            status: AssetStatus.READY,
            analysisSummary: concept.visualDirection,
            brandKeywords: null,
            colorPalette: null,
            ownerId: input.ownerId,
            productId: input.productId ?? null,
          },
        })
      : null;

    await prisma.flyerConcept.create({
      data: {
        projectId: project.id,
        title: concept.title,
        headline: concept.headline,
        bodyCopy: concept.bodyCopy,
        visualDirection: concept.visualDirection,
        promptText: concept.promptText,
        caption: concept.caption,
        hashtags: normalizeHashtags(concept.hashtags),
        engagementComments: normalizeComments(concept.engagementComments),
        imageData: rendered?.imageData ?? null,
        imageMimeType: rendered?.mimeType ?? null,
        status: rendered ? FlyerConceptStatus.GENERATED : FlyerConceptStatus.IDEA,
        assetId: asset?.id ?? null,
      },
    });
  }

  return prisma.flyerProject.findUniqueOrThrow({
    where: { id: project.id },
    include: {
      concepts: {
        include: {
          asset: true,
        },
        orderBy: { createdAt: "asc" },
      },
      product: true,
      audienceSegment: true,
    },
  });
}

export async function createContentItemFromFlyerConcept(conceptId: string) {
  const concept = await prisma.flyerConcept.findUnique({
    where: { id: conceptId },
    include: {
      project: true,
      asset: true,
    },
  });

  if (!concept) {
    throw new Error("Flyer concept not found.");
  }

  const [textModel, campaignTemplate] = await Promise.all([
    getIntegrationSettingValue(
      "openai.text_model",
      process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    ),
    concept.project.campaignTemplateId
      ? prisma.campaignTemplate.findUnique({
          where: { id: concept.project.campaignTemplateId },
        })
      : Promise.resolve(null),
  ]);

  await prisma.flyerConcept.updateMany({
    where: {
      projectId: concept.projectId,
    },
    data: {
      status: FlyerConceptStatus.GENERATED,
    },
  });
  await prisma.flyerConcept.update({
    where: { id: concept.id },
    data: {
      status: FlyerConceptStatus.SELECTED,
    },
  });
  await prisma.flyerProject.update({
    where: { id: concept.projectId },
    data: {
      status: AssetStatus.APPROVED,
    },
  });

  return prisma.contentItem.create({
    data: {
      title: concept.title,
      brief: concept.bodyCopy,
      objective: concept.project.objective,
      campaignLabel:
        campaignTemplate?.title ??
        concept.project.specialDayKey ??
        "Flyer studio campaign",
      distributionTarget: concept.project.distributionTarget,
      contentType: concept.project.contentType,
      tone: concept.project.tone,
      channel: concept.project.channel,
      stage: WorkflowStage.DRAFT,
      draft: concept.bodyCopy,
      finalCopy: concept.caption,
      hashtags: concept.hashtags,
      assetReference: concept.imageData ?? concept.asset?.imageData ?? null,
      notes: `Suggested engagement comments:\n${concept.engagementComments}`,
      aiModel: textModel || "flyer-studio",
      aiSummary: concept.visualDirection,
      themeLabel: concept.title,
      ownerId: concept.project.ownerId,
      productId: concept.project.productId,
      audienceSegmentId: concept.project.audienceSegmentId,
    },
  });
}
