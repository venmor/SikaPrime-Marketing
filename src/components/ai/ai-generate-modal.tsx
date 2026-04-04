"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Sparkles, X } from "lucide-react";

import { ChannelSelector } from "@/components/ai/channel-selector";
import { PreviewEdit } from "@/components/ai/preview-edit";
import { SubjectForm } from "@/components/ai/subject-form";
import { generateAiContentAction, saveAiGeneratedContentAction } from "@/server/actions/aiGenerate";
import type {
  AIGeneratedChannelPreview,
  AIGenerationChannelSelection,
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

function buildInitialSubjectDetails(
  initialInstructions?: string,
): AIGenerationSubjectDetails {
  return {
    productId: null,
    offerId: null,
    audienceSegmentId: null,
    goalId: null,
    tone: "PROFESSIONAL",
    customInstructions: initialInstructions ?? "",
  };
}

export function AIGenerateModal({
  products,
  offers,
  audiences,
  goals,
  values,
  liveTrends,
  triggerLabel = "Generate with AI",
  triggerClassName,
  initialTrendIds = [],
  initialInstructions,
}: {
  products: NamedOption[];
  offers: NamedOption[];
  audiences: NamedOption[];
  goals: GoalOption[];
  values: ValueOption[];
  liveTrends: LiveTrendPreview[];
  triggerLabel?: string;
  triggerClassName?: string;
  initialTrendIds?: string[];
  initialInstructions?: string;
}) {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [channelSelection, setChannelSelection] =
    useState<AIGenerationChannelSelection>("FACEBOOK");
  const [subjectDetails, setSubjectDetails] = useState<AIGenerationSubjectDetails>(
    buildInitialSubjectDetails(initialInstructions),
  );
  const [selectedTrendIds, setSelectedTrendIds] = useState<string[]>(initialTrendIds);
  const [generatedItems, setGeneratedItems] = useState<AIGeneratedChannelPreview[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usedTrends, setUsedTrends] = useState<LiveTrendPreview[]>([]);
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();

  const canContinueToBrief = Boolean(channelSelection);

  const firstItemLink = useMemo(
    () => (generatedItems[0] ? `/content/${generatedItems[0].contentItemId}` : "/content"),
    [generatedItems],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    modalRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function resetFlow() {
    setStep(1);
    setChannelSelection("FACEBOOK");
    setSubjectDetails(buildInitialSubjectDetails(initialInstructions));
    setSelectedTrendIds(initialTrendIds);
    setGeneratedItems([]);
    setStatusMessage(null);
    setErrorMessage(null);
    setUsedTrends([]);
  }

  function openFlow() {
    resetFlow();
    setOpen(true);
  }

  function toggleTrend(trendId: string) {
    setSelectedTrendIds((current) => {
      if (current.includes(trendId)) {
        return current.filter((value) => value !== trendId);
      }

      if (current.length >= 3) {
        return [...current.slice(1), trendId];
      }

      return [...current, trendId];
    });
  }

  function handleGenerate() {
    setErrorMessage(null);
    setStatusMessage(null);

    startGenerating(async () => {
      const result = await generateAiContentAction({
        channel: channelSelection,
        subjectDetails,
        trendIds: selectedTrendIds,
      });

      if (result.status === "error") {
        setErrorMessage(result.message);
        return;
      }

      setGeneratedItems(result.items);
      setUsedTrends(result.usedLiveTrends);
      setStatusMessage(result.message);
      setStep(3);
      router.refresh();
    });
  }

  function handleSave(submitForReview: boolean) {
    setErrorMessage(null);
    setStatusMessage(null);

    startSaving(async () => {
      const result = await saveAiGeneratedContentAction({
        items: generatedItems,
        submitForReview,
      });

      setStatusMessage(result.message);

      if (result.status === "success") {
        setStep(4);
        router.refresh();
      } else {
        setErrorMessage(result.message);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openFlow}
        className={
          triggerClassName ??
          "inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-strong hover:shadow-md"
        }
      >
        <Sparkles className="h-4 w-4" />
        {triggerLabel}
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[220] flex min-h-dvh items-center justify-center overflow-y-auto bg-slate-950/45 p-4 sm:p-6 backdrop-blur-sm">
              <div className="w-full max-w-5xl">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="mx-auto flex max-h-[min(92dvh,58rem)] w-full flex-col overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.98)] shadow-[0_28px_72px_rgba(15,23,42,0.24)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border)] px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  AI content generation
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-[color:var(--foreground)]">
                  Guided AI generation
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                  Move from channel choice to subject details to a draft that can go
                  straight into review, without losing the manual creation option.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:var(--border)] bg-white text-[color:var(--muted)] shadow-sm transition-all hover:-translate-y-0.5 hover:text-[color:var(--foreground)]"
                aria-label="Close AI generation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-[color:var(--border)] px-6 py-4">
              {[
                { stepNumber: 1, label: "Channel" },
                { stepNumber: 2, label: "Subject" },
                { stepNumber: 3, label: "Preview" },
                { stepNumber: 4, label: "Done" },
              ].map((item) => (
                <span
                  key={item.stepNumber}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${
                    step === item.stepNumber
                      ? "bg-brand-soft text-brand-strong"
                      : step > item.stepNumber
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-[color:var(--surface-soft)] text-[color:var(--muted)]"
                  }`}
                >
                  {item.label}
                </span>
              ))}
            </div>

            <div className="overflow-y-auto px-6 py-6">
              {errorMessage ? (
                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                  {errorMessage} You can retry or continue with the manual creation
                  tools in the Content Lab.
                </div>
              ) : null}

              {statusMessage && step === 4 ? (
                <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  {statusMessage}
                </div>
              ) : null}

              {step === 1 ? (
                <div className="grid gap-6">
                  <ChannelSelector
                    value={channelSelection}
                    onChange={setChannelSelection}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-[color:var(--muted)]">
                      Pick one channel or generate separate channel-ready drafts for
                      both.
                    </p>
                    <button
                      type="button"
                      disabled={!canContinueToBrief}
                      onClick={() => setStep(2)}
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="grid gap-6">
                  <SubjectForm
                    value={subjectDetails}
                    liveTrends={liveTrends}
                    selectedTrendIds={selectedTrendIds}
                    onToggleTrend={toggleTrend}
                    products={products}
                    offers={offers}
                    audiences={audiences}
                    goals={goals}
                    values={values}
                    onChange={setSubjectDetails}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-white px-5 py-2.5 text-sm font-semibold text-[color:var(--foreground)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isGenerating ? "Generating..." : "Generate content"}
                    </button>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="grid gap-6">
                  {usedTrends.length ? (
                    <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                        Injected live trends
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {usedTrends.map((trend) => (
                          <span
                            key={trend.id}
                            className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-[color:var(--muted-strong)]"
                          >
                            {trend.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <PreviewEdit items={generatedItems} onChange={setGeneratedItems} />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-white px-5 py-2.5 text-sm font-semibold text-[color:var(--foreground)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                      >
                        Regenerate with AI
                      </button>
                      <Link
                        href={firstItemLink}
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-white px-5 py-2.5 text-sm font-semibold text-[color:var(--foreground)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                      >
                        Edit manually
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleSave(false)}
                        disabled={isSaving}
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-white px-5 py-2.5 text-sm font-semibold text-[color:var(--foreground)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? "Saving..." : "Save as draft"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSave(true)}
                        disabled={isSaving}
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? "Submitting..." : "Submit for review"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="grid gap-5">
                  <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
                    <p className="text-base leading-7 text-[color:var(--foreground)]">
                      The AI-generated content has been saved back into the normal
                      workflow and is ready for manual editing, review, scheduling,
                      and publishing.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/workflow"
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-strong"
                    >
                      Open workflow
                    </Link>
                    <Link
                      href={firstItemLink}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-white px-5 py-2.5 text-sm font-semibold text-[color:var(--foreground)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      Open content item
                    </Link>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-white px-5 py-2.5 text-sm font-semibold text-[color:var(--foreground)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
