import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { onboardingProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { TopNav } from "@/components/top-nav";
import { LibrarySections } from "./_library/sections";
import { LessonCarousel } from "@/components/lesson-carousel";
import { CategoryTiles } from "./_library/category-tiles";
import { Button } from "@/components/ui/button";
import { greetingKey } from "@/lib/utils";
import {
  getCompletedLessons,
  getPublishedLessons,
  getRecommendedLessons,
  getInProgressLessons,
  getUserContext,
  getAllCategories,
} from "@/lib/data";
import { ArrowRight, Flame, Sparkles, Trophy, Target, Play, GraduationCap, Compass } from "lucide-react";
// Compass is used below as carousel icon for "Explore more"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
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
  const [all, recommended, completed, categories, inProgress] = await Promise.all([
    getPublishedLessons(),
    getRecommendedLessons(session.user.id, profile.level, 6),
    getCompletedLessons(session.user.id),
    getAllCategories(),
    getInProgressLessons(session.user.id, 6),
  ]);

  const tHome = await getTranslations("home");
  const tGreeting = await getTranslations("greeting");
  const tCefr = await getTranslations("cefr");

  const firstName = session.user.name?.split(" ").slice(-1)[0] || tGreeting("you");
  const weeklyTarget = Math.max(3, Math.ceil((profile.dailyMinutes / 15) * 5));
  const weeklyDone = Math.min(weeklyTarget, completed.length);
  const levelName = tCefr(`${profile.level}.name`);
  const todayN = Math.max(1, Math.round(profile.dailyMinutes / 8));

  // Filter "by level" + "explore more" rows derived from `all`
  const completedIds = new Set(completed.map((c) => c.id));
  const recommendedIds = new Set(recommended.map((r) => r.id));
  const inProgressIds = new Set(inProgress.map((p) => p.id));
  const byLevel = all
    .filter(
      (l) =>
        l.level === profile.level &&
        !completedIds.has(l.id) &&
        !recommendedIds.has(l.id) &&
        !inProgressIds.has(l.id)
    )
    .slice(0, 8);
  const exploreMore = all
    .filter(
      (l) =>
        !completedIds.has(l.id) &&
        !recommendedIds.has(l.id) &&
        !inProgressIds.has(l.id) &&
        !byLevel.some((b) => b.id === l.id)
    )
    .slice(0, 8);

  const ctaTarget =
    inProgress[0]?.id
      ? `/lessons/${inProgress[0].id}/study`
      : recommended[0]?.id
        ? `/lessons/${recommended[0].id}`
        : "#all";

  return (
    <div className="min-h-screen bg-white">
      <TopNav />

      {/* ============================ HERO (2-col, Coursera style) ============================ */}
      <section className="border-b border-ink-200 bg-white">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-14 items-center">
            {/* Left */}
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                <Sparkles className="size-3.5" />
                {tGreeting(greetingKey())}, {firstName}
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight text-ink-900">
                {tHome("heroCallout")}
              </h1>
              <p className="text-base md:text-lg text-ink-500 max-w-xl leading-relaxed">
                {tHome("heroCalloutSubtitle")}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button asChild size="lg" className="bg-brand-700 hover:bg-brand-800">
                  <Link href={ctaTarget}>
                    <Play className="size-4" /> {tHome("heroCalloutCta")}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <span className="text-sm text-ink-500">
                  {tHome("levelToTarget", {
                    level: profile.level,
                    name: levelName,
                    target: profile.targetLevel,
                  })}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-4">
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

            {/* Right — decorative illustration block (gradient + floating cards) */}
            <div className="relative hidden lg:block">
              <div className="aspect-[5/4] rounded-2xl brand-gradient relative overflow-hidden shadow-card">
                <div className="dotted-bg absolute inset-0 opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white/95 text-center px-8">
                    <GraduationCap className="size-16 mx-auto mb-3 drop-shadow-sm" />
                    <p className="text-2xl font-bold tracking-tight">Vibe English</p>
                    <p className="text-sm opacity-90 mt-1">
                      {profile.level} → {profile.targetLevel}
                    </p>
                  </div>
                </div>
              </div>
              {/* Floating accent cards */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-card-hover p-3 flex items-center gap-2 border border-ink-100">
                <div className="size-9 rounded-lg bg-success-50 flex items-center justify-center">
                  <Flame className="size-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-ink-400 font-semibold">
                    {tHome("statStreak")}
                  </div>
                  <div className="text-sm font-bold text-ink-900">
                    {tHome("streakDays", { n: ctx.progress?.streakDays ?? 0 })}
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-card-hover p-3 flex items-center gap-2 border border-ink-100">
                <div className="size-9 rounded-lg bg-brand-50 flex items-center justify-center">
                  <Trophy className="size-5 text-brand-700" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-ink-400 font-semibold">
                    {tHome("statLearned")}
                  </div>
                  <div className="text-sm font-bold text-ink-900 tabular-nums">
                    {ctx.progress?.totalLessons ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-14">
        {/* Continue learning */}
        {inProgress.length > 0 && (
          <LessonCarousel
            title={tHome("continueLearning")}
            subtitle={tHome("continueLearningSubtitle")}
            icon={<Play className="size-6 text-brand-700" />}
            lessons={inProgress}
          />
        )}

        {/* Recommended */}
        {recommended.length > 0 && (
          <LessonCarousel
            title={tHome("recommended")}
            subtitle={tHome("recommendedSubtitle")}
            icon={<Sparkles className="size-6 text-brand-700" />}
            lessons={recommended}
            showRecommendationBar
          />
        )}

        {/* By level */}
        {byLevel.length > 0 && (
          <LessonCarousel
            title={tHome("byLevel", { level: profile.level })}
            subtitle={tHome("byLevelSubtitle")}
            icon={<GraduationCap className="size-6 text-brand-700" />}
            lessons={byLevel}
          />
        )}

        {/* Browse by topic — tile grid + master modal */}
        <CategoryTiles all={all} categories={categories} />

        {/* Explore more */}
        {exploreMore.length > 0 && (
          <LessonCarousel
            title={tHome("exploreMore")}
            subtitle={tHome("exploreMoreSubtitle")}
            icon={<Compass className="size-6 text-brand-700" />}
            lessons={exploreMore}
          />
        )}

        {/* All lessons with filter (keeps power-user filtering) */}
        <div id="all">
          <LibrarySections
            all={all}
            recommended={[]}
            completed={completed}
            categories={categories}
            initialSearch={sp.q ?? ""}
            initialCategory={sp.cat ?? "all"}
            hideTopChips
            hideRecommended
          />
        </div>
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
