import Link from "next/link";
import Image from "next/image";
import {
  AssetStatus,
  ContentTone,
  ContentType,
  PublishingChannel,
} from "@prisma/client";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  Layers3,
  WandSparkles,
} from "lucide-react";

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
  const referenceCount = assets.filter(
    (asset) => asset.kind === "FLYER_REFERENCE",
  ).length;
  const generatedConceptCount = projects.reduce(
    (sum, project) => sum + project.concepts.length,
    0,
  );
  const nextStep = referenceCount === 0
    ? "Upload one strong Sika Prime flyer first so the studio learns your brand before it generates fresh work."
    : !featuredProject
      ? "Your references are ready. Write a brief and let the studio create three clear directions."
      : "You already have generated concepts. Compare them, then convert the strongest one into a content draft.";

  return (
    <div className="grid gap-8">
      {firstValue(params.asset) === "uploaded" ? (
        <div className="alert-success rounded-2xl p-4 text-sm">
          Brand reference uploaded and analyzed. It is now ready to guide the
          next flyer generation run.
        </div>
      ) : null}
      {firstValue(params.error) ? (
        <div className="alert-danger rounded-2xl p-4 text-sm">
          {firstValue(params.error) === "missing-file"
            ? "Choose a flyer image before uploading."
            : firstValue(params.error) === "invalid-file"
              ? "Only image files can be uploaded to the flyer library."
              : "That file is too large. Keep flyer references under 6 MB."}
        </div>
      ) : null}

      <SectionCard
        title="Flyer studio"
        description="Move from reference flyer to generated concepts to a publish-ready draft with one guided studio flow."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#studio-brief"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition-colors hover:text-brand-strong"
            >
              Open brief
              <ArrowRight className="h-4 w-4" />
            </a>
            {featuredProject ? (
              <a
                href="#studio-concepts"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition-colors hover:text-brand-strong"
              >
                View concepts
                <ArrowRight className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Reference flyers",
                value: referenceCount,
                hint: "Brand examples uploaded",
              },
              {
                label: "Templates",
                value: templates.length,
                hint: "Reusable campaign structures",
              },
              {
                label: "Flyer runs",
                value: projects.length,
                hint: "Briefs already generated",
              },
              {
                label: "Concepts made",
                value: generatedConceptCount,
                hint: "Directions ready to compare",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--muted)]">
                  {stat.label}
                </p>
                <p className="mt-3 font-display text-3xl font-semibold text-[color:var(--foreground)]">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  {stat.hint}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand-subtle">Studio flow</Badge>
              {featuredProject ? (
                <Badge variant="success">Concepts ready</Badge>
              ) : (
                <Badge variant="muted">Waiting for brief</Badge>
              )}
            </div>
            <p className="mt-4 text-base leading-7 text-[color:var(--foreground)]">
              {nextStep}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Add reference",
                  detail: "Upload an original flyer",
                  icon: ImagePlus,
                },
                {
                  label: "Write brief",
                  detail: "Pick objective, audience, and tone",
                  icon: Layers3,
                },
                {
                  label: "Generate 3",
                  detail: "Compare different directions",
                  icon: WandSparkles,
                },
                {
                  label: "Use one",
                  detail: "Convert it into a content draft",
                  icon: CheckCircle2,
                },
              ].map((step) => (
                <div
                  key={step.label}
                  className="rounded-[20px] border border-[color:var(--border)] bg-surface-strong p-4"
                >
                  <step.icon className="h-5 w-5 text-brand" />
                  <p className="mt-3 text-sm font-semibold text-[color:var(--foreground)]">
                    {step.label}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {projects.length > 1 ? (
        <SectionCard
          title="Recent flyer runs"
          description="Jump between recent briefs without losing the current studio context."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/flyers?project=${project.id}`}
                className={`card-hover rounded-[24px] border p-4 shadow-sm transition-all ${
                  featuredProject?.id === project.id
                    ? "border-brand bg-brand-soft/40"
                    : "border-[color:var(--border)] bg-surface-strong"
                }`}
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

      <section className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
        <SectionCard
          title="Step 1: Upload a reference flyer"
          description="Add an original Sika Prime flyer so the studio can learn your layout, CTA style, and brand mood."
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
          title="Step 2: Brief the flyer set"
          description="Describe the campaign once, then let the studio return three branded options with caption and comment support."
        >
          <form
            id="studio-brief"
            action={generateFlyerProjectAction}
            className="grid gap-4"
          >
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

      {featuredProject ? (
        <SectionCard
          title="Step 3: Compare concepts"
          description="Review the current flyer run, compare all three directions, then pick one to convert into a working content draft."
          action={
            <Badge variant="brand-subtle">
              {featuredProject.concepts.length} concepts
            </Badge>
          }
        >
          <div className="grid gap-6">
            <div className="rounded-[28px] border border-[color:var(--border)] bg-surface-strong p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="brand-subtle">Current run</Badge>
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

            <div id="studio-concepts" className="grid gap-6 xl:grid-cols-3">
              {featuredProject.concepts.map((concept) => (
                <article
                  key={concept.id}
                  className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm"
                >
                  <div className="overflow-hidden rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-soft)]">
                    {concept.imageData ? (
                      <Image
                        src={concept.imageData}
                        alt={concept.title}
                        width={960}
                        height={1280}
                        unoptimized
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
                            className="rounded-2xl border border-[color:var(--border)] bg-surface-strong px-3 py-2"
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
        </SectionCard>
      ) : (
        <SectionCard
          title="Step 3: Compare concepts"
          description="Generated concepts will appear here after you upload a reference and submit a brief."
        >
          <div className="empty-state">
            No flyer set has been generated yet. Add a reference, write the
            brief, and the studio will return three branded options here.
          </div>
        </SectionCard>
      )}

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <SectionCard
          title="Campaign templates"
          description="Repeatable flyer structures for school fees, month-end pressure, SME restocking, and other common borrowing moments."
        >
          <div className="grid gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5"
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
          title="Occasion suggestions"
          description="Use proactive occasions when there is no strong social trend but the page still needs timely, relevant flyer content."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {assistant.occasionOpportunities.map((opportunity) => (
              <div
                key={opportunity.key}
                className="rounded-[24px] border border-[color:var(--border)] bg-surface-strong p-5 shadow-sm"
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
        description="Reference flyers stay reusable, approval-aware, and visible in one place instead of being lost in folders or chat."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assets.length ? (
            assets.map((asset) => (
              <div
                key={asset.id}
                className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5"
              >
                <div className="overflow-hidden rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-soft)]">
                  <Image
                    src={asset.imageData}
                    alt={asset.title}
                    width={960}
                    height={720}
                    unoptimized
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
                      <SubmitButton pendingLabel="Approving..." variant="success">
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
    </div>
  );
}
