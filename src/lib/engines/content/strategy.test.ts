import { ContentType, PublishingChannel } from "@prisma/client";

import {
  buildAssistantOpportunities,
  summarizeContentBalance,
} from "@/lib/engines/content/strategy";

describe("content strategy assistant", () => {
  it("flags a promotion-heavy mix and recommends softer lanes", () => {
    const balance = summarizeContentBalance([
      {
        title: "Boost your business today",
        objective: "Promote Business Booster",
        themeLabel: "direct promotion",
        contentType: ContentType.PRODUCT_PROMOTION,
        channel: PublishingChannel.FACEBOOK,
      },
      {
        title: "Apply now",
        objective: "Direct ad",
        themeLabel: "conversion push",
        contentType: ContentType.AD_COPY,
        channel: PublishingChannel.FACEBOOK,
      },
      {
        title: "Fast support",
        objective: "Month-end sales push",
        themeLabel: "payday offer",
        contentType: ContentType.WHATSAPP_MESSAGE,
        channel: PublishingChannel.WHATSAPP,
      },
      {
        title: "Need help this week?",
        objective: "Product awareness",
        themeLabel: "sales push",
        contentType: ContentType.FACEBOOK_POST,
        channel: PublishingChannel.FACEBOOK,
      },
    ]);

    expect(balance.promotionalShare).toBeGreaterThan(0.55);
    expect(balance.recommendedLanes).toContain("EDUCATIONAL");
    expect(balance.recommendedLanes).toContain("TRUST_BUILDING");
  });

  it("builds proactive opportunities even without live trends", () => {
    const assistant = buildAssistantOpportunities({
      products: [
        {
          id: "prod-1",
          profileId: 1,
          slug: "salary-advance",
          name: "Salary Advance",
          category: "Consumer Loan",
          description: "Short-term support for salaried workers before payday.",
          keyBenefits: "Transport, rent, groceries, and emergency support.",
          eligibilityNotes: "Valid NRC and proof of income.",
          callToAction: "Talk to the team.",
          priority: 90,
          active: true,
        },
      ],
      audiences: [
        {
          id: "aud-1",
          profileId: 1,
          name: "Young professionals",
          description: "Young earners managing early career pressure.",
          painPoints: "Cash flow, rent, transport.",
          needs: "Discipline, guidance, and fast clarity.",
          preferredChannels: "Facebook, WhatsApp",
          messagingAngles: "growth, confidence, youth opportunity",
          priority: 90,
        },
      ],
      goals: [
        {
          id: "goal-1",
          profileId: 1,
          title: "Stay consistently visible",
          description: "Keep the page active and useful.",
          priority: 90,
          active: true,
        },
      ],
      offers: [],
      recentContent: [],
      now: new Date("2026-03-10T09:00:00.000Z"),
    });

    expect(assistant.opportunities.length).toBeGreaterThan(0);
    expect(
      assistant.occasionOpportunities.some((item) =>
        item.title.toLowerCase().includes("youth day"),
      ),
    ).toBe(true);
  });
});
