import "server-only";

import { addMinutes, isAfter, subMinutes } from "date-fns";
import { headers } from "next/headers";

import { prisma } from "@/lib/db";

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

async function getRequestFingerprint() {
  const headerStore = await headers();

  /**
   * Prioritize headers set by the hosting platform (Vercel) that cannot be easily spoofed.
   * x-real-ip is set by Vercel to the actual client IP.
   * x-vercel-forwarded-for is also provided on Vercel as a more reliable version of x-forwarded-for.
   */
  const ip =
    headerStore.get("x-real-ip") ||
    headerStore.get("x-vercel-forwarded-for") ||
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  const userAgent = headerStore.get("user-agent") ?? "unknown";

  return `${ip}:${userAgent.slice(0, 48)}`;
}

export async function buildRateLimitKey(subject: string) {
  const fingerprint = await getRequestFingerprint();
  return `${normalizeKey(subject)}:${fingerprint}`;
}

export async function consumeRateLimit(input: {
  action: string;
  key: string;
  limit: number;
  windowMinutes: number;
  blockMinutes: number;
}) {
  const now = new Date();
  const existing = await prisma.rateLimitBucket.findUnique({
    where: {
      action_key: {
        action: input.action,
        key: input.key,
      },
    },
  });

  if (existing?.blockedUntil && isAfter(existing.blockedUntil, now)) {
    return {
      allowed: false,
      retryAt: existing.blockedUntil,
    };
  }

  const windowCutoff = subMinutes(now, input.windowMinutes);
  const shouldResetWindow =
    !existing || isAfter(windowCutoff, existing.windowStart);
  const nextHits = shouldResetWindow ? 1 : existing.hits + 1;
  const blockedUntil =
    nextHits > input.limit ? addMinutes(now, input.blockMinutes) : null;

  await prisma.rateLimitBucket.upsert({
    where: {
      action_key: {
        action: input.action,
        key: input.key,
      },
    },
    update: {
      hits: nextHits,
      windowStart: shouldResetWindow ? now : existing?.windowStart ?? now,
      blockedUntil,
    },
    create: {
      action: input.action,
      key: input.key,
      hits: nextHits,
      windowStart: now,
      blockedUntil,
    },
  });

  return {
    allowed: blockedUntil === null,
    retryAt: blockedUntil,
  };
}

export async function clearRateLimit(action: string, key: string) {
  await prisma.rateLimitBucket.deleteMany({
    where: {
      action,
      key,
    },
  });
}
