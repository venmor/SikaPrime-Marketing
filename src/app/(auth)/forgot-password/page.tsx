import Link from "next/link";
import { redirect } from "next/navigation";

import { AppLogo } from "@/components/branding/app-logo";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { getSession } from "@/lib/auth/session";
import { requestPasswordResetAction } from "@/server/actions/auth";

function helperMessage(params: { error?: string; sent?: string }) {
  if (params.error === "rate") {
    return {
      tone: "warning",
      text: "Too many reset requests were made recently. Please wait a bit before trying again.",
    };
  }

  if (params.sent) {
    return {
      tone: "success",
      text: "If that account exists, the request has been logged. An admin can now issue a secure reset link from Access control.",
    };
  }

  return null;
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const [session, params] = await Promise.all([getSession(), searchParams]);

  if (session) {
    redirect("/dashboard");
  }

  const message = helperMessage(params);

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[color:var(--background)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="surface-panel fade-up mx-auto flex w-full max-w-xl flex-col p-8 sm:p-10 shadow-2xl">
        <Badge variant="brand-subtle" className="self-start">
          Account recovery
        </Badge>
        <div className="mt-6">
          <AppLogo compact />
        </div>
        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-[color:var(--foreground)]">
          Request password help
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">
          Because this workspace does not yet send email automatically, reset
          requests are routed through an admin. Enter your work email and the
          request will appear in the Access control panel.
        </p>

        {message ? (
          <div
            className={
              message.tone === "warning"
                ? "mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
                : "mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
            }
          >
            {message.text}
          </div>
        ) : null}

        <form action={requestPasswordResetAction} className="mt-8 flex flex-col gap-5">
          <label>
            <span>Email</span>
            <input
              name="email"
              type="email"
              placeholder="you@sikaprime.com"
              required
            />
          </label>

          <SubmitButton className="w-full" pendingLabel="Submitting request...">
            Request reset help
          </SubmitButton>
        </form>

        <p className="mt-8 text-sm text-[color:var(--muted)]">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand transition-colors hover:text-brand-strong"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
