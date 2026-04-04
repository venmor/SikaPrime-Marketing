import Link from "next/link";

import { getAssistantHomeSnapshot } from "@/lib/assistant/service";
import { ShellChrome } from "@/components/layout/shell-chrome";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  canGenerateContent,
  canManageAccess,
  canReviewContent,
} from "@/lib/auth/access";
import { getCurrentUser, requireSession } from "@/lib/auth/session";
import { signOutAction } from "@/server/actions/session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();
  const user = await getCurrentUser();

  const resolvedUser = user ?? {
    name: session.name,
    role: session.role,
    jobTitle: "Team Member",
    avatarSeed: "fallback",
  };
  const assistantSnapshot =
    canGenerateContent(resolvedUser.role) || canReviewContent(resolvedUser.role)
      ? await getAssistantHomeSnapshot({
          userId: session.userId,
          role: resolvedUser.role,
        })
      : null;

  return (
    <ShellChrome
      user={resolvedUser}
      assistantSnapshot={assistantSnapshot}
      accountActions={
        <div className="flex flex-col gap-3">
          {canManageAccess(resolvedUser.role) ? (
            <Link
              href="/access"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] shadow-sm hover:-translate-y-0.5 hover:shadow-md"
            >
              Access control
            </Link>
          ) : null}
          <form action={signOutAction}>
            <SubmitButton pendingLabel="Signing out..." variant="secondary" className="w-full">
              Sign out
            </SubmitButton>
          </form>
        </div>
      }
    >
      {children}
    </ShellChrome>
  );
}
