import Link from "next/link";
import { redirect } from "next/navigation";

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
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 md:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[34px] border border-[color:var(--border)] bg-[linear-gradient(160deg,rgba(18,62,74,0.97),rgba(20,93,88,0.92))] p-8 text-white shadow-[0_30px_60px_rgba(18,62,74,0.28)] md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            Sika Prime Loans
          </p>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight">
            Sign in to your marketing operating system.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/82">
            Generate better campaigns, keep compliance close, and move from trend
            signal to approved content without losing team visibility.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-white/82">
            <p>Local and global trend detection</p>
            <p>Reusable business knowledge for every generation flow</p>
            <p>Role-aware approvals, scheduling, publishing, and analytics</p>
          </div>
        </section>

        <section className="rounded-[34px] border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-[0_18px_40px_rgba(17,24,39,0.06)]">
          <h2 className="font-display text-2xl font-semibold text-[color:var(--foreground)]">
            Welcome back
          </h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            Use one of the seeded demo accounts or swap in your own users after
            setup.
          </p>

          {params.error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Invalid email or password. Try one of the seeded demo users below.
            </div>
          ) : null}

          <form action={signInAction} className="mt-6 grid gap-4">
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

          <div className="mt-8 rounded-[28px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.7)] p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
              Demo Accounts
            </h3>
            <div className="mt-4 grid gap-3">
              {demoCredentials.map((credential) => (
                <div
                  key={credential}
                  className="rounded-2xl border border-[color:var(--border)] px-4 py-3 text-sm"
                >
                  {credential}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-sm text-[color:var(--muted)]">
            Need the project docs first? Start with the local README and docs
            folder after setup.{" "}
            <Link href="/" className="font-semibold text-[color:var(--brand)]">
              Back to overview
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
