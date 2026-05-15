import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Bell, Flame, HelpCircle, Search, Target } from "lucide-react";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { users, userProgress, onboardingProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AccountMenu } from "@/components/account-menu";
import { getTranslations } from "next-intl/server";

export async function TopNav() {
  const tNav = await getTranslations("nav");
  const session = await auth();
  if (!session?.user) return null;
  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  const [progress] = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, session.user.id))
    .limit(1);
  const [profile] = await db
    .select({ level: onboardingProfiles.level, targetLevel: onboardingProfiles.targetLevel })
    .from(onboardingProfiles)
    .where(eq(onboardingProfiles.userId, session.user.id))
    .limit(1);

  const homeHref = session.user.role === "admin" ? "/admin" : "/";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/auth" });
  }

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-stone-200">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        <Link href={homeHref} className="flex items-center shrink-0" title="Vibe English">
          <Logo size="sm" withSlogan />
        </Link>

        {/* Global search */}
        <form action="/" method="get" className="hidden md:flex relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
          <input
            type="search"
            name="q"
            placeholder="Tìm bài học, chủ đề..."
            className="h-9 w-full rounded-lg border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:bg-white"
          />
        </form>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {profile && (
            <Link
              href="/profile"
              className="hidden md:flex items-center gap-1.5 bg-brand-50 text-brand-700 px-2.5 py-1.5 rounded-full text-xs font-medium"
              title="Level hiện tại → target"
            >
              <Target className="size-3.5" />
              <span className="font-bold">{profile.level}</span>
              <span className="text-stone-400">→</span>
              <span className="font-bold">{profile.targetLevel}</span>
            </Link>
          )}
          <Link
            href="/profile"
            className="hidden sm:flex items-center gap-1.5 bg-orange-50 text-orange-700 px-2.5 py-1.5 rounded-full text-xs font-medium"
            title={tNav("streak")}
          >
            <Flame className="size-3.5" />
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
