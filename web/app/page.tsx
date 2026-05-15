import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { onboardingProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TopNav } from "@/components/top-nav";
import { LibrarySections } from "./_library/sections";
import { Badge } from "@/components/ui/badge";
import { LEVEL_INFO } from "@/lib/constants";
import { greeting } from "@/lib/utils";
import {
  getCompletedLessons,
  getPublishedLessons,
  getRecommendedLessons,
  getUserContext,
} from "@/lib/data";
import { Flame, Trophy, Target } from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  if (session.user.role === "admin") redirect("/admin");

  const [profile] = await db
    .select()
    .from(onboardingProfiles)
    .where(eq(onboardingProfiles.userId, session.user.id))
    .limit(1);
  if (!profile?.completedAt) redirect("/onboarding");

  const ctx = await getUserContext(session.user.id);
  const [all, recommended, completed] = await Promise.all([
    getPublishedLessons(),
    getRecommendedLessons(session.user.id, profile.level, 3),
    getCompletedLessons(session.user.id),
  ]);

  const firstName = session.user.name?.split(" ").slice(-1)[0] || "bạn";
  const weeklyTarget = Math.max(3, Math.ceil((profile.dailyMinutes / 15) * 5));
  const weeklyDone = Math.min(weeklyTarget, completed.length);
  const info = LEVEL_INFO[profile.level];

  return (
    <div className="min-h-screen bg-stone-50">
      <TopNav />

      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Compact hero strip */}
        <section className="rounded-xl brand-gradient text-white px-5 py-3 flex items-center gap-5 flex-wrap relative overflow-hidden">
          <div className="absolute inset-0 dotted-bg opacity-15 pointer-events-none" />
          <div className="relative flex items-baseline gap-2 min-w-0">
            <span className="text-sm text-white/80 truncate">{greeting()},</span>
            <span className="font-bold text-base md:text-lg truncate">{firstName} 👋</span>
          </div>
          <Badge className="relative bg-white/15 text-white border-white/20" variant="outline">
            <span className="font-bold">{profile.level}</span>
            <span className="opacity-80 ml-1.5">· {info.name}</span>
          </Badge>
          <div className="relative ml-auto flex items-center gap-4 text-xs text-white/90">
            <HeroChip icon={<Trophy className="size-3.5" />}>
              <span className="opacity-80">Đã học:</span> <b className="text-white">{ctx.progress?.totalLessons ?? 0}</b>
            </HeroChip>
            <HeroChip icon={<Flame className="size-3.5" />}>
              <span className="opacity-80">Streak:</span> <b className="text-white">{ctx.progress?.streakDays ?? 0}</b>
            </HeroChip>
            <HeroChip icon={<Target className="size-3.5" />}>
              <span className="opacity-80">Tuần:</span> <b className="text-white">{weeklyDone}/{weeklyTarget}</b>
            </HeroChip>
          </div>
        </section>

        <LibrarySections all={all} recommended={recommended} completed={completed} />
      </main>
    </div>
  );
}

function HeroChip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      {icon}
      {children}
    </span>
  );
}
