import "server-only";

import { Buffer } from "node:buffer";
import {
  PublicationStatus,
  PublishingChannel,
  WorkflowStage,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { getIntegrationSettingValue } from "@/lib/integrations/service";
import {
  fetchWithObservability,
  getPublishBatchSize,
  getPublishRetryCount,
  logOperationalEvent,
} from "@/lib/operations/service";
import { parseChannelPayload } from "@/lib/ai/payload";

function buildMessage(input: {
  channel: PublishingChannel;
  draft: string;
  finalCopy?: string | null;
  callToAction?: string | null;
  hashtags?: string | null;
  channelPayload?: unknown;
}) {
  const structuredPayload = parseChannelPayload(input.channelPayload);

  if (structuredPayload?.kind === "FACEBOOK") {
    return [
      structuredPayload.body,
      structuredPayload.caption,
      input.callToAction,
      input.hashtags,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (structuredPayload?.kind === "WHATSAPP") {
    return [structuredPayload.message, input.callToAction]
      .filter(Boolean)
      .join("\n\n");
  }

  return [input.finalCopy ?? input.draft, input.callToAction, input.hashtags]
    .filter(Boolean)
    .join("\n\n");
}

function normalizePhoneNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function fallbackPublishUrl(
  channel: PublishingChannel,
  distributionTarget?: string | null,
) {
  if (channel === PublishingChannel.WHATSAPP && distributionTarget) {
    return `https://wa.me/${normalizePhoneNumber(distributionTarget)}`;
  }

  return null;
}

function extractImageAsset(assetReference?: string | null) {
  if (!assetReference) {
    return null;
  }

  const dataUrlMatch = assetReference.match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/,
  );

  if (dataUrlMatch) {
    return {
      kind: "inline" as const,
      mimeType: dataUrlMatch[1],
      bytes: Buffer.from(dataUrlMatch[2], "base64"),
    };
  }

  if (/^https?:\/\//i.test(assetReference)) {
    return {
      kind: "remote" as const,
      url: assetReference,
    };
  }

  return null;
}

async function getPublishingConfig() {
  const [
    graphApiVersion,
    facebookPageId,
    facebookToken,
    whatsappPhoneNumberId,
    whatsappAccessToken,
  ] = await Promise.all([
    getIntegrationSettingValue(
      "meta.graph_api_version",
      process.env.META_GRAPH_API_VERSION ?? "v22.0",
    ),
    getIntegrationSettingValue(
      "facebook.page_id",
      process.env.FACEBOOK_PAGE_ID ?? "",
    ),
    getIntegrationSettingValue(
      "facebook.page_access_token",
      process.env.FACEBOOK_PAGE_ACCESS_TOKEN ?? "",
    ),
    getIntegrationSettingValue(
      "whatsapp.phone_number_id",
      process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    ),
    getIntegrationSettingValue(
      "whatsapp.access_token",
      process.env.WHATSAPP_ACCESS_TOKEN ?? "",
    ),
  ]);

  return {
    graphApiVersion,
    facebookPageId,
    facebookToken,
    whatsappPhoneNumberId,
    whatsappAccessToken,
  };
}

async function publishToFacebook(input: {
  message: string;
  assetReference?: string | null;
}) {
  const { graphApiVersion, facebookPageId, facebookToken } =
    await getPublishingConfig();

  if (!facebookPageId || !facebookToken) {
    return {
      status: PublicationStatus.SIMULATED,
      externalId: `fb-sim-${Date.now()}`,
      publishUrl: null,
      errorMessage: null,
    };
  }

  const asset = extractImageAsset(input.assetReference);

  if (asset) {
    let response: Response;

    if (asset.kind === "inline") {
      const body = new FormData();
      body.set("caption", input.message);
      body.set("published", "true");
      body.set("access_token", facebookToken);
      body.set(
        "source",
        new Blob([asset.bytes], { type: asset.mimeType }),
        "sika-prime-flyer.png",
      );

      response = await fetchWithObservability(
        `https://graph.facebook.com/${graphApiVersion}/${facebookPageId}/photos`,
        {
          method: "POST",
          body,
          cache: "no-store",
        },
        {
          source: "facebook_graph_api",
          operation: "publish_photo",
          retries: getPublishRetryCount(),
          metadata: {
            channel: PublishingChannel.FACEBOOK,
            assetKind: "inline-image",
          },
        },
      );
    } else {
      const body = new URLSearchParams({
        caption: input.message,
        url: asset.url,
        published: "true",
        access_token: facebookToken,
      });

      response = await fetchWithObservability(
        `https://graph.facebook.com/${graphApiVersion}/${facebookPageId}/photos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
          cache: "no-store",
        },
        {
          source: "facebook_graph_api",
          operation: "publish_photo",
          retries: getPublishRetryCount(),
          metadata: {
            channel: PublishingChannel.FACEBOOK,
            assetKind: "remote-image",
          },
        },
      );
    }

    if (!response.ok) {
      return {
        status: PublicationStatus.FAILED,
        externalId: null,
        publishUrl: null,
        errorMessage: `Facebook photo publish failed with status ${response.status}`,
      };
    }

    const payload = (await response.json()) as { id?: string; post_id?: string };
    const referenceId = payload.post_id ?? payload.id ?? null;

    return {
      status: PublicationStatus.PUBLISHED,
      externalId: referenceId,
      publishUrl: referenceId ? `https://facebook.com/${referenceId}` : null,
      errorMessage: null,
    };
  }

  const body = new URLSearchParams({
    message: input.message,
    access_token: facebookToken,
  });

  const response = await fetchWithObservability(
    `https://graph.facebook.com/${graphApiVersion}/${facebookPageId}/feed`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      cache: "no-store",
    },
    {
      source: "facebook_graph_api",
      operation: "publish_post",
      retries: getPublishRetryCount(),
      metadata: {
        channel: PublishingChannel.FACEBOOK,
      },
    },
  );

  if (!response.ok) {
    return {
      status: PublicationStatus.FAILED,
      externalId: null,
      publishUrl: null,
      errorMessage: `Facebook publish failed with status ${response.status}`,
    };
  }

  const payload = (await response.json()) as { id?: string };

  return {
    status: PublicationStatus.PUBLISHED,
    externalId: payload.id ?? null,
    publishUrl: payload.id ? `https://facebook.com/${payload.id}` : null,
    errorMessage: null,
  };
}

async function publishToWhatsApp(input: {
  message: string;
  assetReference?: string | null;
  distributionTarget?: string | null;
}) {
  const { graphApiVersion, whatsappPhoneNumberId, whatsappAccessToken } =
    await getPublishingConfig();
  const asset = extractImageAsset(input.assetReference);
  const recipient = input.distributionTarget
    ? normalizePhoneNumber(input.distributionTarget)
    : "";

  if (!whatsappPhoneNumberId || !whatsappAccessToken || !recipient) {
    return {
      status: PublicationStatus.SIMULATED,
      externalId: `wa-sim-${Date.now()}`,
      publishUrl: recipient ? `https://wa.me/${recipient}` : null,
      errorMessage: recipient
        ? null
        : "WhatsApp recipient not configured. Stored as a manual-ready item.",
    };
  }

  const response = await fetchWithObservability(
    `https://graph.facebook.com/${graphApiVersion}/${whatsappPhoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${whatsappAccessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        ...(asset?.kind === "remote"
          ? {
              type: "image",
              image: {
                link: asset.url,
                caption: input.message,
              },
            }
          : {
              type: "text",
              text: {
                preview_url: false,
                body: input.message,
              },
            }),
      }),
      cache: "no-store",
    },
    {
      source: "whatsapp_cloud_api",
      operation: "publish_message",
      retries: getPublishRetryCount(),
      metadata: {
        channel: PublishingChannel.WHATSAPP,
      },
    },
  );

  if (!response.ok) {
    return {
      status: PublicationStatus.FAILED,
      externalId: null,
      publishUrl: `https://wa.me/${recipient}`,
      errorMessage: `WhatsApp publish failed with status ${response.status}`,
    };
  }

  const payload = (await response.json()) as {
    messages?: Array<{ id?: string }>;
  };

  return {
    status: PublicationStatus.PUBLISHED,
    externalId: payload.messages?.[0]?.id ?? null,
    publishUrl: `https://wa.me/${recipient}`,
    errorMessage: null,
  };
}

function getNumericInsightValue(
  insights: Array<{ name?: string; values?: Array<{ value?: number }> }> | undefined,
  metricName: string,
) {
  const match = insights?.find((item) => item.name === metricName);
  const value = match?.values?.[0]?.value;
  return typeof value === "number" ? value : 0;
}

export async function syncFacebookPublicationMetrics(publicationId: string) {
  const { graphApiVersion, facebookToken } = await getPublishingConfig();

  if (!facebookToken) {
    return null;
  }

  const publication = await prisma.publication.findUnique({
    where: { id: publicationId },
    include: {
      contentItem: true,
      metrics: {
        orderBy: {
          capturedAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (
    !publication ||
    publication.channel !== PublishingChannel.FACEBOOK ||
    publication.status !== PublicationStatus.PUBLISHED ||
    !publication.externalId
  ) {
    return null;
  }

  const url = new URL(
    `https://graph.facebook.com/${graphApiVersion}/${publication.externalId}`,
  );
  url.searchParams.set(
    "fields",
    [
      "permalink_url",
      "shares",
      "comments.summary(true)",
      "reactions.summary(total_count)",
      "insights.metric(post_impressions,post_clicks,post_engaged_users)",
    ].join(","),
  );
  url.searchParams.set("access_token", facebookToken);

  const response = await fetchWithObservability(
    url,
    {
      cache: "no-store",
    },
    {
      source: "facebook_graph_api",
      operation: "sync_publication_metrics",
      retries: 1,
      metadata: {
        publicationId: publication.id,
        externalId: publication.externalId,
      },
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    permalink_url?: string;
    shares?: { count?: number };
    comments?: { summary?: { total_count?: number } };
    reactions?: { summary?: { total_count?: number } };
    insights?: {
      data?: Array<{
        name?: string;
        values?: Array<{ value?: number }>;
      }>;
    };
  };

  const impressions = getNumericInsightValue(
    payload.insights?.data,
    "post_impressions",
  );
  const clicks = getNumericInsightValue(payload.insights?.data, "post_clicks");
  const engagedUsers = getNumericInsightValue(
    payload.insights?.data,
    "post_engaged_users",
  );
  const latestMetric = publication.metrics[0];

  await prisma.performanceSnapshot.create({
    data: {
      publicationId: publication.id,
      impressions,
      clicks,
      leads: latestMetric?.leads ?? 0,
      comments: payload.comments?.summary?.total_count ?? 0,
      shares: payload.shares?.count ?? 0,
      saves: latestMetric?.saves ?? 0,
      conversions: latestMetric?.conversions ?? 0,
      engagementRate: impressions > 0 ? (engagedUsers / impressions) * 100 : 0,
      themeLabel:
        latestMetric?.themeLabel ??
        publication.contentItem.themeLabel ??
        "general performance",
    },
  });

  if (payload.permalink_url && payload.permalink_url !== publication.publishUrl) {
    await prisma.publication.update({
      where: { id: publication.id },
      data: {
        publishUrl: payload.permalink_url,
      },
    });
  }

  return publication.id;
}

export async function syncRecentPublicationMetrics() {
  const publications = await prisma.publication.findMany({
    where: {
      channel: PublishingChannel.FACEBOOK,
      status: PublicationStatus.PUBLISHED,
      externalId: {
        not: null,
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 12,
  });

  const synced: string[] = [];

  for (const publication of publications) {
    const syncedPublicationId = await syncFacebookPublicationMetrics(publication.id);

    if (syncedPublicationId) {
      synced.push(syncedPublicationId);
    }
  }

  return synced;
}

export async function publishContentItem(
  contentItemId: string,
  channel?: PublishingChannel,
  overrides?: { distributionTarget?: string | null },
) {
  const content = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
  });

  if (!content) {
    throw new Error("Content item not found.");
  }

  const targetChannel = channel ?? content.channel;
  const distributionTarget =
    overrides?.distributionTarget ?? content.distributionTarget;
  const message = buildMessage({
    channel: content.channel,
    draft: content.draft,
    finalCopy: content.finalCopy,
    callToAction: content.callToAction,
    hashtags: content.hashtags,
    channelPayload: content.channelPayload,
  });
  let result:
    | Awaited<ReturnType<typeof publishToFacebook>>
    | Awaited<ReturnType<typeof publishToWhatsApp>>;

  try {
    result =
      targetChannel === PublishingChannel.FACEBOOK
        ? await publishToFacebook({
            message,
            assetReference: content.assetReference,
          })
        : await publishToWhatsApp({
            message,
            assetReference: content.assetReference,
            distributionTarget,
          });
  } catch (error) {
    result = {
      status: PublicationStatus.FAILED,
      externalId: null,
      publishUrl: fallbackPublishUrl(targetChannel, distributionTarget),
      errorMessage:
        error instanceof Error
          ? error.message
          : "Publishing failed due to an unexpected error.",
    };
  }

  const publication = await prisma.publication.create({
    data: {
      contentItemId: content.id,
      channel: targetChannel,
      status: result.status,
      caption: message,
      payload: JSON.stringify({
        title: content.title,
        message,
        hashtags: content.hashtags,
        assetReference: content.assetReference,
        distributionTarget,
      }),
      externalId: result.externalId,
      publishUrl: result.publishUrl,
      errorMessage: result.errorMessage,
      publishedAt:
        result.status === PublicationStatus.PUBLISHED ||
        result.status === PublicationStatus.SIMULATED
          ? new Date()
          : null,
    },
  });

  if (
    result.status === PublicationStatus.PUBLISHED ||
    result.status === PublicationStatus.SIMULATED
  ) {
    await prisma.contentItem.update({
      where: { id: content.id },
      data: {
        stage: WorkflowStage.PUBLISHED,
        publishedAt: new Date(),
        distributionTarget,
      },
    });
  }

  if (result.status === PublicationStatus.FAILED) {
    await logOperationalEvent({
      severity: "error",
      source: "publishing",
      operation: "publish_content_item",
      message: `Publishing failed for content item ${content.id}.`,
      metadata: {
        channel: targetChannel,
        contentItemId: content.id,
        distributionTarget,
        scheduled: content.stage === WorkflowStage.SCHEDULED,
        errorMessage: result.errorMessage,
      },
    });
  }

  return publication;
}

export async function runDuePublications() {
  const now = new Date();
  const batchSize = getPublishBatchSize();
  const dueWhere = {
    stage: WorkflowStage.SCHEDULED,
    scheduledFor: {
      lte: now,
    },
  } as const;
  const dueCount = await prisma.contentItem.count({
    where: dueWhere,
  });
  const dueItems = await prisma.contentItem.findMany({
    where: dueWhere,
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
    take: batchSize,
  });

  if (dueCount > batchSize) {
    await logOperationalEvent({
      severity: "warning",
      source: "publishing",
      operation: "publish_queue_backlog",
      message: `Scheduled publishing backlog detected: ${dueCount} items are due.`,
      metadata: {
        dueCount,
        batchSize,
        remainingCount: dueCount - dueItems.length,
      },
    });
  }

  const results: Awaited<ReturnType<typeof publishContentItem>>[] = [];

  for (const item of dueItems) {
    results.push(
      await publishContentItem(item.id, item.channel, {
        distributionTarget: item.distributionTarget,
      }),
    );
  }

  return results;
}
