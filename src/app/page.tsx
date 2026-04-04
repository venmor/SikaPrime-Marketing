import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  LineChart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { AppLogo } from "@/components/branding/app-logo";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { getSession } from "@/lib/auth/session";

const heroPoints = [
  {
    title: "Proactive content",
    detail: "Keep channels active even when no trend is worth using.",
    icon: Sparkles,
  },
  {
    title: "Clear approvals",
    detail: "Move drafts, reviews, and publishing through one flow.",
    icon: ShieldCheck,
  },
  {
    title: "Smarter next moves",
    detail: "Learn from performance and get better recommendations over time.",
    icon: LineChart,
  },
];

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen bg-[color:var(--background)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <section className="flex flex-col items-center text-center">
          <Badge variant="brand-subtle" className="mb-6">Web-first, mobile-ready</Badge>

          <div className="mb-8">
            <AppLogo />
          </div>

          <h1 className="max-w-4xl font-display text-4xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-6xl lg:text-7xl">
            Marketing operations, simplified for Sika Prime.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--muted)] sm:text-xl">
            Detect safe trends, create useful campaigns, manage approvals,
            publish with confidence, and learn what works from one workspace.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-8 py-4 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-1 hover:bg-brand-strong hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] focus-visible:ring-offset-2"
            >
              Open platform
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#modules"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--border-strong)] bg-surface-strong px-8 py-4 text-sm font-semibold text-[color:var(--foreground)] shadow-sm transition-all hover:-translate-y-1 hover:border-[color:var(--muted)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] focus-visible:ring-offset-2"
            >
              View modules
            </a>
          </div>
        </section>

        <section className="mt-8 grid gap-8 md:grid-cols-3">
          {heroPoints.map((item) => (
            <div
              key={item.title}
              className="surface-panel card-hover flex flex-col items-center text-center p-8"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
                <item.icon className="h-6 w-6" />
              </div>
              <h2 className="font-display text-xl font-semibold text-[color:var(--foreground)]">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">
                {item.detail}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <SectionCard
            title="Secure team access"
            description="Built for real users, not a public demo list."
          >
            <div className="flex flex-col gap-6 mt-2">
              {[
                "Administrators can invite team members with secure, expiring links.",
                "Password recovery can be emailed directly when SMTP is configured.",
                "Optional email OTP adds another step for higher-risk accounts.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
                    <BadgeCheck className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-relaxed text-[color:var(--muted-strong)]">{item}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Built to last"
            description="A clean technical foundation for future growth."
          >
            <div className="flex flex-col gap-6 mt-2">
              {[
                "Next.js and TypeScript for maintainable product delivery.",
                "Prisma-backed data for content, trends, analytics, and knowledge.",
                "Modular services ready for more channels, AI, and mobile reuse.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <BadgeCheck className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-relaxed text-[color:var(--muted-strong)]">{item}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Trend Engine"
            value="Safe + live"
            hint="Local and global signals filtered for relevance and brand fit."
          />
          <StatCard
            label="Workflow"
            value="End to end"
            hint="Ideas, drafts, reviews, schedules, and publishing in one flow."
          />
          <StatCard
            label="Knowledge"
            value="Reusable"
            hint="Products, audiences, offers, rules, and brand inputs stay shared."
          />
          <StatCard
            label="Automation"
            value="Cron ready"
            hint="Daily maintenance, publishing support, and performance sync."
          />
        </section>

        <section id="modules" className="grid gap-8 lg:grid-cols-2">
          <SectionCard
            title="What the team gets"
            description="A focused workspace instead of scattered tools."
          >
            <ul className="flex flex-col gap-4 mt-2">
              {[
                "Trend detection with local/global separation and safety filtering.",
                "AI generation for proactive, seasonal, educational, and product-led content.",
                "A shared knowledge base for tone, offers, products, audiences, and compliance.",
                "Reviews, approvals, scheduling, publishing, and archiving in one workflow.",
                "Analytics and recommendations that reduce creative fatigue.",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-sm leading-relaxed text-[color:var(--muted-strong)]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            title="Why it feels easier to use"
            description="The product is designed to stay clean, branded, and readable."
          >
            <div className="flex flex-col gap-6 mt-2">
              {[
                {
                  title: "Clear hierarchy",
                  detail: "Fewer competing panels and shorter copy help the team spot the next action quickly.",
                },
                {
                  title: "Balanced assistance",
                  detail: "The assistant can suggest trend-led ideas or useful evergreen content when trends are weak.",
                },
                {
                  title: "Responsive shell",
                  detail: "Navigation, cards, and forms stay usable on desktop, tablet, and mobile.",
                },
              ].map((item) => (
                <div key={item.title}>
                  <h3 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)]">
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
