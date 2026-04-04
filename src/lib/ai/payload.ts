import type { GeneratedChannelPayload } from "@/lib/ai/types";

export function parseChannelPayload(value: unknown): GeneratedChannelPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybePayload = value as Partial<GeneratedChannelPayload>;

  if (
    maybePayload.kind === "FACEBOOK" &&
    typeof maybePayload.body === "string" &&
    typeof maybePayload.caption === "string" &&
    Array.isArray(maybePayload.engagementComments)
  ) {
    return {
      kind: "FACEBOOK",
      body: maybePayload.body,
      caption: maybePayload.caption,
      engagementComments: maybePayload.engagementComments
        .map((comment) => String(comment).trim())
        .filter(Boolean),
    };
  }

  if (
    maybePayload.kind === "WHATSAPP" &&
    typeof maybePayload.message === "string"
  ) {
    return {
      kind: "WHATSAPP",
      message: maybePayload.message,
      buttons: Array.isArray(maybePayload.buttons)
        ? maybePayload.buttons.map((button) => String(button).trim()).filter(Boolean)
        : undefined,
    };
  }

  return null;
}

export function stringifyComments(comments: string[]) {
  return comments.map((comment) => comment.trim()).filter(Boolean).join("\n");
}

export function parseCommentText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function normalizeHashtagList(value: string[] | string) {
  const items = Array.isArray(value)
    ? value
    : value
        .split(/\r?\n|,|\s+/)
        .map((item) => item.trim())
        .filter(Boolean);

  return items
    .map((tag) => tag.replace(/^#*/, "").replace(/\s+/g, ""))
    .filter(Boolean)
    .map((tag) => `#${tag}`);
}
