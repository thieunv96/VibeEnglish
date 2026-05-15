import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Bell, Flame, HelpCircle } from "lucide-react";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { users, userProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AccountMenu } from "@/components/account-menu";
import { getTranslations } from "next-intl/server";

export async function TopNav({ active }: { active?: "home" | "profile" }) {
  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const session = await auth();
  if (!session?.user) return null;
  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  const [progress] = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, session.user.id))
    .limit(1);

  const homeHref = session.user.role === "admin" ? "/admin" : "/";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/auth" });
  }

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-stone-200">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link href={homeHref} className="flex items-center gap-3" title={tCommon("tagline")}>
          <Logo size="sm" />
          <span className="hidden md:block text-xs text-stone-400 ml-1">{tCommon("tagline")}</span>
        </Link>

        <nav className="ml-6 hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            href="/"
            className={`px-3 py-2 rounded-lg transition ${
              active === "home" ? "text-brand-700 bg-brand-50" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {tNav("library")}
          </Link>
          <Link
            href="/profile"
            className={`px-3 py-2 rounded-lg transition ${
              active === "profile" ? "text-brand-700 bg-brand-50" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {tNav("profile")}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/profile"
            className="hidden sm:flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-sm font-medium"
            title={tNav("streak")}
          >
            <Flame className="size-4" />
            {progress?.streakDays ?? 0}
          </Link>
          <Link href="/help" className="text-stone-400 hover:text-stone-600" title={tNav("help")}>
            <HelpCircle className="size-5" />
          </Link>
          <button className="text-stone-400 hover:text-stone-600 relative" title={tNav("notifications")}>
            <Bell className="size-5" />
            <span className="absolute -top-0.5 -right-0.5 size-2 bg-red-500 rounded-full" />
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
