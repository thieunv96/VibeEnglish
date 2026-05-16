import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { onboardingProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { TopNav } from "@/components/top-nav";
import { LibrarySections } from "./_library/sections";
import { greetingKey } from "@/lib/utils";
import {
  getCompletedLessons,
  getPublishedLessons,
  getRecommendedLessons,
  getUserContext,
  getAllCategories,
} from "@/lib/data";
import { Flame, Trophy, Target } from "lucide-react";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  if (session.user.role === "admin") redirect("/admin");

  const [profile] = await db
    .select()
    .from(onboardingProfiles)
    .where(eq(onboardingProfiles.userId, session.user.id))
    .limit(1);
  if (!profile?.completedAt) redirect("/onboarding");

  const sp = await searchParams;
  const ctx = await getUserContext(session.user.id);
  const [all, recommended, completed, categories] = await Promise.all([
    getPublishedLessons(),
    getRecommendedLessons(session.user.id, profile.level, 3),
    getCompletedLessons(session.user.id),
    getAllCategories(),
  ]);

  const tHome = await getTranslations("home");
  const tGreeting = await getTranslations("greeting");
  const tCefr = await getTranslations("cefr");

  const firstName = session.user.name?.split(" ").slice(-1)[0] || tGreeting("you");
  const weeklyTarget = Math.max(3, Math.ceil((profile.dailyMinutes / 15) * 5));
  const weeklyDone = Math.min(weeklyTarget, completed.length);
  const levelName = tCefr(`${profile.level}.name`);
  const todayN = Math.max(1, Math.round(profile.dailyMinutes / 8));

  return (
    <div className="min-h-screen bg-white">
      <TopNav />

      {/* Coursera-style hero band with soft brand gradient backdrop */}
      <section className="border-b border-ink-200 brand-gradient-soft">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-ink-900">
                {tGreeting(greetingKey())}, {firstName}{" "}
                <span aria-hidden>👋</span>
              </h1>
              <p className="mt-2 text-sm md:text-base text-ink-500 max-w-2xl">
                {tHome("levelToTarget", { level: profile.level, name: levelName, target: profile.targetLevel })}
                {" · "}
                {tHome("todayGoal", { n: todayN })}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <StatChip
                icon={<Trophy className="size-3.5 text-brand-700" />}
                label={tHome("statLearned")}
                value={String(ctx.progress?.totalLessons ?? 0)}
              />
              <StatChip
                icon={<Flame className="size-3.5 text-orange-500" />}
                label={tHome("statStreak")}
                value={tHome("streakDays", { n: ctx.progress?.streakDays ?? 0 })}
              />
              <StatChip
                icon={<Target className="size-3.5 text-success-600" />}
                label={tHome("statWeek")}
                value={`${weeklyDone}/${weeklyTarget}`}
              />
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-10">
        <LibrarySections
          all={all}
          recommended={recommended}
          completed={completed}
          categories={categories}
          initialSearch={sp.q ?? ""}
        />
      </main>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1.5 shadow-card">
      {icon}
      <span className="text-xs text-ink-500">{label}</span>
      <span className="text-sm font-semibold text-ink-900 tabular-nums">{value}</span>
    </div>
  );
}
