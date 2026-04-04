import "server-only";

import { AuthTokenType } from "@prisma/client";
import { addDays, addHours, addMinutes, isAfter } from "date-fns";
import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";

import { prisma } from "@/lib/db";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function generateRawToken() {
  return randomBytes(32).toString("base64url");
}

function generateEmailOtpCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    "localhost:3000";
  const protocol =
    headerStore.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}

export async function buildAbsoluteAppUrl(pathname: string) {
  const origin = await getRequestOrigin();
  return new URL(pathname, origin).toString();
}

export async function createAuthToken(input: {
  type: AuthTokenType;
  email: string;
  userId?: string | null;
  createdById?: string | null;
  name?: string | null;
  jobTitle?: string | null;
  role?: import("@prisma/client").UserRole | null;
  rawToken?: string;
  expiresAt?: Date;
}) {
  const rawToken = input.rawToken ?? generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt =
    input.expiresAt ??
    (input.type === AuthTokenType.INVITE
      ? addDays(new Date(), 7)
      : input.type === AuthTokenType.EMAIL_OTP
        ? addMinutes(new Date(), 10)
        : addHours(new Date(), 2));

  await prisma.authToken.create({
    data: {
      type: input.type,
      tokenHash,
      email: input.email.toLowerCase(),
      expiresAt,
      userId: input.userId ?? null,
      createdById: input.createdById ?? null,
      name: input.name ?? null,
      jobTitle: input.jobTitle ?? null,
      role: input.role ?? null,
    },
  });

  return {
    rawToken,
    expiresAt,
  };
}

export async function getAuthTokenPreview(
  rawToken: string,
  type: AuthTokenType,
) {
  const token = await prisma.authToken.findUnique({
    where: {
      tokenHash: hashToken(rawToken),
    },
    include: {
      user: true,
    },
  });

  if (
    !token ||
    token.type !== type ||
    token.consumedAt ||
    token.revokedAt ||
    isAfter(new Date(), token.expiresAt)
  ) {
    return null;
  }

  return token;
}

export async function consumeAuthToken(rawToken: string, type: AuthTokenType) {
  const token = await getAuthTokenPreview(rawToken, type);

  if (!token) {
    return null;
  }

  await prisma.authToken.update({
    where: {
      id: token.id,
    },
    data: {
      consumedAt: new Date(),
    },
  });

  return token;
}

export async function revokeAuthToken(tokenId: string) {
  return prisma.authToken.update({
    where: { id: tokenId },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function revokeOutstandingAuthTokens(input: {
  type: AuthTokenType;
  email?: string | null;
  userId?: string | null;
}) {
  return prisma.authToken.updateMany({
    where: {
      type: input.type,
      email: input.email?.toLowerCase() ?? undefined,
      userId: input.userId ?? undefined,
      consumedAt: null,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function createEmailOtpToken(input: {
  email: string;
  userId: string;
}) {
  const rawToken = generateEmailOtpCode();
  const result = await createAuthToken({
    type: AuthTokenType.EMAIL_OTP,
    email: input.email,
    userId: input.userId,
    rawToken,
    expiresAt: addMinutes(new Date(), 10),
  });

  return {
    code: rawToken,
    expiresAt: result.expiresAt,
  };
}
