"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";

import type { AIGeneratedChannelPreview } from "@/lib/ai/types";

function updateItem(
  items: AIGeneratedChannelPreview[],
  targetId: string,
  updater: (item: AIGeneratedChannelPreview) => AIGeneratedChannelPreview,
) {
  return items.map((item) => (item.contentItemId === targetId ? updater(item) : item));
}

export function PreviewEdit({
  items,
  onChange,
}: {
  items: AIGeneratedChannelPreview[];
  onChange: (nextItems: AIGeneratedChannelPreview[]) => void;
}) {
  return (
    <div className="grid gap-5">
      {items.map((item) => (
        <article
          key={item.contentItemId}
          className="rounded-[28px] border border-[color:var(--border)] bg-surface-strong p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">
                {item.channel}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-1 text-xs font-medium text-[color:var(--muted)]">
                {item.themeLabel}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onChange(
                    updateItem(items, item.contentItemId, (current) => ({
                      ...current,
                      userRating: current.userRating === 1 ? undefined : 1,
                    })),
                  )
                }
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  item.userRating === 1
                    ? "bg-brand-soft text-brand-strong"
                    : "text-[color:var(--muted)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--foreground)]"
                }`}
                title="Good response"
              >
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange(
                    updateItem(items, item.contentItemId, (current) => ({
                      ...current,
                      userRating: current.userRating === 0 ? undefined : 0,
                    })),
                  )
                }
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  item.userRating === 0
                    ? "bg-[color:var(--warning-soft)] text-[color:var(--warning-strong)]"
                    : "text-[color:var(--muted)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--foreground)]"
                }`}
                title="Bad response"
              >
                <ThumbsDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {item.userRating === 0 ? (
            <div className="mt-4">
              <label>
                <span className="text-xs text-[color:var(--muted)]">What went wrong?</span>
                <input
                  type="text"
                  placeholder="Too long, wrong tone..."
                  value={item.userFeedback ?? ""}
                  onChange={(event) =>
                    onChange(
                      updateItem(items, item.contentItemId, (current) => ({
                        ...current,
                        userFeedback: event.target.value,
                      })),
                    )
                  }
                  className="mt-1 h-9 bg-[color:var(--surface)] text-sm"
                />
              </label>
            </div>
          ) : null}

          <div className="mt-4 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Publish preview
            </p>
            {item.payload.kind === "FACEBOOK" ? (
              <div className="mt-4 rounded-[22px] border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm">
                <p className="text-sm font-semibold text-[color:var(--foreground)]">
                  {item.title}
                </p>
                <p className="mt-3 break-words whitespace-pre-wrap text-sm leading-6 text-[color:var(--foreground)]">
                  {item.payload.body}
                </p>
                <div className="mt-4 rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Caption
                  </p>
                  <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-6 text-[color:var(--muted-strong)]">
                    {item.payload.caption}
                  </p>
                </div>
                <p className="mt-3 text-sm font-medium text-brand-strong">
                  {item.hashtags.join(" ")}
                </p>
              </div>
            ) : (
              <div className="mt-4 flex justify-end">
                <div className="max-w-[92%] break-words rounded-[22px] bg-[color:var(--success)] px-4 py-3 text-sm leading-6 text-[color:var(--background)] shadow-sm">
                  {item.payload.message}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-4">
            <label>
              <span>Title</span>
              <input
                value={item.title}
                onChange={(event) =>
                  onChange(
                    updateItem(items, item.contentItemId, (current) => ({
                      ...current,
                      title: event.target.value,
                    })),
                  )
                }
              />
            </label>

            {item.payload.kind === "FACEBOOK" ? (
              <>
                <label>
                  <span>Facebook body</span>
                  <textarea
                    value={item.payload.body}
                    onChange={(event) =>
                      onChange(
                        updateItem(items, item.contentItemId, (current) => ({
                          ...current,
                          payload:
                            current.payload.kind === "FACEBOOK"
                              ? {
                                  ...current.payload,
                                  body: event.target.value,
                                }
                              : current.payload,
                        })),
                      )
                    }
                  />
                </label>
                <label>
                  <span>Facebook caption</span>
                  <textarea
                    value={item.payload.caption}
                    onChange={(event) =>
                      onChange(
                        updateItem(items, item.contentItemId, (current) => ({
                          ...current,
                          payload:
                            current.payload.kind === "FACEBOOK"
                              ? {
                                  ...current.payload,
                                  caption: event.target.value,
                                }
                              : current.payload,
                        })),
                      )
                    }
                  />
                </label>
                <label>
                  <span>Engagement comments</span>
                  <textarea
                    value={item.payload.engagementComments.join("\n")}
                    onChange={(event) =>
                      onChange(
                        updateItem(items, item.contentItemId, (current) => ({
                          ...current,
                          payload:
                            current.payload.kind === "FACEBOOK"
                              ? {
                                  ...current.payload,
                                  engagementComments: event.target.value
                                    .split(/\r?\n/)
                                    .map((comment) => comment.trim())
                                    .filter(Boolean),
                                }
                              : current.payload,
                        })),
                      )
                    }
                  />
                </label>
              </>
            ) : (
              <label>
                <span>WhatsApp message</span>
                <textarea
                  value={item.payload.message}
                  onChange={(event) =>
                    onChange(
                      updateItem(items, item.contentItemId, (current) => ({
                        ...current,
                        payload:
                          current.payload.kind === "WHATSAPP"
                            ? {
                                ...current.payload,
                                message: event.target.value,
                              }
                            : current.payload,
                      })),
                    )
                  }
                />
              </label>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span>Call to action</span>
                <input
                  value={item.callToAction}
                  onChange={(event) =>
                    onChange(
                      updateItem(items, item.contentItemId, (current) => ({
                        ...current,
                        callToAction: event.target.value,
                      })),
                    )
                  }
                />
              </label>
              <label>
                <span>Hashtags</span>
                <input
                  value={item.hashtags.join(" ")}
                  onChange={(event) =>
                    onChange(
                      updateItem(items, item.contentItemId, (current) => ({
                        ...current,
                        hashtags: event.target.value
                          .split(/\s+/)
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      })),
                    )
                  }
                />
              </label>
            </div>

            <label>
              <span>Why this draft was generated</span>
              <textarea
                value={item.rationale}
                onChange={(event) =>
                  onChange(
                    updateItem(items, item.contentItemId, (current) => ({
                      ...current,
                      rationale: event.target.value,
                    })),
                  )
                }
              />
            </label>
          </div>
        </article>
      ))}
    </div>
  );
}
