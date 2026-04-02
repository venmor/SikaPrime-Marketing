import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

import { AppLogo } from "@/components/branding/app-logo";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { getSession } from "@/lib/auth/session";
import { demoCredentials } from "@/lib/constants";
import { signInAction } from "@/server/actions/auth";

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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(230,62,140,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(33,198,217,0.22),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(124,58,237,0.08),transparent_26%),linear-gradient(180deg,#ffffff_0%,#f5f8fc_48%,#eef4fb_100%)]" />
      <div className="pointer-events-none absolute -left-12 top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(230,62,140,0.18),transparent_70%)] blur-2xl [animation:float-soft_14s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(33,198,217,0.2),transparent_70%)] blur-3xl [animation:float-soft_18s_ease-in-out_infinite]" />

      <div className="relative mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <section className="surface-panel fade-up relative overflow-hidden rounded-[40px] p-8 sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.36),rgba(255,255,255,0)),radial-gradient(circle_at_top_right,rgba(230,62,140,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(33,198,217,0.16),transparent_30%)]" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="brand-subtle">Fintech content OS</Badge>
              <Badge variant="cyan-subtle">Always-on campaigns</Badge>
            </div>

            <div className="mt-6">
              <AppLogo />
            </div>

            <h1 className="mt-10 max-w-2xl font-display text-[2.8rem] font-semibold leading-[1.03] tracking-[-0.05em] text-[color:var(--foreground)] sm:text-[3.4rem]">
              Premium campaign operations for a more modern lending brand.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[color:var(--muted)] sm:text-[1.05rem]">
              Generate stronger content, keep approvals tighter, and stay active
              even when trends are quiet. Designed for speed, trust, and
              cleaner marketing execution.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Trend + proactive ideation",
                  detail: "Build content from live signals, occasions, or evergreen business needs.",
                  icon: Sparkles,
                },
                {
                  title: "Compliance-aware workflow",
                  detail: "Keep approvals, revisions, and publishing visible to the whole team.",
                  icon: ShieldCheck,
                },
                {
                  title: "Performance feedback loop",
                  detail: "See what is working and let the system suggest what to do next.",
                  icon: ArrowRight,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="nested-panel card-hover rounded-[28px] p-4"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,rgba(230,62,140,0.14),rgba(33,198,217,0.16))] text-[color:var(--foreground)]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 font-display text-lg font-semibold">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="surface-panel fade-up rounded-[38px] p-6 shadow-[var(--shadow-lift)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
                Sign in
              </p>
              <h2 className="mt-3 font-display text-[2rem] font-semibold tracking-[-0.04em] text-[color:var(--foreground)]">
                Welcome back
              </h2>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                Use one of the seeded demo accounts or continue with your configured
                team credentials.
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
            <label>
              Email
              <input
                name="email"
                type="email"
                placeholder="admin@sikaprime.local"
                required
              />
            </label>
            <label>
              Password
              <input
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

          <div className="mt-8 grid gap-4 rounded-[30px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(244,247,251,0.86))] p-5 shadow-[var(--shadow-soft)]">
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
                  className="rounded-[22px] border border-[color:var(--border)] bg-white/82 px-4 py-3 text-sm text-[color:var(--foreground)] shadow-[var(--shadow-soft)]"
                >
                  {credential}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-sm leading-7 text-[color:var(--muted)]">
            Need the project docs first? Start with the local README and docs
            folder after setup.{" "}
            <Link
              href="/"
              className="font-semibold text-[color:var(--brand)] transition hover:text-[color:var(--brand-strong)]"
            >
              Back to overview
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
