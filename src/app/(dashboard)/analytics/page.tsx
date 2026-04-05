import { redirect } from "next/navigation";

import { PerformanceChart } from "@/components/charts/performance-chart";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { getAnalyticsSnapshot } from "@/lib/analytics/service";
import { canViewAnalytics } from "@/lib/auth/access";
import { requireSession } from "@/lib/auth/session";

export default async function AnalyticsPage() {
  const session = await requireSession();

  if (!canViewAnalytics(session.role)) {
    redirect("/dashboard");
  }

  const analytics = await getAnalyticsSnapshot();

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Impressions"
          value={analytics.totals.impressions.toLocaleString()}
        />
        <StatCard label="Clicks" value={analytics.totals.clicks.toLocaleString()} />
        <StatCard label="Leads" value={analytics.totals.leads.toLocaleString()} />
        <StatCard
          label="Average Engagement"
          value={`${analytics.totals.averageEngagementRate.toFixed(1)}%`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <SectionCard
          title="Performance Timeline"
          description="Track how impressions, engagement, and leads evolve across published content."
        >
          <div className="mt-4 pt-4 border-t border-[color:var(--border)]">
            <PerformanceChart data={analytics.timeline} />
          </div>
        </SectionCard>

        <SectionCard
          title="Insight Summary"
          description="These observations feed the recommendation engine and guide the next content plan."
        >
          <div className="flex flex-col gap-3 mt-4">
            {analytics.insights.map((insight) => (
              <div
                key={insight}
                className="rounded-xl border border-[color:var(--border)] bg-surface-strong p-4 text-sm leading-relaxed text-[color:var(--foreground)] shadow-sm"
              >
                {insight}
              </div>
            ))}
            {!analytics.insights.length && (
               <div className="empty-state">No insights generated yet.</div>
            )}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Top Themes"
          description="Themes that are currently leading on engagement and lead response."
        >
          <div className="flex flex-col gap-3 mt-4">
            {analytics.themePerformance.length ? (
              analytics.themePerformance.map((theme) => (
                <div
                  key={theme.themeLabel}
                  className="rounded-xl border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm"
                >
                  <h3 className="font-display text-base font-semibold text-[color:var(--foreground)]">
                    {theme.themeLabel}
                  </h3>
                  <div className="mt-3 flex items-center justify-between text-sm text-[color:var(--muted)]">
                    <span className="font-medium text-[color:var(--foreground)]">{theme.leads} <span className="text-[color:var(--muted)] font-normal">leads</span></span>
                    <span>{theme.averageEngagementRate.toFixed(1)}% avg eng.</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                No published theme data is available yet.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Product Performance"
          description="Products attracting the strongest lead response should influence the next campaign sequence."
        >
          <div className="flex flex-col gap-3 mt-4">
            {analytics.productPerformance.length ? (
              analytics.productPerformance.map((product) => (
                <div
                  key={product.productName}
                  className="rounded-xl border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm"
                >
                  <h3 className="font-display text-base font-semibold text-[color:var(--foreground)]">
                    {product.productName}
                  </h3>
                  <div className="mt-3 flex flex-col gap-1 text-sm text-[color:var(--muted)]">
                    <div className="flex justify-between">
                      <span>Leads</span>
                      <span className="font-medium text-[color:var(--foreground)]">{product.leads}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impressions</span>
                      <span className="font-medium text-[color:var(--foreground)]">{product.impressions.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                Product-level performance will appear after more content is published.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Best Posting Windows"
          description="Posting-time patterns based on the content that has already performed well."
        >
          <div className="flex flex-col gap-3 mt-4">
            {analytics.bestPostingWindows.length ? (
              analytics.bestPostingWindows.map((window) => (
                <div
                  key={window.label}
                  className="rounded-xl bg-brand-soft border border-brand-soft p-4"
                >
                  <p className="font-display text-2xl font-bold tracking-tight text-brand-strong">
                    {window.label}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-medium text-[color:var(--foreground)]">{window.leads} leads</span>
                    <span className="text-[color:var(--muted)]">{window.averageEngagementRate.toFixed(1)}% avg eng.</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                More published results are needed before timing recommendations stabilize.
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <SectionCard
          title="Trend Performance"
          description="Trend-linked posts that translated into stronger engagement or lead quality."
        >
          <div className="flex flex-col gap-3 mt-4">
            {analytics.trendPerformance.length ? (
              analytics.trendPerformance.map((trend) => (
                <div
                  key={trend.trendTitle}
                  className="rounded-xl border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm"
                >
                  <h3 className="font-display text-base font-semibold text-[color:var(--foreground)]">
                    {trend.trendTitle}
                  </h3>
                  <div className="mt-3 flex items-center justify-between text-sm">
                     <span className="font-medium text-[color:var(--foreground)]">{trend.leads} <span className="text-[color:var(--muted)] font-normal">leads</span></span>
                     <span className="text-[color:var(--muted)]">{trend.averageEngagementRate.toFixed(1)}% avg eng.</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                No trend-linked performance data is available yet.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Channel Breakdown"
          description="Compare how each publishing channel is contributing to reach and lead generation."
        >
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            {analytics.channelPerformance.length ? (
              analytics.channelPerformance.map((channel) => (
                <div
                  key={channel.channel}
                  className="rounded-xl border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--border)] pb-3 mb-3">
                    <h3 className="font-display text-base font-semibold text-[color:var(--foreground)]">
                      {channel.channel}
                    </h3>
                    <Badge variant="cyan-subtle">Live</Badge>
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-[color:var(--muted)]">
                     <div className="flex justify-between">
                      <span>Impressions</span>
                      <span className="font-medium text-[color:var(--foreground)]">{channel.impressions.toLocaleString()}</span>
                    </div>
                     <div className="flex justify-between">
                      <span>Leads</span>
                      <span className="font-medium text-[color:var(--foreground)]">{channel.leads}</span>
                    </div>
                     <div className="flex justify-between">
                      <span>Engagement</span>
                      <span className="font-medium text-[color:var(--foreground)]">{channel.averageEngagementRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                Channel performance appears here after the first published posts.
              </div>
            )}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
