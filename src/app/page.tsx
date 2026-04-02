import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { getSession } from "@/lib/auth/session";
import { demoCredentials } from "@/lib/constants";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
        <div className="rounded-[34px] border border-[color:var(--border)] bg-[linear-gradient(160deg,rgba(18,62,74,0.98),rgba(20,93,88,0.92))] p-7 text-white shadow-[0_30px_60px_rgba(18,62,74,0.28)] md:p-10">
          <Badge variant="warning">Web-first, mobile-ready foundation</Badge>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-tight md:text-6xl">
            AI-powered marketing operations for Sika Prime Loans.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/80 md:text-lg">
            Detect trends, generate compliant content, manage approvals, publish
            campaigns, and learn from performance in one system built for a loan
            business that needs speed and trust at the same time.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[color:var(--brand)] transition hover:bg-[color:var(--surface-strong)]"
            >
              Open platform
            </Link>
            <a
              href="#modules"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Explore modules
            </a>
          </div>
        </div>

        <SectionCard
          title="Demo Access"
          description="The workspace ships with seeded roles so your team can explore workflows immediately."
        >
          <div className="space-y-3">
            {demoCredentials.map((credential) => (
              <div
                key={credential}
                className="rounded-2xl border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.65)] px-4 py-3 text-sm text-[color:var(--foreground)]"
              >
                {credential}
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Trend Engine"
          value="Live + seeded"
          hint="Local Zambian and global feeds with freshness, relevance, and brand-fit scoring."
        />
        <StatCard
          label="Content Workflow"
          value="End-to-end"
          hint="Idea, draft, review, approval, schedule, publish, and archive in one flow."
        />
        <StatCard
          label="Knowledge Base"
          value="Reusable"
          hint="Products, audiences, offers, compliance, values, and goals power every generation step."
        />
        <StatCard
          label="Architecture"
          value="Scalable"
          hint="Prepared for more channels, cron jobs, analytics growth, and future mobile apps."
        />
      </section>

      <section id="modules" className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="What your team gets"
          description="The platform is structured as a proper product, not a prompt playground."
        >
          <div className="grid gap-3 text-sm leading-7 text-[color:var(--muted)]">
            <p>Trend Detection Engine with local/global separation and scoring.</p>
            <p>AI Content Generator for Facebook, WhatsApp, ads, captions, educational posts, and trust content.</p>
            <p>Business Knowledge Base for products, values, goals, audiences, and compliance rules.</p>
            <p>Workflow Manager with collaboration-ready review and approval stages.</p>
            <p>Publishing Module with Facebook integration path and WhatsApp-ready copy packs.</p>
            <p>Analytics and recommendation loops to reduce creative fatigue and guide next content moves.</p>
          </div>
        </SectionCard>

        <SectionCard
          title="Built for maintainability"
          description="The codebase is organized for future engineers and future product expansion."
        >
          <div className="grid gap-3 text-sm leading-7 text-[color:var(--muted)]">
            <p>TypeScript + Next.js app router for a modern web foundation.</p>
            <p>Prisma-backed schema for durable business knowledge, content, trends, and performance records.</p>
            <p>Service-layer architecture so generation, scoring, recommendations, and publishing remain modular.</p>
            <p>Seed data, docs, cron-ready job routes, and test coverage on scoring and recommendations.</p>
          </div>
        </SectionCard>
      </section>
    </main>
  );
}
