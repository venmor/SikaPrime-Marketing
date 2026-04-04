"use client";

import Link from "next/link";
import {
  useEffect,
  useEffectEvent,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  CheckCircle2,
  ChevronUp,
  MessageSquare,
  Send,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type {
  AssistantReviewInboxItem,
  AssistantSuggestion,
} from "@/lib/assistant/types";
import type {
  AIGeneratedChannelPreview,
  AssistantRunResult,
} from "@/lib/ai/types";
import { cn, formatRelativeDate } from "@/lib/utils";
import {
  runAssistantPromptAction,
  saveAiGeneratedContentAction,
} from "@/server/actions/aiGenerate";
import {
  approveContentAction,
  sendBackToDraftAction,
} from "@/server/actions/content";

type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  drafts?: AIGeneratedChannelPreview[];
  usedTrends?: string[];
  toneHint?: string;
};

export function AssistantDock({
  canGenerate,
  canReview,
  defaultsSummary,
  suggestions,
  reviewInbox,
}: {
  canGenerate: boolean;
  canReview: boolean;
  defaultsSummary: string;
  suggestions: AssistantSuggestion[];
  reviewInbox: AssistantReviewInboxItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"assistant" | "inbox">(
    canGenerate ? "assistant" : "inbox",
  );
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: canGenerate
        ? "Tell me what you want to create in plain language. I’ll fill the product, channel, tone, and live trend context for you."
        : "Your review inbox is ready. Approve or send back the next draft without opening a separate page.",
    },
  ]);
  const [drafts, setDrafts] = useState<AIGeneratedChannelPreview[]>([]);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [revisionNotes, setRevisionNotes] = useState<Record<string, string>>({});
  const [isRunning, startRun] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [isReviewing, startReviewing] = useTransition();

  const latestDraftLink = drafts[0] ? `/content/${drafts[0].contentItemId}` : "/content";

  function addMessage(message: AssistantMessage) {
    setMessages((current) => [...current, message]);
  }

  function handleAssistantResult(result: AssistantRunResult) {
    if (result.status === "error") {
      addMessage({
        id: `assistant-error-${Date.now()}`,
        role: "assistant",
        text: result.message,
      });
      return;
    }

    if (result.status === "needs_clarification") {
      addMessage({
        id: `assistant-clarify-${Date.now()}`,
        role: "assistant",
        text: result.question,
        toneHint: result.defaultsSummary,
      });
      return;
    }

    setDrafts(result.items);
    addMessage({
      id: `assistant-success-${Date.now()}`,
      role: "assistant",
      text: `${result.message} ${result.explanation}`,
      drafts: result.items,
      usedTrends: result.usedLiveTrends.map((trend) => trend.title),
      toneHint: result.defaultsSummary,
    });
  }

  function submitPrompt(rawPrompt?: string, options?: { keepOpen?: boolean }) {
    const sourcePrompt = (rawPrompt ?? input).trim();

    if (!sourcePrompt || !canGenerate) {
      return;
    }

    const resolvedPrompt = pendingPrompt
      ? `${pendingPrompt}\nClarification: ${sourcePrompt}`
      : sourcePrompt;

    addMessage({
      id: `user-${Date.now()}`,
      role: "user",
      text: sourcePrompt,
    });

    setInput("");
    setOpen(options?.keepOpen ?? true);

    startRun(async () => {
      const result = await runAssistantPromptAction({
        prompt: resolvedPrompt,
      });

      if (result.status === "needs_clarification") {
        setPendingPrompt(resolvedPrompt);
      } else {
        setPendingPrompt(null);
      }

      handleAssistantResult(result);
      router.refresh();
    });
  }

  function updateDraft(
    contentItemId: string,
    updater: (draft: AIGeneratedChannelPreview) => AIGeneratedChannelPreview,
  ) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.contentItemId === contentItemId ? updater(draft) : draft,
      ),
    );
  }

  function saveDrafts(submitForReview: boolean) {
    if (!drafts.length) {
      return;
    }

    startSaving(async () => {
      const result = await saveAiGeneratedContentAction({
        items: drafts,
        submitForReview,
      });

      addMessage({
        id: `assistant-save-${Date.now()}`,
        role: "assistant",
        text: result.message,
      });
      router.refresh();
    });
  }

  function handleReviewAction(action: "approve" | "revise", contentItemId: string) {
    startReviewing(async () => {
      const formData = new FormData();
      formData.set("id", contentItemId);

      if (action === "approve") {
        formData.set("approvalNotes", "Approved from the review inbox.");
        await approveContentAction(formData);
      } else {
        formData.set(
          "revisionNotes",
          revisionNotes[contentItemId]?.trim() || "Please tighten the message before publishing.",
        );
        await sendBackToDraftAction(formData);
      }

      router.refresh();
    });
  }

  const onAssistantOpen = useEffectEvent(
    (detail?: { prompt?: string; autoSend?: boolean }) => {
      setOpen(true);
      setActiveTab("assistant");
      setInput(detail?.prompt ?? "");

      if (detail?.prompt && detail.autoSend) {
        submitPrompt(detail.prompt, { keepOpen: true });
      }
    },
  );

  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<{ prompt?: string; autoSend?: boolean }>).detail;
      onAssistantOpen(detail);
    };

    window.addEventListener("assistant:open", listener);

    return () => window.removeEventListener("assistant:open", listener);
  }, []);

  if (!canGenerate && !canReview) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-3">
      {open ? (
        <div className="pointer-events-auto w-[min(30rem,calc(100vw-1.5rem))] rounded-[28px] border border-[color:var(--border-strong)] bg-[color:rgba(255,255,255,0.97)] shadow-[0_24px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-[color:var(--border)] px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                Workflow assistant
              </p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{defaultsSummary}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-surface-strong text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
                onClick={() => setOpen(false)}
                aria-label="Minimize assistant"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-surface-strong text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
                onClick={() => {
                  setOpen(false);
                  setDrafts([]);
                  setPendingPrompt(null);
                }}
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-5 pt-4">
            {canGenerate ? (
              <button
                type="button"
                onClick={() => setActiveTab("assistant")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  activeTab === "assistant"
                    ? "bg-brand-soft text-brand-strong"
                    : "bg-[color:var(--surface-soft)] text-[color:var(--muted)]",
                )}
              >
                Assistant
              </button>
            ) : null}
            {canReview ? (
              <button
                type="button"
                onClick={() => setActiveTab("inbox")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  activeTab === "inbox"
                    ? "bg-brand-soft text-brand-strong"
                    : "bg-[color:var(--surface-soft)] text-[color:var(--muted)]",
                )}
              >
                Inbox
              </button>
            ) : null}
          </div>

          {activeTab === "assistant" ? (
            <div className="grid gap-4 px-5 pb-5 pt-4">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    className="rounded-full border border-[color:var(--border)] bg-surface-strong px-3 py-2 text-left text-xs font-medium text-[color:var(--foreground)] transition-all hover:-translate-y-0.5 hover:border-[color:var(--border-strong)]"
                    onClick={() => submitPrompt(suggestion.prompt, { keepOpen: true })}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>

              <div className="max-h-[22rem] overflow-y-auto rounded-[22px] bg-[color:var(--surface-soft)] p-3">
                <div className="grid gap-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "rounded-[20px] px-4 py-3 text-sm leading-6",
                        message.role === "assistant"
                          ? "bg-surface-strong text-[color:var(--foreground)] shadow-sm"
                          : "ml-8 bg-brand text-white",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {message.role === "assistant" ? (
                            <Bot className="h-4 w-4 text-brand" />
                          ) : (
                            <MessageSquare className="h-4 w-4 text-white/80" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p>{message.text}</p>
                          {message.toneHint ? (
                            <p className="mt-2 text-xs text-[color:var(--muted)]">
                              Defaults: {message.toneHint}
                            </p>
                          ) : null}
                          {message.usedTrends?.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {message.usedTrends.map((trend) => (
                                <Badge key={trend} variant="cyan-subtle">
                                  {trend}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[22px] border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                    What should I make?
                  </span>
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Create a Facebook ad about our quick loan for small businesses, friendly tone, include today’s top finance trend."
                    className="mt-3 min-h-[7rem] w-full resize-none rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-sm text-[color:var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]"
                  />
                </label>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-[color:var(--muted)]">
                    The assistant fills product, audience, tone, and trends from your workspace.
                  </p>
                  <button
                    type="button"
                    onClick={() => submitPrompt()}
                    disabled={isRunning || !input.trim()}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {isRunning ? "Generating..." : pendingPrompt ? "Answer" : "Generate"}
                  </button>
                </div>
              </div>

              {drafts.length ? (
                <div className="rounded-[24px] border border-[color:var(--border-strong)] bg-surface-strong p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                        Generated drafts
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--muted)]">
                        Edit here, save as draft, or send straight into review.
                      </p>
                    </div>
                    <Link
                      href={latestDraftLink}
                      className="text-sm font-semibold text-brand transition-colors hover:text-brand-strong"
                    >
                      Open editor
                    </Link>
                  </div>

                  <div className="mt-4 grid gap-4">
                    {drafts.map((draft) => (
                      <div
                        key={draft.contentItemId}
                        className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="brand-subtle">{draft.channel}</Badge>
                            <Badge variant="muted">{draft.themeLabel}</Badge>
                          </div>
                          <Link
                            href={`/content/${draft.contentItemId}`}
                            className="text-xs font-semibold text-brand transition-colors hover:text-brand-strong"
                          >
                            Full editor
                          </Link>
                        </div>

                        <div className="mt-4 grid gap-3">
                          <label className="grid gap-2 text-sm">
                            <span className="font-medium text-[color:var(--foreground)]">Title</span>
                            <input
                              value={draft.title}
                              onChange={(event) =>
                                updateDraft(draft.contentItemId, (current) => ({
                                  ...current,
                                  title: event.target.value,
                                }))
                              }
                            />
                          </label>

                          {draft.payload.kind === "FACEBOOK" ? (
                            <>
                              <label className="grid gap-2 text-sm">
                                <span className="font-medium text-[color:var(--foreground)]">Post body</span>
                                <textarea
                                  value={draft.payload.body}
                                  onChange={(event) =>
                                    updateDraft(draft.contentItemId, (current) => ({
                                      ...current,
                                      payload:
                                        current.payload.kind === "FACEBOOK"
                                          ? {
                                              ...current.payload,
                                              body: event.target.value,
                                            }
                                          : current.payload,
                                    }))
                                  }
                                />
                              </label>
                              <label className="grid gap-2 text-sm">
                                <span className="font-medium text-[color:var(--foreground)]">Caption</span>
                                <textarea
                                  value={draft.payload.caption}
                                  onChange={(event) =>
                                    updateDraft(draft.contentItemId, (current) => ({
                                      ...current,
                                      payload:
                                        current.payload.kind === "FACEBOOK"
                                          ? {
                                              ...current.payload,
                                              caption: event.target.value,
                                            }
                                          : current.payload,
                                    }))
                                  }
                                />
                              </label>
                              <label className="grid gap-2 text-sm">
                                <span className="font-medium text-[color:var(--foreground)]">Boost comments</span>
                                <textarea
                                  value={draft.payload.engagementComments.join("\n")}
                                  onChange={(event) =>
                                    updateDraft(draft.contentItemId, (current) => ({
                                      ...current,
                                      payload:
                                        current.payload.kind === "FACEBOOK"
                                          ? {
                                              ...current.payload,
                                              engagementComments: event.target.value
                                                .split("\n")
                                                .map((comment) => comment.trim())
                                                .filter(Boolean),
                                            }
                                          : current.payload,
                                    }))
                                  }
                                />
                              </label>
                            </>
                          ) : (
                            <label className="grid gap-2 text-sm">
                              <span className="font-medium text-[color:var(--foreground)]">WhatsApp message</span>
                              <textarea
                                value={draft.payload.message}
                                onChange={(event) =>
                                  updateDraft(draft.contentItemId, (current) => ({
                                    ...current,
                                    payload:
                                      current.payload.kind === "WHATSAPP"
                                        ? {
                                            ...current.payload,
                                            message: event.target.value,
                                          }
                                        : current.payload,
                                  }))
                                }
                              />
                            </label>
                          )}

                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="grid gap-2 text-sm">
                              <span className="font-medium text-[color:var(--foreground)]">Call to action</span>
                              <input
                                value={draft.callToAction}
                                onChange={(event) =>
                                  updateDraft(draft.contentItemId, (current) => ({
                                    ...current,
                                    callToAction: event.target.value,
                                  }))
                                }
                              />
                            </label>
                            <label className="grid gap-2 text-sm">
                              <span className="font-medium text-[color:var(--foreground)]">Hashtags</span>
                              <input
                                value={draft.hashtags.join(" ")}
                                onChange={(event) =>
                                  updateDraft(draft.contentItemId, (current) => ({
                                    ...current,
                                    hashtags: event.target.value
                                      .split(/[\s,]+/)
                                      .map((tag) => tag.trim())
                                      .filter(Boolean),
                                  }))
                                }
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => saveDrafts(false)}
                      disabled={isSaving}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-surface-strong px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)] transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
                    >
                      {isSaving ? "Saving..." : "Keep as draft"}
                    </button>
                    <button
                      type="button"
                      onClick={() => saveDrafts(true)}
                      disabled={isSaving}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-strong disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Submit for review
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4 px-5 pb-5 pt-4">
              {reviewInbox.length ? (
                reviewInbox.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[22px] border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                          Ready for review
                        </p>
                        <h3 className="mt-2 font-display text-lg font-semibold text-[color:var(--foreground)]">
                          {item.title}
                        </h3>
                      </div>
                      <Badge variant="warning">{formatRelativeDate(item.updatedAt)}</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                      {item.brief}
                    </p>
                    <p className="mt-3 text-xs text-[color:var(--muted)]">
                      Owner: {item.ownerName}
                    </p>
                    <label className="mt-4 grid gap-2 text-sm">
                      <span className="font-medium text-[color:var(--foreground)]">Revision note</span>
                      <textarea
                        value={revisionNotes[item.id] ?? ""}
                        onChange={(event) =>
                          setRevisionNotes((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                        placeholder="Optional feedback if you request changes."
                      />
                    </label>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleReviewAction("approve", item.id)}
                        disabled={isReviewing}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReviewAction("revise", item.id)}
                        disabled={isReviewing}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--border-strong)] bg-surface-strong px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)] transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
                      >
                        <WandSparkles className="h-4 w-4" />
                        Request changes
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5 text-sm text-[color:var(--muted)]">
                  Nothing is waiting for review right now.
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      <button
        type="button"
        className="pointer-events-auto inline-flex min-h-14 items-center gap-3 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(230,62,140,0.35)] transition-all hover:-translate-y-0.5 hover:bg-brand-strong"
        onClick={() => setOpen((current) => !current)}
      >
        <Sparkles className="h-4 w-4" />
        {canGenerate ? "Ask AI" : "Review inbox"}
      </button>
    </div>
  );
}
