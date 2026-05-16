import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { onboardingProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { TopNav } from "@/components/top-nav";
import { LibrarySections } from "./_library/sections";
import { LessonCarousel } from "@/components/lesson-carousel";
import { CategoryTiles } from "./_library/category-tiles";
import {
  getCompletedLessons,
  getPublishedLessons,
  getRecommendedLessons,
  getInProgressLessons,
  getUserContext,
  getAllCategories,
} from "@/lib/data";

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
  await getUserContext(session.user.id); // populate session-side caches if any
  const [all, recommended, completed, categories, inProgress] = await Promise.all([
    getPublishedLessons(),
    getRecommendedLessons(session.user.id, profile.level, 8),
    getCompletedLessons(session.user.id),
    getAllCategories(),
    getInProgressLessons(session.user.id, 8),
  ]);

  const tHome = await getTranslations("home");
  const tGreeting = await getTranslations("greeting");
  const tCefr = await getTranslations("cefr");

  const firstName = session.user.name?.split(" ").slice(-1)[0] || tGreeting("you");
  const levelName = tCefr(`${profile.level}.name`);
  const todayN = Math.max(1, Math.round(profile.dailyMinutes / 8));

  // Map for fast id → category lookup (used by LessonCard partner row)
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Derived row buckets — keep them mutually exclusive so a lesson doesn't appear in 3 sections.
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
    .slice(0, 10);
  const byLevelIds = new Set(byLevel.map((b) => b.id));
  const exploreMore = all
    .filter(
      (l) =>
        !completedIds.has(l.id) &&
        !recommendedIds.has(l.id) &&
        !inProgressIds.has(l.id) &&
        !byLevelIds.has(l.id)
    )
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-white">
      <TopNav />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-12">
        {/* H1 personalized greeting — Coursera pattern: no hero, just a heading then content */}
        <header className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink-900">
            {tHome("greetingPersonalized", { name: firstName })}
          </h1>
          <p className="text-sm text-ink-500">
            {tHome("greetingMeta", {
              level: profile.level,
              name: levelName,
              target: profile.targetLevel,
              n: todayN,
            })}
          </p>
        </header>

        {/* Continue learning (if any) */}
        {inProgress.length > 0 && (
          <LessonCarousel
            title={tHome("continueLearning")}
            lessons={inProgress}
            categoryMap={categoryMap}
          />
        )}

        {/* Recommended */}
        {recommended.length > 0 && (
          <LessonCarousel
            title={tHome("recommended")}
            lessons={recommended}
            showRecommendationBar
            statusBadge={tHome("topRecommended")}
            categoryMap={categoryMap}
          />
        )}

        {/* By level */}
        {byLevel.length > 0 && (
          <LessonCarousel
            title={tHome("byLevel", { level: profile.level })}
            lessons={byLevel}
            categoryMap={categoryMap}
          />
        )}

        {/* Browse by topic — tile grid + master modal (Coursera "Categories" idiom) */}
        <CategoryTiles all={all} categories={categories} />

        {/* Explore more */}
        {exploreMore.length > 0 && (
          <LessonCarousel
            title={tHome("exploreMore")}
            lessons={exploreMore}
            categoryMap={categoryMap}
          />
        )}

        {/* All lessons with power-filter (collapsed below; not part of the Coursera idiom but useful) */}
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
