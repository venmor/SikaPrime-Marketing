import Link from "next/link";
import {
  AssetStatus,
  ContentTone,
  ContentType,
  PublishingChannel,
} from "@prisma/client";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { canGenerateContent } from "@/lib/auth/access";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { buildAssistantOpportunities } from "@/lib/engines/content/strategy";
import { formatDateTime, formatRelativeDate, humanizeEnum } from "@/lib/utils";
import {
  createFlyerDraftAction,
  generateFlyerProjectAction,
  updateBrandAssetStatusAction,
  uploadBrandAssetAction,
} from "@/server/actions/flyers";

export const maxDuration = 60;

function firstValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function conceptBadgeVariant(status: string) {
  if (status === "SELECTED") {
    return "success" as const;
  }

  if (status === "GENERATED") {
    return "brand-subtle" as const;
  }

  return "muted" as const;
}

function assetBadgeVariant(status: AssetStatus) {
  if (status === AssetStatus.APPROVED) {
    return "success" as const;
  }

  if (status === AssetStatus.ARCHIVED) {
    return "muted" as const;
  }

  return "brand-subtle" as const;
}

export default async function FlyersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, params] = await Promise.all([requireSession(), searchParams]);

  if (!canGenerateContent(session.role)) {
    redirect("/dashboard");
  }

  const [profile, products, audiences, templates, assets, projects, recentContent] =
    await Promise.all([
      prisma.businessProfile.findUnique({
        where: { id: 1 },
        include: {
          goals: {
            where: { active: true },
            orderBy: { priority: "desc" },
          },
          offers: {
            where: { active: true },
            orderBy: { priority: "desc" },
          },
        },
      }),
      prisma.product.findMany({
        where: { active: true },
        orderBy: { priority: "desc" },
      }),
      prisma.audienceSegment.findMany({
        orderBy: { priority: "desc" },
      }),
      prisma.campaignTemplate.findMany({
        where: { active: true },
        orderBy: { priority: "desc" },
      }),
      prisma.brandAsset.findMany({
        orderBy: [{ updatedAt: "desc" }],
        take: 12,
      }),
      prisma.flyerProject.findMany({
        include: {
          product: true,
          audienceSegment: true,
          concepts: {
            include: {
              asset: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 4,
      }),
      prisma.contentItem.findMany({
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        take: 18,
        select: {
          title: true,
          objective: true,
          themeLabel: true,
          contentType: true,
          channel: true,
        },
      }),
    ]);

  if (!profile) {
    redirect("/dashboard");
  }

  const assistant = buildAssistantOpportunities({
    products,
    audiences,
    goals: profile.goals,
    offers: profile.offers,
    recentContent,
  });
  const selectedProjectId = firstValue(params.project);
  const featuredProject =
    projects.find((project) => project.id === selectedProjectId) ?? projects[0] ?? null;

  return (
    <div className="grid gap-6">
      {firstValue(params.asset) === "uploaded" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Brand reference uploaded and analyzed. It is now available to guide
          the next flyer generation run.
        </div>
      ) : null}
      {firstValue(params.error) ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          {firstValue(params.error) === "missing-file"
            ? "Choose a flyer image before uploading."
            : firstValue(params.error) === "invalid-file"
              ? "Only image files can be uploaded to the flyer library."
              : "That file is too large. Keep flyer references under 6 MB."}
        </div>
      ) : null}

      <SectionCard
        title="Flyer studio"
        description="Upload original Sika Prime flyers, learn the brand system from them, generate 3 creative directions, preview the images, then convert the best option into a publish-ready post."
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-[color:var(--border)] bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--muted)]">
              Reference flyers
            </p>
            <p className="mt-3 font-display text-3xl font-semibold text-[color:var(--foreground)]">
              {assets.filter((asset) => asset.kind === "FLYER_REFERENCE").length}
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--muted)]">
              Campaign templates
            </p>
            <p className="mt-3 font-display text-3xl font-semibold text-[color:var(--foreground)]">
              {templates.length}
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--muted)]">
              Occasion cues
            </p>
            <p className="mt-3 font-display text-3xl font-semibold text-[color:var(--foreground)]">
              {assistant.occasionOpportunities.length}
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--muted)]">
              Recent flyer runs
            </p>
            <p className="mt-3 font-display text-3xl font-semibold text-[color:var(--foreground)]">
              {projects.length}
            </p>
          </div>
        </div>
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
        <SectionCard
          title="Upload a reference flyer"
          description="Add original Sika Prime creative so the system can read recurring colors, CTA style, layout cues, and brand tone."
        >
          <form action={uploadBrandAssetAction} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                Reference title
                <input
                  name="title"
                  placeholder="Salary advance flyer reference"
                  required
                />
              </label>
              <label>
                Product link
                <select name="productId" defaultValue="">
                  <option value="">General brand reference</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Flyer image
              <input name="image" type="file" accept="image/*" required />
            </label>
            <SubmitButton pendingLabel="Uploading and analyzing...">
              Add flyer reference
            </SubmitButton>
          </form>
        </SectionCard>

        <SectionCard
          title="Generate 3 flyer options"
          description="Choose the campaign objective, occasion, product, and audience. The studio will produce 3 branded flyer concepts, captions, hashtags, and 4 engagement comments."
        >
          <form action={generateFlyerProjectAction} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                Project title
                <input
                  name="title"
                  placeholder="Youth Day empowerment flyer set"
                  required
                />
              </label>
              <label>
                Campaign template
                <select name="campaignTemplateId" defaultValue="">
                  <option value="">Free-form campaign</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Objective
              <textarea
                name="objective"
                placeholder="Example: Create a Youth Day flyer sequence that feels aspirational, responsible, and relevant to young Zambians building their future."
                required
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label>
                Occasion or special day
                <select name="specialDayKey" defaultValue="">
                  <option value="">Auto-pick the strongest occasion</option>
                  {assistant.occasionOpportunities.map((opportunity) => (
                    <option key={opportunity.key} value={opportunity.key}>
                      {opportunity.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Product
                <select name="productId" defaultValue="">
                  <option value="">General brand focus</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Audience
                <select name="audienceSegmentId" defaultValue="">
                  <option value="">General audience</option>
                  {audiences.map((audience) => (
                    <option key={audience.id} value={audience.id}>
                      {audience.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
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
                Content type
                <select name="contentType" defaultValue={ContentType.FACEBOOK_POST}>
                  {Object.values(ContentType).map((type) => (
                    <option key={type} value={type}>
                      {humanizeEnum(type)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Distribution target
                <input
                  name="distributionTarget"
                  placeholder="Optional phone number or list"
                />
              </label>
            </div>

            <SubmitButton pendingLabel="Generating flyer set...">
              Generate 3 flyer concepts
            </SubmitButton>
          </form>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <SectionCard
          title="Campaign templates"
          description="Repeatable sequences for common loan moments like school fees, month-end pressure, and SME restocking."
        >
          <div className="grid gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand-subtle">Template</Badge>
                  <Badge variant="muted">Priority {template.priority}</Badge>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                  {template.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {template.summary}
                </p>
                <p className="mt-3 text-sm font-medium text-[color:var(--foreground)]">
                  Objective
                </p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {template.objective}
                </p>
                <p className="mt-3 text-sm font-medium text-[color:var(--foreground)]">
                  Sequence
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-[color:var(--muted)]">
                  {template.sequenceSteps}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Seasonal opportunities"
          description="The proactive assistant can suggest flyer directions even before a social trend appears."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {assistant.occasionOpportunities.map((opportunity) => (
              <div
                key={opportunity.key}
                className="rounded-[24px] border border-[color:var(--border)] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="cyan-subtle">{humanizeEnum(opportunity.lane)}</Badge>
                  <Badge variant="muted">{humanizeEnum(opportunity.tone)}</Badge>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                  {opportunity.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {opportunity.summary}
                </p>
                <p className="mt-3 text-sm text-[color:var(--foreground)]">
                  {opportunity.rationale}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <SectionCard
        title="Brand asset library"
        description="Reference flyers stay reusable, approval-aware, and linked to the creative system."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assets.length ? (
            assets.map((asset) => (
              <div
                key={asset.id}
                className="rounded-[28px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-5"
              >
                <div className="overflow-hidden rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-soft)]">
                  <img
                    src={asset.imageData}
                    alt={asset.title}
                    className="h-56 w-full object-cover"
                  />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge variant={assetBadgeVariant(asset.status)}>
                    {humanizeEnum(asset.status)}
                  </Badge>
                  <Badge variant="muted">{humanizeEnum(asset.kind)}</Badge>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                  {asset.title}
                </h3>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  {asset.fileName}
                </p>
                {asset.analysisSummary ? (
                  <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                    {asset.analysisSummary}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {asset.status !== AssetStatus.APPROVED ? (
                    <form action={updateBrandAssetStatusAction}>
                      <input type="hidden" name="assetId" value={asset.id} />
                      <input type="hidden" name="status" value={AssetStatus.APPROVED} />
                      <SubmitButton pendingLabel="Approving..." variant="secondary">
                        Approve
                      </SubmitButton>
                    </form>
                  ) : null}
                  {asset.status !== AssetStatus.ARCHIVED ? (
                    <form action={updateBrandAssetStatusAction}>
                      <input type="hidden" name="assetId" value={asset.id} />
                      <input type="hidden" name="status" value={AssetStatus.ARCHIVED} />
                      <SubmitButton pendingLabel="Archiving..." variant="ghost">
                        Archive
                      </SubmitButton>
                    </form>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state md:col-span-2 xl:col-span-3">
              No flyer references yet. Upload one original Sika Prime flyer to
              start teaching the studio your visual system.
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Generated flyer previews"
        description="Each concept includes the image preview, recommended caption, hashtags, and 4 starter comments designed to lift engagement."
      >
        {featuredProject ? (
          <div className="grid gap-6">
            <div className="rounded-[28px] border border-[color:var(--border)] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="brand-subtle">Project</Badge>
                <Badge variant="muted">{humanizeEnum(featuredProject.channel)}</Badge>
                <Badge variant="muted">{humanizeEnum(featuredProject.tone)}</Badge>
              </div>
              <h3 className="mt-3 font-display text-2xl font-semibold text-[color:var(--foreground)]">
                {featuredProject.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                {featuredProject.objective}
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-[color:var(--muted)]">
                <span>Updated {formatRelativeDate(featuredProject.updatedAt)}</span>
                {featuredProject.product ? (
                  <span>Product: {featuredProject.product.name}</span>
                ) : null}
                {featuredProject.audienceSegment ? (
                  <span>Audience: {featuredProject.audienceSegment.name}</span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              {featuredProject.concepts.map((concept) => (
                <article
                  key={concept.id}
                  className="rounded-[28px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.8)] p-5 shadow-sm"
                >
                  <div className="overflow-hidden rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-soft)]">
                    {concept.imageData ? (
                      <img
                        src={concept.imageData}
                        alt={concept.title}
                        className="h-[360px] w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-[360px] items-center justify-center text-sm text-[color:var(--muted)]">
                        Image preview unavailable for this concept
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge variant={conceptBadgeVariant(concept.status)}>
                      {humanizeEnum(concept.status)}
                    </Badge>
                    <Badge variant="cyan-subtle">
                      {concept.asset ? "Generated image" : "Concept only"}
                    </Badge>
                  </div>

                  <h3 className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                    {concept.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-[color:var(--foreground)]">
                    {concept.headline}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                    {concept.bodyCopy}
                  </p>

                  <div className="mt-4 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                      Preview caption
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[color:var(--foreground)]">
                      {concept.caption}
                    </p>
                    <p className="mt-3 text-sm font-medium text-[color:var(--brand-strong)]">
                      {concept.hashtags}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                      4 engagement comments
                    </p>
                    <ul className="mt-2 grid gap-2 text-sm leading-6 text-[color:var(--muted)]">
                      {concept.engagementComments
                        .split(/\r?\n/)
                        .filter(Boolean)
                        .map((comment) => (
                          <li
                            key={comment}
                            className="rounded-2xl border border-[color:var(--border)] bg-white px-3 py-2"
                          >
                            {comment}
                          </li>
                        ))}
                    </ul>
                  </div>

                  <form action={createFlyerDraftAction} className="mt-5">
                    <input type="hidden" name="conceptId" value={concept.id} />
                    <SubmitButton pendingLabel="Preparing draft..." className="w-full">
                      Use this flyer
                    </SubmitButton>
                  </form>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            No flyer set has been generated yet. Upload a reference flyer, choose
            an objective, and the studio will generate three branded options here.
          </div>
        )}
      </SectionCard>

      {projects.length > 1 ? (
        <SectionCard
          title="Recent flyer projects"
          description="Jump between recent runs and compare how different occasions, audiences, or products changed the output."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/flyers?project=${project.id}`}
                className="card-hover rounded-[24px] border border-[color:var(--border)] bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="muted">{humanizeEnum(project.channel)}</Badge>
                  <Badge variant="brand-subtle">
                    {project.concepts.length} concepts
                  </Badge>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-[color:var(--foreground)]">
                  {project.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[color:var(--muted)]">
                  {project.objective}
                </p>
                <p className="mt-4 text-xs text-[color:var(--muted)]">
                  Updated {formatDateTime(project.updatedAt)}
                </p>
              </Link>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
