import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/Container";
import { auth } from "@/auth";
import { SampleTestClient } from "./SampleTestClient";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function SampleTestPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Auth gate — anonymous visitors are bounced to login.
  const session = await auth();
  const u = session?.user as { id?: string } | undefined;
  if (!u?.id) redirect("/auth/login");

  const t = await getTranslations("sampleTest");
  const tEx = await getTranslations("exercise");

  return (
    <Container size="narrow" className="py-12">
      <header className="mb-10 text-center">
        <h1
          className="text-4xl font-extrabold tracking-tight text-gray-900"
          data-testid="sample-test-title"
        >
          {t("pageTitle")}
        </h1>
        <p className="mt-3 text-lg text-muted">{t("pageSubtitle")}</p>
      </header>

      <SampleTestClient
        labels={{
          startBtn: t("startBtn"),
          questionCount: t("questionCount"),
          submitBtn: t("submitBtn"),
          fullResultsHeading: t("fullResultsHeading"),
          scoreLabel: t("scoreLabel", { correct: "{correct}", total: "{total}" }),
          skillBreakdownHeading: t("skillBreakdownHeading"),
          skillBreakdownItem: t("skillBreakdownItem", { correct: "{correct}", total: "{total}" }),
          recommendationsHeading: t("recommendationsHeading"),
          recommendationsEmpty: t("recommendationsEmpty"),
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
    </Container>
  );
}
