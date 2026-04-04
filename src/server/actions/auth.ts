"use server";

import { AuthTokenType } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { addMinutes, isAfter } from "date-fns";
import { redirect } from "next/navigation";

import { logActivity } from "@/lib/audit/service";
import { buildRateLimitKey, clearRateLimit, consumeRateLimit } from "@/lib/auth/rate-limit";
import { validatePasswordStrength } from "@/lib/auth/password";
import {
  clearPendingAuthSession,
  clearSession,
  createPendingAuthSession,
  createSession,
  getPendingAuthSession,
} from "@/lib/auth/session";
import {
  buildAbsoluteAppUrl,
  consumeAuthToken,
  createAuthToken,
  createEmailOtpToken,
  getAuthTokenPreview,
  revokeOutstandingAuthTokens,
} from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";
import {
  isEmailDeliveryConfigured,
  sendEmailOtp,
  sendPasswordResetEmail,
} from "@/lib/email/service";

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

async function completeSignIn(user: {
  id: string;
  email: string;
  role: import("@prisma/client").UserRole;
  name: string;
  sessionVersion: number;
}) {
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedSignInAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  await clearPendingAuthSession();
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
}

async function issueEmailOtpChallenge(user: {
  id: string;
  email: string;
  role: import("@prisma/client").UserRole;
  name: string;
  sessionVersion: number;
}) {
  await revokeOutstandingAuthTokens({
    type: AuthTokenType.EMAIL_OTP,
    userId: user.id,
    email: user.email,
  });

  const otp = await createEmailOtpToken({
    email: user.email,
    userId: user.id,
  });
  const delivery = await sendEmailOtp({
    to: user.email,
    recipientName: user.name,
    code: otp.code,
    expiresAt: otp.expiresAt,
  });

  if (!delivery.delivered) {
    await revokeOutstandingAuthTokens({
      type: AuthTokenType.EMAIL_OTP,
      userId: user.id,
      email: user.email,
    });
    return false;
  }

  await createPendingAuthSession({
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
    action: "auth.otp_challenge_sent",
    summary: "Email verification code sent for sign-in.",
  });

  return true;
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

  await clearRateLimit("auth.sign_in", rateLimitKey);

  if (user.mfaEnabled) {
    if (!(await isEmailDeliveryConfigured())) {
      redirect("/login?error=otp-unavailable");
    }

    const issued = await issueEmailOtpChallenge(user);

    if (!issued) {
      redirect("/login?error=otp-unavailable");
    }

    redirect("/verify-otp?sent=1");
  }

  await completeSignIn(user);

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
  const emailConfigured = await isEmailDeliveryConfigured();

  if (user?.isActive) {
    if (emailConfigured) {
      await revokeOutstandingAuthTokens({
        type: AuthTokenType.PASSWORD_RESET,
        userId: user.id,
        email: user.email,
      });

      const token = await createAuthToken({
        type: AuthTokenType.PASSWORD_RESET,
        email: user.email,
        userId: user.id,
      });
      const resetLink = await buildAbsoluteAppUrl(
        `/reset-password?token=${encodeURIComponent(token.rawToken)}`,
      );
      const delivery = await sendPasswordResetEmail({
        to: user.email,
        recipientName: user.name,
        resetLink,
        expiresAt: token.expiresAt,
      });

      if (!delivery.delivered) {
        redirect("/forgot-password?error=email");
      }
    }

    await logActivity({
      entityType: "user",
      entityId: user.id,
      action: "auth.password_reset_requested",
      summary: "Password reset requested.",
    });
  }

  redirect(`/forgot-password?sent=1${emailConfigured ? "" : "&mode=admin"}`);
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
  await revokeOutstandingAuthTokens({
    type: AuthTokenType.PASSWORD_RESET,
    userId: updatedUser.id,
    email: updatedUser.email,
  });
  await clearSession();
  await clearPendingAuthSession();
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
  await revokeOutstandingAuthTokens({
    type: AuthTokenType.INVITE,
    userId: user.id,
    email: preview.email,
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

export async function verifyOtpAction(formData: FormData) {
  const code = normalizeText(formData.get("code")).toUpperCase();
  const pending = await getPendingAuthSession();

  if (!pending) {
    redirect("/login?error=otp-expired");
  }

  const rateLimitKey = await buildRateLimitKey(`${pending.email}:otp-verify`);
  const rateLimit = await consumeRateLimit({
    action: "auth.email_otp_verify",
    key: rateLimitKey,
    limit: 5,
    windowMinutes: 15,
    blockMinutes: 15,
  });

  if (!rateLimit.allowed) {
    redirect("/verify-otp?error=rate");
  }

  const preview = await getAuthTokenPreview(code, AuthTokenType.EMAIL_OTP);

  if (!preview || preview.userId !== pending.userId) {
    redirect("/verify-otp?error=invalid");
  }

  const user = await prisma.user.findUnique({
    where: { id: pending.userId },
  });

  if (!user || !user.isActive || user.sessionVersion !== pending.sessionVersion) {
    await clearPendingAuthSession();
    redirect("/login?error=otp-expired");
  }

  await consumeAuthToken(code, AuthTokenType.EMAIL_OTP);
  await revokeOutstandingAuthTokens({
    type: AuthTokenType.EMAIL_OTP,
    userId: user.id,
    email: user.email,
  });
  await clearRateLimit("auth.email_otp_verify", rateLimitKey);
  await completeSignIn(user);
  await logActivity({
    actorId: user.id,
    entityType: "user",
    entityId: user.id,
    action: "auth.otp_verified",
    summary: "Completed email OTP verification.",
  });

  redirect("/dashboard");
}

export async function resendOtpAction() {
  const pending = await getPendingAuthSession();

  if (!pending) {
    redirect("/login?error=otp-expired");
  }

  const rateLimitKey = await buildRateLimitKey(`${pending.email}:otp-resend`);
  const rateLimit = await consumeRateLimit({
    action: "auth.email_otp_resend",
    key: rateLimitKey,
    limit: 3,
    windowMinutes: 15,
    blockMinutes: 15,
  });

  if (!rateLimit.allowed) {
    redirect("/verify-otp?error=resend-rate");
  }

  const user = await prisma.user.findUnique({
    where: { id: pending.userId },
  });

  if (!user || !user.isActive || !user.mfaEnabled) {
    await clearPendingAuthSession();
    redirect("/login?error=otp-expired");
  }

  const issued = await issueEmailOtpChallenge(user);

  if (!issued) {
    redirect("/verify-otp?error=email");
  }

  redirect("/verify-otp?sent=1");
}

export async function signOutAction() {
  await clearPendingAuthSession();
  await clearSession();
  redirect("/login");
}
