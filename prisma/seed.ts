import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

type IntegrationSettingSeed = {
  key: string;
  label: string;
  groupLabel: string;
  helpText: string;
  value?: string;
  isSecret?: boolean;
};

const demoEmails = [
  "admin@sikaprime.local",
  "strategist@sikaprime.local",
  "creator@sikaprime.local",
  "reviewer@sikaprime.local",
  "analyst@sikaprime.local",
];

const integrationSettings = [
  {
    key: "openai.api_key",
    label: "OpenAI API key",
    groupLabel: "AI generation",
    helpText:
      "Stored fallback API key for text and image generation when no environment variable override is preferred.",
    isSecret: true,
  },
  {
    key: "openai.text_model",
    label: "OpenAI text model",
    groupLabel: "AI generation",
    helpText: "Model used for captions, idea packs, and generated copy.",
    value: "gpt-4.1-mini",
  },
  {
    key: "openai.image_model",
    label: "OpenAI image model",
    groupLabel: "AI generation",
    helpText: "Model used for flyer rendering.",
    value: "gpt-image-1",
  },
  {
    key: "openai.image_size",
    label: "OpenAI image size",
    groupLabel: "AI generation",
    helpText: "Default flyer output size for generated creatives.",
    value: "1024x1536",
  },
  {
    key: "facebook.page_id",
    label: "Facebook page ID",
    groupLabel: "Publishing",
    helpText: "Page ID used for live Facebook publishing and metrics sync.",
  },
  {
    key: "facebook.page_access_token",
    label: "Facebook page access token",
    groupLabel: "Publishing",
    helpText: "Token used to publish posts and sync metrics from Facebook.",
    isSecret: true,
  },
  {
    key: "whatsapp.phone_number_id",
    label: "WhatsApp phone number ID",
    groupLabel: "Publishing",
    helpText: "WhatsApp Business phone number ID used for direct delivery.",
  },
  {
    key: "whatsapp.access_token",
    label: "WhatsApp access token",
    groupLabel: "Publishing",
    helpText: "Token used for WhatsApp Business Cloud API delivery.",
    isSecret: true,
  },
  {
    key: "meta.graph_api_version",
    label: "Meta Graph API version",
    groupLabel: "Publishing",
    helpText: "Graph API version for Facebook, WhatsApp, and Meta metrics.",
    value: "v22.0",
  },
  {
    key: "email.smtp_host",
    label: "SMTP host",
    groupLabel: "Email delivery",
    helpText: "SMTP server used to send invite, reset, and OTP emails.",
  },
  {
    key: "email.smtp_port",
    label: "SMTP port",
    groupLabel: "Email delivery",
    helpText: "SMTP port, usually 465 for secure or 587 for STARTTLS.",
    value: "587",
  },
  {
    key: "email.smtp_user",
    label: "SMTP username",
    groupLabel: "Email delivery",
    helpText: "SMTP account username used for email delivery.",
  },
  {
    key: "email.smtp_password",
    label: "SMTP password",
    groupLabel: "Email delivery",
    helpText: "SMTP password or app password for the sending account.",
    isSecret: true,
  },
  {
    key: "email.smtp_secure",
    label: "SMTP secure transport",
    groupLabel: "Email delivery",
    helpText: "Use true for SMTPS/465, false for STARTTLS/587.",
    value: "false",
  },
  {
    key: "email.from_email",
    label: "From email",
    groupLabel: "Email delivery",
    helpText: "Sender address shown on invite, reset, and OTP emails.",
  },
  {
    key: "email.from_name",
    label: "From name",
    groupLabel: "Email delivery",
    helpText: "Sender name shown on invite, reset, and OTP emails.",
    value: "Sika Prime Loans",
  },
  {
    key: "social.google_trends_enabled",
    label: "Google Trends",
    groupLabel: "Social listening",
    helpText: "Enable Google Trends signal ingestion when configured.",
    value: "false",
  },
  {
    key: "social.google_trends_feed",
    label: "Google Trends feed URL",
    groupLabel: "Social listening",
    helpText:
      "RSS or JSON feed endpoint for Google Trends-style signals. JSON should expose title, summary, url, and publishedAt.",
  },
  {
    key: "social.meta_insights_enabled",
    label: "Meta insights",
    groupLabel: "Social listening",
    helpText: "Enable Meta insight signals when connected.",
    value: "false",
  },
  {
    key: "social.meta_signals_feed",
    label: "Meta insights feed URL",
    groupLabel: "Social listening",
    helpText:
      "Approved JSON or RSS endpoint that exposes Meta attention signals for trend scoring.",
  },
  {
    key: "social.instagram_signals_enabled",
    label: "Instagram signals",
    groupLabel: "Social listening",
    helpText: "Enable Instagram trend signal collection when connected.",
    value: "false",
  },
  {
    key: "social.instagram_signals_feed",
    label: "Instagram signal feed URL",
    groupLabel: "Social listening",
    helpText:
      "Approved JSON or RSS endpoint for Instagram phrases, hooks, or theme signals.",
  },
  {
    key: "social.tiktok_signals_enabled",
    label: "TikTok signals",
    groupLabel: "Social listening",
    helpText: "Enable TikTok trend signal collection when connected.",
    value: "false",
  },
  {
    key: "social.tiktok_signals_feed",
    label: "TikTok signal feed URL",
    groupLabel: "Social listening",
    helpText:
      "Approved JSON or RSS endpoint for TikTok phrase, challenge, or obsession signals.",
  },
  {
    key: "social.monitoring_enabled",
    label: "Approved monitoring feed",
    groupLabel: "Social listening",
    helpText:
      "Enable the generic monitoring feed for approved social-listening providers.",
    value: "false",
  },
  {
    key: "social.monitoring_webhook",
    label: "Social monitoring webhook",
    groupLabel: "Social listening",
    helpText:
      "Optional JSON or RSS provider endpoint for approved social listening tools.",
  },
  {
    key: "social.live_keywords",
    label: "Live trend keyword override",
    groupLabel: "Social listening",
    helpText:
      "Optional comma-separated keywords that should be mixed with knowledge-base terms when fetching live trends.",
  },
  {
    key: "social.gnews_api_key",
    label: "GNews API key",
    groupLabel: "Social listening",
    helpText:
      "Optional API key for GNews live-search enrichment. Leave empty to rely on Reddit search plus internal fallback.",
    isSecret: true,
  },
  {
    key: "social.reddit_enabled",
    label: "Reddit live search",
    groupLabel: "Social listening",
    helpText:
      "Enable Reddit search as a live signal source for conversations around finance, lending, and small business.",
    value: "true",
  },
] satisfies readonly IntegrationSettingSeed[];

function envFlag(name: string, fallback = false) {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

async function resetWorkspaceData(adminEmail: string) {
  await prisma.flyerConcept.deleteMany();
  await prisma.flyerProject.deleteMany();
  await prisma.brandAsset.deleteMany();
  await prisma.campaignTemplate.deleteMany();
  await prisma.integrationSetting.deleteMany();
  await prisma.generationLog.deleteMany();
  await prisma.performanceSnapshot.deleteMany();
  await prisma.publication.deleteMany();
  await prisma.contentReview.deleteMany();
  await prisma.rateLimitBucket.deleteMany();
  await prisma.authToken.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.contentItem.deleteMany();
  await prisma.liveTrend.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.trendSignal.deleteMany();
  await prisma.guardrailTerm.deleteMany();
  await prisma.companyValue.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.strategicGoal.deleteMany();
  await prisma.complianceRule.deleteMany();
  await prisma.audienceSegment.deleteMany();
  await prisma.product.deleteMany();
  await prisma.businessProfile.deleteMany();
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { in: demoEmails } },
        { email: { not: adminEmail } },
      ],
    },
  });
}

async function upsertBusinessProfile() {
  return prisma.businessProfile.upsert({
    where: { id: 1 },
    update: {
      companyName: "Sika Prime Loans",
      brandPromise: "Responsible loan support with clarity, speed, and respect.",
      mission:
        "Help customers access practical financial support while keeping communication trustworthy and easy to understand.",
      valueProposition:
        "A focused marketing workspace for responsible lending campaigns, customer education, and performance-led planning.",
      toneSummary:
        "Professional, clear, respectful, locally aware, and never misleading.",
      primaryGoal:
        "Grow qualified conversations and leads while protecting trust and compliance.",
      coreNarrative:
        "Sika Prime Loans supports responsible borrowing, financial discipline, and real-world progress for customers and businesses.",
      complianceSummary:
        "Avoid guaranteed approval claims, misleading urgency, and language that promotes irresponsible borrowing.",
      heroMessage:
        "Create clear, trustworthy marketing that keeps the business active and credible.",
    },
    create: {
      id: 1,
      companyName: "Sika Prime Loans",
      brandPromise: "Responsible loan support with clarity, speed, and respect.",
      mission:
        "Help customers access practical financial support while keeping communication trustworthy and easy to understand.",
      valueProposition:
        "A focused marketing workspace for responsible lending campaigns, customer education, and performance-led planning.",
      toneSummary:
        "Professional, clear, respectful, locally aware, and never misleading.",
      primaryGoal:
        "Grow qualified conversations and leads while protecting trust and compliance.",
      coreNarrative:
        "Sika Prime Loans supports responsible borrowing, financial discipline, and real-world progress for customers and businesses.",
      complianceSummary:
        "Avoid guaranteed approval claims, misleading urgency, and language that promotes irresponsible borrowing.",
      heroMessage:
        "Create clear, trustworthy marketing that keeps the business active and credible.",
    },
  });
}

async function syncIntegrationSettings() {
  for (const setting of integrationSettings) {
    await prisma.integrationSetting.upsert({
      where: { key: setting.key },
      update: {
        label: setting.label,
        groupLabel: setting.groupLabel,
        helpText: setting.helpText,
        isSecret: setting.isSecret ?? false,
      },
      create: {
        key: setting.key,
        label: setting.label,
        groupLabel: setting.groupLabel,
        helpText: setting.helpText,
        isSecret: setting.isSecret ?? false,
        value: setting.value ?? null,
      },
    });
  }
}

async function upsertInitialAdmin() {
  const email =
    process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase() ??
    "admin@example.com";
  const password =
    process.env.INITIAL_ADMIN_PASSWORD?.trim() ?? "ChangeThisAdminPassword123!";
  const name = process.env.INITIAL_ADMIN_NAME?.trim() ?? "Platform Administrator";
  const jobTitle = process.env.INITIAL_ADMIN_JOB_TITLE?.trim() ?? "Administrator";
  const mfaEnabled = envFlag("INITIAL_ADMIN_MFA_ENABLED", false);
  const passwordHash = await hash(password, 10);

  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: UserRole.ADMIN,
      jobTitle,
      avatarSeed: "brand",
      isActive: true,
      mfaEnabled,
      failedSignInAttempts: 0,
      lockedUntil: null,
      passwordChangedAt: new Date(),
    },
    create: {
      name,
      email,
      passwordHash,
      role: UserRole.ADMIN,
      jobTitle,
      avatarSeed: "brand",
      isActive: true,
      mfaEnabled,
      passwordChangedAt: new Date(),
    },
  });
}

async function main() {
  const adminEmail =
    process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase() ??
    "admin@example.com";
  const shouldResetDemoData = envFlag("RESET_DEMO_DATA", false);

  if (shouldResetDemoData) {
    await resetWorkspaceData(adminEmail);
  } else {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: demoEmails.filter((email) => email !== adminEmail),
        },
      },
    });
  }

  const admin = await upsertInitialAdmin();
  await upsertBusinessProfile();
  await syncIntegrationSettings();

  console.log("");
  console.log("Sika Prime workspace bootstrap complete.");
  console.log(`Admin account: ${admin.email} (${admin.role})`);
  if (shouldResetDemoData) {
    console.log("Demo users and seeded sample workspace data were removed.");
  } else {
    console.log("Existing real workspace data was preserved.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
