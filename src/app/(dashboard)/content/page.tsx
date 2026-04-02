import Link from "next/link";
import {
  ContentTone,
  ContentType,
  PublishingChannel,
  UserRole,
  WorkflowStage,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { canGenerateContent } from "@/lib/auth/access";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatRelativeDate, humanizeEnum } from "@/lib/utils";
import {
  generateContentAction,
  generateIdeasAction,
} from "@/server/actions/content";

export default async function ContentPage() {
  const session = await requireSession();
  const isGenerator = canGenerateContent(session.role);

  const [users, products, audiences, trends, workingItems, ideaItems] =
    await Promise.all([
      prisma.user.findMany({
        orderBy: { name: "asc" },
        where: {
          role: {
            in: [
              UserRole.ADMIN,
              UserRole.STRATEGIST,
              UserRole.CREATOR,
              UserRole.REVIEWER,
            ],
          },
        },
      }),
      prisma.product.findMany({
        where: { active: true },
        orderBy: { priority: "desc" },
      }),
      prisma.audienceSegment.findMany({ orderBy: { priority: "desc" } }),
      prisma.trendSignal.findMany({
        orderBy: [{ totalScore: "desc" }, { freshnessScore: "desc" }],
        take: 12,
      }),
      prisma.contentItem.findMany({
        where: {
          stage: {
            in: [
              WorkflowStage.DRAFT,
              WorkflowStage.IN_REVIEW,
              WorkflowStage.NEEDS_REVISION,
              WorkflowStage.APPROVED,
              WorkflowStage.SCHEDULED,
            ],
          },
        },
        include: { owner: true, trend: true, product: true },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      prisma.contentItem.findMany({
        where: {
          stage: WorkflowStage.IDEA,
        },
        include: { owner: true, trend: true, product: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  const ownerRoles: UserRole[] = [
    UserRole.ADMIN,
    UserRole.STRATEGIST,
    UserRole.CREATOR,
  ];
  const reviewerRoles: UserRole[] = [
    UserRole.ADMIN,
    UserRole.STRATEGIST,
    UserRole.REVIEWER,
  ];

  const owners = users.filter((user) => ownerRoles.includes(user.role));
  const reviewers = users.filter((user) => reviewerRoles.includes(user.role));

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="AI Content Idea Generator"
          description="Start with a campaign goal, blend it with live trends and business knowledge, and generate several saveable ideas before drafting."
        >
          {isGenerator ? (
            <form action={generateIdeasAction} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  Campaign objective
                  <textarea
                    name="objective"
                    placeholder="Example: Promote Business Booster to traders preparing to restock this month."
                    required
                  />
                </label>
                <div className="grid gap-4">
                  <label>
                    Campaign label
                    <input
                      name="campaignLabel"
                      placeholder="April restock push"
                    />
                  </label>
                  <label>
                    Number of ideas
                    <select name="numberOfIdeas" defaultValue="4">
                      {[2, 3, 4, 5, 6].map((count) => (
                        <option key={count} value={count}>
                          {count}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label>
                  Tone
                  <select name="tone" defaultValue={ContentTone.PROFESSIONAL}>
                    {Object.values(ContentTone).map((tone) => (
                      <option key={tone} value={tone}>
                        {humanizeEnum(tone)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Channel
                  <select name="channel" defaultValue={PublishingChannel.FACEBOOK}>
                    {Object.values(PublishingChannel).map((channel) => (
                      <option key={channel} value={channel}>
                        {humanizeEnum(channel)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Distribution target
                  <input
                    name="distributionTarget"
                    placeholder="Optional phone number or audience label"
                  />
                </label>
                <label>
                  Assign owner
                  <select name="ownerId" defaultValue={session.userId}>
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label>
                  Product context
                  <select name="productId" defaultValue="">
                    <option value="">General brand context</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Audience segment
                  <select name="audienceSegmentId" defaultValue="">
                    <option value="">General audience</option>
                    {audiences.map((audience) => (
                      <option key={audience.id} value={audience.id}>
                        {audience.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Trend to anchor on
                  <select name="trendId" defaultValue="">
                    <option value="">No specific trend</option>
                    {trends.map((trend) => (
                      <option key={trend.id} value={trend.id}>
                        {trend.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Reviewer
                <select name="reviewerId" defaultValue="">
                  <option value="">Assign later</option>
                  {reviewers.map((reviewer) => (
                    <option key={reviewer.id} value={reviewer.id}>
                      {reviewer.name}
                    </option>
                  ))}
                </select>
              </label>

              <SubmitButton pendingLabel="Generating ideas...">
                Generate content ideas
              </SubmitButton>
            </form>
          ) : (
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.65)] px-4 py-4 text-sm text-[color:var(--muted)]">
              Your current role is read-only for generation. You can still review
              saved ideas and active drafts.
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Direct Draft Generator"
          description="Use this when the team already knows the idea and wants to jump straight into drafting."
        >
          {isGenerator ? (
            <form action={generateContentAction} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  Working title
                  <input name="title" placeholder="Optional headline or concept" />
                </label>
                <label>
                  Assign owner
                  <select name="ownerId" defaultValue={session.userId}>
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  Objective
                  <input
                    name="objective"
                    placeholder="Build trust, drive leads, educate, or promote"
                  />
                </label>
                <label>
                  Campaign label
                  <input name="campaignLabel" placeholder="Month-end awareness" />
                </label>
              </div>

              <label>
                Distribution target
                <input
                  name="distributionTarget"
                  placeholder="Optional phone number, audience list, or destination note"
                />
              </label>

              <label>
                Brief
                <textarea
                  name="brief"
                  placeholder="Describe the message, audience, product focus, and what you want the content to achieve."
                  required
                />
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                <label>
                  Content type
                  <select name="contentType" defaultValue={ContentType.FACEBOOK_POST}>
                    {Object.values(ContentType)
                      .filter((type) => type !== ContentType.CAMPAIGN_IDEA)
                      .map((type) => (
                        <option key={type} value={type}>
                          {humanizeEnum(type)}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Tone
                  <select name="tone" defaultValue={ContentTone.PROFESSIONAL}>
                    {Object.values(ContentTone).map((tone) => (
                      <option key={tone} value={tone}>
                        {humanizeEnum(tone)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Channel
                  <select name="channel" defaultValue={PublishingChannel.FACEBOOK}>
                    {Object.values(PublishingChannel).map((channel) => (
                      <option key={channel} value={channel}>
                        {humanizeEnum(channel)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label>
                  Product context
                  <select name="productId" defaultValue="">
                    <option value="">General brand context</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Audience segment
                  <select name="audienceSegmentId" defaultValue="">
                    <option value="">General audience</option>
                    {audiences.map((audience) => (
                      <option key={audience.id} value={audience.id}>
                        {audience.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Trend to anchor on
                  <select name="trendId" defaultValue="">
                    <option value="">No specific trend</option>
                    {trends.map((trend) => (
                      <option key={trend.id} value={trend.id}>
                        {trend.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  Asset reference
                  <input
                    name="assetReference"
                    placeholder="Flyer brief, image link, or creative reference"
                  />
                </label>
                <label>
                  Reviewer
                  <select name="reviewerId" defaultValue="">
                    <option value="">Assign later</option>
                    {reviewers.map((reviewer) => (
                      <option key={reviewer.id} value={reviewer.id}>
                        {reviewer.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <SubmitButton pendingLabel="Generating draft...">
                Generate content draft
              </SubmitButton>
            </form>
          ) : null}
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Saved Ideas"
          description="Ideas can be reviewed, refined, rejected, or converted into complete drafts."
        >
          <div className="grid gap-4">
            {ideaItems.length ? (
              ideaItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/content/${item.id}`}
                  className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.7)] p-4 transition hover:border-[color:var(--brand)]"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="muted">{humanizeEnum(item.stage)}</Badge>
                    <Badge>{item.campaignLabel ?? "Idea backlog"}</Badge>
                    {item.trend ? <Badge variant="warning">{item.trend.lifecycle}</Badge> : null}
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {item.draft}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-[color:var(--muted)]">
                    <span>Owner: {item.owner.name}</span>
                    <span>Objective: {item.objective ?? item.brief}</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-[color:var(--muted)]">
                No saved ideas yet. Generate an idea batch to begin the workflow.
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Active Drafts and Reviews"
          description="Open a draft to edit AI output, assign review, move it through workflow, or schedule it."
        >
          <div className="grid gap-4">
            {workingItems.map((item) => (
              <Link
                key={item.id}
                href={`/content/${item.id}`}
                className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.7)] p-4 transition hover:border-[color:var(--brand)]"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="muted">{humanizeEnum(item.stage)}</Badge>
                  <Badge>{humanizeEnum(item.contentType)}</Badge>
                  {item.product ? <Badge variant="warning">{item.product.name}</Badge> : null}
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {item.brief}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-[color:var(--muted)]">
                  <span>Owner: {item.owner.name}</span>
                  <span>Updated {formatRelativeDate(item.updatedAt)}</span>
                  {item.revisionCount ? (
                    <span>Revisions: {item.revisionCount}</span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
