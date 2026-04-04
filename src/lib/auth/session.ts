import "server-only";

import type { UserRole } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { canManageAccess } from "@/lib/auth/access";
import { prisma } from "@/lib/db";

const cookieName = "sika-prime-session";
const defaultSessionMaxAgeHours = 24 * 7;
const defaultAdminReauthHours = 12;

type SessionPayload = {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  sessionVersion: number;
};

export type AuthSession = SessionPayload & {
  issuedAt: Date;
};

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }

  return new TextEncoder().encode(secret);
}

function parseHoursEnv(name: string, fallbackHours: number) {
  const rawValue = Number(process.env[name]);

  if (!Number.isFinite(rawValue) || rawValue <= 0) {
    return fallbackHours;
  }

  return rawValue;
}

function getSessionMaxAgeSeconds() {
  return Math.round(
    parseHoursEnv("AUTH_SESSION_MAX_AGE_HOURS", defaultSessionMaxAgeHours) *
      60 *
      60,
  );
}

function getAdminReauthMaxAgeSeconds() {
  return Math.round(
    parseHoursEnv("ADMIN_REAUTH_MAX_AGE_HOURS", defaultAdminReauthHours) *
      60 *
      60,
  );
}

export async function createSession(session: SessionPayload) {
  const maxAgeSeconds = getSessionMaxAgeSeconds();
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(getSessionSecret());

  const cookieStore = await cookies();

  cookieStore.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    const session = payload as SessionPayload;
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        sessionVersion: true,
        isActive: true,
      },
    });

    if (
      !user ||
      !user.isActive ||
      user.sessionVersion !== session.sessionVersion
    ) {
      cookieStore.delete(cookieName);
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      sessionVersion: user.sessionVersion,
      issuedAt:
        typeof payload.iat === "number"
          ? new Date(payload.iat * 1000)
          : new Date(),
    };
  } catch {
    cookieStore.delete(cookieName);
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export function isSessionFresh(
  session: Pick<AuthSession, "issuedAt">,
  maxAgeSeconds = getAdminReauthMaxAgeSeconds(),
) {
  return Date.now() - session.issuedAt.getTime() <= maxAgeSeconds * 1000;
}

export async function requireRecentAdminSession() {
  const session = await requireSession();

  if (!canManageAccess(session.role)) {
    redirect("/dashboard");
  }

  if (!isSessionFresh(session)) {
    await clearSession();
    redirect("/login?error=reauth");
  }

  return session;
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
  });
}
