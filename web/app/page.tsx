import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { onboardingProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TopNav } from "@/components/top-nav";
import { LibrarySections } from "./_library/sections";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LEVEL_INFO, SKILL_LABELS } from "@/lib/constants";
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

  const weakest = ctx.skills.length
    ? [...ctx.skills].sort((a, b) => a.score - b.score)[0]
    : null;
  const weeklyTarget = Math.max(3, Math.ceil((profile.dailyMinutes / 15) * 5));
  const weeklyDone = Math.min(weeklyTarget, completed.length);
  const info = LEVEL_INFO[profile.level];

  return (
    <div className="min-h-screen bg-stone-50">
      <TopNav active="home" />

      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero */}
        <section className="rounded-2xl brand-gradient text-white p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-0 dotted-bg opacity-20" />
          <div className="absolute -bottom-20 -right-10 size-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-white/85 text-sm">{greeting()},</p>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {session.user.name?.split(" ").slice(-1)[0] || "bạn"} 👋
                </h1>
                <p className="mt-2 text-white/85 max-w-md">
                  Hôm nay nên học khoảng {Math.max(1, Math.round(profile.dailyMinutes / 8))} bài để giữ nhịp tốt.
                </p>
              </div>
              <Badge className="bg-white/15 text-white border-white/20 backdrop-blur" variant="outline">
                <span className="font-bold">{profile.level}</span>
                <span className="opacity-80 ml-1.5">· {info.name}</span>
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <StatCard
                icon={<Trophy className="size-5" />}
                label="Bài hoàn thành"
                value={String(ctx.progress?.totalLessons ?? 0)}
                hint={completed.length > 0 ? `+${completed.length} tuần này` : "Chưa có"}
              />
              <StatCard
                icon={<Target className="size-5" />}
                label={weakest ? `Cần luyện: ${SKILL_LABELS[weakest.skill]}` : "Kỹ năng"}
                value={weakest ? `${weakest.score}%` : "—"}
              >
                {ctx.skills.slice(0, 3).map((s) => (
                  <div key={s.skill} className="flex items-center gap-2 text-xs">
                    <span className="w-20 truncate opacity-80">{SKILL_LABELS[s.skill]}</span>
                    <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full" style={{ width: `${s.score}%` }} />
                    </div>
                    <span className="opacity-80 w-7 text-right">{s.score}</span>
                  </div>
                ))}
              </StatCard>
              <StatCard
                icon={<Flame className="size-5" />}
                label="Tiến độ tuần"
                value={`${weeklyDone}/${weeklyTarget}`}
              >
                <div className="h-2 bg-white/15 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${(weeklyDone / weeklyTarget) * 100}%` }}
                  />
                </div>
              </StatCard>
            </div>
          </div>
        </section>

        <LibrarySections all={all} recommended={recommended} completed={completed} />
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="bg-white/10 border-white/20 backdrop-blur text-white shadow-none">
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm text-white/80 mb-2">
          {icon}
          {label}
        </div>
        <div className="text-3xl font-bold leading-none mb-1">{value}</div>
        {hint && <div className="text-xs text-white/70 mb-2">{hint}</div>}
        {children}
      </div>
    </Card>
  );
}

