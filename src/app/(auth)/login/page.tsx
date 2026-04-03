import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { AppLogo } from "@/components/branding/app-logo";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { getSession } from "@/lib/auth/session";
import { demoCredentials } from "@/lib/constants";
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

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(230,62,140,0.14),transparent_22%),radial-gradient(circle_at_top_right,rgba(33,198,217,0.16),transparent_20%),linear-gradient(180deg,#ffffff_0%,#f5f8fc_50%,#eef4fb_100%)]" />
      <div className="pointer-events-none absolute -left-10 top-24 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(230,62,140,0.16),transparent_70%)] blur-2xl [animation:float-soft_14s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(33,198,217,0.16),transparent_70%)] blur-3xl [animation:float-soft_18s_ease-in-out_infinite]" />

      <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.06fr_0.94fr]">
        <section className="surface-panel fade-up relative overflow-hidden rounded-[38px] p-8 sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.34),rgba(255,255,255,0)),radial-gradient(circle_at_top_right,rgba(230,62,140,0.08),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(33,198,217,0.1),transparent_30%)]" />
          <div className="relative">
            <Badge variant="brand-subtle">Sika Prime workspace</Badge>

            <div className="mt-6">
              <AppLogo />
            </div>

            <h1 className="mt-8 max-w-2xl font-display text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.05em] text-[color:var(--foreground)] sm:text-[3.15rem]">
              One calm space for Sika Prime marketing.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[color:var(--muted)]">
              Create stronger content, keep approvals tidy, and stay active even
              when trends are quiet.
            </p>

            <div className="mt-8 grid gap-3">
              {featureRows.map((item) => (
                <div
                  key={item.title}
                  className="nested-panel card-hover flex items-start gap-4 rounded-[24px] px-4 py-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,rgba(230,62,140,0.14),rgba(33,198,217,0.16))] text-[color:var(--foreground)]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="surface-panel fade-up rounded-[36px] p-6 shadow-[var(--shadow-lift)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
                Sign in
              </p>
              <h2 className="mt-3 font-display text-[2rem] font-semibold tracking-[-0.04em] text-[color:var(--foreground)]">
                Welcome back
              </h2>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                Use a seeded demo account or your team login.
              </p>
            </div>
            <div className="hidden sm:block">
              <AppLogo compact showLabel={false} />
            </div>
          </div>

          {params.error ? (
            <div className="mt-6 rounded-[22px] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700 shadow-[var(--shadow-soft)]">
              Invalid email or password. Try one of the seeded demo users below.
            </div>
          ) : null}

          <form action={signInAction} className="mt-7 grid gap-5">
            <label htmlFor="email">
              Email
              <input
                id="email"
                name="email"
                type="email"
                placeholder="admin@sikaprime.local"
                required
              />
            </label>
            <label htmlFor="password">
              Password
              <input
                id="password"
                name="password"
                type="password"
                placeholder="SikaPrime123!"
                required
              />
            </label>
            <SubmitButton className="mt-2 w-full" pendingLabel="Signing in...">
              Enter platform
            </SubmitButton>
          </form>

          <div className="mt-8 grid gap-4 rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(244,247,251,0.86))] p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
                Demo accounts
              </h3>
              <Badge variant="muted">Seeded access</Badge>
            </div>
            <div className="grid gap-3">
              {demoCredentials.map((credential) => (
                <div
                  key={credential}
                  className="rounded-[20px] border border-[color:var(--border)] bg-white/84 px-4 py-3 text-sm text-[color:var(--foreground)] shadow-[var(--shadow-soft)]"
                >
                  {credential}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-sm leading-6 text-[color:var(--muted)]">
            Need the overview first?{" "}
            <Link
              href="/"
              className="font-semibold text-[color:var(--brand)] transition hover:text-[color:var(--brand-strong)]"
            >
              Back to overview
            </Link>
            <ArrowRight className="ml-1 inline h-4 w-4" />
          </p>
        </section>
      </div>
    </main>
  );
}
