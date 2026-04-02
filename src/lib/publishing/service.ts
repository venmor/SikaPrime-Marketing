import {
  PublicationStatus,
  PublishingChannel,
  WorkflowStage,
} from "@prisma/client";

import { prisma } from "@/lib/db";

const graphApiVersion = process.env.META_GRAPH_API_VERSION ?? "v22.0";

function buildMessage(input: {
  draft: string;
  finalCopy?: string | null;
  callToAction?: string | null;
  hashtags?: string | null;
}) {
  return [input.finalCopy ?? input.draft, input.callToAction, input.hashtags]
    .filter(Boolean)
    .join("\n\n");
}

function normalizePhoneNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

async function publishToFacebook(message: string) {
  if (!process.env.FACEBOOK_PAGE_ID || !process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    return {
      status: PublicationStatus.SIMULATED,
      externalId: `fb-sim-${Date.now()}`,
      publishUrl: null,
      errorMessage: null,
    };
  }

  const body = new URLSearchParams({
    message,
    access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
  });

  const response = await fetch(
    `https://graph.facebook.com/${graphApiVersion}/${process.env.FACEBOOK_PAGE_ID}/feed`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      cache: "no-store",
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
  distributionTarget?: string | null;
}) {
  const recipient = input.distributionTarget
    ? normalizePhoneNumber(input.distributionTarget)
    : "";

  if (
    !process.env.WHATSAPP_PHONE_NUMBER_ID ||
    !process.env.WHATSAPP_ACCESS_TOKEN ||
    !recipient
  ) {
    return {
      status: PublicationStatus.SIMULATED,
      externalId: `wa-sim-${Date.now()}`,
      publishUrl: recipient ? `https://wa.me/${recipient}` : null,
      errorMessage: recipient
        ? null
        : "WhatsApp recipient not configured. Stored as a manual-ready item.",
    };
  }

  const response = await fetch(
    `https://graph.facebook.com/${graphApiVersion}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "text",
        text: {
          preview_url: false,
          body: input.message,
        },
      }),
      cache: "no-store",
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
  if (!process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
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
  url.searchParams.set("access_token", process.env.FACEBOOK_PAGE_ACCESS_TOKEN);

  const response = await fetch(url, {
    cache: "no-store",
  });

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
  const message = buildMessage(content);

  const result =
    targetChannel === PublishingChannel.FACEBOOK
      ? await publishToFacebook(message)
      : await publishToWhatsApp({
          message,
          distributionTarget,
        });

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

  return publication;
}

export async function runDuePublications() {
  const dueItems = await prisma.contentItem.findMany({
    where: {
      stage: WorkflowStage.SCHEDULED,
      scheduledFor: {
        lte: new Date(),
      },
    },
  });

  const results = [];

  for (const item of dueItems) {
    results.push(
      await publishContentItem(item.id, item.channel, {
        distributionTarget: item.distributionTarget,
      }),
    );
  }

  return results;
}
