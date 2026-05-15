import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { lessonAttempts, lessons, userProgress, skillScores } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Trophy, ArrowRight, Flame, ThumbsUp, AlertCircle, Lightbulb, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LESSON_TYPES } from "@/lib/constants";
import { getNextLessonInSeries } from "@/lib/data";
import { RatingCard } from "./rating-card";

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const { id } = await params;
  const sp = await searchParams;

  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  if (!lesson) notFound();

  let attempt = sp.attempt
    ? (await db.select().from(lessonAttempts).where(eq(lessonAttempts.id, sp.attempt)).limit(1))[0]
    : (
        await db
          .select()
          .from(lessonAttempts)
          .where(
            and(
              eq(lessonAttempts.lessonId, id),
              eq(lessonAttempts.userId, session.user.id),
              eq(lessonAttempts.status, "completed")
            )
          )
          .orderBy(lessonAttempts.completedAt)
          .limit(1)
      )[0];
  if (!attempt) redirect(`/lessons/${id}`);

  const [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, session.user.id)).limit(1);
  const skills = await db.select().from(skillScores).where(eq(skillScores.userId, session.user.id));
  const next = await getNextLessonInSeries(id);
  const typeMeta = LESSON_TYPES.find((tt) => tt.id === lesson.type)!;
  const t = await getTranslations("lesson.result");
  const tTypes = await getTranslations("lessonTypes");
  const tSkills = await getTranslations("skills");
  const tQuiz = await getTranslations("lesson.quiz");

  const feedback = (attempt.aiFeedback ?? {}) as {
    strengths?: string[];
    improvements?: string[];
    tips?: string[];
    vocabulary?: string[];
  };
  const vocab = feedback.vocabulary ?? sampleVocab(lesson.title);
  const score = attempt.score ?? 0;
  const time = attempt.completedAt && attempt.startedAt
    ? Math.max(1, Math.round((attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 60000))
    : Math.round(lesson.durationSec / 60);

  return (
    <div className="min-h-screen bg-stone-50 pb-12">
      {/* Celebration header */}
      <header className="brand-gradient text-white text-center px-4 py-12 relative overflow-hidden">
        <div className="absolute inset-0 dotted-bg opacity-20" />
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex size-20 rounded-full bg-white/15 backdrop-blur items-center justify-center mb-4 animate-[pop_0.6s_cubic-bezier(0.34,1.56,0.64,1)]">
            <Trophy className="size-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("completed")}</h1>
          <p className="text-white/85">{lesson.title}</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-sm">
            <Sparkles className="size-4" /> {t("xp", { xp: attempt.xpAwarded })}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 -mt-8 space-y-6">
        {/* Score cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card title={t("totalScore")} value={score.toString()} highlight />
          <Card title={t("lessonType")} value={`${typeMeta.icon}`} sub={tTypes(typeMeta.id)} />
          <Card title={t("duration")} value={t("durationValue", { n: time })} />
        </div>

        {/* Skill progress */}
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <h3 className="font-bold mb-3">{t("skillsProgress")}</h3>
          <div className="space-y-3">
            {skills.map((s) => (
              <div key={s.skill}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{tSkills(s.skill)}</span>
                  <span className="text-emerald-600 font-medium">+2</span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-[width] duration-500" style={{ width: `${s.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating */}
        <RatingCard attemptId={attempt.id} initialRating={attempt.rating ?? null} />

        {/* Vocabulary chips */}
        {vocab.length > 0 && (
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <h3 className="font-bold mb-3">{t("vocab")}</h3>
            <div className="flex flex-wrap gap-2">
              {vocab.map((w) => (
                <span key={w} className="bg-brand-50 text-brand-700 hover:bg-brand-100 transition px-3 py-1 rounded-full text-sm">
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Feedback */}
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold">
            <Sparkles className="size-4 text-brand-500" /> {t("aiCoach")}
          </div>
          {feedback.strengths && (
            <FeedbackBlock icon={<ThumbsUp className="size-3.5 text-emerald-600" />} label={tQuiz("strengths")} items={feedback.strengths} />
          )}
          {feedback.improvements && (
            <FeedbackBlock icon={<AlertCircle className="size-3.5 text-amber-600" />} label={tQuiz("improvements")} items={feedback.improvements} />
          )}
          {feedback.tips && (
            <FeedbackBlock icon={<Lightbulb className="size-3.5 text-brand-600" />} label={tQuiz("tips")} items={feedback.tips} />
          )}
        </div>

        {/* Streak */}
        {progress && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 p-4 flex items-center gap-3">
            <Flame className="size-6 fill-amber-500 text-amber-500" />
            <div className="flex-1">
              <div className="font-bold">{t("streakBanner", { n: progress.streakDays })}</div>
              <div className="text-xs text-amber-700">{t("streakHint")}</div>
            </div>
          </div>
        )}

        {/* Next lesson */}
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="text-xs text-stone-400 uppercase tracking-wide mb-1">
            {next ? t("next") : t("nextRecommended")}
          </div>
          <div className="font-semibold mb-4">{next?.title ?? t("noNext")}</div>
          <div className="flex gap-2">
            {next ? (
              <Button asChild size="lg" className="flex-1">
                <Link href={`/lessons/${next.id}`}>
                  {t("continueNext")} <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="flex-1">
                <Link href="/">{t("backToLibrary")} <ArrowRight className="size-4" /></Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline">
              <Link href="/">{t("library")}</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}


function Card({ title, value, sub, highlight }: { title: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border bg-white p-4 text-center ${highlight ? "border-brand-300 bg-brand-50" : "border-stone-200"}`}>
      <div className="text-xs text-stone-500">{title}</div>
      <div className={`mt-1 font-bold ${highlight ? "text-brand-700 text-3xl" : "text-2xl"}`}>{value}</div>
      {sub && <div className="text-xs text-stone-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function FeedbackBlock({ icon, label, items }: { icon: React.ReactNode; label: string; items: string[] }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-stone-600 mb-1">
        {icon} {label}
      </div>
      <ul className="text-sm space-y-1 text-stone-700">
        {items.map((it, i) => (
          <li key={i}>• {it}</li>
        ))}
      </ul>
    </div>
  );
}

function sampleVocab(title: string): string[] {
  const fallback = ["circle back", "follow up", "reach out", "touch base", "go-to", "stand-up"];
  return fallback;
}
