import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { getCurrentUser, requireSession } from "@/lib/auth/session";
import { humanizeEnum } from "@/lib/utils";
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
    <div className="min-h-screen md:flex">
      <SidebarNav user={resolvedUser} />
      <div className="flex-1">
        <header className="border-b border-[color:var(--border)] px-4 py-4 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
                Marketing Control Center
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold text-[color:var(--foreground)]">
                Keep campaigns aligned, timely, and easier to ship.
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="muted">{humanizeEnum(resolvedUser.role)}</Badge>
              <form action={signOutAction}>
                <SubmitButton
                  pendingLabel="Signing out..."
                  className="bg-[color:var(--accent)] text-[color:#1f1a12] hover:bg-[color:#bd7d26]"
                >
                  Sign out
                </SubmitButton>
              </form>
            </div>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
