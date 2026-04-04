"use client";

import type { ContentTone } from "@prisma/client";

import type {
  AIGenerationSubjectDetails,
  LiveTrendPreview,
} from "@/lib/ai/types";

type NamedOption = {
  id: string;
  name: string;
  description?: string | null;
};

type GoalOption = {
  id: string;
  title: string;
  description?: string | null;
};

type ValueOption = {
  id: string;
  name: string;
  description?: string | null;
};

const toneOptions: Array<{ value: ContentTone; label: string; summary: string }> = [
  {
    value: "PROFESSIONAL",
    label: "Professional",
    summary: "Clear, credible, and trustworthy.",
  },
  {
    value: "LOCALIZED",
    label: "Friendly",
    summary: "More conversational and locally grounded.",
  },
  {
    value: "PERSUASIVE",
    label: "Urgent",
    summary: "Action-oriented without becoming pushy.",
  },
  {
    value: "YOUTHFUL",
    label: "Educational",
    summary: "Lighter, youth-aware, and easier to scan.",
  },
];

export function SubjectForm({
  value,
  liveTrends,
  selectedTrendIds,
  onToggleTrend,
  products,
  offers,
  audiences,
  goals,
  values,
  onChange,
}: {
  value: AIGenerationSubjectDetails;
  liveTrends: LiveTrendPreview[];
  selectedTrendIds: string[];
  onToggleTrend: (trendId: string) => void;
  products: NamedOption[];
  offers: NamedOption[];
  audiences: NamedOption[];
  goals: GoalOption[];
  values: ValueOption[];
  onChange: (nextValue: AIGenerationSubjectDetails) => void;
}) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span>Product</span>
          <select
            value={value.productId ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                productId: event.target.value || null,
              })
            }
          >
            <option value="">General product focus</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Offer</span>
          <select
            value={value.offerId ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                offerId: event.target.value || null,
              })
            }
          >
            <option value="">No specific offer</option>
            {offers.map((offer) => (
              <option key={offer.id} value={offer.id}>
                {offer.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label>
          <span>Audience</span>
          <select
            value={value.audienceSegmentId ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                audienceSegmentId: event.target.value || null,
              })
            }
          >
            <option value="">General audience</option>
            {audiences.map((audience) => (
              <option key={audience.id} value={audience.id}>
                {audience.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Content goal</span>
          <select
            value={value.goalId ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                goalId: event.target.value || null,
              })
            }
          >
            <option value="">General marketing goal</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Tone</span>
          <select
            value={value.tone}
            onChange={(event) =>
              onChange({
                ...value,
                tone: event.target.value as ContentTone,
              })
            }
          >
            {toneOptions.map((tone) => (
              <option key={tone.value} value={tone.value}>
                {tone.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
          Knowledge base anchors
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((companyValue) => (
            <span
              key={companyValue.id}
              className="rounded-full border border-[color:var(--border)] bg-surface-strong px-3 py-1.5 text-xs font-medium text-[color:var(--muted-strong)]"
            >
              {companyValue.name}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm">
        <p className="text-sm font-semibold text-[color:var(--foreground)]">
          Live trend context
        </p>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          Select up to three live trends to seed the AI prompt, or leave them empty
          and the assistant will use the strongest current signals automatically.
        </p>
        <div className="mt-4 grid gap-3">
          {liveTrends.map((trend) => (
            <label
              key={trend.id}
              className="grid gap-2 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4"
            >
              <span className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedTrendIds.includes(trend.id)}
                  onChange={() => onToggleTrend(trend.id)}
                />
                <span className="grid gap-1">
                  <span className="text-sm font-semibold text-[color:var(--foreground)]">
                    {trend.title}
                  </span>
                  <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    {trend.source} · score {Math.round(trend.relevanceScore)}
                  </span>
                  {trend.description ? (
                    <span className="text-sm leading-6 text-[color:var(--muted)]">
                      {trend.description}
                    </span>
                  ) : null}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <label>
        <span>Additional instructions</span>
        <textarea
          value={value.customInstructions ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              customInstructions: event.target.value,
            })
          }
          placeholder="Example: Emphasize responsible borrowing for traders preparing to restock this month, and keep the message optimistic but disciplined."
        />
      </label>
    </div>
  );
}
