import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  LineChart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { AppLogo } from "@/components/branding/app-logo";
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
    <main className="relative isolate flex-1 overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(230,62,140,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(33,198,217,0.18),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.88),rgba(246,248,252,0.98))]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="grid gap-6 xl:grid-cols-[1.16fr_0.84fr]">
          <div className="surface-panel overflow-hidden rounded-[40px] p-8 sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.2),transparent_40%),radial-gradient(circle_at_top_right,rgba(230,62,140,0.14),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(33,198,217,0.16),transparent_34%)]" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="brand-subtle">Web-first, mobile-ready</Badge>
                <Badge variant="cyan-subtle">Premium fintech workflow</Badge>
              </div>

              <div className="mt-6">
                <AppLogo />
              </div>

              <h1 className="mt-10 max-w-4xl font-display text-[2.9rem] font-semibold leading-[1.01] tracking-[-0.055em] text-[color:var(--foreground)] sm:text-[3.8rem] xl:text-[4.5rem]">
                A brighter, sharper content operating system for Sika Prime Loans.
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-[color:var(--muted)] sm:text-[1.05rem]">
                Detect safe trends, create proactive campaigns, move content
                through approvals, publish with confidence, and learn from
                performance without losing the trust expected from a lending
                brand.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--brand),#ff74a7)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(230,62,140,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(230,62,140,0.3)]"
                >
                  Open platform
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#modules"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--border)] bg-white/82 px-6 py-3.5 text-sm font-semibold text-[color:var(--foreground)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
                >
                  Explore modules
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    title: "Trend + proactive content",
                    detail: "The system stays useful even when no major trend is worth using.",
                    icon: Sparkles,
                  },
                  {
                    title: "Workflow with accountability",
                    detail: "Reviews, approvals, scheduling, and publishing stay visible end to end.",
                    icon: ShieldCheck,
                  },
                  {
                    title: "Performance-led next moves",
                    detail: "Recommendations learn from what is working for Sika Prime specifically.",
                    icon: LineChart,
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
          </div>

          <div className="grid gap-6">
            <SectionCard
              title="Demo Access"
              description="The workspace ships with seeded roles so your team can explore the full flow immediately."
            >
              <div className="space-y-3">
                {demoCredentials.map((credential) => (
                  <div
                    key={credential}
                    className="nested-panel rounded-[22px] px-4 py-3 text-sm text-[color:var(--foreground)]"
                  >
                    {credential}
                  </div>
                ))}
              </div>
            </SectionCard>

            <div className="surface-panel rounded-[34px] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
                Built for maintainability
              </p>
              <div className="mt-5 grid gap-4">
                {[
                  "TypeScript + Next.js foundation for long-term product growth.",
                  "Prisma-backed data model for business knowledge, content, trends, and analytics.",
                  "Modular service layer ready for more channels, AI, and future mobile app reuse.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,rgba(230,62,140,0.12),rgba(33,198,217,0.14))]">
                      <BadgeCheck className="h-4 w-4 text-[color:var(--foreground)]" />
                    </div>
                    <p className="text-sm leading-7 text-[color:var(--muted)]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Trend Engine"
            value="Safe + live"
            hint="Local Zambian and global attention signals filtered for usefulness and brand fit."
          />
          <StatCard
            label="Content Workflow"
            value="End to end"
            hint="Idea, draft, review, approval, schedule, publish, and archive in one flow."
          />
          <StatCard
            label="Knowledge Base"
            value="Reusable"
            hint="Products, audiences, offers, compliance, values, and goals power every generation step."
          />
          <StatCard
            label="Automation"
            value="Cron ready"
            hint="Daily maintenance jobs, publishing support, and performance sync for a lean team."
          />
        </section>

        <section id="modules" className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <SectionCard
            title="What your team gets"
            description="A product-grade workspace, not a collection of prompts."
          >
            <div className="grid gap-4">
              {[
                "Trend detection with local/global separation, scoring, and safety filtering.",
                "AI content generation for proactive, seasonal, educational, and product-led campaigns.",
                "Shared business knowledge for brand tone, offers, products, audiences, and compliance.",
                "Workflow routing for reviews, revisions, approvals, publishing, and archiving.",
                "Analytics and recommendation loops that reduce creative fatigue and improve timing.",
              ].map((item) => (
                <div key={item} className="nested-panel rounded-[24px] px-4 py-3 text-sm leading-7 text-[color:var(--muted)]">
                  {item}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Built for teams that need trust"
            description="The design language stays light, modern, and premium while preserving the seriousness expected in fintech."
          >
            <div className="grid gap-4">
              {[
                {
                  title: "Professional but not cold",
                  detail: "Fresh magenta and cyan accents keep the product branded without becoming noisy.",
                },
                {
                  title: "Always-on content assistance",
                  detail: "The assistant suggests useful posts even when trends are weak, risky, or irrelevant.",
                },
                {
                  title: "Responsive by design",
                  detail: "The shell, cards, and forms scale from desktop to tablet to mobile without collapsing into a cramped admin look.",
                },
              ].map((item) => (
                <div key={item.title} className="nested-panel rounded-[26px] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,rgba(230,62,140,0.14),rgba(33,198,217,0.16))]">
                      <CalendarClock className="h-4 w-4 text-[color:var(--foreground)]" />
                    </div>
                    <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        </section>
      </div>
    </main>
  );
}
