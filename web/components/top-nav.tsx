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
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3 lg:gap-5">
        <Link href={homeHref} className="flex items-center shrink-0" title="Vibe English">
          <Logo size="sm" withSlogan />
        </Link>

        {/* Center nav links — Coursera pattern: Khám phá · Việc học của tôi */}
        <nav className="hidden lg:flex items-center gap-1 shrink-0">
          <Link
            href="/"
            className="px-3 py-2 text-sm font-medium text-ink-700 hover:text-brand-700 rounded-md hover:bg-ink-50 transition-colors"
          >
            {tNav("discover")}
          </Link>
          <Link
            href="/profile"
            className="px-3 py-2 text-sm font-medium text-ink-700 hover:text-brand-700 rounded-md hover:bg-ink-50 transition-colors"
          >
            {tNav("myLearning")}
          </Link>
        </nav>

        {/* Global search — pill style with rounded ends, blue search button on the right (Coursera) */}
        <form action={homeHref} method="get" className="hidden md:flex relative flex-1 max-w-2xl">
          <input
            type="search"
            name="q"
            placeholder={tNav("search")}
            className="h-10 w-full rounded-full border border-ink-300 bg-white pl-5 pr-12 text-sm placeholder:text-ink-400 focus-visible:outline-none focus-visible:border-brand-700 focus-visible:ring-2 focus-visible:ring-brand-700/20"
          />
          <button
            type="submit"
            aria-label={tNav("search")}
            className="absolute right-1 top-1/2 -translate-y-1/2 size-8 inline-flex items-center justify-center rounded-full bg-brand-700 text-white hover:bg-brand-800 transition-colors"
          >
            <Search className="size-4" />
          </button>
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
