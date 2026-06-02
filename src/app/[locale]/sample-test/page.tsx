import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/Container";
import { SampleTestClient } from "./SampleTestClient";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function SampleTestPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

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
          // Pass template string — client interpolates {correct}/{total} at runtime.
          // Deferred-interpolation trick: passing placeholder as its own value so
          // next-intl returns the raw template; client fills in actual numbers.
          teaserHeading: t("teaserHeading", { correct: "{correct}", total: "{total}" }),
          teaserSub: t("teaserSub"),
          teaserSignUpBtn: t("teaserSignUpBtn"),
          teaserLoginPrompt: t("teaserLoginPrompt"),
          teaserLoginLink: t("teaserLoginLink"),
          retakeBtn: t("retakeBtn"),
          errorStart: t("errorStart"),
          errorSubmit: t("errorSubmit"),
          errorNetwork: t("errorNetwork"),
          redirecting: t("redirecting"),
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
