import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { Container } from "@/components/Container";
import { CefrBadge } from "@/components/CefrBadge";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { examSlugSchema } from "@/lib/test-prep-constants";
import type { ExamSlug } from "@/lib/test-prep-constants";
import type { CefrLevel } from "@/lib/content";

interface PageProps {
  params: Promise<{ locale: string; exam: string; skill: string }>;
}

const EXAM_DISPLAY: Record<ExamSlug, string> = {
  toeic: "TOEIC",
  toefl: "TOEFL",
  ielts: "IELTS",
  oet: "OET",
};

export default async function SkillPracticePage({ params }: PageProps) {
  const { locale, exam, skill } = await params;
  setRequestLocale(locale);

  const parsed = examSlugSchema.safeParse(exam);
  if (!parsed.success) notFound();
  const examSlug = parsed.data;

  // V1: listening only
  if (skill !== "listening") notFound();

  const session = await auth();
  const u = session?.user as { id?: string } | undefined;
  if (!u?.id) redirect("/auth/login");

  const t = await getTranslations("testPrep");
  const displayLabel = EXAM_DISPLAY[examSlug];
  const skillLabel = t("examSkills.listening");

  const exercises = await prisma.exercise.findMany({
    where: { exam: examSlug, skill: "listening" },
    select: { id: true, slug: true, skill: true, title: true, level: true },
    orderBy: { level: "asc" },
  });

  // Fetch last attempt score for each exercise (single query, filter in memory)
  const lastAttempts = exercises.length > 0
    ? await prisma.exerciseAttempt.findMany({
        where: {
          userId: u.id,
          exerciseSlug: { in: exercises.map((e) => e.slug) },
        },
        select: { exerciseSlug: true, score: true, completedAt: true },
        orderBy: { completedAt: "desc" },
      })
    : [];

  // Build slug → most-recent score map (orderBy desc → first seen = most recent)
  const lastBySlug = new Map<string, number>();
  for (const a of lastAttempts) {
    if (!lastBySlug.has(a.exerciseSlug)) {
      lastBySlug.set(a.exerciseSlug, a.score);
    }
  }

  return (
    <Container size="wide" className="py-12">
      <header className="mb-8">
        <h1
          className="text-3xl font-bold tracking-tight"
          data-testid="page-title"
        >
          {t("practice.pageTitle", { exam: displayLabel, skill: skillLabel })}
        </h1>
        <p className="mt-2 text-muted">
          {t("practice.pageSubtitle", { exam: displayLabel, skill: skillLabel })}
        </p>
      </header>

      {exercises.length === 0 ? (
        <p className="text-muted text-center py-12" data-testid="no-exercises">
          {t("practice.noExercisesLabel")}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => {
            const lastScore = lastBySlug.get(ex.slug);
            return (
              <div
                key={ex.slug}
                className="rounded-xl border border-border bg-white p-5 flex flex-col gap-3"
                data-testid={`practice-card-${ex.slug}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-sm leading-snug">{ex.title}</h2>
                  <CefrBadge level={ex.level as CefrLevel} />
                </div>
                {lastScore !== undefined && (
                  <p className="text-xs text-muted" data-testid={`last-score-${ex.slug}`}>
                    {t("practice.lastScoreLabel", {
                      score: Math.round(lastScore * 100),
                    })}
                  </p>
                )}
                <div className="mt-auto">
                  <Link
                    href={`/practice/${ex.skill}/${ex.slug}`}
                    className="inline-flex items-center rounded-md bg-brand hover:bg-brand-strong text-white text-xs font-semibold px-3 py-1.5"
                    data-testid={`start-btn-${ex.slug}`}
                  >
                    {t("practice.startExerciseBtn")}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
