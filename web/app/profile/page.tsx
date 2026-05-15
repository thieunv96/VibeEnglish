import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TopNav } from "@/components/top-nav";
import { db } from "@/db";
import { users, onboardingProfiles, lessonAttempts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getRecentAttempts, getUserBadges, getUserContext } from "@/lib/data";
import { CEFR_LEVELS } from "@/lib/constants";
import { Flame, Trophy, Clock, Pencil } from "lucide-react";
import { Heatmap } from "./heatmap";
import { ProfileAvatar } from "./profile-avatar";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const [profile] = await db.select().from(onboardingProfiles).where(eq(onboardingProfiles.userId, session.user.id)).limit(1);
  if (!profile?.completedAt) redirect("/onboarding");

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  const ctx = await getUserContext(session.user.id);
  const recent = await getRecentAttempts(session.user.id, 8);
  const badges = await getUserBadges(session.user.id);

  // Activity for last 120 days (heatmap)
  const since = new Date(Date.now() - 120 * 86400000);
  const attempts = await db
    .select()
    .from(lessonAttempts)
    .where(and(eq(lessonAttempts.userId, session.user.id), eq(lessonAttempts.status, "completed")));
  const activityByDay: Record<string, number> = {};
  for (const a of attempts) {
    if (!a.completedAt) continue;
    const d = a.completedAt.toISOString().slice(0, 10);
    activityByDay[d] = (activityByDay[d] ?? 0) + 1;
  }

  const t = await getTranslations("profile");
  const tSkills = await getTranslations("skills");
  const tCefr = await getTranslations("cefr");
  const locale = await getLocale();
  const currentIdx = CEFR_LEVELS.indexOf(profile.level);
  const targetIdx = CEFR_LEVELS.indexOf(profile.targetLevel);
  const nextLevel = CEFR_LEVELS[Math.min(currentIdx + 1, CEFR_LEVELS.length - 1)];
  // Phase 1: simple level-up progress based on totalLessons
  const lessonsNeededForLevelUp = 20;
  const progressInLevel = Math.min(100, Math.round((((ctx.progress?.totalLessons ?? 0) % lessonsNeededForLevelUp) / lessonsNeededForLevelUp) * 100));

  const accuracy = attempts.length === 0
    ? 0
    : Math.round((attempts.filter((a) => (a.score ?? 0) >= 70).length / attempts.length) * 100);

  return (
    <div className="min-h-screen bg-stone-50">
      <TopNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Hero */}
        <section className="rounded-2xl brand-gradient text-white p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-0 dotted-bg opacity-15" />
          <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="relative">
              <ProfileAvatar
                name={user?.name ?? session.user.name ?? null}
                email={session.user.email}
                avatarSrc={user?.avatarData ?? user?.image ?? null}
              />
              <Badge className="absolute -bottom-1 -right-1 bg-white text-brand-700 border-white">
                {profile.level}
              </Badge>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{session.user.name ?? session.user.email}</h1>
              <p className="text-white/80 text-sm mt-0.5">{t("joinedYear", { name: tCefr(`${profile.level}.name`), year: new Date().getFullYear() })}</p>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl">
                <Stat label={t("statsLearned")} value={String(ctx.progress?.totalLessons ?? 0)} />
                <Stat label={t("statsHours")} value={`${Math.round((ctx.progress?.totalMinutes ?? 0) / 60)}h`} />
                <Stat label={t("statsBadges")} value={String(badges.filter((b) => b.earned).length)} />
                <Stat label={t("statsStreak")} value={`${ctx.progress?.streakDays ?? 0}🔥`} />
              </div>
            </div>

            <div className="flex gap-2 md:flex-col">
              <Button asChild variant="outline" className="bg-white/15 border-white/20 text-white hover:bg-white/25 hover:text-white">
                <Link href="/settings"><Pencil className="size-3.5" /> {t("edit")}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Level progress */}
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold">{t("levelProgress")}</div>
              <div className="text-xs text-stone-500">
                {profile.level} → {nextLevel}{" "}
                {targetIdx > currentIdx && (
                  <>· Target: <span className="text-brand-700 font-medium">{profile.targetLevel}</span></>
                )}
              </div>
            </div>
            <div className="text-2xl font-bold text-brand-600">{progressInLevel}%</div>
          </div>
          <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-[width] duration-700" style={{ width: `${progressInLevel}%` }} />
          </div>
          <p className="mt-2 text-xs text-stone-500">
            {t("needMore", { n: lessonsNeededForLevelUp - ((ctx.progress?.totalLessons ?? 0) % lessonsNeededForLevelUp), next: nextLevel })}
          </p>
        </section>

        {/* Skills + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <h3 className="font-bold mb-3">{t("skills")}</h3>
            <div className="space-y-3">
              {[...ctx.skills]
                .sort((a, b) => a.score - b.score)
                .map((s, idx) => {
                  const isWeakest = idx === 0;
                  return (
                    <div key={s.skill}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium flex items-center gap-2">
                          {tSkills(s.skill)}
                          {isWeakest && <Badge variant="warning">{t("needPractice")}</Badge>}
                        </span>
                        <span className="text-stone-600 font-medium">{s.score}</span>
                      </div>
                      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isWeakest ? "bg-amber-500" : "bg-brand-500"}`}
                          style={{ width: `${s.score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <h3 className="font-bold mb-3">{t("statsTitle")}</h3>
            <div className="grid grid-cols-2 gap-3">
              <Tile icon={<Trophy className="size-4 text-amber-500" />} label={t("statsLearned")} value={String(ctx.progress?.totalLessons ?? 0)} />
              <Tile icon={<Trophy className="size-4 text-emerald-500" />} label={t("accuracy")} value={`${accuracy}%`} />
              <Tile icon={<Clock className="size-4 text-brand-500" />} label={t("totalTime")} value={`${Math.round((ctx.progress?.totalMinutes ?? 0) / 60)}h${(ctx.progress?.totalMinutes ?? 0) % 60}m`} />
              <Tile icon={<Flame className="size-4 text-orange-500" />} label={t("totalXp")} value={String(ctx.progress?.xp ?? 0)} />
            </div>
          </section>
        </div>

        {/* Heatmap */}
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">{t("activity")}</h3>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span>{t("less")}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className={`size-3 rounded-sm bg-brand-${i * 200}`} style={{ background: i === 1 ? "#ede9fe" : i === 2 ? "#c4b5fd" : i === 3 ? "#8b5cf6" : "#6d28d9" }} />
                ))}
              </div>
              <span>{t("more")}</span>
            </div>
          </div>
          <Heatmap activity={activityByDay} />
        </section>

        {/* Badges */}
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h3 className="font-bold mb-3">{t("badges")}</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {badges.map((b) => (
              <div key={b.id} className={`text-center ${b.earned ? "" : "opacity-30 grayscale"}`} title={b.description}>
                <div className="size-12 mx-auto rounded-full bg-brand-100 flex items-center justify-center text-2xl mb-1">
                  {b.icon}
                </div>
                <div className="text-xs font-medium truncate">{b.title}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent activity */}
        {recent.length > 0 && (
          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <h3 className="font-bold mb-3">{t("history")}</h3>
            <div className="divide-y divide-stone-100">
              {recent.map((a) => (
                <Link key={a.id} href={`/lessons/${a.lessonId}`} className="flex items-center gap-3 py-2.5 hover:bg-stone-50 -mx-2 px-2 rounded-md transition">
                  <div className="size-9 rounded-lg bg-stone-100 flex items-center justify-center text-sm">
                    📘
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.lesson?.title ?? t("lessonDeleted")}</div>
                    <div className="text-xs text-stone-500">
                      {a.completedAt ? new Date(a.completedAt).toLocaleDateString(locale === "en" ? "en-US" : "vi-VN") : t("inProgress")}
                    </div>
                  </div>
                  {a.score != null && (
                    <Badge variant={a.score >= 80 ? "success" : a.score >= 60 ? "warning" : "default"}>{a.score}</Badge>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-bold leading-none">{value}</div>
      <div className="text-xs text-white/70 mt-1">{label}</div>
    </div>
  );
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-stone-50 p-3">
      <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
        {icon} {label}
      </div>
      <div className="font-bold text-lg">{value}</div>
    </div>
  );
}
