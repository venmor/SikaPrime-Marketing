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

import {
  getContentLaneLabel,
  type AssistantOpportunity,
  type ContentBalanceSnapshot,
  type ContentLane,
  type GenerationMode,
} from "@/lib/engines/content/strategy";
import { humanizeEnum } from "@/lib/utils";

export type GenerationContext = {
  profile: BusinessProfile;
  product: Product | null;
  audience: AudienceSegment | null;
  trend: TrendSignal | null;
  allProducts: Product[];
  allAudiences: AudienceSegment[];
  offers: Offer[];
  goals: StrategicGoal[];
  complianceRules: ComplianceRule[];
  guardrailTerms: GuardrailTerm[];
  balance: ContentBalanceSnapshot;
  proactiveOpportunities: AssistantOpportunity[];
  selectedOpportunity: AssistantOpportunity | null;
};

export function buildGenerationPrompt(input: {
  brief: string;
  title?: string | null;
  contentType: ContentType;
  tone: ContentTone;
  channel: PublishingChannel;
  generationMode: GenerationMode;
  contentLane?: ContentLane | null;
  context: GenerationContext;
}) {
  const {
    profile,
    product,
    audience,
    trend,
    allProducts,
    allAudiences,
    offers,
    goals,
    complianceRules,
    guardrailTerms,
    balance,
    proactiveOpportunities,
    selectedOpportunity,
  } =
    input.context;

  return `
You are the senior marketing copy system for Sika Prime Loans.
Generate one high-quality content draft for a Zambian loan business.
The system must stay useful even when there is no major trend, so you should be equally strong at proactive, seasonal, educational, trust-building, youth-centered, engagement-led, and campaign-support content.

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
- Generation mode: ${input.generationMode}
- Preferred content lane: ${input.contentLane ? getContentLaneLabel(input.contentLane) : "Auto-select the strongest lane"}
- Working title: ${input.title ?? "Create the best title"}
- Brief: ${input.brief}

Product context:
${product ? `- ${product.name}: ${product.description}\n- Benefits: ${product.keyBenefits}\n- CTA: ${product.callToAction}` : "- Use company-level context"}

Available products:
${allProducts.map((item) => `- ${item.name}: ${item.description}`).join("\n") || "- None"}

Audience context:
${audience ? `- ${audience.name}: ${audience.description}\n- Needs: ${audience.needs}\n- Pain points: ${audience.painPoints}\n- Preferred channels: ${audience.preferredChannels}` : "- Use broad audience fit"}

Available audience segments:
${allAudiences.map((item) => `- ${item.name}: ${item.needs}`).join("\n") || "- None"}

Trend context:
${trend ? `- ${trend.title}\n- Summary: ${trend.summary}\n- Region: ${humanizeEnum(trend.region)}\n- Topic: ${trend.topic}\n- Use it only if it improves relevance without sounding exploitative or forced.` : "- No specific trend selected. You must still create a strong, useful post from proactive brand and audience context."}

Selected proactive opportunity:
${selectedOpportunity ? `- ${selectedOpportunity.title}\n- Source: ${selectedOpportunity.source}\n- Summary: ${selectedOpportunity.summary}\n- Why now: ${selectedOpportunity.rationale}` : "- None selected. Use the best available proactive opportunity if no safe trend adds value."}

Current proactive opportunities:
${proactiveOpportunities
  .slice(0, 5)
  .map((opportunity) => `- ${opportunity.title} (${getContentLaneLabel(opportunity.lane)}): ${opportunity.summary}`)
  .join("\n") || "- None"}

Content balance guidance:
- Promotional share in recent content: ${Math.round(balance.promotionalShare * 100)}%
- Dominant lane: ${balance.dominantLane ? getContentLaneLabel(balance.dominantLane) : "No dominant lane yet"}
- Underused lanes: ${balance.missingLanes.length ? balance.missingLanes.map((lane) => getContentLaneLabel(lane)).join(", ") : "No major gaps"}
- Guidance: ${balance.guidance}

Write natural, persuasive, high-trust copy. Do not promise guaranteed approval. Keep the message respectful and clear.
If there is no good trend, lean into proactive value, occasion relevance, or content-balance needs rather than pretending a trend exists.
`.trim();
}

export function buildFallbackDraft(input: {
  title?: string | null;
  brief: string;
  contentType: ContentType;
  tone: ContentTone;
  channel: PublishingChannel;
  generationMode: GenerationMode;
  contentLane?: ContentLane | null;
  context: GenerationContext;
}) {
  const {
    profile,
    product,
    audience,
    trend,
    complianceRules,
    guardrailTerms,
    balance,
    selectedOpportunity,
  } =
    input.context;

  const lane = input.contentLane ?? selectedOpportunity?.lane ?? "PROMOTIONAL";

  const openerByLane: Record<ContentLane, Record<ContentTone, string>> = {
    PROMOTIONAL: {
      PROFESSIONAL:
        "The right financial support should be practical, respectful, and clearly explained.",
      PERSUASIVE:
        "When timing matters, the right support can help you stay in control.",
      YOUTHFUL:
        "Smart support should help you move forward without the drama.",
      LOCALIZED:
        "From month-end pressure to business restocking, real life needs practical help.",
    },
    EDUCATIONAL: {
      PROFESSIONAL:
        "Smart financial decisions start with clear information and steady planning.",
      PERSUASIVE:
        "The strongest money moves usually begin with understanding the options first.",
      YOUTHFUL:
        "Money confidence grows faster when the basics make sense.",
      LOCALIZED:
        "A little planning goes a long way when real-life pressure shows up.",
    },
    TRUST_BUILDING: {
      PROFESSIONAL:
        "Financial support feels stronger when the message is honest from the start.",
      PERSUASIVE:
        "People respond to speed even more when it comes with clarity and respect.",
      YOUTHFUL:
        "Trust matters most when money conversations feel stressful.",
      LOCALIZED:
        "In everyday life, clear terms and respectful service matter more than hype.",
    },
    YOUTH_EMPOWERMENT: {
      PROFESSIONAL:
        "Progress grows when ambition is matched with discipline and smart choices.",
      PERSUASIVE:
        "Big goals move faster when the plan behind them is practical.",
      YOUTHFUL:
        "Dreams hit different when hustle meets smart money habits.",
      LOCALIZED:
        "Young people need opportunities, structure, and support that respect the journey.",
    },
    VALUE_BASED: {
      PROFESSIONAL:
        "Strong brands show their values in the way they support real people.",
      PERSUASIVE:
        "The message lands better when people can feel the values behind it.",
      YOUTHFUL:
        "People trust brands that actually stand for something useful.",
      LOCALIZED:
        "Respect, clarity, and practical support should show up in every message.",
    },
    ENGAGEMENT: {
      PROFESSIONAL:
        "Good conversations often begin with a practical question.",
      PERSUASIVE:
        "A relatable question can open a stronger connection than a hard pitch.",
      YOUTHFUL:
        "Sometimes the best post starts by asking people what real life looks like.",
      LOCALIZED:
        "When everyday money pressure is real, people have plenty to say about it.",
    },
    SEASONAL: {
      PROFESSIONAL:
        "The strongest seasonal content connects the moment to something genuinely useful.",
      PERSUASIVE:
        "Timing matters most when the message fits what people are already preparing for.",
      YOUTHFUL:
        "The season changes, and the message should feel just as timely.",
      LOCALIZED:
        "Some seasons come with pressure, planning, and opportunities that deserve useful guidance.",
    },
    CAMPAIGN_SUPPORT: {
      PROFESSIONAL:
        "Campaigns perform better when the supporting message adds context, not just urgency.",
      PERSUASIVE:
        "A good follow-up angle keeps a campaign visible without repeating the same pitch.",
      YOUTHFUL:
        "The follow-up matters when you want people to stay interested, not scroll past.",
      LOCALIZED:
        "A strong campaign should feel fresh across multiple posts, not copied and pasted.",
    },
    COMMUNITY: {
      PROFESSIONAL:
        "Community-centered content works best when it respects real people and shared progress.",
      PERSUASIVE:
        "Brand visibility grows stronger when the message gives social value as well as marketing value.",
      YOUTHFUL:
        "People connect faster when the message feels human and socially aware.",
      LOCALIZED:
        "Community matters when everyday progress is built together.",
    },
    INSPIRATIONAL: {
      PROFESSIONAL:
        "Encouraging content works best when it stays grounded in practical progress.",
      PERSUASIVE:
        "The right encouragement can move people toward better decisions without pressure.",
      YOUTHFUL:
        "Growth looks better when confidence meets discipline.",
      LOCALIZED:
        "Life moves in stages, and steady progress deserves to be celebrated.",
    },
  };

  const title =
    input.title?.trim() ||
    selectedOpportunity?.title ||
    `${product?.name ?? profile.companyName} ${humanizeEnum(input.contentType)}`;

  const copy = [
    openerByLane[lane][input.tone],
    selectedOpportunity?.summary,
    product?.description ?? profile.valueProposition,
    audience
      ? `${audience.name} can benefit from messaging built around ${audience.needs.toLowerCase()}.`
      : "The message should stay broad enough for everyday financial realities.",
    trend
      ? `Right now, interest is growing around ${trend.topic.toLowerCase()}, making this a timely conversation to join.`
      : selectedOpportunity
        ? `This is a proactive moment to lead with ${getContentLaneLabel(selectedOpportunity.lane).toLowerCase()} content instead of waiting for a trend.`
        : "Use a calm, trust-led angle that feels useful rather than pushy.",
    balance.promotionalShare >= 0.55
      ? "The next post should soften the mix with more value and usefulness than direct selling."
      : "Keep the tone useful, relevant, and active so the page does not go quiet between campaigns.",
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
      selectedOpportunity
        ? `#${selectedOpportunity.title.replace(/[^a-z0-9]+/gi, "")}`
        : `#${getContentLaneLabel(lane).replace(/[^a-z0-9]+/gi, "")}`,
      input.channel === "WHATSAPP" ? "#WhatsAppReady" : "#FacebookMarketing",
    ],
    rationale:
      "Fallback generation used company context, selected product and audience data, proactive content opportunities, and current workflow settings.",
    complianceChecklist: complianceRules
      .slice(0, 3)
      .map((rule) => `${rule.title}: ${rule.guidance}`),
    guardrailChecklist: guardrailTerms
      .slice(0, 3)
      .map((term) => `${term.phrase}: ${term.explanation}`),
    themeLabel:
      selectedOpportunity?.title ??
      trend?.topic ??
      getContentLaneLabel(lane) ??
      product?.category ??
      "trust-led promotion",
  };
}

export function buildIdeaPrompt(input: {
  objective: string;
  channel: PublishingChannel;
  tone: ContentTone;
  numberOfIdeas: number;
  generationMode: GenerationMode;
  contentLane?: ContentLane | null;
  context: GenerationContext;
}) {
  const {
    profile,
    product,
    audience,
    trend,
    allProducts,
    allAudiences,
    offers,
    goals,
    complianceRules,
    guardrailTerms,
    balance,
    proactiveOpportunities,
    selectedOpportunity,
  } = input.context;

  return `
You are the strategic content ideation engine for Sika Prime Loans.
Generate ${input.numberOfIdeas} distinct marketing ideas.
The system must stay active even when no viral trend is available, so you should combine proactive content, safe trend adaptation, and content-balance awareness.

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
- Generation mode: ${input.generationMode}
- Preferred lane: ${input.contentLane ? getContentLaneLabel(input.contentLane) : "Auto-select the strongest lane"}

Priority goals:
${goals.map((goal) => `- ${goal.title}: ${goal.description}`).join("\n")}

Active offers:
${offers.map((offer) => `- ${offer.name}: ${offer.description}`).join("\n") || "- None"}

Product context:
${product ? `- ${product.name}: ${product.description}\n- Benefits: ${product.keyBenefits}` : "- Use general brand and product mix context"}

Available products:
${allProducts.map((item) => `- ${item.name}: ${item.description}`).join("\n") || "- None"}

Audience context:
${audience ? `- ${audience.name}: ${audience.description}\n- Needs: ${audience.needs}\n- Pain points: ${audience.painPoints}` : "- Use broad audience fit"}

Available audiences:
${allAudiences.map((item) => `- ${item.name}: ${item.needs}`).join("\n") || "- None"}

Trend context:
${trend ? `- ${trend.title}\n- Topic: ${trend.topic}\n- Summary: ${trend.summary}\n- Adapt only if it is safe, useful, and brand-aligned.` : "- No specific trend selected. You must still return strong ideas."}

Selected proactive opportunity:
${selectedOpportunity ? `- ${selectedOpportunity.title}: ${selectedOpportunity.summary}` : "- None selected"}

Current proactive opportunities:
${proactiveOpportunities
  .slice(0, 6)
  .map((opportunity) => `- ${opportunity.title} (${getContentLaneLabel(opportunity.lane)}): ${opportunity.summary}`)
  .join("\n") || "- None"}

Content balance guidance:
- Promotional share in recent content: ${Math.round(balance.promotionalShare * 100)}%
- Guidance: ${balance.guidance}
- Recommended lanes next: ${balance.recommendedLanes.length ? balance.recommendedLanes.map((lane) => getContentLaneLabel(lane)).join(", ") : "No major rebalance needed"}

Compliance rules:
${complianceRules.map((rule) => `- ${rule.ruleText}`).join("\n")}

Guardrails:
${guardrailTerms.map((term) => `- Avoid or carefully review: ${term.phrase} (${term.explanation})`).join("\n") || "- None"}

Generate ideas that are practical, brand-safe, and easy to convert into drafts.
Do not make every idea promotional. Mix education, trust, youth or community value, and seasonal relevance when appropriate.
`.trim();
}

export function buildFallbackIdeas(input: {
  objective: string;
  channel: PublishingChannel;
  tone: ContentTone;
  numberOfIdeas: number;
  generationMode: GenerationMode;
  contentLane?: ContentLane | null;
  context: GenerationContext;
}) {
  const {
    profile,
    product,
    audience,
    trend,
    offers,
    goals,
    balance,
    proactiveOpportunities,
    selectedOpportunity,
  } = input.context;

  const lane = input.contentLane ?? selectedOpportunity?.lane ?? "PROMOTIONAL";

  const baseAngles = [
    {
      title:
        lane === "EDUCATIONAL"
          ? `Teach a practical money habit for ${audience?.name ?? "everyday customers"}`
          : `Explain the practical side of ${product?.name ?? "responsible borrowing"}`,
      idea:
        lane === "EDUCATIONAL"
          ? `Create an educational piece on budgeting, planning, and responsible borrowing for ${audience?.name ?? "everyday customers"} without sounding preachy.`
          : `Create an educational piece that breaks down how ${product?.name ?? profile.companyName} helps with real cash-flow pressure without sounding pushy.`,
      hook: "Before you borrow, make sure the support actually fits the moment.",
      themeLabel: selectedOpportunity?.title ?? trend?.topic ?? "financial education",
    },
    {
      title:
        lane === "TRUST_BUILDING"
          ? "Build a trust-first clarity post"
          : `Build trust around ${product?.name ?? "clear loan guidance"}`,
      idea: `Show how ${profile.companyName} keeps the process respectful, transparent, and subject to review for ${audience?.name ?? "everyday customers"}.`,
      hook: "Fast support matters more when the message is honest.",
      themeLabel: "trust-led promotion",
    },
    {
      title:
        selectedOpportunity?.title ??
        `Turn ${trend?.topic ?? "current money pressure"} into a campaign angle`,
      idea:
        selectedOpportunity?.summary ??
        `Link a live conversation to ${profile.companyName}'s products with a calm, local, and useful point of view.`,
      hook: trend
        ? `People are already talking about ${trend.topic.toLowerCase()}.`
        : selectedOpportunity
          ? "You do not need a viral trend when the calendar and audience moment are already strong."
          : "The strongest campaigns start with the conversations people are already having.",
      themeLabel: selectedOpportunity?.title ?? trend?.topic ?? "campaign opportunity",
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
      idea: `Ask a grounded question that helps ${audience?.name ?? "customers"} talk about budgeting, business cash flow, or planning for the month. ${balance.promotionalShare >= 0.55 ? "Use this to soften a promotion-heavy content streak." : ""}`,
      hook: "A strong question can open the right conversation faster than a sales pitch.",
      themeLabel: "engagement-led awareness",
    },
    ...proactiveOpportunities.slice(0, 2).map((opportunity) => ({
      title: opportunity.title,
      idea: opportunity.summary,
      hook:
        opportunity.source === "OCCASION"
          ? "A timely occasion can carry a strong post even without a social trend."
          : "Always-on content keeps the brand useful between bigger campaigns.",
      themeLabel: opportunity.title,
    })),
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
        : `Combines the objective, current goals, proactive opportunities, and trend-aware brand positioning.`,
    themeLabel: idea.themeLabel,
  }));
}
