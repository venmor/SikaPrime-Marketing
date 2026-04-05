import Link from "next/link";
import { AuthTokenType } from "@prisma/client";
import { redirect } from "next/navigation";

import { AppLogo } from "@/components/branding/app-logo";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { getSession } from "@/lib/auth/session";
import { getAuthTokenPreview } from "@/lib/auth/tokens";
import { humanizeEnum } from "@/lib/utils";
import { acceptInviteAction } from "@/server/actions/auth";

function getErrorMessage(error?: string) {
  if (!error) {
    return null;
  }

  if (error === "invalid") {
    return "This invite link is invalid, expired, or has already been used.";
  }

  if (error === "match") {
    return "The passwords did not match. Please try again.";
  }

  return decodeURIComponent(error);
}

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const [session, params] = await Promise.all([getSession(), searchParams]);

  if (session) {
    redirect("/dashboard");
  }

  const token = params.token ?? "";
  const preview = token ? await getAuthTokenPreview(token, AuthTokenType.INVITE) : null;
  const errorMessage = getErrorMessage(params.error);

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[color:var(--background)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="surface-panel fade-up mx-auto flex w-full max-w-xl flex-col p-8 sm:p-10 shadow-2xl">
        <Badge variant="brand-subtle" className="self-start">
          Team invitation
        </Badge>
        <div className="mt-6">
          <AppLogo compact />
        </div>
        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-[color:var(--foreground)]">
          Join the workspace
        </h1>

        {preview ? (
          <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4 text-sm">
            <p className="font-semibold text-[color:var(--foreground)]">
              {preview.name ?? preview.email}
            </p>
            <p className="mt-1 text-[color:var(--muted)]">{preview.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {preview.role ? <Badge variant="cyan-subtle">{humanizeEnum(preview.role)}</Badge> : null}
              {preview.jobTitle ? <Badge variant="muted">{preview.jobTitle}</Badge> : null}
            </div>
            <p className="mt-3 text-[color:var(--muted)]">
              This invite expires on {preview.expiresAt.toLocaleString()}.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">
            This invitation is no longer valid. Ask an admin to issue a fresh invite link.
          </p>
        )}

        {errorMessage ? (
          <div className="alert-danger mt-6 rounded-xl p-4 text-sm">
            {errorMessage}
          </div>
        ) : null}

        {preview ? (
          <form action={acceptInviteAction} className="mt-8 flex flex-col gap-5">
            <input type="hidden" name="token" value={token} />
            <label>
              <span>Create password</span>
              <input
                name="password"
                type="password"
                placeholder="Choose a strong password"
                minLength={10}
                required
              />
            </label>
            <label>
              <span>Confirm password</span>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Repeat the password"
                minLength={10}
                required
              />
            </label>
            <p className="text-xs text-[color:var(--muted)]">
              Use at least 10 characters with uppercase, lowercase, and a number.
            </p>
            <SubmitButton className="w-full" pendingLabel="Activating account...">
              Accept invite
            </SubmitButton>
          </form>
        ) : null}

        <p className="mt-8 text-sm text-[color:var(--muted)]">
          Already have access?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand transition-colors hover:text-brand-strong"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
