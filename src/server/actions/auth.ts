"use server";

import { AuthTokenType } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { addMinutes, isAfter } from "date-fns";
import { redirect } from "next/navigation";

import { logActivity } from "@/lib/audit/service";
import { buildRateLimitKey, clearRateLimit, consumeRateLimit } from "@/lib/auth/rate-limit";
import { validatePasswordStrength } from "@/lib/auth/password";
import { createSession, clearSession } from "@/lib/auth/session";
import { consumeAuthToken, getAuthTokenPreview } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

async function registerFailedSignIn(userId: string, attempts: number) {
  const shouldLock = attempts >= 5;

  await prisma.user.update({
    where: { id: userId },
    data: {
      failedSignInAttempts: attempts,
      lockedUntil: shouldLock ? addMinutes(new Date(), 15) : null,
    },
  });
}

export async function signInAction(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = normalizeText(formData.get("password"));
  const rateLimitKey = await buildRateLimitKey(email || "sign-in");
  const rateLimit = await consumeRateLimit({
    action: "auth.sign_in",
    key: rateLimitKey,
    limit: 5,
    windowMinutes: 15,
    blockMinutes: 15,
  });

  if (!rateLimit.allowed) {
    redirect("/login?error=rate");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    redirect("/login?error=invalid");
  }

  if (!user.isActive) {
    await logActivity({
      entityType: "user",
      entityId: user.id,
      action: "auth.sign_in_blocked",
      summary: "Blocked sign-in attempt for inactive account.",
    });
    redirect("/login?error=inactive");
  }

  if (user.lockedUntil && isAfter(user.lockedUntil, new Date())) {
    redirect("/login?error=locked");
  }

  const validPassword = await compare(password, user.passwordHash);

  if (!validPassword) {
    const attempts = user.failedSignInAttempts + 1;
    await registerFailedSignIn(user.id, attempts);
    await logActivity({
      entityType: "user",
      entityId: user.id,
      action: "auth.sign_in_failed",
      summary: "Sign-in failed because the password was invalid.",
      details: JSON.stringify({
        attempts,
      }),
    });
    redirect(attempts >= 5 ? "/login?error=locked" : "/login?error=invalid");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedSignInAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  await clearRateLimit("auth.sign_in", rateLimitKey);
  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    sessionVersion: user.sessionVersion,
  });
  await logActivity({
    actorId: user.id,
    entityType: "user",
    entityId: user.id,
    action: "auth.sign_in",
    summary: "Signed in successfully.",
  });

  redirect("/dashboard");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const rateLimitKey = await buildRateLimitKey(email || "password-reset");
  const rateLimit = await consumeRateLimit({
    action: "auth.password_reset_request",
    key: rateLimitKey,
    limit: 3,
    windowMinutes: 30,
    blockMinutes: 30,
  });

  if (!rateLimit.allowed) {
    redirect("/forgot-password?error=rate");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user?.isActive) {
    await logActivity({
      entityType: "user",
      entityId: user.id,
      action: "auth.password_reset_requested",
      summary: "Password reset requested.",
    });
  }

  redirect("/forgot-password?sent=1");
}

export async function resetPasswordAction(formData: FormData) {
  const token = normalizeText(formData.get("token"));
  const password = normalizeText(formData.get("password"));
  const confirmPassword = normalizeText(formData.get("confirmPassword"));

  if (!token) {
    redirect("/reset-password?error=invalid");
  }

  if (password !== confirmPassword) {
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=match`);
  }

  const validation = validatePasswordStrength(password);

  if (!validation.valid) {
    redirect(
      `/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent(
        validation.message ?? "Password is too weak.",
      )}`,
    );
  }

  const preview = await getAuthTokenPreview(token, AuthTokenType.PASSWORD_RESET);

  if (!preview?.userId) {
    redirect("/reset-password?error=invalid");
  }

  const passwordHash = await hash(password, 10);
  const updatedUser = await prisma.user.update({
    where: { id: preview.userId },
    data: {
      passwordHash,
      passwordChangedAt: new Date(),
      failedSignInAttempts: 0,
      lockedUntil: null,
      sessionVersion: {
        increment: 1,
      },
    },
  });

  await consumeAuthToken(token, AuthTokenType.PASSWORD_RESET);
  await prisma.authToken.updateMany({
    where: {
      type: AuthTokenType.PASSWORD_RESET,
      userId: updatedUser.id,
      consumedAt: null,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
  await clearSession();
  await createSession({
    userId: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
    name: updatedUser.name,
    sessionVersion: updatedUser.sessionVersion,
  });
  await logActivity({
    actorId: updatedUser.id,
    entityType: "user",
    entityId: updatedUser.id,
    action: "auth.password_reset_completed",
    summary: "Password was reset successfully.",
  });

  redirect("/dashboard");
}

export async function acceptInviteAction(formData: FormData) {
  const token = normalizeText(formData.get("token"));
  const password = normalizeText(formData.get("password"));
  const confirmPassword = normalizeText(formData.get("confirmPassword"));

  if (!token) {
    redirect("/accept-invite?error=invalid");
  }

  if (password !== confirmPassword) {
    redirect(`/accept-invite?token=${encodeURIComponent(token)}&error=match`);
  }

  const validation = validatePasswordStrength(password);

  if (!validation.valid) {
    redirect(
      `/accept-invite?token=${encodeURIComponent(token)}&error=${encodeURIComponent(
        validation.message ?? "Password is too weak.",
      )}`,
    );
  }

  const preview = await getAuthTokenPreview(token, AuthTokenType.INVITE);

  if (!preview) {
    redirect("/accept-invite?error=invalid");
  }

  const passwordHash = await hash(password, 10);
  const user =
    preview.userId && preview.user
      ? await prisma.user.update({
          where: { id: preview.userId },
          data: {
            name: preview.name ?? preview.user.name,
            email: preview.email,
            jobTitle: preview.jobTitle ?? preview.user.jobTitle,
            role: preview.role ?? preview.user.role,
            passwordHash,
            isActive: true,
            passwordChangedAt: new Date(),
            failedSignInAttempts: 0,
            lockedUntil: null,
            sessionVersion: {
              increment: 1,
            },
          },
        })
      : await prisma.user.create({
          data: {
            name: preview.name ?? "New Team Member",
            email: preview.email,
            passwordHash,
            role: preview.role ?? "CREATOR",
            jobTitle: preview.jobTitle ?? "Team Member",
            avatarSeed: "brand",
            isActive: true,
            passwordChangedAt: new Date(),
          },
        });

  await consumeAuthToken(token, AuthTokenType.INVITE);
  await prisma.authToken.updateMany({
    where: {
      type: AuthTokenType.INVITE,
      email: preview.email,
      consumedAt: null,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    sessionVersion: user.sessionVersion,
  });
  await logActivity({
    actorId: user.id,
    entityType: "user",
    entityId: user.id,
    action: "auth.invite_accepted",
    summary: "Accepted an invitation and activated the account.",
  });

  redirect("/dashboard");
}

export async function signOutAction() {
  await clearSession();
  redirect("/login");
}
