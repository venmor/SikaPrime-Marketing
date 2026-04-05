"use client";

import { useActionState, useState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import {
  createInviteAction,
  createPasswordResetLinkAction,
} from "@/server/actions/access";

const initialLinkActionState = {
  status: "idle" as const,
  message: null,
  link: null,
};

function ResultPanel({
  message,
  link,
}: {
  message: string | null;
  link: string | null;
}) {
  const [copied, setCopied] = useState(false);

  if (!message && !link) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4 text-sm">
      {message ? (
        <p className="font-medium text-[color:var(--foreground)]">{message}</p>
      ) : null}
      {link ? (
        <div className="mt-3 flex flex-col gap-3">
          <input readOnly value={link} className="bg-surface-strong text-xs" />
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-surface-strong px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] shadow-sm hover:-translate-y-0.5 hover:shadow-md"
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function InviteIssuerForm() {
  const [state, formAction] = useActionState(
    createInviteAction,
    initialLinkActionState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span>Full name</span>
          <input name="name" placeholder="Martha Phiri" required />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" placeholder="martha@sikaprime.com" required />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span>Job title</span>
          <input name="jobTitle" placeholder="Marketing Coordinator" required />
        </label>
        <label>
          <span>Role</span>
          <select name="role" defaultValue="CREATOR" required>
            <option value="ADMIN">Admin</option>
            <option value="STRATEGIST">Strategist</option>
            <option value="CREATOR">Creator</option>
            <option value="REVIEWER">Reviewer</option>
            <option value="ANALYST">Analyst</option>
          </select>
        </label>
      </div>
      <SubmitButton pendingLabel="Generating invite...">
        Create invite email or link
      </SubmitButton>
      <ResultPanel message={state.message} link={state.link} />
    </form>
  );
}

export function PasswordResetIssuerForm({
  userId,
}: {
  userId: string;
}) {
  const [state, formAction] = useActionState(
    createPasswordResetLinkAction,
    initialLinkActionState,
  );

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton pendingLabel="Creating link..." variant="secondary">
        Send reset email or link
      </SubmitButton>
      <ResultPanel message={state.message} link={state.link} />
    </form>
  );
}
