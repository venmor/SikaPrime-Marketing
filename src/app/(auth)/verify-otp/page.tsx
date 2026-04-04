import Link from "next/link";
import { redirect } from "next/navigation";

import { AppLogo } from "@/components/branding/app-logo";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { getPendingAuthSession, getSession } from "@/lib/auth/session";
import { resendOtpAction, verifyOtpAction } from "@/server/actions/auth";

function helperMessage(params: { error?: string; sent?: string }) {
  if (params.error === "rate") {
    return {
      tone: "warning",
      text: "Too many verification attempts were made. Please wait a few minutes and try again.",
    };
  }

  if (params.error === "resend-rate") {
    return {
      tone: "warning",
      text: "A recent code was already sent. Please wait a bit before requesting another one.",
    };
  }

  if (params.error === "invalid") {
    return {
      tone: "danger",
      text: "That verification code is invalid or has expired. Try the latest code from your email.",
    };
  }

  if (params.error === "email") {
    return {
      tone: "danger",
      text: "We could not send a new verification code. Check email delivery settings or contact the administrator.",
    };
  }

  if (params.sent) {
    return {
      tone: "success",
      text: "A fresh verification code was sent to your email.",
    };
  }

  return null;
}

export default async function VerifyOtpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const [session, pending, params] = await Promise.all([
    getSession(),
    getPendingAuthSession(),
    searchParams,
  ]);

  if (session) {
    redirect("/dashboard");
  }

  if (!pending) {
    redirect("/login?error=otp-expired");
  }

  const message = helperMessage(params);

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[color:var(--background)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="surface-panel fade-up mx-auto flex w-full max-w-xl flex-col p-8 sm:p-10 shadow-2xl">
        <Badge variant="warning" className="self-start">
          Verification required
        </Badge>
        <div className="mt-6">
          <AppLogo compact />
        </div>

        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-[color:var(--foreground)]">
          Check your email
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">
          Enter the one-time verification code sent to{" "}
          <span className="font-semibold text-[color:var(--foreground)]">
            {pending.email}
          </span>
          .
        </p>

        {message ? (
          <div
            className={
              message.tone === "warning"
                ? "mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
                : message.tone === "success"
                  ? "mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
                  : "mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
            }
          >
            {message.text}
          </div>
        ) : null}

        <form action={verifyOtpAction} className="mt-8 flex flex-col gap-5">
          <label>
            <span>Verification code</span>
            <input
              name="code"
              placeholder="AB12CD34"
              autoComplete="one-time-code"
              inputMode="text"
              required
            />
          </label>

          <SubmitButton className="w-full" pendingLabel="Verifying code...">
            Verify and continue
          </SubmitButton>
        </form>

        <form action={resendOtpAction} className="mt-4">
          <SubmitButton className="w-full" variant="secondary" pendingLabel="Sending a new code...">
            Resend code
          </SubmitButton>
        </form>

        <p className="mt-8 text-sm text-[color:var(--muted)]">
          Wrong account?{" "}
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
