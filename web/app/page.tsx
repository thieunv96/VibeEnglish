import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { onboardingProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TopNav } from "@/components/top-nav";
import { LibrarySections } from "./_library/sections";
import { LEVEL_INFO } from "@/lib/constants";
import { greeting } from "@/lib/utils";
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

  const firstName = session.user.name?.split(" ").slice(-1)[0] || "bạn";
  const weeklyTarget = Math.max(3, Math.ceil((profile.dailyMinutes / 15) * 5));
  const weeklyDone = Math.min(weeklyTarget, completed.length);
  const info = LEVEL_INFO[profile.level];

  return (
    <div className="min-h-screen bg-stone-50">
      <TopNav />

      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Plain hero — greeting + 3 inline stat chips on one row */}
        <section className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900 truncate">
              {greeting()}, {firstName} <span aria-hidden>👋</span>
            </h1>
            <p className="mt-0.5 text-xs text-stone-500 truncate">
              <span className="font-semibold text-brand-700">{profile.level}</span> ({info.name}) → mục tiêu{" "}
              <span className="font-semibold text-brand-700">{profile.targetLevel}</span> · Hôm nay học{" "}
              {Math.max(1, Math.round(profile.dailyMinutes / 8))} bài
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <StatChip
              icon={<Trophy className="size-3.5 text-brand-600" />}
              label="Đã học"
              value={String(ctx.progress?.totalLessons ?? 0)}
            />
            <StatChip
              icon={<Flame className="size-3.5 text-orange-500" />}
              label="Streak"
              value={`${ctx.progress?.streakDays ?? 0} ngày`}
            />
            <StatChip
              icon={<Target className="size-3.5 text-emerald-600" />}
              label="Tuần"
              value={`${weeklyDone}/${weeklyTarget}`}
            />
          </div>
        </section>

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
    <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5">
      {icon}
      <span className="text-xs text-stone-500">{label}</span>
      <span className="text-sm font-semibold text-stone-900 tabular-nums">{value}</span>
    </div>
  );
}
