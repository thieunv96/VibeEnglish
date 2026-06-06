import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { Container } from "@/components/Container";
import { examSlugSchema } from "@/lib/test-prep-constants";
import type { ExamSlug } from "@/lib/test-prep-constants";
import { MockTestClient } from "./MockTestClient";

interface PageProps {
  params: Promise<{ locale: string; exam: string }>;
}

const EXAM_DISPLAY: Record<ExamSlug, string> = {
  toeic: "TOEIC",
  toefl: "TOEFL",
  ielts: "IELTS",
  oet: "OET",
};

export default async function MockTestPage({ params }: PageProps) {
  const { locale, exam } = await params;
  setRequestLocale(locale);

  const parsed = examSlugSchema.safeParse(exam);
  if (!parsed.success) notFound();
  const examSlug = parsed.data;

  const session = await auth();
  const u = session?.user as { id?: string } | undefined;
  if (!u?.id) redirect("/auth/login");

  const t = await getTranslations("testPrep");
  const tEx = await getTranslations("exercise");
  const displayLabel = EXAM_DISPLAY[examSlug];

  return (
    <Container size="narrow" className="py-12">
      <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-3">
            {t("mockTest.pageTitle", { exam: displayLabel })}
          </h1>
          <p className="text-muted mb-2">
            {t("mockTest.pageSubtitle", { exam: displayLabel, count: 25 })}
          </p>
          <p className="text-sm text-muted mb-4">
            {t("mockTest.listeningOnlyNote")}
          </p>

          {/* Server-rendered disclaimer — visible before user starts the test (AC-15). */}
          <p
            className="text-xs text-muted italic max-w-md mx-auto"
            data-testid="mock-disclaimer"
          >
            {t("mockTest.disclaimer")}
          </p>
        </div>

        <MockTestClient
          exam={examSlug}
          examDisplayLabel={displayLabel}
          labels={{
            startBtn: t("mockTest.startBtn"),
            listeningOnlyNote: t("mockTest.listeningOnlyNote"),
            submitBtn: t("mockTest.submitBtn"),
            retakeBtn: t("mockTest.retakeBtn"),
            resultsHeading: t("mockTest.resultsHeading"),
            scoreLabel: t("mockTest.scoreLabel", { correct: "{correct}", total: "{total}" }),
            bandEstimateLabel: t("mockTest.bandEstimateLabel", { exam: "{exam}", band: "{band}" }),
            bandDisclaimerLabel: t("mockTest.bandDisclaimerLabel"),
            skillBreakdownHeading: t("mockTest.skillBreakdownHeading"),
            skillBreakdownItem: t("mockTest.skillBreakdownItem", { correct: "{correct}", total: "{total}" }),
            reviewHeading: t("mockTest.reviewHeading"),
            reviewCorrect: t("mockTest.reviewCorrect"),
            reviewIncorrect: t("mockTest.reviewIncorrect"),
            reviewCorrectAnswer: t("mockTest.reviewCorrectAnswer", { answer: "{answer}" }),
            sessionExpiredError: t("mockTest.sessionExpiredError"),
            noContentError: t("mockTest.noContentError"),
            rateLimitError: t("mockTest.rateLimitError"),
            errorStart: t("mockTest.errorStart"),
            errorSubmit: t("mockTest.errorSubmit"),
            errorNetwork: t("mockTest.errorNetwork"),
            exercise: {
              check: tEx("check"),
              showAll: tEx("showAll"),
              submit: t("mockTest.submitBtn"),
              next: tEx("next"),
              yourScore: tEx("yourScore"),
              correct: tEx("correct"),
              incorrect: tEx("incorrect"),
            },
          }}
        />
      </div>
    </Container>
  );
}
