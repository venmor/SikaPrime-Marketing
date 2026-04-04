import Link from "next/link";
import { AuthTokenType } from "@prisma/client";
import { redirect } from "next/navigation";

import { AppLogo } from "@/components/branding/app-logo";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { getSession } from "@/lib/auth/session";
import { getAuthTokenPreview } from "@/lib/auth/tokens";
import { resetPasswordAction } from "@/server/actions/auth";

function getErrorMessage(error?: string) {
  if (!error) {
    return null;
  }

  if (error === "invalid") {
    return "This reset link is invalid, expired, or has already been used.";
  }

  if (error === "match") {
    return "The passwords did not match. Please try again.";
  }

  return decodeURIComponent(error);
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const [session, params] = await Promise.all([getSession(), searchParams]);

  if (session) {
    redirect("/dashboard");
  }

  const token = params.token ?? "";
  const preview = token
    ? await getAuthTokenPreview(token, AuthTokenType.PASSWORD_RESET)
    : null;
  const errorMessage = getErrorMessage(params.error);

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[color:var(--background)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="surface-panel fade-up mx-auto flex w-full max-w-xl flex-col p-8 sm:p-10 shadow-2xl">
        <Badge variant="warning" className="self-start">
          Secure reset
        </Badge>
        <div className="mt-6">
          <AppLogo compact />
        </div>
        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-[color:var(--foreground)]">
          Set a new password
        </h1>

        {preview ? (
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">
            Resetting access for{" "}
            <span className="font-semibold text-[color:var(--foreground)]">
              {preview.email}
            </span>
            . This link expires on {preview.expiresAt.toLocaleString()}.
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">
            This page only works with a valid reset link issued by an admin.
          </p>
        )}

        {errorMessage ? (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {preview ? (
          <form action={resetPasswordAction} className="mt-8 flex flex-col gap-5">
            <input type="hidden" name="token" value={token} />
            <label>
              <span>New password</span>
              <input
                name="password"
                type="password"
                placeholder="Create a strong password"
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
            <SubmitButton className="w-full" pendingLabel="Updating password...">
              Save new password
            </SubmitButton>
          </form>
        ) : null}

        <p className="mt-8 text-sm text-[color:var(--muted)]">
          Need a new reset link?{" "}
          <Link
            href="/forgot-password"
            className="font-semibold text-brand transition-colors hover:text-brand-strong"
          >
            Request admin help
          </Link>
        </p>
      </div>
    </main>
  );
}
