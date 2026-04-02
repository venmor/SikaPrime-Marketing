import type {
  AudienceSegment,
  BusinessProfile,
  ComplianceRule,
  ContentTone,
  ContentType,
  GuardrailTerm,
  Offer,
  Product,
  PublishingChannel,
  StrategicGoal,
  TrendSignal,
} from "@prisma/client";

import { humanizeEnum } from "@/lib/utils";

export type GenerationContext = {
  profile: BusinessProfile;
  product: Product | null;
  audience: AudienceSegment | null;
  trend: TrendSignal | null;
  offers: Offer[];
  goals: StrategicGoal[];
  complianceRules: ComplianceRule[];
  guardrailTerms: GuardrailTerm[];
};

export function buildGenerationPrompt(input: {
  brief: string;
  title?: string | null;
  contentType: ContentType;
  tone: ContentTone;
  channel: PublishingChannel;
  context: GenerationContext;
}) {
  const {
    profile,
    product,
    audience,
    trend,
    offers,
    goals,
    complianceRules,
    guardrailTerms,
  } =
    input.context;

  return `
You are the senior marketing copy system for Sika Prime Loans.
Generate one high-quality content draft for a Zambian loan business.

Return JSON only in this shape:
{
  "title": "string",
  "copy": "string",
  "cta": "string",
  "hashtags": ["#tag1", "#tag2"],
  "rationale": "string",
  "complianceChecklist": ["string"],
  "themeLabel": "string"
}

Business profile:
- Company: ${profile.companyName}
- Promise: ${profile.brandPromise}
- Mission: ${profile.mission}
- Value proposition: ${profile.valueProposition}
- Tone guidance: ${profile.toneSummary}
- Narrative: ${profile.coreNarrative}
- Compliance summary: ${profile.complianceSummary}

Priority goals:
${goals.map((goal) => `- ${goal.title}: ${goal.description}`).join("\n")}

Active offers:
${offers.map((offer) => `- ${offer.name}: ${offer.description}`).join("\n") || "- None"}

Compliance rules:
${complianceRules
  .map((rule) => `- ${rule.title}: ${rule.ruleText}. ${rule.guidance}`)
  .join("\n")}

Guardrail terms and risky phrases:
${guardrailTerms
  .map((term) => `- ${term.phrase} (${humanizeEnum(term.type)}): ${term.explanation}`)
  .join("\n") || "- None"}

Requested content:
- Type: ${humanizeEnum(input.contentType)}
- Tone: ${humanizeEnum(input.tone)}
- Channel: ${humanizeEnum(input.channel)}
- Working title: ${input.title ?? "Create the best title"}
- Brief: ${input.brief}

Product context:
${product ? `- ${product.name}: ${product.description}\n- Benefits: ${product.keyBenefits}\n- CTA: ${product.callToAction}` : "- Use company-level context"}

Audience context:
${audience ? `- ${audience.name}: ${audience.description}\n- Needs: ${audience.needs}\n- Pain points: ${audience.painPoints}\n- Preferred channels: ${audience.preferredChannels}` : "- Use broad audience fit"}

Trend context:
${trend ? `- ${trend.title}\n- Summary: ${trend.summary}\n- Region: ${humanizeEnum(trend.region)}\n- Topic: ${trend.topic}` : "- No specific trend selected"}

Write natural, persuasive, high-trust copy. Do not promise guaranteed approval. Keep the message respectful and clear.
`.trim();
}

export function buildFallbackDraft(input: {
  title?: string | null;
  brief: string;
  contentType: ContentType;
  tone: ContentTone;
  channel: PublishingChannel;
  context: GenerationContext;
}) {
  const { profile, product, audience, trend, complianceRules, guardrailTerms } =
    input.context;

  const openerByTone: Record<ContentTone, string> = {
    PROFESSIONAL:
      "Clear, respectful financial support starts with the right information.",
    PERSUASIVE:
      "When timing matters, the right support can help you stay in control.",
    YOUTHFUL:
      "Life moves fast, and smart support should keep up without the drama.",
    LOCALIZED:
      "From month-end pressure to business restocking, real life needs practical help.",
  };

  const title =
    input.title?.trim() ||
    `${product?.name ?? profile.companyName} ${humanizeEnum(input.contentType)}`;

  const copy = [
    openerByTone[input.tone],
    product?.description ?? profile.valueProposition,
    audience
      ? `${audience.name} can benefit from messaging built around ${audience.needs.toLowerCase()}.`
      : "The message should stay broad enough for everyday financial realities.",
    trend
      ? `Right now, interest is growing around ${trend.topic.toLowerCase()}, making this a timely conversation to join.`
      : "Use a calm, trust-led angle that feels useful rather than pushy.",
    `${profile.companyName} keeps the process clear, respectful, and subject to review.`,
  ].join(" ");

  return {
    title,
    copy,
    cta:
      product?.callToAction ??
      "Message Sika Prime Loans to ask questions and explore the right support for your situation.",
    hashtags: [
      "#SikaPrimeLoans",
      product ? `#${product.name.replace(/\s+/g, "")}` : "#SmartBorrowing",
      input.channel === "WHATSAPP" ? "#WhatsAppReady" : "#FacebookMarketing",
    ],
    rationale:
      "Fallback generation used company context, selected product and audience data, and current workflow settings.",
    complianceChecklist: complianceRules
      .slice(0, 3)
      .map((rule) => `${rule.title}: ${rule.guidance}`),
    guardrailChecklist: guardrailTerms
      .slice(0, 3)
      .map((term) => `${term.phrase}: ${term.explanation}`),
    themeLabel: trend?.topic ?? product?.category ?? "trust-led promotion",
  };
}

export function buildIdeaPrompt(input: {
  objective: string;
  channel: PublishingChannel;
  tone: ContentTone;
  numberOfIdeas: number;
  context: GenerationContext;
}) {
  const {
    profile,
    product,
    audience,
    trend,
    offers,
    goals,
    complianceRules,
    guardrailTerms,
  } = input.context;

  return `
You are the strategic content ideation engine for Sika Prime Loans.
Generate ${input.numberOfIdeas} distinct marketing ideas.

Return JSON only in this shape:
{
  "ideas": [
    {
      "title": "string",
      "idea": "string",
      "hook": "string",
      "cta": "string",
      "rationale": "string",
      "themeLabel": "string"
    }
  ]
}

Business profile:
- Company: ${profile.companyName}
- Promise: ${profile.brandPromise}
- Value proposition: ${profile.valueProposition}
- Tone guidance: ${profile.toneSummary}
- Primary goal: ${profile.primaryGoal}

Requested ideation:
- Objective: ${input.objective}
- Channel: ${humanizeEnum(input.channel)}
- Tone: ${humanizeEnum(input.tone)}

Priority goals:
${goals.map((goal) => `- ${goal.title}: ${goal.description}`).join("\n")}

Active offers:
${offers.map((offer) => `- ${offer.name}: ${offer.description}`).join("\n") || "- None"}

Product context:
${product ? `- ${product.name}: ${product.description}\n- Benefits: ${product.keyBenefits}` : "- Use general brand and product mix context"}

Audience context:
${audience ? `- ${audience.name}: ${audience.description}\n- Needs: ${audience.needs}\n- Pain points: ${audience.painPoints}` : "- Use broad audience fit"}

Trend context:
${trend ? `- ${trend.title}\n- Topic: ${trend.topic}\n- Summary: ${trend.summary}` : "- No specific trend selected"}

Compliance rules:
${complianceRules.map((rule) => `- ${rule.ruleText}`).join("\n")}

Guardrails:
${guardrailTerms.map((term) => `- Avoid or carefully review: ${term.phrase} (${term.explanation})`).join("\n") || "- None"}

Generate ideas that are current, practical, brand-safe, and easy to convert into drafts.
`.trim();
}

export function buildFallbackIdeas(input: {
  objective: string;
  channel: PublishingChannel;
  tone: ContentTone;
  numberOfIdeas: number;
  context: GenerationContext;
}) {
  const { profile, product, audience, trend, offers, goals } = input.context;

  const baseAngles = [
    {
      title: `Explain the practical side of ${product?.name ?? "responsible borrowing"}`,
      idea: `Create an educational piece that breaks down how ${product?.name ?? profile.companyName} helps with real cash-flow pressure without sounding pushy.`,
      hook: "Before you borrow, make sure the support actually fits the moment.",
      themeLabel: trend?.topic ?? "financial education",
    },
    {
      title: `Build trust around ${product?.name ?? "clear loan guidance"}`,
      idea: `Show how ${profile.companyName} keeps the process respectful, transparent, and subject to review for ${audience?.name ?? "everyday customers"}.`,
      hook: "Fast support matters more when the message is honest.",
      themeLabel: "trust-led promotion",
    },
    {
      title: `Turn ${trend?.topic ?? "current money pressure"} into a campaign angle`,
      idea: `Link a live conversation to ${profile.companyName}'s products with a calm, local, and useful point of view.`,
      hook: trend
        ? `People are already talking about ${trend.topic.toLowerCase()}.`
        : "The strongest campaigns start with the conversations people are already having.",
      themeLabel: trend?.topic ?? "campaign opportunity",
    },
    {
      title: `Promote ${offers[0]?.name ?? "an active offer"} with a stronger hook`,
      idea: `Frame the offer around ${goals[0]?.title.toLowerCase() ?? "current business priorities"} and highlight a clear next step.`,
      hook: offers[0]
        ? `${offers[0].name} should feel timely, not generic.`
        : "Promotions work best when they solve a visible problem.",
      themeLabel: offers[0]?.name ?? "offer-led campaign",
    },
    {
      title: `Start a question-led engagement post`,
      idea: `Ask a grounded question that helps ${audience?.name ?? "customers"} talk about budgeting, business cash flow, or planning for the month.`,
      hook: "A strong question can open the right conversation faster than a sales pitch.",
      themeLabel: "engagement-led awareness",
    },
  ];

  return baseAngles.slice(0, input.numberOfIdeas).map((idea, index) => ({
    title: idea.title,
    idea: `${idea.idea} Tone should stay ${input.tone.toLowerCase()} and ${input.channel.toLowerCase()} friendly.`,
    hook: idea.hook,
    cta:
      product?.callToAction ??
      "Invite the audience to message Sika Prime Loans for clear, responsible support.",
    rationale:
      index === 0
        ? `Aligned to the objective "${input.objective}" and backed by current business context.`
        : `Combines the objective, current goals, and trend-aware brand positioning.`,
    themeLabel: idea.themeLabel,
  }));
}
