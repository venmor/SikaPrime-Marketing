import {
  ContentTone,
  ContentType,
  GuardrailType,
  PrismaClient,
  PublicationStatus,
  PublishingChannel,
  ReviewStatus,
  TrendLifecycle,
  TrendRegion,
  TrendStatus,
  UserRole,
  WorkflowStage,
} from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function daysFromNow(days: number, hour = 9) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function main() {
  await prisma.flyerConcept.deleteMany();
  await prisma.flyerProject.deleteMany();
  await prisma.brandAsset.deleteMany();
  await prisma.campaignTemplate.deleteMany();
  await prisma.integrationSetting.deleteMany();
  await prisma.performanceSnapshot.deleteMany();
  await prisma.publication.deleteMany();
  await prisma.contentReview.deleteMany();
  await prisma.rateLimitBucket.deleteMany();
  await prisma.authToken.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.contentItem.deleteMany();
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
  await prisma.user.deleteMany();

  const passwordHash = await hash("SikaPrime123!", 10);

  const [admin, strategist, creator, reviewer, analyst] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Chipo Banda",
        email: "admin@sikaprime.local",
        passwordHash,
        role: UserRole.ADMIN,
        jobTitle: "Marketing Lead",
        avatarSeed: "amber",
        passwordChangedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: "Thandiwe Phiri",
        email: "strategist@sikaprime.local",
        passwordHash,
        role: UserRole.STRATEGIST,
        jobTitle: "Growth Strategist",
        avatarSeed: "teal",
        passwordChangedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: "Mubanga Zulu",
        email: "creator@sikaprime.local",
        passwordHash,
        role: UserRole.CREATOR,
        jobTitle: "Content Creator",
        avatarSeed: "emerald",
        passwordChangedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: "Ruth Mumba",
        email: "reviewer@sikaprime.local",
        passwordHash,
        role: UserRole.REVIEWER,
        jobTitle: "Compliance Reviewer",
        avatarSeed: "rose",
        passwordChangedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: "Joseph Mwale",
        email: "analyst@sikaprime.local",
        passwordHash,
        role: UserRole.ANALYST,
        jobTitle: "Performance Analyst",
        avatarSeed: "slate",
        passwordChangedAt: new Date(),
      },
    }),
  ]);

  const profile = await prisma.businessProfile.create({
    data: {
      companyName: "Sika Prime Loans",
      brandPromise: "Fast, respectful lending support when cash flow gets tight.",
      mission:
        "Help Zambian households and growing businesses bridge urgent money gaps with clarity, speed, and trust.",
      valueProposition:
        "Responsive short-term loans, transparent terms, and marketing that educates before it persuades.",
      toneSummary:
        "Professional, reassuring, plain-language, and locally aware. Avoid hype and overpromising.",
      primaryGoal:
        "Increase qualified Facebook and WhatsApp leads for priority loan products while strengthening public trust.",
      coreNarrative:
        "Sika Prime is the practical money partner for responsible borrowing, business continuity, school needs, and short-term emergencies.",
      complianceSummary:
        "Do not guarantee approval, avoid misleading urgency, include affordability language, and respect privacy.",
      heroMessage:
        "When life moves fast, your marketing should move faster without losing trust.",
      values: {
        create: [
          {
            name: "Trust first",
            description: "Every message should feel safe, honest, and respectful.",
          },
          {
            name: "Speed with clarity",
            description:
              "Fast service matters, but only when terms are easy to understand.",
          },
          {
            name: "Local relevance",
            description:
              "Content should reflect real Zambian financial moments and seasons.",
          },
          {
            name: "Responsible growth",
            description:
              "Promote borrowing as a useful tool, not a lifestyle shortcut.",
          },
        ],
      },
      products: {
        create: [
          {
            slug: "salary-advance",
            name: "Salary Advance",
            category: "Consumer Loan",
            description: "Short-term support for salaried workers before payday.",
            keyBenefits:
              "Fast application, predictable repayment window, support for rent, transport, groceries, and bills.",
            eligibilityNotes:
              "Salaried workers with valid identification and proof of income.",
            callToAction:
              "Apply today and speak to our team about the right amount for your budget.",
            priority: 90,
          },
          {
            slug: "business-booster",
            name: "Business Booster Loan",
            category: "SME Loan",
            description:
              "Working capital support for traders, shop owners, and small businesses.",
            keyBenefits:
              "Helps restock inventory, manage seasonal demand, and keep business moving.",
            eligibilityNotes:
              "For active businesses with a clear repayment plan and basic trading history.",
            callToAction:
              "Talk to us about restocking, expansion, or short-term business cash flow.",
            priority: 85,
          },
          {
            slug: "school-fees-bridge",
            name: "School Fees Bridge",
            category: "Family Support",
            description:
              "A focused loan option for urgent school-related expenses.",
            keyBenefits:
              "Supports fees, uniforms, transport, and term-start readiness.",
            eligibilityNotes:
              "Subject to review, affordability, and documentation checks.",
            callToAction:
              "Stay prepared for the school term with a responsible finance plan.",
            priority: 70,
          },
        ],
      },
      audienceSegments: {
        create: [
          {
            name: "Urban salaried professionals",
            description:
              "Monthly earners managing family, rent, and transport costs.",
            painPoints:
              "Month-end cash gaps, emergency bills, medical costs, and school expenses.",
            needs:
              "Quick access, clear repayment expectations, and a lender they can trust.",
            preferredChannels: "Facebook, WhatsApp",
            messagingAngles:
              "Stability, professionalism, convenience, and respect for privacy.",
            priority: 90,
          },
          {
            name: "SME owners and traders",
            description:
              "Business operators who need stock, cash flow, or continuity support.",
            painPoints:
              "Inventory pressure, supplier payments, and seasonal demand spikes.",
            needs:
              "Fast working capital and communication that understands day-to-day hustle.",
            preferredChannels: "Facebook, WhatsApp",
            messagingAngles:
              "Momentum, growth, resilience, and business continuity.",
            priority: 85,
          },
          {
            name: "Parents and caregivers",
            description:
              "Families planning for school terms and urgent household expenses.",
            painPoints:
              "Back-to-school deadlines, uniforms, transport, and surprise fees.",
            needs:
              "Supportive messaging, practical budgeting guidance, and low-drama communication.",
            preferredChannels: "Facebook, WhatsApp",
            messagingAngles:
              "Preparedness, dignity, family care, and calm decision making.",
            priority: 75,
          },
        ],
      },
      complianceRules: {
        create: [
          {
            title: "No guaranteed approval claims",
            ruleText: "Never promise that every applicant will be approved.",
            guidance:
              "Use language like 'subject to review' or 'eligibility checks apply'.",
            severity: "High",
          },
          {
            title: "Promote responsible borrowing",
            ruleText:
              "Avoid language that encourages careless or emotional borrowing.",
            guidance:
              "Frame loans as planned financial support, not instant lifestyle upgrades.",
            severity: "High",
          },
          {
            title: "Keep terms transparent",
            ruleText:
              "When talking about speed or convenience, balance it with clarity and affordability.",
            guidance:
              "Use simple explanations and encourage customers to ask questions.",
            severity: "Medium",
          },
        ],
      },
      guardrailTerms: {
        create: [
          {
            phrase: "Guaranteed approval",
            explanation:
              "This is misleading. Replace it with language that makes eligibility and review clear.",
            type: GuardrailType.MISLEADING_CLAIM,
            severity: "High",
          },
          {
            phrase: "Instant cash no questions asked",
            explanation:
              "This undermines responsible lending and should never appear in marketing copy.",
            type: GuardrailType.PROHIBITED_WORD,
            severity: "High",
          },
          {
            phrase: "Urgent borrow now",
            explanation:
              "This phrase should trigger a human check so urgency does not become pressure.",
            type: GuardrailType.REVIEW_TRIGGER,
            severity: "Medium",
          },
        ],
      },
      offers: {
        create: [
          {
            name: "Back-to-School Readiness Push",
            description:
              "Promote calm, practical support for parents preparing school fees and supplies.",
            callToAction:
              "Plan ahead and speak to our team about responsible school-term support.",
            startDate: daysFromNow(-12),
            endDate: daysFromNow(21),
            active: true,
            priority: 88,
          },
          {
            name: "SME Restock Momentum",
            description:
              "Target traders and small businesses needing short-term working capital.",
            callToAction:
              "Keep your shelves moving with a business-focused cash flow plan.",
            startDate: daysFromNow(-5),
            endDate: daysFromNow(30),
            active: true,
            priority: 84,
          },
        ],
      },
      goals: {
        create: [
          {
            title: "Lift qualified Facebook leads",
            description:
              "Increase lead quality from high-intent loan messaging instead of broad awareness only.",
            priority: 92,
          },
          {
            title: "Build trust with educational content",
            description:
              "Improve credibility through budgeting tips, borrowing guidance, and transparent language.",
            priority: 86,
          },
          {
            title: "Support WhatsApp conversion",
            description:
              "Create short, shareable content that can move prospects into conversations quickly.",
            priority: 80,
          },
        ],
      },
    },
  });

  await prisma.campaignTemplate.createMany({
    data: [
      {
        slug: "school-fees-support",
        title: "School fees support sequence",
        summary: "A repeatable flyer and caption sequence for term-start household pressure.",
        objective: "Promote practical, responsible support around school-related expenses.",
        triggerTags: "school fees, uniforms, term start, caregiver planning",
        sequenceSteps:
          "1. Awareness flyer about term-start pressure. 2. Educational post on planning. 3. Product-led support flyer with clear CTA.",
        priority: 90,
      },
      {
        slug: "month-end-relief",
        title: "Month-end cash flow sequence",
        summary: "A softer, trust-first sequence for salary-gap and transport pressure.",
        objective: "Keep Sika Prime relevant during recurring month-end money stress.",
        triggerTags: "month-end, salary gap, rent, transport, groceries",
        sequenceSteps:
          "1. Relatable month-end flyer. 2. Responsible borrowing explainer. 3. Offer-led conversion flyer with CTA.",
        priority: 85,
      },
      {
        slug: "sme-restock",
        title: "SME restock sequence",
        summary: "A business momentum sequence for traders and small business owners.",
        objective: "Promote working-capital support for restocking and seasonal demand.",
        triggerTags: "restock, stock pressure, traders, shop owners, working capital",
        sequenceSteps:
          "1. Business pain-point flyer. 2. Cash-flow education post. 3. Product promotion flyer for restocking.",
        priority: 88,
      },
    ],
  });

  await prisma.integrationSetting.createMany({
    data: [
      {
        key: "openai.api_key",
        label: "OpenAI API key",
        groupLabel: "AI generation",
        helpText:
          "Stored fallback API key for text and image generation when no environment variable override is preferred.",
        value: "",
        isSecret: true,
      },
      {
        key: "openai.text_model",
        label: "OpenAI text model",
        groupLabel: "AI generation",
        helpText: "Model used for captions, idea packs, and flyer concept copy.",
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
        value: "",
      },
      {
        key: "facebook.page_access_token",
        label: "Facebook page access token",
        groupLabel: "Publishing",
        helpText: "Token used to publish posts and upload flyer images to Facebook.",
        value: "",
        isSecret: true,
      },
      {
        key: "whatsapp.phone_number_id",
        label: "WhatsApp phone number ID",
        groupLabel: "Publishing",
        helpText: "WhatsApp Business phone number ID used for direct delivery.",
        value: "",
      },
      {
        key: "whatsapp.access_token",
        label: "WhatsApp access token",
        groupLabel: "Publishing",
        helpText: "Token used for WhatsApp Business Cloud API delivery.",
        value: "",
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
          "RSS or JSON feed endpoint for Google Trends-style signals. JSON should expose an array or { items: [] } with title, summary, url, and publishedAt.",
        value: "",
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
        value: "",
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
        value: "",
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
        value: "",
      },
      {
        key: "social.monitoring_enabled",
        label: "Approved monitoring feed",
        groupLabel: "Social listening",
        helpText: "Enable the generic monitoring feed for approved social-listening providers.",
        value: "false",
      },
      {
        key: "social.monitoring_webhook",
        label: "Social monitoring webhook",
        groupLabel: "Social listening",
        helpText:
          "Optional JSON or RSS provider endpoint for approved social listening tools. JSON should expose title, summary, url, and publishedAt.",
        value: "",
      },
    ],
  });

  const products = await prisma.product.findMany({ orderBy: { priority: "desc" } });
  const audiences = await prisma.audienceSegment.findMany({
    orderBy: { priority: "desc" },
  });

  const [localSchoolTrend, localBusinessTrend, globalPlanningTrend, saturatedTrustTrend] =
    await Promise.all([
      prisma.trendSignal.create({
        data: {
          title:
            "Back-to-school budgeting conversations are rising in Lusaka and Copperbelt",
          summary:
            "Parents and caregivers are actively discussing school fees, uniforms, and household budgeting pressure.",
          sourceName: "Lusaka Times",
          sourceUrl: "https://www.lusakatimes.com/feed/",
          region: TrendRegion.LOCAL,
          topic: "Family finance",
          keywords: "school fees, budgeting, household planning",
          publishedAt: daysFromNow(-2, 8),
          relevanceScore: 88,
          freshnessScore: 91,
          brandFitScore: 94,
          totalScore: 91,
          status: TrendStatus.RISING,
          lifecycle: TrendLifecycle.ACTIVE,
        },
      }),
      prisma.trendSignal.create({
        data: {
          title:
            "Small business cash-flow resilience stories are getting more attention",
          summary:
            "Local stories about trading pressure, restocking, and business continuity are performing well.",
          sourceName: "Diggers News",
          sourceUrl: "https://diggers.news/feed/",
          region: TrendRegion.LOCAL,
          topic: "SME growth",
          keywords: "small business, cash flow, restocking",
          publishedAt: daysFromNow(-1, 10),
          relevanceScore: 85,
          freshnessScore: 95,
          brandFitScore: 90,
          totalScore: 90,
          status: TrendStatus.RISING,
          lifecycle: TrendLifecycle.EMERGING,
        },
      }),
      prisma.trendSignal.create({
        data: {
          title:
            "Global personal-finance content is leaning toward calm financial planning",
          summary:
            "High-performing finance content is focusing on education, control, and smart decision making.",
          sourceName: "BBC Business",
          sourceUrl: "https://feeds.bbci.co.uk/news/business/rss.xml",
          region: TrendRegion.GLOBAL,
          topic: "Personal finance education",
          keywords: "financial planning, responsible borrowing, budgeting",
          publishedAt: daysFromNow(-3, 7),
          relevanceScore: 81,
          freshnessScore: 87,
          brandFitScore: 89,
          totalScore: 86,
          status: TrendStatus.RISING,
          lifecycle: TrendLifecycle.ACTIVE,
        },
      }),
      prisma.trendSignal.create({
        data: {
          title: "Fintech trust signals remain a familiar hook",
          summary:
            "International finance brands are still using convenience-plus-proof messaging, but the angle is beginning to saturate.",
          sourceName: "BBC Technology",
          sourceUrl: "https://feeds.bbci.co.uk/news/technology/rss.xml",
          region: TrendRegion.GLOBAL,
          topic: "Fintech trust",
          keywords: "fintech, credibility, proof points",
          publishedAt: daysFromNow(-6, 6),
          relevanceScore: 74,
          freshnessScore: 68,
          brandFitScore: 86,
          totalScore: 76,
          status: TrendStatus.WATCH,
          lifecycle: TrendLifecycle.SATURATED,
        },
      }),
    ]);

  const ideaContent = await prisma.contentItem.create({
    data: {
      title: "School-term planning mini campaign",
      brief:
        "Generate a calm campaign idea for parents who need help planning school fees, uniforms, transport, and term-start costs.",
      objective:
        "Build trust with parents while introducing the School Fees Bridge product responsibly.",
      campaignLabel: "School readiness sequence",
      contentType: ContentType.CAMPAIGN_IDEA,
      tone: ContentTone.PROFESSIONAL,
      channel: PublishingChannel.FACEBOOK,
      stage: WorkflowStage.IDEA,
      draft:
        "Hook: School planning feels easier when the money conversation is calm.\n\nConcept: A three-part trust sequence with budgeting tips, transparent support language, and a practical CTA for parents preparing for the next term.",
      callToAction: "Ask us about responsible school-term support.",
      aiModel: "seeded-template",
      aiSummary:
        "Idea batch winner focused on trust, preparedness, and school-fees pressure.",
      themeLabel: "family preparedness",
      ownerId: strategist.id,
      reviewerId: reviewer.id,
      trendId: localSchoolTrend.id,
      productId: products[2]?.id,
      audienceSegmentId: audiences[2]?.id,
    },
  });

  const draftContent = await prisma.contentItem.create({
    data: {
      title: "Month-end does not have to mean panic",
      brief:
        "Create a calm Facebook post for salaried workers who need a practical salary advance option.",
      objective: "Drive qualified salary advance conversations before payday.",
      campaignLabel: "Month-end support",
      contentType: ContentType.FACEBOOK_POST,
      tone: ContentTone.PROFESSIONAL,
      channel: PublishingChannel.FACEBOOK,
      stage: WorkflowStage.DRAFT,
      draft:
        "When month-end pressure shows up before payday, breathing room matters. Sika Prime Loans offers salary advance support designed for real-life bills, transport, groceries, and urgent needs. Our team keeps the process clear and respectful so you can make a confident decision.",
      callToAction:
        "Send us a message to learn what support may fit your situation.",
      hashtags: "#SikaPrimeLoans #SalaryAdvance #SmartBorrowing",
      assetReference: "salary-advance-card-v1",
      notes: "Keep the headline calm and avoid urgency pressure.",
      aiModel: "seeded-template",
      aiSummary:
        "Trust-led salary advance message anchored in transparency and everyday needs.",
      themeLabel: "salary relief",
      ownerId: creator.id,
      reviewerId: reviewer.id,
      trendId: globalPlanningTrend.id,
      productId: products[0]?.id,
      audienceSegmentId: audiences[0]?.id,
    },
  });

  const revisionContent = await prisma.contentItem.create({
    data: {
      title: "Restock with confidence this week",
      brief:
        "WhatsApp-ready promotion for market traders who need short-term stock support without risky overpromising.",
      objective:
        "Increase WhatsApp conversations for Business Booster while keeping the message compliant.",
      campaignLabel: "April restock push",
      distributionTarget: "260977000001",
      contentType: ContentType.WHATSAPP_MESSAGE,
      tone: ContentTone.LOCALIZED,
      channel: PublishingChannel.WHATSAPP,
      stage: WorkflowStage.NEEDS_REVISION,
      draft:
        "Business is easier to grow when your shelves stay ready. If cash flow is slowing your next restock, Sika Prime Loans can help you plan for short-term support that keeps momentum alive.",
      callToAction: "Reply with RESTOCK to start the conversation.",
      hashtags: "#BusinessBooster #SikaPrimeLoans #SMEGrowth",
      assetReference: "restock-flyer-concept",
      notes:
        "Add affordability language and make the WhatsApp CTA feel more conversational.",
      aiModel: "seeded-template",
      aiSummary: "Localized SME cash flow message with strong WhatsApp CTA.",
      themeLabel: "business continuity",
      revisionCount: 1,
      ownerId: strategist.id,
      reviewerId: reviewer.id,
      trendId: localBusinessTrend.id,
      productId: products[1]?.id,
      audienceSegmentId: audiences[1]?.id,
    },
  });

  const reviewContent = await prisma.contentItem.create({
    data: {
      title: "Transparent lending starts with good questions",
      brief:
        "Trust-building Facebook copy that explains why review and affordability checks protect customers.",
      objective:
        "Strengthen trust by making the loan review process feel responsible and respectful.",
      campaignLabel: "Trust and transparency",
      contentType: ContentType.TRUST_BUILDING,
      tone: ContentTone.PROFESSIONAL,
      channel: PublishingChannel.FACEBOOK,
      stage: WorkflowStage.IN_REVIEW,
      draft:
        "A good lender should never rush you into a decision. At Sika Prime Loans, we believe questions, clarity, and affordability checks are part of respectful service. They help you understand what support fits and what repayment should realistically look like.",
      callToAction: "Talk to our team about your options and ask every question you need.",
      hashtags: "#TrustedSupport #SikaPrimeLoans #ResponsibleBorrowing",
      assetReference: "trust-carousel-v2",
      aiModel: "seeded-template",
      aiSummary: "Trust-building copy designed to counter pressure-based lending narratives.",
      themeLabel: "transparent lending",
      ownerId: creator.id,
      reviewerId: reviewer.id,
      trendId: globalPlanningTrend.id,
      productId: products[0]?.id,
      audienceSegmentId: audiences[0]?.id,
    },
  });

  const approvedContent = await prisma.contentItem.create({
    data: {
      title: "School term planning made easier",
      brief:
        "Educational trust-building post for parents preparing school fees and term expenses.",
      objective:
        "Educate parents and create gentle product awareness around school-term planning.",
      campaignLabel: "School readiness sequence",
      contentType: ContentType.EDUCATIONAL,
      tone: ContentTone.PROFESSIONAL,
      channel: PublishingChannel.FACEBOOK,
      stage: WorkflowStage.APPROVED,
      draft:
        "A new school term can arrive with a long list of costs. One practical way to stay calm is to plan early, list the essentials, and ask questions before taking financial support. At Sika Prime Loans, we believe helpful lending starts with clear information and realistic repayment planning.",
      finalCopy:
        "School planning gets easier when the financial conversation is clear. From fees to transport and uniforms, Sika Prime Loans supports families with respectful, transparent guidance and loan options subject to review. Ask us about responsible support for the school term ahead.",
      callToAction: "Chat with our team about school-term planning support.",
      hashtags: "#SchoolFeesBridge #SikaPrimeLoans #FamilyFinance",
      assetReference: "school-planning-checklist",
      aiModel: "seeded-template",
      aiSummary: "Educational trust content linked to school-fees demand.",
      themeLabel: "family preparedness",
      ownerId: creator.id,
      reviewerId: reviewer.id,
      trendId: localSchoolTrend.id,
      productId: products[2]?.id,
      audienceSegmentId: audiences[2]?.id,
    },
  });

  const scheduledContent = await prisma.contentItem.create({
    data: {
      title: "Choose clarity before payday pressure builds",
      brief:
        "Short performance-tested Facebook caption for salary advance lead generation.",
      objective: "Generate high-intent Facebook leads for Salary Advance.",
      campaignLabel: "Month-end support",
      contentType: ContentType.CAPTION,
      tone: ContentTone.PERSUASIVE,
      channel: PublishingChannel.FACEBOOK,
      stage: WorkflowStage.SCHEDULED,
      draft:
        "Need breathing room before payday? Choose a team that explains the process clearly and treats your situation with respect.",
      finalCopy:
        "Before payday pressure builds, get support from a team that values speed, clarity, and dignity. Salary advance options are available subject to review. Message Sika Prime Loans to learn more.",
      callToAction: "Message us today.",
      hashtags: "#SalaryAdvance #TrustedSupport #SikaPrimeLoans",
      assetReference: "salary-advance-caption-v3",
      aiModel: "seeded-template",
      aiSummary:
        "Short-form lead generation caption shaped by past high engagement.",
      themeLabel: "salary relief",
      scheduledFor: daysFromNow(2, 9),
      ownerId: creator.id,
      reviewerId: reviewer.id,
      trendId: saturatedTrustTrend.id,
      productId: products[0]?.id,
      audienceSegmentId: audiences[0]?.id,
    },
  });

  const publishedContent = await prisma.contentItem.create({
    data: {
      title: "Keep your business moving",
      brief:
        "Published Facebook promotion for small business working-capital support.",
      objective: "Drive qualified SME loan leads through continuity-focused copy.",
      campaignLabel: "April restock push",
      contentType: ContentType.PRODUCT_PROMOTION,
      tone: ContentTone.LOCALIZED,
      channel: PublishingChannel.FACEBOOK,
      stage: WorkflowStage.PUBLISHED,
      draft:
        "A business that keeps moving needs timely support. Sika Prime Loans helps traders and SMEs plan for stock, supplier pressure, and short-term business needs.",
      finalCopy:
        "When customers are ready, your business should be ready too. Sika Prime Loans supports traders and SMEs with short-term funding plans for stock, continuity, and momentum. Subject to review and affordability checks.",
      callToAction: "Send a message to discuss your business needs.",
      hashtags: "#BusinessBooster #SMELoans #SikaPrimeLoans",
      assetReference: "business-booster-static-1",
      aiModel: "seeded-template",
      aiSummary: "Published winner built around business continuity.",
      themeLabel: "business continuity",
      publishedAt: daysFromNow(-2, 13),
      ownerId: strategist.id,
      reviewerId: reviewer.id,
      trendId: localBusinessTrend.id,
      productId: products[1]?.id,
      audienceSegmentId: audiences[1]?.id,
    },
  });

  const publishedWhatsAppContent = await prisma.contentItem.create({
    data: {
      title: "Stay ready for the school term",
      brief:
        "Published WhatsApp message for parents who need a calm school-fees support conversation.",
      objective:
        "Increase WhatsApp conversations for School Fees Bridge using warm, supportive language.",
      campaignLabel: "School readiness sequence",
      distributionTarget: "260977000002",
      contentType: ContentType.WHATSAPP_MESSAGE,
      tone: ContentTone.LOCALIZED,
      channel: PublishingChannel.WHATSAPP,
      stage: WorkflowStage.PUBLISHED,
      draft:
        "School costs can arrive all at once. If you need help planning for fees, uniforms, or transport, Sika Prime Loans is here to talk through a responsible option.",
      finalCopy:
        "School costs can arrive all at once. If you need support with fees, uniforms, or transport, Sika Prime Loans is ready to talk through a responsible option subject to review. Reply SCHOOL to start the conversation.",
      callToAction: "Reply SCHOOL to start the conversation.",
      hashtags: "#SchoolFeesBridge #SikaPrimeLoans",
      assetReference: "school-fees-flyer-v1",
      aiModel: "seeded-template",
      aiSummary:
        "WhatsApp-ready family support message with low-drama, trust-first wording.",
      themeLabel: "family preparedness",
      publishedAt: daysFromNow(-1, 18),
      ownerId: creator.id,
      reviewerId: reviewer.id,
      trendId: localSchoolTrend.id,
      productId: products[2]?.id,
      audienceSegmentId: audiences[2]?.id,
    },
  });

  const archivedContent = await prisma.contentItem.create({
    data: {
      title: "Old urgency-led trust post",
      brief:
        "Retired trust message archived because the angle became overused and no longer fits the current calendar.",
      objective: "Archive a stale message that should no longer be reused without a rewrite.",
      campaignLabel: "Retired trust sequence",
      contentType: ContentType.AD_COPY,
      tone: ContentTone.PERSUASIVE,
      channel: PublishingChannel.FACEBOOK,
      stage: WorkflowStage.ARCHIVED,
      draft:
        "Trust us for instant support and fast answers every time.",
      finalCopy:
        "Trust us for instant support and fast answers every time.",
      callToAction: "Message us now.",
      hashtags: "#OldCampaign",
      assetReference: "retired-trust-ad",
      notes: "Archived because the promise was too broad and the trend is saturated.",
      aiModel: "seeded-template",
      aiSummary: "Archived example for repository and audit-trail demonstrations.",
      themeLabel: "trust refresh",
      archivedAt: daysFromNow(-15, 12),
      ownerId: strategist.id,
      reviewerId: reviewer.id,
      trendId: saturatedTrustTrend.id,
      productId: products[0]?.id,
      audienceSegmentId: audiences[0]?.id,
    },
  });

  await prisma.contentReview.createMany({
    data: [
      {
        contentItemId: revisionContent.id,
        reviewerId: reviewer.id,
        status: ReviewStatus.COMMENTED,
        notes: "Add affordability language and soften the urgency.",
      },
      {
        contentItemId: reviewContent.id,
        reviewerId: reviewer.id,
        status: ReviewStatus.REQUESTED,
        notes: "Looks strong. Double-check the CTA and keep approval language explicit.",
      },
      {
        contentItemId: approvedContent.id,
        reviewerId: reviewer.id,
        status: ReviewStatus.APPROVED,
        notes: "Approved. Clear, compliant, and useful.",
      },
    ],
  });

  const scheduledPublication = await prisma.publication.create({
    data: {
      contentItemId: scheduledContent.id,
      channel: PublishingChannel.FACEBOOK,
      status: PublicationStatus.SCHEDULED,
      caption: scheduledContent.finalCopy ?? scheduledContent.draft,
      payload: JSON.stringify({
        title: scheduledContent.title,
        hashtags: scheduledContent.hashtags,
      }),
      scheduledFor: scheduledContent.scheduledFor,
    },
  });

  const publishedPublication = await prisma.publication.create({
    data: {
      contentItemId: publishedContent.id,
      channel: PublishingChannel.FACEBOOK,
      status: PublicationStatus.PUBLISHED,
      caption: publishedContent.finalCopy ?? publishedContent.draft,
      publishUrl: "https://facebook.com/sikaprime/posts/demo-001",
      externalId: "demo-001",
      payload: JSON.stringify({
        title: publishedContent.title,
        hashtags: publishedContent.hashtags,
      }),
      publishedAt: publishedContent.publishedAt,
    },
  });

  const simulatedWhatsAppPublication = await prisma.publication.create({
    data: {
      contentItemId: publishedWhatsAppContent.id,
      channel: PublishingChannel.WHATSAPP,
      status: PublicationStatus.SIMULATED,
      caption: publishedWhatsAppContent.finalCopy ?? publishedWhatsAppContent.draft,
      externalId: "wa-demo-001",
      payload: JSON.stringify({
        title: publishedWhatsAppContent.title,
        hashtags: publishedWhatsAppContent.hashtags,
      }),
      publishedAt: publishedWhatsAppContent.publishedAt,
    },
  });

  await prisma.publication.create({
    data: {
      contentItemId: archivedContent.id,
      channel: PublishingChannel.FACEBOOK,
      status: PublicationStatus.FAILED,
      caption: archivedContent.finalCopy ?? archivedContent.draft,
      payload: JSON.stringify({
        title: archivedContent.title,
      }),
      errorMessage: "Meta token expired during an earlier test run.",
      scheduledFor: daysFromNow(-20, 15),
    },
  });

  await prisma.performanceSnapshot.createMany({
    data: [
      {
        publicationId: publishedPublication.id,
        capturedAt: daysFromNow(-2, 16),
        impressions: 12840,
        clicks: 652,
        leads: 44,
        comments: 27,
        shares: 19,
        saves: 14,
        conversions: 18,
        engagementRate: 5.54,
        themeLabel: "business continuity",
      },
      {
        publicationId: publishedPublication.id,
        capturedAt: daysFromNow(-1, 8),
        impressions: 13860,
        clicks: 714,
        leads: 49,
        comments: 31,
        shares: 22,
        saves: 18,
        conversions: 21,
        engagementRate: 5.92,
        themeLabel: "business continuity",
      },
      {
        publicationId: simulatedWhatsAppPublication.id,
        capturedAt: daysFromNow(-1, 20),
        impressions: 4620,
        clicks: 241,
        leads: 26,
        comments: 11,
        shares: 13,
        saves: 9,
        conversions: 12,
        engagementRate: 4.87,
        themeLabel: "family preparedness",
      },
      {
        publicationId: scheduledPublication.id,
        capturedAt: daysFromNow(0, 9),
        impressions: 0,
        clicks: 0,
        leads: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        conversions: 0,
        engagementRate: 0,
        themeLabel: "salary relief",
      },
    ],
  });

  await prisma.recommendation.createMany({
    data: [
      {
        title: "Create a Facebook carousel on school-term cost planning",
        rationale:
          "Local budgeting conversations are rising and family preparedness content already fits your trust-building goal.",
        contentType: ContentType.EDUCATIONAL,
        tone: ContentTone.PROFESSIONAL,
        channel: PublishingChannel.FACEBOOK,
        priorityScore: 92,
        basedOn:
          "Trend: back-to-school budgeting | Goal: trust-building | Product: School Fees Bridge",
      },
      {
        title: "Push a WhatsApp restock script for market traders",
        rationale:
          "Business continuity content has the strongest engagement pattern and matches a high-priority product.",
        contentType: ContentType.WHATSAPP_MESSAGE,
        tone: ContentTone.LOCALIZED,
        channel: PublishingChannel.WHATSAPP,
        priorityScore: 89,
        basedOn:
          "Performance: business continuity theme | Product: Business Booster Loan",
      },
      {
        title: "Produce a trust post about review and affordability checks",
        rationale:
          "Calm financial planning content is active and compliance-friendly transparency messaging strengthens brand fit.",
        contentType: ContentType.TRUST_BUILDING,
        tone: ContentTone.PROFESSIONAL,
        channel: PublishingChannel.FACEBOOK,
        priorityScore: 84,
        basedOn:
          "Trend: calm financial planning | Goal: stronger qualified leads | Compliance: no overpromising",
      },
    ],
  });

  await prisma.activityLog.createMany({
    data: [
      {
        actorId: admin.id,
        entityType: "business_profile",
        entityId: "1",
        action: "knowledge.profile_saved",
        summary: "Updated core business profile settings",
        createdAt: daysFromNow(-8, 9),
      },
      {
        actorId: admin.id,
        entityType: "guardrail_term",
        entityId: "Guaranteed approval",
        action: "knowledge.guardrail_saved",
        summary: 'Saved guardrail term "Guaranteed approval"',
        createdAt: daysFromNow(-8, 10),
      },
      {
        actorId: strategist.id,
        entityType: "trend_batch",
        entityId: localBusinessTrend.id,
        action: "trends.refreshed",
        summary: "Refreshed local and global trend signals",
        createdAt: daysFromNow(-2, 11),
      },
      {
        actorId: strategist.id,
        entityType: "idea_batch",
        entityId: ideaContent.id,
        action: "ideas.generated",
        summary:
          'Generated 4 ideas for "Build trust with parents while introducing the School Fees Bridge product responsibly."',
        createdAt: daysFromNow(-2, 12),
      },
      {
        actorId: creator.id,
        entityType: "content_item",
        entityId: draftContent.id,
        action: "content.generated",
        summary: `Generated draft "${draftContent.title}"`,
        details: draftContent.brief,
        createdAt: daysFromNow(-1, 9),
      },
      {
        actorId: reviewer.id,
        entityType: "content_item",
        entityId: revisionContent.id,
        action: "content.needs_revision",
        summary: `Marked "${revisionContent.title}" as needing revision`,
        details: "Add affordability language and soften urgency.",
        createdAt: daysFromNow(-1, 13),
      },
      {
        actorId: reviewer.id,
        entityType: "content_item",
        entityId: approvedContent.id,
        action: "content.approved",
        summary: `Approved "${approvedContent.title}" for scheduling or publishing`,
        createdAt: daysFromNow(-1, 15),
      },
      {
        actorId: strategist.id,
        entityType: "content_item",
        entityId: scheduledContent.id,
        action: "content.scheduled",
        summary: "Scheduled content for publishing",
        details: `${scheduledContent.scheduledFor?.toISOString()} via FACEBOOK`,
        createdAt: daysFromNow(0, 8),
      },
      {
        actorId: strategist.id,
        entityType: "content_item",
        entityId: publishedContent.id,
        action: "content.published",
        summary: `Published "${publishedContent.title}" to Facebook`,
        createdAt: daysFromNow(-2, 13),
      },
    ],
  });

  console.log(
    `Seeded Sika Prime workspace with users, profile ${profile.companyName}, trends, workflows, publications, and audit history.`,
  );

  console.log("Demo credentials:");
  console.log(`admin@sikaprime.local / SikaPrime123! (${admin.role})`);
  console.log(`strategist@sikaprime.local / SikaPrime123! (${strategist.role})`);
  console.log(`creator@sikaprime.local / SikaPrime123! (${creator.role})`);
  console.log(`reviewer@sikaprime.local / SikaPrime123! (${reviewer.role})`);
  console.log(`analyst@sikaprime.local / SikaPrime123! (${analyst.role})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
