import { PerformanceChart } from "@/components/charts/performance-chart";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { getAnalyticsSnapshot } from "@/lib/analytics/service";

export default async function AnalyticsPage() {
  const analytics = await getAnalyticsSnapshot();

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Performance Timeline"
          description="Track how impressions, engagement, and leads evolve across published content."
        >
          <PerformanceChart data={analytics.timeline} />
        </SectionCard>

        <SectionCard
          title="Insight Summary"
          description="These observations feed the recommendation engine and guide the next content plan."
        >
          <div className="grid gap-4">
            {analytics.insights.map((insight) => (
              <div
                key={insight}
                className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4 text-sm leading-6 text-[color:var(--foreground)]"
              >
                {insight}
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Top Themes"
          description="Themes that are currently leading on engagement and lead response."
        >
          <div className="grid gap-4">
            {analytics.themePerformance.length ? (
              analytics.themePerformance.map((theme) => (
                <div
                  key={theme.themeLabel}
                  className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
                >
                  <h3 className="font-display text-lg font-semibold">
                    {theme.themeLabel}
                  </h3>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-[color:var(--muted)]">
                    <p>Leads: {theme.leads}</p>
                    <p>
                      Avg engagement: {theme.averageEngagementRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[color:var(--muted)]">
                No published theme data is available yet.
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Product Performance"
          description="Products attracting the strongest lead response should influence the next campaign sequence."
        >
          <div className="grid gap-4">
            {analytics.productPerformance.length ? (
              analytics.productPerformance.map((product) => (
                <div
                  key={product.productName}
                  className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
                >
                  <h3 className="font-display text-lg font-semibold">
                    {product.productName}
                  </h3>
                  <div className="mt-3 grid gap-1 text-sm text-[color:var(--muted)]">
                    <p>Leads: {product.leads}</p>
                    <p>Impressions: {product.impressions.toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[color:var(--muted)]">
                Product-level performance will appear after more content is published.
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Best Posting Windows"
          description="Posting-time patterns based on the content that has already performed well."
        >
          <div className="grid gap-4">
            {analytics.bestPostingWindows.length ? (
              analytics.bestPostingWindows.map((window) => (
                <div
                  key={window.label}
                  className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4"
                >
                  <p className="font-display text-2xl font-semibold">
                    {window.label}
                  </p>
                  <div className="mt-3 grid gap-1 text-sm text-[color:var(--muted)]">
                    <p>Leads: {window.leads}</p>
                    <p>
                      Avg engagement: {window.averageEngagementRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[color:var(--muted)]">
                More published results are needed before timing recommendations stabilize.
              </p>
            )}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          title="Trend Performance"
          description="Trend-linked posts that translated into stronger engagement or lead quality."
        >
          <div className="grid gap-4">
            {analytics.trendPerformance.length ? (
              analytics.trendPerformance.map((trend) => (
                <div
                  key={trend.trendTitle}
                  className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
                >
                  <h3 className="font-display text-lg font-semibold">
                    {trend.trendTitle}
                  </h3>
                  <div className="mt-3 grid gap-1 text-sm text-[color:var(--muted)]">
                    <p>Leads: {trend.leads}</p>
                    <p>
                      Avg engagement: {trend.averageEngagementRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[color:var(--muted)]">
                No trend-linked performance data is available yet.
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Channel Breakdown"
          description="Compare how each publishing channel is contributing to reach and lead generation."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {analytics.channelPerformance.length ? (
              analytics.channelPerformance.map((channel) => (
                <div
                  key={channel.channel}
                  className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-semibold">
                      {channel.channel}
                    </h3>
                    <Badge variant="muted">Live</Badge>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-[color:var(--muted)]">
                    <p>Impressions: {channel.impressions.toLocaleString()}</p>
                    <p>Leads: {channel.leads}</p>
                    <p>
                      Avg engagement: {channel.averageEngagementRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[color:var(--muted)]">
                Channel performance appears here after the first published posts.
              </p>
            )}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
