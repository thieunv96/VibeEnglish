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
        {/* Plain hero — greeting + level summary + big stat cards */}
        <section className="space-y-4">
          <div>
            <p className="text-sm text-stone-500">{greeting()},</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900">
              {firstName} <span aria-hidden>👋</span>
            </h1>
            <p className="mt-1.5 text-sm text-stone-500">
              Mục tiêu hôm nay: học khoảng{" "}
              <span className="font-semibold text-stone-700">
                {Math.max(1, Math.round(profile.dailyMinutes / 8))} bài
              </span>{" "}
              · Level{" "}
              <span className="font-semibold text-brand-700">{profile.level}</span>{" "}
              ({info.name}) → mục tiêu{" "}
              <span className="font-semibold text-brand-700">{profile.targetLevel}</span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl">
            <BigStat
              icon={<Trophy className="size-5 text-brand-600" />}
              label="Đã học"
              value={String(ctx.progress?.totalLessons ?? 0)}
              hint="bài"
            />
            <BigStat
              icon={<Flame className="size-5 text-orange-500" />}
              label="Streak"
              value={String(ctx.progress?.streakDays ?? 0)}
              hint="ngày liên tiếp"
            />
            <BigStat
              icon={<Target className="size-5 text-emerald-600" />}
              label="Tuần này"
              value={`${weeklyDone}/${weeklyTarget}`}
              hint={`mục tiêu ${weeklyTarget} bài`}
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

function BigStat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex items-center gap-2 text-xs text-stone-500 mb-1.5 font-medium">
        {icon}
        {label}
      </div>
      <div className="text-2xl sm:text-3xl font-bold leading-none text-stone-900 tabular-nums">{value}</div>
      <div className="text-[11px] text-stone-400 mt-1">{hint}</div>
    </div>
  );
}
