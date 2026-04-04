import { AuthTokenType } from "@prisma/client";

import { PasswordResetIssuerForm, InviteIssuerForm } from "@/components/security/access-forms";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { isEmailDeliveryConfigured } from "@/lib/email/service";
import { requireRecentAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatDateTime, formatRelativeDate, humanizeEnum } from "@/lib/utils";
import {
  revokeAuthTokenAction,
  revokeUserSessionsAction,
  toggleUserMfaAction,
  toggleUserActiveAction,
} from "@/server/actions/access";

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [session, params] = await Promise.all([
    requireRecentAdminSession(),
    searchParams,
  ]);

  const [users, pendingTokens, resetRequests, emailConfigured] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ isActive: "desc" }, { role: "asc" }, { name: "asc" }],
    }),
    prisma.authToken.findMany({
      where: {
        type: {
          in: [AuthTokenType.INVITE, AuthTokenType.PASSWORD_RESET],
        },
        consumedAt: null,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
        createdBy: true,
      },
      orderBy: [{ createdAt: "desc" }],
      take: 20,
    }),
    prisma.activityLog.findMany({
      where: {
        action: "auth.password_reset_requested",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    }),
    isEmailDeliveryConfigured(),
  ]);

  const requestUsers = await prisma.user.findMany({
    where: {
      id: {
        in: resetRequests.map((item) => item.entityId),
      },
    },
  });
  const requestUserById = new Map(requestUsers.map((user) => [user.id, user]));

  return (
    <div className="grid gap-6">
      {params.error === "self-lockout" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Your own admin account cannot be suspended from this page.
        </div>
      ) : params.error === "email-required" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Configure SMTP email delivery before enabling email OTP for a user.
        </div>
      ) : null}

      <SectionCard
        title="Access control"
        description="Manage team access, generate secure invite and recovery links, and revoke sessions without touching the database."
      >
        <div className="mb-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4 text-sm text-[color:var(--muted)]">
          Sensitive admin actions require a recent sign-in. If this panel stops opening, sign in again and continue.
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--muted)]">
              Active users
            </p>
            <p className="mt-3 font-display text-3xl font-semibold text-[color:var(--foreground)]">
              {users.filter((user) => user.isActive).length}
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--muted)]">
              Pending invites
            </p>
            <p className="mt-3 font-display text-3xl font-semibold text-[color:var(--foreground)]">
              {pendingTokens.filter((token) => token.type === AuthTokenType.INVITE).length}
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--muted)]">
              Email delivery
            </p>
            <p className="mt-3 font-display text-3xl font-semibold text-[color:var(--foreground)]">
              {emailConfigured ? "Ready" : "Offline"}
            </p>
          </div>
        </div>
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Invite a teammate"
          description="Admins can create secure invite links for new or inactive users. Links expire automatically, never store plain tokens, and are emailed when delivery is configured."
        >
          <InviteIssuerForm />
        </SectionCard>

        <SectionCard
          title="Password recovery"
          description="Users can request help from the login screen. You can also issue a reset email or secure link here at any time."
        >
          <div className="grid gap-3">
            {resetRequests.length ? (
              resetRequests.map((request) => {
                const user = requestUserById.get(request.entityId);

                return (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="warning">Reset requested</Badge>
                      <span className="text-xs text-[color:var(--muted)]">
                        {formatRelativeDate(request.createdAt)}
                      </span>
                    </div>
                    <p className="mt-3 font-semibold text-[color:var(--foreground)]">
                      {user?.name ?? "Unknown user"}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      {user?.email ?? request.summary}
                    </p>
                    {user?.isActive ? (
                      <div className="mt-4">
                        <PasswordResetIssuerForm userId={user.id} />
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-[color:var(--muted)]">
                        This request cannot be fulfilled until the account is active.
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                No password reset requests have been logged recently.
              </div>
            )}

            {!emailConfigured ? (
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] p-4 text-sm text-[color:var(--muted)]">
                SMTP is not configured yet, so reset links will need to be copied and shared manually.
              </div>
            ) : null}
          </div>
        </SectionCard>
      </section>

      <SectionCard
        title="Team members"
        description="Suspend access, reactivate users, or revoke active sessions immediately."
      >
        <div className="grid gap-4">
          {users.map((user) => {
            const isCurrentUser = user.id === session.userId;

            return (
              <div
                key={user.id}
                className="rounded-2xl border border-[color:var(--border)] bg-surface-strong p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
                      {user.name}
                    </h3>
                    <Badge variant={user.isActive ? "success" : "muted"}>
                      {user.isActive ? "Active" : "Suspended"}
                    </Badge>
                    <Badge variant="cyan-subtle">{humanizeEnum(user.role)}</Badge>
                    <Badge variant={user.mfaEnabled ? "warning" : "muted"}>
                      {user.mfaEnabled ? "Email OTP on" : "Email OTP off"}
                    </Badge>
                    {isCurrentUser ? <Badge variant="muted">You</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">{user.email}</p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">{user.jobTitle}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-[color:var(--muted)]">
                    <span>Last login: {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Never"}</span>
                    <span>Session version: {user.sessionVersion}</span>
                    <span>Password updated: {user.passwordChangedAt ? formatRelativeDate(user.passwordChangedAt) : "Not set"}</span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
                  <PasswordResetIssuerForm userId={user.id} />

                  {isCurrentUser ? (
                    <div className="flex min-h-11 items-center rounded-full border border-dashed border-[color:var(--border)] px-4 text-sm text-[color:var(--muted)]">
                      Current admin session cannot revoke itself here.
                    </div>
                  ) : (
                    <form action={revokeUserSessionsAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <SubmitButton
                        pendingLabel="Revoking..."
                        variant="secondary"
                        className="w-full"
                      >
                        Revoke sessions
                      </SubmitButton>
                    </form>
                  )}

                  {isCurrentUser ? (
                    <div className="flex min-h-11 items-center rounded-full border border-dashed border-[color:var(--border)] px-4 text-sm text-[color:var(--muted)]">
                      Your own admin access stays protected on this screen.
                    </div>
                  ) : (
                    <form action={toggleUserActiveAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <input
                        type="hidden"
                        name="nextState"
                        value={user.isActive ? "inactive" : "active"}
                      />
                      <SubmitButton
                        pendingLabel={user.isActive ? "Suspending..." : "Reactivating..."}
                        variant={user.isActive ? "secondary" : "primary"}
                        className="w-full"
                      >
                        {user.isActive ? "Suspend access" : "Reactivate user"}
                      </SubmitButton>
                    </form>
                  )}

                  <form action={toggleUserMfaAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input
                      type="hidden"
                      name="nextState"
                      value={user.mfaEnabled ? "disabled" : "enabled"}
                    />
                    <SubmitButton
                      pendingLabel={user.mfaEnabled ? "Disabling..." : "Enabling..."}
                      variant="secondary"
                      className="w-full sm:col-span-2"
                    >
                      {user.mfaEnabled ? "Disable email OTP" : "Enable email OTP"}
                    </SubmitButton>
                  </form>
                </div>
              </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Pending secure links"
        description="Review outstanding invite and reset links. Revoke anything that should no longer work."
      >
        <div className="grid gap-4">
          {pendingTokens.length ? (
            pendingTokens.map((token) => (
              <div
                key={token.id}
                className="rounded-2xl border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={token.type === AuthTokenType.INVITE ? "brand-subtle" : "warning"}>
                        {token.type === AuthTokenType.INVITE ? "Invite" : "Password reset"}
                      </Badge>
                      <span className="text-xs text-[color:var(--muted)]">
                        Expires {formatDateTime(token.expiresAt)}
                      </span>
                    </div>
                    <p className="mt-2 font-semibold text-[color:var(--foreground)]">
                      {token.email}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      Created by {token.createdBy?.name ?? "System"} on{" "}
                      {formatDateTime(token.createdAt)}
                    </p>
                  </div>
                  <form action={revokeAuthTokenAction}>
                    <input type="hidden" name="tokenId" value={token.id} />
                    <SubmitButton pendingLabel="Revoking..." variant="secondary">
                      Revoke link
                    </SubmitButton>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              No pending invite or recovery links are active right now.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
