import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Bell, HelpCircle, Search } from "lucide-react";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AccountMenu } from "@/components/account-menu";
import { getTranslations } from "next-intl/server";

export async function TopNav() {
  const tNav = await getTranslations("nav");
  const session = await auth();
  if (!session?.user) return null;
  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);

  const homeHref = session.user.role === "admin" ? "/admin" : "/";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/auth" });
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-ink-200">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4 lg:gap-6">
        <Link href={homeHref} className="flex items-center shrink-0" title="Vibe English">
          <Logo size="sm" withSlogan />
        </Link>

        {/* Global search — center, takes available width */}
        <form action={homeHref} method="get" className="hidden md:flex relative flex-1 max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-[18px] text-ink-400" />
          <input
            type="search"
            name="q"
            placeholder={tNav("search")}
            className="h-10 w-full rounded-md border border-ink-200 bg-white pl-10 pr-3 text-sm placeholder:text-ink-400 focus-visible:outline-none focus-visible:border-brand-700 focus-visible:ring-2 focus-visible:ring-brand-700/20"
          />
        </form>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/help"
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-500 hover:text-ink-900 hover:bg-ink-50"
            title={tNav("help")}
          >
            <HelpCircle className="size-[18px]" />
          </Link>
          <button
            className="relative h-9 w-9 inline-flex items-center justify-center rounded-md text-ink-500 hover:text-ink-900 hover:bg-ink-50"
            title={tNav("notifications")}
          >
            <Bell className="size-[18px]" />
            <span className="absolute top-2 right-2 size-1.5 bg-danger-500 rounded-full" />
          </button>
          <AccountMenu
            name={user?.name ?? null}
            email={session.user.email}
            avatarSrc={user?.avatarData ?? user?.image ?? null}
            locale={(user?.locale ?? "vi") as "vi" | "en"}
            isAdmin={false}
            signOutAction={handleSignOut}
          />
        </div>
      </div>
    </header>
  );
}

export function LevelBadge({ level }: { level: string }) {
  return <Badge variant="brand">{level}</Badge>;
}
