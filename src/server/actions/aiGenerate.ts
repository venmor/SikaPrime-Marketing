"use server";

import { ContentType, PublishingChannel, ReviewStatus, WorkflowStage } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { parseCommentText, normalizeHashtagList } from "@/lib/ai/payload";
import {
  generateMarketingContent,
  interpretAssistantPrompt,
} from "@/lib/ai/generationService";
import type {
  AIGenerationResult,
  AIGenerationSaveInput,
  AIGenerationSubjectDetails,
  AssistantRunResult,
  GeneratedChannelPayload,
} from "@/lib/ai/types";
import { logActivity } from "@/lib/audit/service";
import { canGenerateContent } from "@/lib/auth/access";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createGeneratedContentItem } from "@/lib/engines/content/service";

function contentTypeForChannel(channel: PublishingChannel) {
  return channel === PublishingChannel.FACEBOOK
    ? ContentType.FACEBOOK_POST
    : ContentType.WHATSAPP_MESSAGE;
}

function buildBrief(input: {
  subjectDetails: AIGenerationSubjectDetails;
  objective: string;
  trendTitles: string[];
}) {
  return [
    input.objective,
    input.subjectDetails.customInstructions?.trim()
      ? `Additional direction: ${input.subjectDetails.customInstructions.trim()}`
      : null,
    input.trendTitles.length
      ? `Live trend context: ${input.trendTitles.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function serializePayloadForPreview(
  contentItemId: string,
  channel: PublishingChannel,
  payload: GeneratedChannelPayload,
  input: {
    title: string;
    callToAction: string;
    hashtags: string[];
    themeLabel: string;
    rationale: string;
    objective: string;
    productName?: string | null;
    offerName?: string | null;
    audienceName?: string | null;
    goalTitle?: string | null;
    selectedTrendIds: string[];
    selectedTrendTitles: string[];
  },
) {
  return {
    contentItemId,
    channel,
    title: input.title,
    stage: "DRAFT" as const,
    callToAction: input.callToAction,
    hashtags: input.hashtags,
    themeLabel: input.themeLabel,
    rationale: input.rationale,
    promptMetadata: {
      objective: input.objective,
      productName: input.productName ?? null,
      offerName: input.offerName ?? null,
      audienceName: input.audienceName ?? null,
      goalTitle: input.goalTitle ?? null,
      selectedTrendIds: input.selectedTrendIds,
      selectedTrendTitles: input.selectedTrendTitles,
    },
    payload,
  };
}

async function generateAndPersistAiContent(input: {
  actorId: string;
  channel: "FACEBOOK" | "WHATSAPP" | "BOTH";
  subjectDetails: AIGenerationSubjectDetails;
  trendIds?: string[];
}) {
  const generation = await generateMarketingContent({
    channelSelection: input.channel,
    subjectDetails: input.subjectDetails,
    trendIds: input.trendIds ?? [],
  });

  const items = await Promise.all(
    generation.outputs.map(async (output, index) => {
      const liveTrend = generation.usedLiveTrends[index] ?? generation.usedLiveTrends[0] ?? null;
      const trace = generation.traces.find((item) => item.channel === output.channel);
      const brief = buildBrief({
        subjectDetails: input.subjectDetails,
        objective: generation.objective,
        trendTitles: generation.usedLiveTrends.map((trend) => trend.title),
      });
      const contentItem = await createGeneratedContentItem({
        title: output.title,
        brief,
        objective: generation.context.goal?.title ?? generation.objective,
        campaignLabel: generation.context.offer?.name ?? generation.context.goal?.title ?? null,
        distributionTarget: null,
        contentType: contentTypeForChannel(output.channel),
        tone: input.subjectDetails.tone,
        channel: output.channel,
        draft:
          output.payload.kind === "FACEBOOK"
            ? output.payload.body
            : output.payload.message,
        finalCopy:
          output.payload.kind === "FACEBOOK"
            ? output.payload.caption
            : null,
        callToAction: output.callToAction,
        hashtags: output.hashtags,
        aiModel: trace?.model ?? generation.model,
        aiSummary: output.rationale,
        themeLabel: output.themeLabel,
        ownerId: input.actorId,
        reviewerId: null,
        productId: generation.context.product?.id ?? null,
        audienceSegmentId: generation.context.audience?.id ?? null,
        liveTrendId: liveTrend?.id ?? null,
        promptMetadata: {
          objective: generation.objective,
          productName: generation.context.product?.name ?? null,
          offerName: generation.context.offer?.name ?? null,
          audienceName: generation.context.audience?.name ?? null,
          goalTitle: generation.context.goal?.title ?? null,
          selectedTrendIds: generation.usedLiveTrends.map((trend) => trend.id),
          selectedTrendTitles: generation.usedLiveTrends.map((trend) => trend.title),
        },
        channelPayload: output.payload,
      });

      await prisma.generationLog.create({
        data: {
          contentItemId: contentItem.id,
          actorId: input.actorId,
          provider: trace?.provider ?? generation.provider,
          model: trace?.model ?? generation.model,
          channel: output.channel,
          status: "SUCCESS",
          prompt: trace?.prompt ?? "",
          requestPayload: trace?.requestPayload,
          responsePayload: trace?.responsePayload,
          responseText: trace?.responseText,
          promptTokens: trace?.promptTokens,
          completionTokens: trace?.completionTokens,
          totalTokens: trace?.totalTokens,
        },
      });

      return serializePayloadForPreview(contentItem.id, output.channel, output.payload, {
        title: output.title,
        callToAction: output.callToAction,
        hashtags: output.hashtags,
        themeLabel: output.themeLabel,
        rationale: output.rationale,
        objective: generation.objective,
        productName: generation.context.product?.name,
        offerName: generation.context.offer?.name,
        audienceName: generation.context.audience?.name,
        goalTitle: generation.context.goal?.title,
        selectedTrendIds: generation.usedLiveTrends.map((trend) => trend.id),
        selectedTrendTitles: generation.usedLiveTrends.map((trend) => trend.title),
      });
    }),
  );

  await logActivity({
    actorId: input.actorId,
    entityType: "ai_generation",
    entityId: items[0]?.contentItemId ?? input.actorId,
    action: "content.ai_generated",
    summary: `Generated ${items.length} AI draft${items.length === 1 ? "" : "s"}.`,
    details: generation.usedLiveTrends.map((trend) => trend.title).join(", ") || null,
  });

  revalidatePath("/content");
  revalidatePath("/workflow");
  revalidatePath("/dashboard");
  revalidatePath("/trends");
  revalidatePath("/trends/live");

  return {
    items,
    usedLiveTrends: generation.usedLiveTrends,
    fallbackReason: generation.fallbackReason,
    message:
      generation.fallbackReason
        ? items.length === 2
          ? "Live AI was busy, so two backup drafts are ready to review."
          : "Live AI was busy, so a backup draft is ready to review."
        : items.length === 2
          ? "Two channel-specific drafts are ready to review."
          : "AI draft is ready to review.",
  };
}

import { createStreamableValue } from "ai/rsc";

export async function generateAiContentAction(input: {
  channel: "FACEBOOK" | "WHATSAPP" | "BOTH";
  subjectDetails: AIGenerationSubjectDetails;
  trendIds?: string[];
}): Promise<AIGenerationResult> {
  const session = await requireSession();

  if (!canGenerateContent(session.role)) {
    return {
      status: "error",
      message: "Your role cannot generate AI content.",
    };
  }

  try {
    const { apiKey, model } = await import("@/lib/ai/generationService").then((m) => m.getAiConfig());

    if (apiKey) {
      const stream = createStreamableValue("");

      const { streamText } = await import("ai");
      const { openai } = await import("@ai-sdk/openai");
      const { buildSystemPrompt, buildUserPrompt, loadResolvedContext, resolveLiveTrends, buildObjective } = await import("@/lib/ai/generationService");

      const context = await loadResolvedContext(input.subjectDetails);
      const liveTrends = await resolveLiveTrends(input.trendIds ?? []);
      const objective = buildObjective(context, input.subjectDetails.customInstructions);
      const channels = input.channel === "BOTH" ? ["FACEBOOK" as const, "WHATSAPP" as const] : [input.channel];

      // Create the DB items first so we have real IDs!
      const preCreatedItems = await Promise.all(
        channels.map(async (channel) => {
          const liveTrend = liveTrends[0] ?? null;
          const brief = buildBrief({
            subjectDetails: input.subjectDetails,
            objective,
            trendTitles: liveTrends.map((trend) => trend.title),
          });
          const contentItem = await createGeneratedContentItem({
            title: "Generating...",
            brief,
            objective: context.goal?.title ?? objective,
            campaignLabel: context.offer?.name ?? context.goal?.title ?? null,
            distributionTarget: null,
            contentType: contentTypeForChannel(channel),
            tone: input.subjectDetails.tone,
            channel: channel,
            draft: "",
            finalCopy: null,
            callToAction: "",
            hashtags: [],
            aiModel: model || "gpt-4o-mini",
            aiSummary: "Generated via stream.",
            themeLabel: "Streaming...",
            ownerId: session.userId,
            reviewerId: null,
            productId: context.product?.id ?? null,
            audienceSegmentId: context.audience?.id ?? null,
            liveTrendId: liveTrend?.id ?? null,
            promptMetadata: {
              objective,
              productName: context.product?.name ?? null,
              offerName: context.offer?.name ?? null,
              audienceName: context.audience?.name ?? null,
              goalTitle: context.goal?.title ?? null,
              selectedTrendIds: input.trendIds ?? [],
              selectedTrendTitles: liveTrends.map((trend) => trend.title),
            },
            channelPayload: channel === "FACEBOOK" ? { kind: "FACEBOOK", body: "", caption: "", engagementComments: [] } : { kind: "WHATSAPP", message: "", buttons: [] },
          });

          await prisma.generationLog.create({
            data: {
              contentItemId: contentItem.id,
              actorId: session.userId,
              provider: "openai",
              model: model || "gpt-4o-mini",
              channel: channel,
              status: "SUCCESS",
              prompt: "Streamed via UI",
              responseText: "Streamed directly to client",
            },
          });

          return {
            id: contentItem.id,
            channel,
          };
        })
      );

      // Start streaming process asynchronously
      (async () => {
        try {
          let fullText = "[";

          for (let i = 0; i < channels.length; i++) {
            const channel = channels[i];
            const systemPrompt = buildSystemPrompt(channel, context, liveTrends);
            const userPrompt = buildUserPrompt({
              channel,
              subjectDetails: input.subjectDetails,
              context,
              trends: liveTrends,
              objective,
            });

            const { textStream } = await streamText({
              model: openai(model || "gpt-4o-mini"),
              system: systemPrompt,
              prompt: userPrompt,
            });

            if (i > 0) {
              fullText += ",";
              stream.update(fullText);
            }

            for await (const chunk of textStream) {
              fullText += chunk;
              stream.update(fullText);
            }
          }

          fullText += "]";
          stream.done(fullText);

          // Cleanup markdown code blocks if AI wrapped the response
          let cleanFullText = fullText.trim();
          if (cleanFullText.startsWith("```json")) {
            cleanFullText = cleanFullText.replace(/^```json/, "").replace(/```$/, "").trim();
          }

          // Parse final text and update DB
          try {
            const finalParsed = JSON.parse(cleanFullText);

            for (let i = 0; i < finalParsed.length; i++) {
              if (preCreatedItems[i]) {
                const p = finalParsed[i];
                await updateAiChannelPayloadAction({
                  contentItemId: preCreatedItems[i].id,
                  title: p.title || "Generated Draft",
                  callToAction: p.callToAction || "",
                  hashtags: (p.hashtags || []).join(" "),
                  themeLabel: p.themeLabel || "",
                  rationale: p.rationale || "",
                  body: p.body,
                  caption: p.caption,
                  engagementComments: (p.engagementComments || []).join("\n"),
                  message: p.message,
                });
              }
            }
          } catch (err) {
            console.error("Failed to parse and save final streamed text", err);
          }

          await logActivity({
            actorId: session.userId,
            entityType: "ai_generation",
            entityId: preCreatedItems[0]?.id ?? session.userId,
            action: "content.ai_generated",
            summary: `Generated ${preCreatedItems.length} AI draft${preCreatedItems.length === 1 ? "" : "s"}.`,
            details: liveTrends.map((trend) => trend.title).join(", ") || null,
          });

        } catch (e) {
          stream.error(e);
        }
      })();

      return {
        status: "success",
        message: "Streaming AI Draft...",
        items: [],
        usedLiveTrends: liveTrends.map((trend) => ({
          id: trend.id,
          title: trend.title,
          description: trend.description,
          source: trend.source,
          sourceUrl: trend.sourceUrl,
          relevanceScore: trend.relevanceScore,
          createdAt: typeof trend.createdAt === 'string' ? trend.createdAt : (trend.createdAt as Date).toISOString(),
        })),
        stream: stream.value,
        preCreatedItemIds: preCreatedItems.map((i) => i.id),
      };
    }

    // Fallback if no API key
    const result = await generateAndPersistAiContent({
      actorId: session.userId,
      channel: input.channel,
      subjectDetails: input.subjectDetails,
      trendIds: input.trendIds,
    });

    return {
      status: "success",
      message: result.message,
      items: result.items,
      usedLiveTrends: result.usedLiveTrends,
      fallbackReason: result.fallbackReason,
    };
  } catch (error) {
    await prisma.generationLog.create({
      data: {
        actorId: session.userId,
        provider: "openai",
        model: "unknown",
        channel: input.channel === "BOTH" ? PublishingChannel.FACEBOOK : input.channel,
        status: "FAILED",
        prompt: JSON.stringify(input),
        responseText: error instanceof Error ? error.message : "Unknown generation error",
      },
    });

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "AI generation failed. Please retry or continue with manual creation.",
    };
  }
}

export async function runAssistantPromptAction(input: {
  prompt: string;
}): Promise<AssistantRunResult> {
  const session = await requireSession();

  if (!canGenerateContent(session.role)) {
    return {
      status: "error",
      message: "Your role cannot use the AI assistant.",
    };
  }

  try {
    const interpretation = await interpretAssistantPrompt({
      prompt: input.prompt,
      userId: session.userId,
    });

    if (interpretation.status === "needs_clarification") {
      return {
        status: "needs_clarification",
        question: interpretation.question,
        explanation: interpretation.explanation,
        defaultsSummary: interpretation.defaultsSummary,
      };
    }

    const result = await generateAndPersistAiContent({
      actorId: session.userId,
      channel: interpretation.channelSelection,
      subjectDetails: interpretation.subjectDetails,
      trendIds: interpretation.trendIds,
    });

    return {
      status: "success",
      message: result.message,
      items: result.items,
      usedLiveTrends: result.usedLiveTrends,
      explanation: interpretation.explanation,
      defaultsSummary: interpretation.defaultsSummary,
    };
  } catch (error) {
    await prisma.generationLog.create({
      data: {
        actorId: session.userId,
        provider: "openai",
        model: "unknown",
        channel: PublishingChannel.FACEBOOK,
        status: "FAILED",
        prompt: input.prompt,
        responseText:
          error instanceof Error
            ? error.message
            : "Unknown assistant generation error",
      },
    });

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "The assistant could not create content right now. Try again or use manual drafting.",
    };
  }
}

export async function saveAiGeneratedContentAction(input: AIGenerationSaveInput) {
  const session = await requireSession();

  if (!canGenerateContent(session.role)) {
    return {
      status: "error" as const,
      message: "Your role cannot update AI-generated content.",
    };
  }

  const existingItems = await prisma.contentItem.findMany({
    where: {
      id: { in: input.items.map((item) => item.contentItemId) },
      ownerId: session.userId,
    },
    select: {
      id: true,
      ownerId: true,
      reviewerId: true,
    },
  });

  const existingMap = new Map(existingItems.map((item) => [item.id, item]));

  for (const item of input.items) {
    const existing = existingMap.get(item.contentItemId);

    if (!existing) {
      continue;
    }

    if (item.userRating !== undefined) {
      const latestLog = await prisma.generationLog.findFirst({
        where: { contentItemId: item.contentItemId },
        orderBy: { createdAt: "desc" },
      });

      if (latestLog) {
        await prisma.generationLog.update({
          where: { id: latestLog.id },
          data: {
            userRating: item.userRating,
            userFeedback: item.userFeedback?.trim() || null,
          },
        });
      }
    }

    const normalizedPayload =
      item.payload.kind === "FACEBOOK"
        ? {
            kind: "FACEBOOK" as const,
            body: item.payload.body.trim(),
            caption: item.payload.caption.trim(),
            engagementComments: item.payload.engagementComments.map((comment) =>
              comment.trim(),
            ).filter(Boolean),
          }
        : {
            kind: "WHATSAPP" as const,
            message: item.payload.message.trim(),
            buttons: item.payload.buttons?.map((button) => button.trim()).filter(Boolean),
          };

    await prisma.contentItem.update({
      where: { id: item.contentItemId },
      data: {
        title: item.title.trim(),
        stage: input.submitForReview ? WorkflowStage.IN_REVIEW : WorkflowStage.DRAFT,
        draft:
          normalizedPayload.kind === "FACEBOOK"
            ? normalizedPayload.body
            : normalizedPayload.message,
        finalCopy:
          normalizedPayload.kind === "FACEBOOK"
            ? normalizedPayload.caption
            : null,
        callToAction: item.callToAction.trim() || null,
        hashtags: normalizeHashtagList(item.hashtags).join(" ") || null,
        themeLabel: item.themeLabel.trim(),
        aiSummary: item.rationale.trim(),
        promptMetadata: item.promptMetadata,
        channelPayload: normalizedPayload,
      },
    });

    if (input.submitForReview && existing.reviewerId) {
      await prisma.contentReview.create({
        data: {
          contentItemId: item.contentItemId,
          reviewerId: existing.reviewerId,
          status: ReviewStatus.REQUESTED,
          notes: "Submitted from AI preview.",
        },
      });
    }
  }

  await logActivity({
    actorId: session.userId,
    entityType: "ai_generation",
    entityId: input.items[0]?.contentItemId ?? session.userId,
    action: input.submitForReview ? "content.ai_submitted" : "content.ai_saved",
    summary: input.submitForReview
      ? "Submitted AI-generated content for review."
      : "Saved AI-generated content as draft.",
  });

  revalidatePath("/content");
  revalidatePath("/workflow");
  revalidatePath("/dashboard");

  return {
    status: "success" as const,
    message: input.submitForReview
      ? "AI content submitted for review."
      : "AI content saved as draft.",
  };
}

export async function updateAiChannelPayloadAction(input: {
  contentItemId: string;
  title: string;
  callToAction: string;
  hashtags: string;
  themeLabel: string;
  rationale: string;
  body?: string;
  caption?: string;
  engagementComments?: string;
  message?: string;
} | FormData) {
  const session = await requireSession();

  if (!canGenerateContent(session.role)) {
    return;
  }

  const normalizedInput =
    input instanceof FormData
      ? {
          contentItemId: String(input.get("contentItemId") ?? "").trim(),
          title: String(input.get("title") ?? "").trim(),
          callToAction: String(input.get("callToAction") ?? "").trim(),
          hashtags: String(input.get("hashtags") ?? "").trim(),
          themeLabel: String(input.get("themeLabel") ?? "").trim(),
          rationale: String(input.get("rationale") ?? "").trim(),
          body: String(input.get("body") ?? "").trim(),
          caption: String(input.get("caption") ?? "").trim(),
          engagementComments: String(input.get("engagementComments") ?? "").trim(),
          message: String(input.get("message") ?? "").trim(),
        }
      : input;

  const content = await prisma.contentItem.findUnique({
    where: { id: normalizedInput.contentItemId },
    select: {
      id: true,
      ownerId: true,
      channel: true,
      promptMetadata: true,
    },
  });

  if (!content || content.ownerId !== session.userId) {
    return;
  }

  const channelPayload =
    content.channel === PublishingChannel.FACEBOOK
      ? {
          kind: "FACEBOOK" as const,
          body: normalizedInput.body?.trim() || "",
          caption: normalizedInput.caption?.trim() || "",
          engagementComments: parseCommentText(
            normalizedInput.engagementComments ?? "",
          ),
        }
      : {
          kind: "WHATSAPP" as const,
          message: normalizedInput.message?.trim() || "",
        };

  await prisma.contentItem.update({
    where: { id: content.id },
    data: {
      title: normalizedInput.title.trim(),
      draft:
        channelPayload.kind === "FACEBOOK"
          ? channelPayload.body
          : channelPayload.message,
      finalCopy:
        channelPayload.kind === "FACEBOOK"
          ? channelPayload.caption
          : null,
      callToAction: normalizedInput.callToAction.trim() || null,
      hashtags: normalizeHashtagList(normalizedInput.hashtags).join(" ") || null,
      themeLabel: normalizedInput.themeLabel.trim() || null,
      aiSummary: normalizedInput.rationale.trim() || null,
      promptMetadata: (content.promptMetadata ?? undefined) as never,
      channelPayload: channelPayload as never,
    },
  });

  revalidatePath(`/content/${content.id}`);
  revalidatePath("/content");
}
