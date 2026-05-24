import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Container } from "@/components/Container";
import { Avatar } from "@/components/Avatar";
import { userStats, userRecentActivity } from "@/lib/user-analytics";
import { ProfileForm } from "./ProfileForm";
import { AvatarUploader } from "./AvatarUploader";
import { StatsCard, ActivityFeedCard } from "./Stats";
import { GOAL_OPTIONS, parseGoals, type GoalSlug } from "@/lib/learning-goals";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const u = session?.user as { id?: string; isAdmin?: boolean } | undefined;
  if (!u?.id) redirect("/auth/login");
  if (u.isAdmin) redirect("/admin");

  const [user, stats, activity] = await Promise.all([
    prisma.user.findUnique({
      where: { id: u.id },
      select: {
        email: true,
        name: true,
        birthYear: true,
        country: true,
        occupation: true,
        nativeLanguage: true,
        dailyTimeGoalMin: true,
        learningGoals: true,
        avatarUrl: true,
        createdAt: true,
      },
    }),
    userStats(u.id),
    userRecentActivity(u.id, 12),
  ]);
  if (!user) redirect("/auth/login");

  const t = await getTranslations("profile");
  const tGoals = await getTranslations("profile.goalNames");
  const goalNames = Object.fromEntries(
    GOAL_OPTIONS.map((g) => [g, tGoals(g)]),
  ) as Record<GoalSlug, string>;

  const displayName = user.name || user.email;

  return (
    <>
      {/* HERO */}
      <section className="bg-gradient-to-b from-brand-soft via-surface to-white border-b border-border">
        <Container size="wide" className="py-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar
              name={displayName}
              src={user.avatarUrl ?? undefined}
              size={96}
              className="shadow-sm"
            />
            <div className="flex-1 text-center sm:text-left">
              <h1
                className="text-3xl sm:text-4xl font-bold tracking-tight"
                data-testid="page-title"
              >
                {displayName}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {t("memberSince", { date: user.createdAt.toISOString().slice(0, 10) })}
              </p>
              <div
                className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3 text-sm"
                data-testid="hero-stats"
              >
                <Pill icon="⏱" label={`${stats.activeMinutesTotal} min`} />
                <Pill icon="📚" label={`${stats.lessonsStarted} lessons`} />
                <Pill icon="⭐" label={`${Math.round(stats.avgAccuracy * 100)}% avg`} />
                <Pill icon="🔥" label={`${stats.streakDays}-day streak`} />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container size="wide" className="py-10 grid gap-8 lg:grid-cols-3">
        {/* PERSONAL INFO */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-white p-6 space-y-6">
          <header>
            <h2 className="text-xl font-bold">{t("title")}</h2>
            <p className="text-sm text-muted mt-1">{t("sub")}</p>
          </header>

          <AvatarUploader
            name={displayName}
            currentUrl={user.avatarUrl ?? null}
            labels={{
              upload: t("avatar.upload"),
              remove: t("avatar.remove"),
              cropTitle: t("avatar.cropTitle"),
              save: t("avatar.save"),
              cancel: t("avatar.cancel"),
              zoom: t("avatar.zoom"),
              saved: t("avatar.saved"),
              removed: t("avatar.removed"),
              tooLarge: t("avatar.tooLarge"),
            }}
          />

          <ProfileForm
            email={user.email}
            initial={{
              name: user.name,
              birthYear: user.birthYear,
              country: user.country,
              occupation: user.occupation,
              nativeLanguage: user.nativeLanguage,
              dailyTimeGoalMin: user.dailyTimeGoalMin,
              learningGoals: parseGoals(user.learningGoals),
            }}
            labels={{
              email: t("email"),
              name: t("name"),
              birthYear: t("birthYear"),
              country: t("country"),
              occupation: t("occupation"),
              nativeLanguage: t("nativeLanguage"),
              dailyTimeGoalMin: t("dailyTimeGoalMin"),
              learningGoals: t("learningGoals"),
              save: t("save"),
              saved: t("saved"),
              goalNames,
            }}
          />
        </div>

        {/* STATS + ACTIVITY */}
        <div className="space-y-6">
          <StatsCard stats={stats} />
          <ActivityFeedCard rows={activity} />
        </div>
      </Container>
    </>
  );
}

function Pill({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-border px-3 py-1 text-sm">
      <span aria-hidden>{icon}</span>
      <span className="font-medium">{label}</span>
    </span>
  );
}
