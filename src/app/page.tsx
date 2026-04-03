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
import { demoCredentials } from "@/lib/constants";

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
    <main className="relative isolate flex-1 overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(230,62,140,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(33,198,217,0.14),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,248,252,0.98))]" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="surface-panel overflow-hidden rounded-[38px] p-8 sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.2),transparent_40%),radial-gradient(circle_at_top_right,rgba(230,62,140,0.1),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(33,198,217,0.12),transparent_34%)]" />
            <div className="relative">
              <Badge variant="brand-subtle">Web-first, mobile-ready</Badge>

              <div className="mt-6">
                <AppLogo />
              </div>

              <h1 className="mt-8 max-w-4xl font-display text-[2.8rem] font-semibold leading-[1.03] tracking-[-0.055em] text-[color:var(--foreground)] sm:text-[3.5rem] xl:text-[4.1rem]">
                Marketing operations, simplified for Sika Prime Loans.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-[color:var(--muted)]">
                Detect safe trends, create useful campaigns, manage approvals,
                publish with confidence, and learn what works from one product.
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
                  View modules
                </a>
              </div>

              <div className="mt-8 grid gap-3">
                {heroPoints.map((item) => (
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
          </div>

          <div className="grid gap-6">
            <SectionCard
              title="Demo Access"
              description="Seeded roles are ready to explore."
            >
              <div className="space-y-3">
                {demoCredentials.map((credential) => (
                  <div
                    key={credential}
                    className="nested-panel rounded-[20px] px-4 py-3 text-sm text-[color:var(--foreground)]"
                  >
                    {credential}
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Built to last"
              description="A clean technical foundation for future growth."
            >
              <div className="grid gap-4">
                {[
                  "Next.js and TypeScript for maintainable product delivery.",
                  "Prisma-backed data for content, trends, analytics, and knowledge.",
                  "Modular services ready for more channels, AI, and mobile reuse.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,rgba(230,62,140,0.12),rgba(33,198,217,0.14))]">
                      <BadgeCheck className="h-4 w-4 text-[color:var(--foreground)]" />
                    </div>
                    <p className="text-sm leading-6 text-[color:var(--muted)]">{item}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

        <section id="modules" className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <SectionCard
            title="What the team gets"
            description="A focused workspace instead of scattered tools."
          >
            <div className="grid gap-3">
              {[
                "Trend detection with local/global separation and safety filtering.",
                "AI generation for proactive, seasonal, educational, and product-led content.",
                "A shared knowledge base for tone, offers, products, audiences, and compliance.",
                "Reviews, approvals, scheduling, publishing, and archiving in one workflow.",
                "Analytics and recommendations that reduce creative fatigue.",
              ].map((item) => (
                <div
                  key={item}
                  className="nested-panel rounded-[22px] px-4 py-3 text-sm leading-6 text-[color:var(--muted)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Why it feels easier to use"
            description="The product is designed to stay clean, branded, and readable."
          >
            <div className="grid gap-4">
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
                <div key={item.title} className="nested-panel rounded-[24px] p-4">
                  <h3 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
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
