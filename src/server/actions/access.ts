"use server";

import { AuthTokenType, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logActivity } from "@/lib/audit/service";
import { buildRateLimitKey, consumeRateLimit } from "@/lib/auth/rate-limit";
import { requireRecentAdminSession } from "@/lib/auth/session";
import { buildAbsoluteAppUrl, createAuthToken, revokeAuthToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";

export type LinkActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
  link: string | null;
};

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function requireAdminSession() {
  return requireRecentAdminSession();
}

export async function createInviteAction(
  _previousState: LinkActionState,
  formData: FormData,
): Promise<LinkActionState> {
  const session = await requireAdminSession();
  const email = value(formData, "email").toLowerCase();
  const name = value(formData, "name");
  const jobTitle = value(formData, "jobTitle");
  const role = value(formData, "role") as UserRole;
  const inviteRateKey = await buildRateLimitKey(`${session.userId}:invite`);
  const rateLimit = await consumeRateLimit({
    action: "auth.invite_create",
    key: inviteRateKey,
    limit: 10,
    windowMinutes: 60,
    blockMinutes: 15,
  });

  if (!rateLimit.allowed) {
    return {
      status: "error",
      message: "Invite creation is temporarily rate-limited. Try again shortly.",
      link: null,
    };
  }

  if (!email || !name || !jobTitle || !role) {
    return {
      status: "error",
      message: "Name, email, job title, and role are required.",
      link: null,
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser?.isActive) {
    return {
      status: "error",
      message: "That email already belongs to an active team member.",
      link: null,
    };
  }

  const placeholderPasswordHash = await hash(randomBytes(16).toString("hex"), 10);
  const user =
    existingUser ??
    (await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: placeholderPasswordHash,
        role,
        jobTitle,
        avatarSeed: "brand",
        isActive: false,
      },
    }));

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        jobTitle,
        role,
        isActive: false,
      },
    });
  }

  await prisma.authToken.updateMany({
    where: {
      type: AuthTokenType.INVITE,
      email,
      consumedAt: null,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  const token = await createAuthToken({
    type: AuthTokenType.INVITE,
    email,
    userId: user.id,
    createdById: session.userId,
    name,
    jobTitle,
    role,
  });
  const inviteLink = await buildAbsoluteAppUrl(
    `/accept-invite?token=${encodeURIComponent(token.rawToken)}`,
  );

  await logActivity({
    actorId: session.userId,
    entityType: "user",
    entityId: user.id,
    action: "auth.invite_created",
    summary: `Created an invite for ${email}.`,
    details: JSON.stringify({
      role,
      expiresAt: token.expiresAt.toISOString(),
    }),
  });
  revalidatePath("/access");

  return {
    status: "success",
    message: `Invite link ready for ${email}. It expires on ${token.expiresAt.toLocaleString()}.`,
    link: inviteLink,
  };
}

export async function createPasswordResetLinkAction(
  _previousState: LinkActionState,
  formData: FormData,
): Promise<LinkActionState> {
  const session = await requireAdminSession();
  const resetRateKey = await buildRateLimitKey(`${session.userId}:password-reset-link`);
  const rateLimit = await consumeRateLimit({
    action: "auth.password_reset_link_create",
    key: resetRateKey,
    limit: 12,
    windowMinutes: 60,
    blockMinutes: 15,
  });

  if (!rateLimit.allowed) {
    return {
      status: "error",
      message: "Reset link creation is temporarily rate-limited. Try again shortly.",
      link: null,
    };
  }

  const userId = value(formData, "userId");
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.isActive) {
    return {
      status: "error",
      message: "Only active users can receive reset links.",
      link: null,
    };
  }

  await prisma.authToken.updateMany({
    where: {
      type: AuthTokenType.PASSWORD_RESET,
      userId: user.id,
      consumedAt: null,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  const token = await createAuthToken({
    type: AuthTokenType.PASSWORD_RESET,
    email: user.email,
    userId: user.id,
    createdById: session.userId,
  });
  const resetLink = await buildAbsoluteAppUrl(
    `/reset-password?token=${encodeURIComponent(token.rawToken)}`,
  );

  await logActivity({
    actorId: session.userId,
    entityType: "user",
    entityId: user.id,
    action: "auth.password_reset_link_created",
    summary: `Created a password reset link for ${user.email}.`,
    details: JSON.stringify({
      expiresAt: token.expiresAt.toISOString(),
    }),
  });
  revalidatePath("/access");

  return {
    status: "success",
    message: `Reset link ready for ${user.email}. It expires on ${token.expiresAt.toLocaleString()}.`,
    link: resetLink,
  };
}

export async function revokeAuthTokenAction(formData: FormData) {
  const session = await requireAdminSession();
  const tokenId = value(formData, "tokenId");

  if (!tokenId) {
    redirect("/access");
  }

  const token = await revokeAuthToken(tokenId);
  await logActivity({
    actorId: session.userId,
    entityType: "auth_token",
    entityId: token.id,
    action: "auth.token_revoked",
    summary: `Revoked ${token.type.toLowerCase()} token for ${token.email}.`,
  });
  revalidatePath("/access");
  redirect("/access");
}

export async function toggleUserActiveAction(formData: FormData) {
  const session = await requireAdminSession();
  const userId = value(formData, "userId");
  const nextState = value(formData, "nextState");

  if (!userId || !nextState) {
    redirect("/access");
  }

  if (session.userId === userId && nextState === "inactive") {
    redirect("/access?error=self-lockout");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: nextState === "active",
      sessionVersion: {
        increment: 1,
      },
    },
  });

  await logActivity({
    actorId: session.userId,
    entityType: "user",
    entityId: updatedUser.id,
    action: nextState === "active" ? "auth.user_reactivated" : "auth.user_suspended",
    summary:
      nextState === "active"
        ? `Reactivated ${updatedUser.email}.`
        : `Suspended ${updatedUser.email}.`,
  });
  revalidatePath("/access");
  redirect("/access");
}

export async function revokeUserSessionsAction(formData: FormData) {
  const session = await requireAdminSession();
  const userId = value(formData, "userId");

  if (!userId || userId === session.userId) {
    redirect("/access");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      sessionVersion: {
        increment: 1,
      },
      failedSignInAttempts: 0,
      lockedUntil: null,
    },
  });

  await logActivity({
    actorId: session.userId,
    entityType: "user",
    entityId: updatedUser.id,
    action: "auth.sessions_revoked",
    summary: `Revoked active sessions for ${updatedUser.email}.`,
  });
  revalidatePath("/access");
  redirect("/access");
}
