import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, Sparkles, Zap } from "lucide-react";

import { AppLogo } from "@/components/branding/app-logo";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { getSession } from "@/lib/auth/session";
import { signInAction } from "@/server/actions/auth";

const featureRows = [
  {
    title: "Create faster",
    detail: "Generate proactive, seasonal, and trend-safe content from one place.",
    icon: Sparkles,
  },
  {
    title: "Keep approvals clear",
    detail: "Review, revise, and publish without losing context.",
    icon: ShieldCheck,
  },
  {
    title: "Stay guided",
    detail: "See what to post next and where the queue needs attention.",
    icon: Zap,
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [session, params] = await Promise.all([getSession(), searchParams]);

  if (session) {
    redirect("/dashboard");
  }

  const errorMessage =
    params.error === "rate"
      ? "Too many sign-in attempts were made recently. Please wait a few minutes and try again."
      : params.error === "reauth"
        ? "Please sign in again to continue with sensitive admin access."
      : params.error === "otp-unavailable"
        ? "This account requires email verification, but email delivery is not available right now. Contact the administrator."
      : params.error === "otp-expired"
        ? "Your verification step expired. Sign in again to request a fresh code."
      : params.error === "inactive"
        ? "This account is currently inactive. Contact an administrator for help."
        : params.error === "locked"
          ? "This account is temporarily locked after repeated failed sign-in attempts."
          : params.error
            ? "Invalid email or password. Please try again."
            : null;

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[color:var(--background)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="relative mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-8">
        <section className="fade-up hidden flex-col justify-center lg:flex">
          <Badge variant="brand-subtle" className="self-start mb-6">Sika Prime workspace</Badge>

          <AppLogo />

          <h1 className="mt-8 font-display text-4xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-5xl">
            One calm space for Sika Prime marketing.
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-[color:var(--muted)]">
            Create stronger content, keep approvals tidy, and stay active even
            when trends are quiet.
          </p>

          <div className="mt-10 flex flex-col gap-6">
            {featureRows.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-[color:var(--muted)]">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-panel fade-up order-1 flex flex-col p-6 shadow-2xl sm:p-8 lg:order-2 lg:p-10">
          <div className="mb-6 lg:hidden">
            <Badge variant="brand-subtle" className="mb-4">Sika Prime workspace</Badge>
            <AppLogo compact />
            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
              One calm space for Sika Prime marketing.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)] sm:text-base">
              Sign in to create stronger content, keep approvals clear, and stay active when trends are quiet.
            </p>
          </div>

          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-[color:var(--foreground)]">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Sign in to your team workspace.
              </p>
            </div>
            <div className="hidden sm:block">
              <AppLogo compact showLabel={false} />
            </div>
          </div>

          {errorMessage && (
            <div className="alert-danger mb-6 rounded-xl p-4 text-sm shadow-sm">
              {errorMessage}
            </div>
          )}

          <form action={signInAction} className="flex flex-col gap-5">
            <div className="group relative">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                required
                className="peer pt-6 pb-2 placeholder-transparent focus:placeholder-transparent"
              />
              <label
                htmlFor="email"
                className="absolute left-4 top-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted)] transition-[top,font-size,color] peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-xs peer-focus:uppercase peer-focus:text-[color:var(--brand)]"
              >
                Email
              </label>
            </div>

            <div className="group relative">
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                className="peer pt-6 pb-2 placeholder-transparent focus:placeholder-transparent"
              />
              <label
                htmlFor="password"
                className="absolute left-4 top-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted)] transition-[top,font-size,color] peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-xs peer-focus:uppercase peer-focus:text-[color:var(--brand)]"
              >
                Password
              </label>
            </div>

            <SubmitButton className="mt-4 w-full py-3 text-base" pendingLabel="Signing in...">
              Enter platform
            </SubmitButton>
          </form>

          <div className="mt-4 flex flex-col items-start gap-2 text-sm text-[color:var(--muted)] sm:flex-row sm:items-center sm:justify-between">
            <span>Need help accessing your account?</span>
            <Link
              href="/forgot-password"
              className="font-semibold text-brand transition-colors hover:text-brand-strong"
            >
              Request reset help
            </Link>
          </div>

          <div className="mt-8 rounded-2xl bg-[color:var(--surface-soft)] p-5 sm:mt-10 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[color:var(--muted)]">
                Secure access
              </h3>
              <Badge variant="muted">Invite-only</Badge>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[color:var(--muted)]">
              New team members join through secure invite links. Password help
              and verification codes are delivered through the access flow when
              email delivery is configured.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-[color:var(--muted)] sm:mt-8">
            Need the overview first?{" "}
            <Link
              href="/"
              className="font-semibold text-brand transition-colors hover:text-brand-strong"
            >
              Back to overview
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
