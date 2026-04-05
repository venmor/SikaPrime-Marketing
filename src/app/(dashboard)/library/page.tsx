import { ContentType, PublishingChannel } from "@prisma/client";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { canViewAnalytics } from "@/lib/auth/access";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getPublishedRepository } from "@/lib/repository/service";
import { formatDateTime, humanizeEnum } from "@/lib/utils";
import {
  repurposePublishedContentAction,
  reusePublishedContentAction,
} from "@/server/actions/library";

type PerformanceLevel = "high" | "medium" | "low";

function firstValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();

  if (!canViewAnalytics(session.role)) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const filters = {
    query: firstValue(resolvedSearchParams.query).trim(),
    channel: firstValue(resolvedSearchParams.channel).trim(),
    productId: firstValue(resolvedSearchParams.productId).trim(),
    contentType: firstValue(resolvedSearchParams.contentType).trim(),
    performance:
      (firstValue(resolvedSearchParams.performance).trim() as
        | "all"
        | "high"
        | "medium"
        | "low") || "all",
  };

  const [items, products] = await Promise.all([
    getPublishedRepository(filters),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { priority: "desc" },
    }),
  ]);

  const counts = items.reduce(
    (accumulator, item) => {
      const level = item.repositoryMetrics.performanceLevel as PerformanceLevel;
      accumulator[level] += 1;
      return accumulator;
    },
    { high: 0, medium: 0, low: 0 } satisfies Record<PerformanceLevel, number>,
  );

  return (
    <div className="grid gap-6">
      <SectionCard
        title="Published Content Repository"
        description="Search, filter, reuse, repurpose, and archive what has already gone live so marketing knowledge does not get lost."
      >
        <form className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="xl:col-span-2">
              Search
              <input
                name="query"
                defaultValue={filters.query}
                placeholder="Search title, brief, theme, or campaign"
              />
            </label>
            <label>
              Channel
              <select name="channel" defaultValue={filters.channel}>
                <option value="">All channels</option>
                {Object.values(PublishingChannel).map((channel) => (
                  <option key={channel} value={channel}>
                    {humanizeEnum(channel)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Product
              <select name="productId" defaultValue={filters.productId}>
                <option value="">All products</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Performance
              <select name="performance" defaultValue={filters.performance}>
                <option value="all">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <label>
              Content type
              <select name="contentType" defaultValue={filters.contentType}>
                <option value="">All content types</option>
                {Object.values(ContentType).map((type) => (
                  <option key={type} value={type}>
                    {humanizeEnum(type)}
                  </option>
                ))}
              </select>
            </label>
            <SubmitButton pendingLabel="Filtering...">Apply filters</SubmitButton>
          </div>
        </form>
      </SectionCard>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="Repository Total" description="Published items matching your current filters.">
          <p className="font-display text-4xl font-semibold">{items.length}</p>
        </SectionCard>
        <SectionCard title="High Performers" description="Strong engagement or lead-generating content.">
          <p className="font-display text-4xl font-semibold">{counts.high}</p>
        </SectionCard>
        <SectionCard title="Medium Performers" description="Worth reviewing for reuse or optimization.">
          <p className="font-display text-4xl font-semibold">{counts.medium}</p>
        </SectionCard>
        <SectionCard title="Low Performers" description="Candidates for rewriting or retiring.">
          <p className="font-display text-4xl font-semibold">{counts.low}</p>
        </SectionCard>
      </section>

      <SectionCard
        title="Repository Items"
        description="Reuse proven posts as new drafts or repurpose them for a different platform."
      >
        <div className="grid gap-4">
          {items.length ? (
            items.map((item) => (
              <div
                key={item.id}
                className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge>{humanizeEnum(item.channel)}</Badge>
                  <Badge variant="muted">{humanizeEnum(item.contentType)}</Badge>
                  <Badge
                    variant={
                      item.repositoryMetrics.performanceLevel === "high"
                        ? "success"
                        : item.repositoryMetrics.performanceLevel === "medium"
                          ? "warning"
                          : "muted"
                    }
                  >
                    {humanizeEnum(item.repositoryMetrics.performanceLevel)}
                  </Badge>
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {item.brief}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[color:var(--foreground)]">
                  {item.finalCopy ?? item.draft}
                </p>
                <div className="mt-4 grid gap-1 text-sm text-[color:var(--muted)]">
                  <span>
                    Published:{" "}
                    {item.publishedAt ? formatDateTime(item.publishedAt) : "Unknown"}
                  </span>
                  {item.product ? <span>Product: {item.product.name}</span> : null}
                  {item.trend ? <span>Trend: {item.trend.title}</span> : null}
                  <span>
                    Leads: {item.repositoryMetrics.leads} | Impressions:{" "}
                    {item.repositoryMetrics.impressions.toLocaleString()} | Avg engagement:{" "}
                    {item.repositoryMetrics.averageEngagementRate.toFixed(1)}%
                  </span>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[auto_minmax(0,1fr)]">
                  <form action={reusePublishedContentAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <SubmitButton pendingLabel="Creating draft...">
                      Reuse as draft
                    </SubmitButton>
                  </form>

                  <form
                    action={repurposePublishedContentAction}
                    className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <input type="hidden" name="id" value={item.id} />
                    <label>
                      Repurpose for channel
                      <select name="targetChannel" defaultValue={PublishingChannel.WHATSAPP}>
                        {Object.values(PublishingChannel).map((channel) => (
                          <option key={channel} value={channel}>
                            {humanizeEnum(channel)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="self-end">
                      <SubmitButton pendingLabel="Repurposing...">
                        Create channel variant
                      </SubmitButton>
                    </div>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-[color:var(--muted)]">
              No published content matches the current filters yet.
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
