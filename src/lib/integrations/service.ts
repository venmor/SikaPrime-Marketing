import "server-only";

import { prisma } from "@/lib/db";

const requiredIntegrationSettings = [
  {
    key: "social.live_keywords",
    label: "Live trend keyword override",
    groupLabel: "Social listening",
    helpText:
      "Optional comma-separated keywords that should be mixed with knowledge-base terms when fetching live trends.",
    isSecret: false,
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
    isSecret: false,
    value: "true",
  },
] as const;

const runtimeEnvDefaults: Record<string, string | undefined> = {
  "openai.api_key": process.env.OPENAI_API_KEY,
  "openai.text_model": process.env.OPENAI_MODEL,
  "openai.image_model": process.env.OPENAI_IMAGE_MODEL,
  "facebook.page_id": process.env.FACEBOOK_PAGE_ID,
  "facebook.page_access_token": process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
  "whatsapp.phone_number_id": process.env.WHATSAPP_PHONE_NUMBER_ID,
  "whatsapp.access_token": process.env.WHATSAPP_ACCESS_TOKEN,
  "meta.graph_api_version": process.env.META_GRAPH_API_VERSION,
  "email.smtp_host": process.env.EMAIL_SMTP_HOST,
  "email.smtp_port": process.env.EMAIL_SMTP_PORT,
  "email.smtp_user": process.env.EMAIL_SMTP_USER,
  "email.smtp_password": process.env.EMAIL_SMTP_PASSWORD,
  "email.smtp_secure": process.env.EMAIL_SMTP_SECURE,
  "email.from_email": process.env.EMAIL_FROM_EMAIL,
  "email.from_name": process.env.EMAIL_FROM_NAME,
  "social.live_keywords": process.env.SOCIAL_LIVE_KEYWORDS,
  "social.gnews_api_key": process.env.GNEWS_API_KEY,
  "social.reddit_enabled": process.env.SOCIAL_REDDIT_ENABLED,
};

export async function getIntegrationSettings() {
  await Promise.all(
    requiredIntegrationSettings.map((setting) =>
      prisma.integrationSetting.upsert({
        where: { key: setting.key },
        update: {
          label: setting.label,
          groupLabel: setting.groupLabel,
          helpText: setting.helpText,
          isSecret: setting.isSecret,
        },
        create: {
          key: setting.key,
          label: setting.label,
          groupLabel: setting.groupLabel,
          helpText: setting.helpText,
          isSecret: setting.isSecret,
          value: "value" in setting ? setting.value ?? null : null,
        },
      }),
    ),
  );

  const settings = await prisma.integrationSetting.findMany({
    orderBy: [{ groupLabel: "asc" }, { label: "asc" }],
  });

  return {
    all: settings,
    grouped: settings.reduce<Record<string, typeof settings>>((acc, setting) => {
      if (!acc[setting.groupLabel]) {
        acc[setting.groupLabel] = [];
      }

      acc[setting.groupLabel].push(setting);
      return acc;
    }, {}),
    map: Object.fromEntries(
      settings.map((setting) => [
        setting.key,
        setting.value ?? runtimeEnvDefaults[setting.key] ?? "",
      ]),
    ),
  };
}

export async function getIntegrationSettingValue(key: string, fallback = "") {
  const setting = await prisma.integrationSetting.findUnique({
    where: { key },
  });

  const dbValue = setting?.value?.trim();

  if (dbValue) {
    return dbValue;
  }

  const envValue = runtimeEnvDefaults[key]?.trim();
  return envValue || fallback;
}

export async function getIntegrationSettingBoolean(
  key: string,
  fallback = false,
) {
  const value = await getIntegrationSettingValue(
    key,
    fallback ? "true" : "false",
  );

  return value.toLowerCase() === "true";
}

export async function getMaskedIntegrationValue(key: string) {
  const value = await getIntegrationSettingValue(key);

  if (!value) {
    return "";
  }

  if (value.length <= 8) {
    return "••••••••";
  }

  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}
