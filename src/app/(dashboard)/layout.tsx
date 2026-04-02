import { ShellChrome } from "@/components/layout/shell-chrome";
import { SubmitButton } from "@/components/ui/submit-button";
import { getCurrentUser, requireSession } from "@/lib/auth/session";
import { signOutAction } from "@/server/actions/auth";

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

  return (
    <ShellChrome
      user={resolvedUser}
      accountActions={
        <form action={signOutAction}>
          <SubmitButton pendingLabel="Signing out..." variant="secondary" className="w-full">
            Sign out
          </SubmitButton>
        </form>
      }
    >
      {children}
    </ShellChrome>
  );
}
