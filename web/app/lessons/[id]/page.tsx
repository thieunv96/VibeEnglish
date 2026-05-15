import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  getLessonPreview,
  getInProgressAttempt,
  getLastCompletedAttempt,
} from "@/lib/data";
import { TopNav } from "@/components/top-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LESSON_TYPES } from "@/lib/constants";
import {
  ArrowRight,
  Clock,
  Hash,
  Star,
  Play,
  CheckCircle2,
  BookOpen,
  Mic,
  Pencil,
  ListChecks,
  ArrowLeft,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

export default async function LessonPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const { id } = await params;
  const data = await getLessonPreview(id);
  if (!data) notFound();
  const { lesson, video, exercises, series, category } = data;

  const t = await getTranslations("lesson.preview");
  const tTypes = await getTranslations("lessonTypes");
  const locale = await getLocale();

  const [inProgress, lastCompleted] = await Promise.all([
    getInProgressAttempt(session.user.id, id),
    getLastCompletedAttempt(session.user.id, id),
  ]);

  const typeMeta = LESSON_TYPES.find((tt) => tt.id === lesson.type) ?? LESSON_TYPES[0];
  const typeLabel = tTypes(typeMeta.id);
  const durationMin = Math.max(1, Math.round(lesson.durationSec / 60));

  const quizCount = exercises.filter((e) => e.kind === "quiz").length;
  const writingCount = exercises.filter((e) => e.kind === "writing").length;
  const speakingCount = exercises.filter((e) => e.kind === "speaking").length;
  const exerciseSummary = [
    quizCount > 0 && { kind: "quiz" as const, icon: ListChecks, label: "Quiz", desc: t("quizExercises", { n: quizCount }) },
    writingCount > 0 && { kind: "writing" as const, icon: Pencil, label: "Writing", desc: t("writingExercises", { n: writingCount }) },
    speakingCount > 0 && { kind: "speaking" as const, icon: Mic, label: "Speaking", desc: t("speakingExercises", { n: speakingCount }) },
  ].filter(Boolean) as Array<{ kind: "quiz" | "writing" | "speaking"; icon: typeof ListChecks; label: string; desc: string }>;

  const ctaText = lastCompleted ? t("ctaRetry") : inProgress ? t("ctaContinue") : t("ctaStart");

  return (
    <div className="min-h-screen bg-stone-50">
      <TopNav />
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900">
          <ArrowLeft className="size-4" /> {t("back")}
        </Link>

        {/* Title + badges row — full-width, above the 2-col grid */}
        <header>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="brand">
              <span className="mr-1">{typeMeta.icon}</span> {typeLabel}
            </Badge>
            <Badge variant="outline">{lesson.level}</Badge>
            {category && (
              <Badge variant="info">
                <span>{category.icon}</span> {category.title}
              </Badge>
            )}
            {series && <Badge variant="info">{series.title}</Badge>}
            {lastCompleted && (
              <Badge variant="success">
                <CheckCircle2 className="size-3" /> {t("completedBadge")}
              </Badge>
            )}
            {inProgress && !lastCompleted && <Badge variant="warning">{t("inProgressBadge")}</Badge>}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900">{lesson.title}</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
          {/* Left — meta + media + description */}
          <div className="space-y-6">
            {/* Meta row — the CTA aside is aligned with the top of this row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500">
              <span className="flex items-center gap-1">
                <Clock className="size-4" /> {durationMin} {t("minutes")}
              </span>
              <span className="flex items-center gap-1">
                <Hash className="size-4" /> {exercises.length} {t("exercises")}
              </span>
              {lesson.rating != null && (
                <span className="flex items-center gap-1">
                  <Star className="size-4 fill-amber-400 text-amber-400" /> {lesson.rating.toFixed(1)}
                </span>
              )}
            </div>

            {/* Video thumbnail / type illustration */}
            <div
              className={`relative aspect-video rounded-xl border border-stone-200 overflow-hidden flex items-center justify-center text-7xl ${typeMeta.color}`}
            >
              <span>{typeMeta.icon}</span>
              {video?.youtubeId && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Link
                    href={`/lessons/${id}/study`}
                    className="size-16 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:scale-105 transition shadow-xl"
                    title={t("ctaStart")}
                  >
                    <Play className="size-7 fill-stone-900 text-stone-900 ml-1" />
                  </Link>
                </div>
              )}
            </div>

            {/* Description */}
            <section>
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                <BookOpen className="size-4 text-brand-600" /> {t("aboutTitle")}
              </h2>
              <p className="text-stone-700 leading-relaxed">
                {lesson.description || t("aboutDefault")}
              </p>
            </section>

            {/* What you'll do */}
            <section>
              <h2 className="text-lg font-bold mb-3">{t("willPractice")}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {exerciseSummary.map((e) => {
                  const Icon = e.icon;
                  return (
                    <div key={e.kind} className="rounded-xl border border-stone-200 bg-white p-4">
                      <Icon className="size-5 text-brand-600 mb-2" />
                      <div className="font-semibold text-sm">{e.label}</div>
                      <div className="text-xs text-stone-500 mt-0.5">{e.desc}</div>
                    </div>
                  );
                })}
                {video && (
                  <div className="rounded-xl border border-stone-200 bg-white p-4">
                    <Play className="size-5 text-brand-600 mb-2" />
                    <div className="font-semibold text-sm">{t("video")}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{t("videoMeta", { duration: formatDuration(video.durationSec) })}</div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right — CTA card (aligned top with meta row) */}
          <aside className="lg:sticky lg:top-20 lg:self-start space-y-3">
            <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
              <div>
                <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">
                  {lastCompleted ? t("completedTitle") : inProgress ? t("inProgressTitle") : t("readyTitle")}
                </div>
                {lastCompleted && (
                  <div className="text-sm text-stone-700">
                    {t("lastScore", { score: lastCompleted.score ?? "—" })}
                  </div>
                )}
                {inProgress && !lastCompleted && (
                  <div className="text-sm text-stone-700">
                    {t("startedAt", { time: new Date(inProgress.startedAt).toLocaleString(locale === "en" ? "en-US" : "vi-VN") })}
                  </div>
                )}
              </div>
              <Button asChild size="lg" className="w-full">
                <Link href={`/lessons/${id}/study`}>
                  <Play className="size-4" /> {ctaText} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <div className="space-y-1.5 text-xs text-stone-500 pt-2 border-t border-stone-100">
                <div className="flex justify-between">
                  <span>{t("factType")}</span>
                  <span className="font-medium text-stone-700">{typeLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("factLevel")}</span>
                  <span className="font-medium text-stone-700">{lesson.level}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("factDuration")}</span>
                  <span className="font-medium text-stone-700">{durationMin} {t("minutes")}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("factExercises")}</span>
                  <span className="font-medium text-stone-700">{exercises.length}</span>
                </div>
                {category && (
                  <div className="flex justify-between">
                    <span>{t("factCategory")}</span>
                    <span className="font-medium text-stone-700">
                      {category.icon} {category.title}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
