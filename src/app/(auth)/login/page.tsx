import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, Sparkles, Zap } from "lucide-react";

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
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[color:var(--background)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="relative mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-2 lg:items-center">
        <section className="fade-up order-2 lg:order-1 flex flex-col justify-center">
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

        <section className="surface-panel fade-up order-1 lg:order-2 flex flex-col p-8 sm:p-10 shadow-2xl">
          <div className="mb-8 flex items-center justify-between">
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

          {params.error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
              Invalid email or password. Try one of the seeded demo users below.
            </div>
          )}

          <form action={signInAction} className="flex flex-col gap-5">
            <div className="group relative">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="admin@sikaprime.local"
                required
                className="peer pt-6 pb-2 placeholder-transparent focus:placeholder-transparent"
              />
              <label
                htmlFor="email"
                className="absolute left-4 top-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted)] transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-xs peer-focus:uppercase peer-focus:text-[color:var(--brand)]"
              >
                Email
              </label>
            </div>

            <div className="group relative">
              <input
                id="password"
                name="password"
                type="password"
                placeholder="SikaPrime123!"
                required
                className="peer pt-6 pb-2 placeholder-transparent focus:placeholder-transparent"
              />
              <label
                htmlFor="password"
                className="absolute left-4 top-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted)] transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-xs peer-focus:uppercase peer-focus:text-[color:var(--brand)]"
              >
                Password
              </label>
            </div>

            <SubmitButton className="mt-4 w-full py-3 text-base" pendingLabel="Signing in...">
              Enter platform
            </SubmitButton>
          </form>

          <div className="mt-10 flex flex-col gap-4 rounded-2xl bg-[color:var(--surface-soft)] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[color:var(--muted)]">
                Demo accounts
              </h3>
              <Badge variant="muted">Seeded access</Badge>
            </div>
            <div className="flex flex-col gap-3">
              {demoCredentials.map((credential) => (
                <div
                  key={credential}
                  className="rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm font-mono text-[color:var(--foreground)] shadow-sm transition-colors hover:border-[color:var(--border-strong)]"
                >
                  {credential}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-[color:var(--muted)]">
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
