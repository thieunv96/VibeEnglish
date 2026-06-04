import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { CefrTestClient } from "./CefrTestClient";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function CefrTestPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Auth gate — anonymous visitors are bounced to login.
  const session = await auth();
  const u = session?.user as { id?: string } | undefined;
  if (!u?.id) redirect("/auth/login");

  const t = await getTranslations("cefrTest");
  const tEx = await getTranslations("exercise");

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl border border-border bg-white p-8 shadow-sm text-center">
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">{t("pageTitle")}</h1>
        <p className="text-muted mb-4">{t("pageSubtitle")}</p>
        <p className="text-sm text-muted mb-6 font-medium">{t("questionCount")}</p>

        {/* Server-rendered disclaimer — visible before the user starts the test. */}
        <p
          className="text-xs text-muted italic mb-8 max-w-md mx-auto"
          data-testid="cefr-disclaimer"
        >
          {t("disclaimer")}
        </p>

        <CefrTestClient
          labels={{
            startBtn: t("startBtn"),
            fullResultsHeading: t("fullResultsHeading"),
            scoreLabel: t("scoreLabel", { correct: "{correct}", total: "{total}" }),
            estimatedLevelLabel: t("estimatedLevelLabel"),
            c1PlusExplanation: t("c1PlusExplanation"),
            levelBreakdownHeading: t("levelBreakdownHeading"),
            levelBreakdownItem: t("levelBreakdownItem", { correct: "{correct}", total: "{total}" }),
            skillBreakdownHeading: t("skillBreakdownHeading"),
            skillBreakdownItem: t("skillBreakdownItem", { correct: "{correct}", total: "{total}" }),
            reviewHeading: t("reviewHeading"),
            reviewCorrect: t("reviewCorrect"),
            reviewIncorrect: t("reviewIncorrect"),
            reviewCorrectAnswer: t("reviewCorrectAnswer", { answer: "{answer}" }),
            retakeBtn: t("retakeBtn"),
            errorStart: t("errorStart"),
            errorSubmit: t("errorSubmit"),
            errorNetwork: t("errorNetwork"),
            exercise: {
              check: tEx("check"),
              showAll: tEx("showAll"),
              submit: t("submitBtn"),
              next: tEx("next"),
              yourScore: tEx("yourScore"),
              correct: tEx("correct"),
              incorrect: tEx("incorrect"),
            },
          }}
        />
      </div>
    </main>
  );
}
