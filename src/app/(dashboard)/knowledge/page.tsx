import { GuardrailType } from "@prisma/client";
import { redirect } from "next/navigation";

import { OpenAssistantButton } from "@/components/assistant/open-assistant-button";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { canManageKnowledge } from "@/lib/auth/access";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { humanizeEnum } from "@/lib/utils";
import {
  saveAudienceSegmentAction,
  saveBusinessProfileAction,
  saveCompanyValueAction,
  saveComplianceRuleAction,
  saveGuardrailTermAction,
  saveOfferAction,
  saveProductAction,
  saveStrategicGoalAction,
} from "@/server/actions/knowledge";

export default async function KnowledgePage() {
  const session = await requireSession();

  if (!canManageKnowledge(session.role)) {
    redirect("/dashboard");
  }

  const profile = await prisma.businessProfile.findUnique({
    where: { id: 1 },
    include: {
      values: true,
      products: true,
      audienceSegments: true,
      complianceRules: true,
      guardrailTerms: true,
      offers: true,
      goals: true,
    },
  });

  if (!profile) {
    redirect("/dashboard");
  }

  return (
    <div className="grid gap-6">
      <SectionCard
        title="Business Knowledge Base"
        description="This is the shared context layer for AI generation, recommendations, trend scoring, approvals, and future channel expansion."
      >
        <form action={saveBusinessProfileAction} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              Company name
              <input name="companyName" defaultValue={profile.companyName} required />
            </label>
            <label>
              Brand promise
              <input name="brandPromise" defaultValue={profile.brandPromise} required />
            </label>
          </div>
          <label>
            Mission
            <textarea name="mission" defaultValue={profile.mission} required />
          </label>
          <label>
            Value proposition
            <textarea
              name="valueProposition"
              defaultValue={profile.valueProposition}
              required
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              Tone summary
              <textarea name="toneSummary" defaultValue={profile.toneSummary} required />
            </label>
            <label>
              Primary goal
              <textarea name="primaryGoal" defaultValue={profile.primaryGoal} required />
            </label>
          </div>
          <label>
            Core narrative
            <textarea name="coreNarrative" defaultValue={profile.coreNarrative} required />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              Compliance summary
              <textarea
                name="complianceSummary"
                defaultValue={profile.complianceSummary}
                required
              />
            </label>
            <label>
              Hero message
              <textarea name="heroMessage" defaultValue={profile.heroMessage} required />
            </label>
          </div>
          <SubmitButton pendingLabel="Saving profile...">
            Save business profile
          </SubmitButton>
        </form>
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Company Values"
          description="Editable values that guide messaging and brand-fit scoring."
        >
          <div className="grid gap-4">
            {profile.values.map((value) => (
              <form
                key={value.id}
                action={saveCompanyValueAction}
                className="grid gap-3 rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
              >
                <input type="hidden" name="id" value={value.id} />
                <label>
                  Value name
                  <input name="name" defaultValue={value.name} required />
                </label>
                <label>
                  Description
                  <textarea name="description" defaultValue={value.description} required />
                </label>
                <SubmitButton pendingLabel="Saving value...">Save value</SubmitButton>
              </form>
            ))}
            <form
              action={saveCompanyValueAction}
              className="grid gap-3 rounded-[24px] border border-dashed border-[color:var(--border)] p-4"
            >
              <label>
                New value name
                <input name="name" placeholder="Responsible growth" required />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  placeholder="How this should influence marketing."
                  required
                />
              </label>
              <SubmitButton pendingLabel="Adding value...">Add value</SubmitButton>
            </form>
          </div>
        </SectionCard>

        <SectionCard
          title="Strategic Goals"
          description="Goals shape the recommendation engine and keep generation aligned with business priorities."
        >
          <div className="grid gap-4">
            {profile.goals.map((goal) => (
              <form
                key={goal.id}
                action={saveStrategicGoalAction}
                className="grid gap-3 rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
              >
                <input type="hidden" name="id" value={goal.id} />
                <label>
                  Goal title
                  <input name="title" defaultValue={goal.title} required />
                </label>
                <label>
                  Description
                  <textarea name="description" defaultValue={goal.description} required />
                </label>
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                  <label>
                    Priority
                    <input name="priority" type="number" defaultValue={goal.priority} />
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      className="h-4 w-4"
                      name="active"
                      type="checkbox"
                      defaultChecked={goal.active}
                    />
                    Active
                  </label>
                </div>
                <SubmitButton pendingLabel="Saving goal...">Save goal</SubmitButton>
              </form>
            ))}
            <form
              action={saveStrategicGoalAction}
              className="grid gap-3 rounded-[24px] border border-dashed border-[color:var(--border)] p-4"
            >
              <label>
                Goal title
                <input name="title" placeholder="Increase WhatsApp conversations" required />
              </label>
              <label>
                Description
                <textarea name="description" required />
              </label>
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <label>
                  Priority
                  <input name="priority" type="number" defaultValue={70} />
                </label>
                <label className="flex items-center gap-3">
                  <input className="h-4 w-4" name="active" type="checkbox" defaultChecked />
                  Active
                </label>
              </div>
              <SubmitButton pendingLabel="Adding goal...">Add goal</SubmitButton>
            </form>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Products"
          description="Priority products feed the generator and recommendation engine."
        >
          <div className="grid gap-4">
            {profile.products.map((product) => (
              <form
                key={product.id}
                action={saveProductAction}
                className="grid gap-3 rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
              >
                <input type="hidden" name="id" value={product.id} />
                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    Name
                    <input name="name" defaultValue={product.name} required />
                  </label>
                  <label>
                    Category
                    <input name="category" defaultValue={product.category} required />
                  </label>
                </div>
                <label>
                  Description
                  <textarea name="description" defaultValue={product.description} required />
                </label>
                <label>
                  Key benefits
                  <textarea name="keyBenefits" defaultValue={product.keyBenefits} required />
                </label>
                <label>
                  Eligibility notes
                  <textarea
                    name="eligibilityNotes"
                    defaultValue={product.eligibilityNotes}
                    required
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    Call to action
                    <input name="callToAction" defaultValue={product.callToAction} required />
                  </label>
                  <label>
                    Priority
                    <input name="priority" type="number" defaultValue={product.priority} />
                  </label>
                </div>
                <label className="flex items-center gap-3">
                  <input
                    className="h-4 w-4"
                    name="active"
                    type="checkbox"
                    defaultChecked={product.active}
                  />
                  Active
                </label>
                <div className="flex flex-wrap gap-3">
                  <SubmitButton pendingLabel="Saving product...">Save product</SubmitButton>
                  <OpenAssistantButton
                    label="Create a post for this product"
                    prompt={`Create the best post for ${product.name}. Pick the strongest channel automatically, keep it aligned with the current top trend, and make it ready to edit.`}
                    autoSend
                    className="bg-surface-strong text-[color:var(--foreground)] hover:bg-[color:var(--surface-soft)]"
                  />
                </div>
              </form>
            ))}
            <form
              action={saveProductAction}
              className="grid gap-3 rounded-[24px] border border-dashed border-[color:var(--border)] p-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  Name
                  <input name="name" placeholder="Emergency Cash Support" required />
                </label>
                <label>
                  Category
                  <input name="category" placeholder="Consumer loan" required />
                </label>
              </div>
              <label>
                Description
                <textarea name="description" required />
              </label>
              <label>
                Key benefits
                <textarea name="keyBenefits" required />
              </label>
              <label>
                Eligibility notes
                <textarea name="eligibilityNotes" required />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  Call to action
                  <input name="callToAction" required />
                </label>
                <label>
                  Priority
                  <input name="priority" type="number" defaultValue={60} />
                </label>
              </div>
              <label className="flex items-center gap-3">
                <input className="h-4 w-4" name="active" type="checkbox" defaultChecked />
                Active
              </label>
              <SubmitButton pendingLabel="Adding product...">Add product</SubmitButton>
            </form>
          </div>
        </SectionCard>

        <SectionCard
          title="Audience Segments"
          description="Segments keep messaging targeted and useful."
        >
          <div className="grid gap-4">
            {profile.audienceSegments.map((segment) => (
              <form
                key={segment.id}
                action={saveAudienceSegmentAction}
                className="grid gap-3 rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
              >
                <input type="hidden" name="id" value={segment.id} />
                <label>
                  Segment name
                  <input name="name" defaultValue={segment.name} required />
                </label>
                <label>
                  Description
                  <textarea name="description" defaultValue={segment.description} required />
                </label>
                <label>
                  Pain points
                  <textarea name="painPoints" defaultValue={segment.painPoints} required />
                </label>
                <label>
                  Needs
                  <textarea name="needs" defaultValue={segment.needs} required />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    Preferred channels
                    <input
                      name="preferredChannels"
                      defaultValue={segment.preferredChannels}
                      required
                    />
                  </label>
                  <label>
                    Priority
                    <input name="priority" type="number" defaultValue={segment.priority} />
                  </label>
                </div>
                <label>
                  Messaging angles
                  <textarea
                    name="messagingAngles"
                    defaultValue={segment.messagingAngles}
                    required
                  />
                </label>
                <div className="flex flex-wrap gap-3">
                  <SubmitButton pendingLabel="Saving audience...">Save audience</SubmitButton>
                  <OpenAssistantButton
                    label="Create a post for this audience"
                    prompt={`Create the best post for the ${segment.name} audience. Pick the strongest channel and product automatically, and keep the tone natural for this group.`}
                    autoSend
                    className="bg-surface-strong text-[color:var(--foreground)] hover:bg-[color:var(--surface-soft)]"
                  />
                </div>
              </form>
            ))}
            <form
              action={saveAudienceSegmentAction}
              className="grid gap-3 rounded-[24px] border border-dashed border-[color:var(--border)] p-4"
            >
              <label>
                Segment name
                <input name="name" placeholder="Young professionals" required />
              </label>
              <label>
                Description
                <textarea name="description" required />
              </label>
              <label>
                Pain points
                <textarea name="painPoints" required />
              </label>
              <label>
                Needs
                <textarea name="needs" required />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  Preferred channels
                  <input name="preferredChannels" placeholder="Facebook, WhatsApp" required />
                </label>
                <label>
                  Priority
                  <input name="priority" type="number" defaultValue={60} />
                </label>
              </div>
              <label>
                Messaging angles
                <textarea name="messagingAngles" required />
              </label>
              <SubmitButton pendingLabel="Adding audience...">Add audience</SubmitButton>
            </form>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Compliance Rules"
          description="These guide AI outputs and approval decisions."
        >
          <div className="grid gap-4">
            {profile.complianceRules.map((rule) => (
              <form
                key={rule.id}
                action={saveComplianceRuleAction}
                className="grid gap-3 rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
              >
                <input type="hidden" name="id" value={rule.id} />
                <label>
                  Rule title
                  <input name="title" defaultValue={rule.title} required />
                </label>
                <label>
                  Rule text
                  <textarea name="ruleText" defaultValue={rule.ruleText} required />
                </label>
                <label>
                  Guidance
                  <textarea name="guidance" defaultValue={rule.guidance} required />
                </label>
                <label>
                  Severity
                  <input name="severity" defaultValue={rule.severity} required />
                </label>
                <SubmitButton pendingLabel="Saving rule...">Save rule</SubmitButton>
              </form>
            ))}
            <form
              action={saveComplianceRuleAction}
              className="grid gap-3 rounded-[24px] border border-dashed border-[color:var(--border)] p-4"
            >
              <label>
                Rule title
                <input name="title" placeholder="Affordability language" required />
              </label>
              <label>
                Rule text
                <textarea name="ruleText" required />
              </label>
              <label>
                Guidance
                <textarea name="guidance" required />
              </label>
              <label>
                Severity
                <input name="severity" defaultValue="Medium" required />
              </label>
              <SubmitButton pendingLabel="Adding rule...">Add rule</SubmitButton>
            </form>
          </div>
        </SectionCard>

        <SectionCard
          title="Offers"
          description="Campaigns and seasonal offers stay reusable across generation flows."
        >
          <div className="grid gap-4">
            {profile.offers.map((offer) => (
              <form
                key={offer.id}
                action={saveOfferAction}
                className="grid gap-3 rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
              >
                <input type="hidden" name="id" value={offer.id} />
                <label>
                  Offer name
                  <input name="name" defaultValue={offer.name} required />
                </label>
                <label>
                  Description
                  <textarea name="description" defaultValue={offer.description} required />
                </label>
                <label>
                  Call to action
                  <input name="callToAction" defaultValue={offer.callToAction} required />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    Start date
                    <input
                      name="startDate"
                      type="date"
                      defaultValue={offer.startDate?.toISOString().slice(0, 10) ?? ""}
                    />
                  </label>
                  <label>
                    End date
                    <input
                      name="endDate"
                      type="date"
                      defaultValue={offer.endDate?.toISOString().slice(0, 10) ?? ""}
                    />
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                  <label>
                    Priority
                    <input name="priority" type="number" defaultValue={offer.priority} />
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      className="h-4 w-4"
                      name="active"
                      type="checkbox"
                      defaultChecked={offer.active}
                    />
                    Active
                  </label>
                </div>
                <SubmitButton pendingLabel="Saving offer...">Save offer</SubmitButton>
              </form>
            ))}
            <form
              action={saveOfferAction}
              className="grid gap-3 rounded-[24px] border border-dashed border-[color:var(--border)] p-4"
            >
              <label>
                Offer name
                <input name="name" placeholder="Salary advance awareness push" required />
              </label>
              <label>
                Description
                <textarea name="description" required />
              </label>
              <label>
                Call to action
                <input name="callToAction" required />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  Start date
                  <input name="startDate" type="date" />
                </label>
                <label>
                  End date
                  <input name="endDate" type="date" />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <label>
                  Priority
                  <input name="priority" type="number" defaultValue={60} />
                </label>
                <label className="flex items-center gap-3">
                  <input className="h-4 w-4" name="active" type="checkbox" defaultChecked />
                  Active
                </label>
              </div>
              <SubmitButton pendingLabel="Adding offer...">Add offer</SubmitButton>
            </form>
          </div>
        </SectionCard>
      </section>

      <SectionCard
        title="Guardrail Terms"
        description="Store prohibited words, misleading claims, and phrases that should trigger extra review before publishing."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {profile.guardrailTerms.map((term) => (
            <form
              key={term.id}
              action={saveGuardrailTermAction}
              className="grid gap-3 rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.72)] p-4"
            >
              <input type="hidden" name="id" value={term.id} />
              <label>
                Phrase
                <input name="phrase" defaultValue={term.phrase} required />
              </label>
              <label>
                Explanation
                <textarea
                  name="explanation"
                  defaultValue={term.explanation}
                  required
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  Guardrail type
                  <select name="type" defaultValue={term.type}>
                    {Object.values(GuardrailType).map((type) => (
                      <option key={type} value={type}>
                        {humanizeEnum(type)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Severity
                  <input name="severity" defaultValue={term.severity} required />
                </label>
              </div>
              <label className="flex items-center gap-3">
                <input
                  className="h-4 w-4"
                  name="active"
                  type="checkbox"
                  defaultChecked={term.active}
                />
                Active
              </label>
              <SubmitButton pendingLabel="Saving guardrail...">
                Save guardrail
              </SubmitButton>
            </form>
          ))}

          <form
            action={saveGuardrailTermAction}
            className="grid gap-3 rounded-[24px] border border-dashed border-[color:var(--border)] p-4"
          >
            <label>
              Phrase
              <input name="phrase" placeholder="Guaranteed approval" required />
            </label>
            <label>
              Explanation
              <textarea
                name="explanation"
                placeholder="Why this phrase is risky and how the team should rewrite it."
                required
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                Guardrail type
                <select
                  name="type"
                  defaultValue={GuardrailType.MISLEADING_CLAIM}
                >
                  {Object.values(GuardrailType).map((type) => (
                    <option key={type} value={type}>
                      {humanizeEnum(type)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Severity
                <input name="severity" defaultValue="High" required />
              </label>
            </div>
            <label className="flex items-center gap-3">
              <input className="h-4 w-4" name="active" type="checkbox" defaultChecked />
              Active
            </label>
            <SubmitButton pendingLabel="Adding guardrail...">
              Add guardrail
            </SubmitButton>
          </form>
        </div>
      </SectionCard>
    </div>
  );
}
