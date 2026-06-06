import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { Container } from "@/components/Container";
import { Link } from "@/i18n/navigation";
import { EXAMS, examSlugSchema } from "@/lib/test-prep-constants";
import type { ExamSlug } from "@/lib/test-prep-constants";
import { getExamProgress } from "@/lib/test-prep-progress";

interface PageProps {
  params: Promise<{ locale: string; exam: string }>;
}

const EXAM_DISPLAY: Record<ExamSlug, string> = {
  toeic: "TOEIC",
  toefl: "TOEFL",
  ielts: "IELTS",
  oet: "OET",
};

export default async function ExamLandingPage({ params }: PageProps) {
  const { locale, exam } = await params;
  setRequestLocale(locale);

  const parsed = examSlugSchema.safeParse(exam);
  if (!parsed.success) notFound();
  const examSlug = parsed.data;

  const session = await auth();
  const u = session?.user as { id?: string } | undefined;
  if (!u?.id) redirect("/auth/login");

  const t = await getTranslations("testPrep");
  const progress = await getExamProgress(u.id, examSlug);
  const displayLabel = EXAM_DISPLAY[examSlug];
  // Narrow EXAMS[n] for examDescriptions key lookup
  const descKey = `examDescriptions.${examSlug}` as `examDescriptions.${(typeof EXAMS)[number]}`;

  return (
    <Container size="wide" className="py-12">
      <header className="mb-8">
        <span className="inline-block rounded-full bg-brand-soft text-brand-strong text-xs font-semibold px-3 py-1 mb-3">
          Test Preparation
        </span>
        <h1
          className="text-3xl sm:text-4xl font-bold tracking-tight"
          data-testid="page-title"
        >
          {displayLabel} Listening Prep
        </h1>
        <p className="mt-3 text-muted max-w-2xl">
          {t(descKey)}
        </p>
      </header>

      {/* Mock CTA */}
      <div className="rounded-2xl border border-brand bg-brand-soft p-6 mb-8 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">
            {t("mockTest.pageTitle", { exam: displayLabel })}
          </h2>
          <p className="text-sm text-muted mt-1">
            {t("mockTest.pageSubtitle", { exam: displayLabel, count: 25 })}
          </p>
        </div>
        <Link
          href={`/test-prep/${examSlug}/mock`}
          className="shrink-0 inline-flex items-center rounded-md bg-brand hover:bg-brand-strong text-white font-semibold px-5 py-2.5"
          data-testid="mock-cta"
        >
          {t("examCard.mockCta")}
        </Link>
      </div>

      {/* Progress */}
      <section className="rounded-xl border border-border bg-white p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">{t("progress.sectionHeading")}</h2>
        {progress.attemptCount === 0 ? (
          <p className="text-muted text-sm">{t("progress.noAttemptsLabel")}</p>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-muted">{t("progress.attemptsLabel", { count: progress.attemptCount })}</dt>
            </div>
            <div>
              <dt className="text-muted">
                {progress.bestScore !== null
                  ? t("progress.bestScoreLabel", { score: Math.round(progress.bestScore * 100) })
                  : "—"}
              </dt>
            </div>
            <div>
              <dt className="text-muted">
                {progress.lastAttemptDate
                  ? t("progress.lastAttemptLabel", {
                      date: progress.lastAttemptDate.toLocaleDateString(),
                    })
                  : "—"}
              </dt>
            </div>
          </dl>
        )}
      </section>

      {/* Skill Practice */}
      <section className="rounded-xl border border-border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">{t("examSkills.listening")} Practice</h2>
        <Link
          href={`/test-prep/${examSlug}/practice/listening`}
          className="inline-flex items-center rounded-md border border-border hover:bg-surface font-semibold px-4 py-2 text-sm"
        >
          {t("examCard.practiceCta")}
        </Link>
      </section>
    </Container>
  );
}
