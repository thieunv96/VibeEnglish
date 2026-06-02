import { getTranslations, setRequestLocale } from "next-intl/server";
import { CefrTestClient } from "./CefrTestClient";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function CefrTestPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("cefrTest");
  const tEx = await getTranslations("exercise");

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl border border-border bg-white p-8 shadow-sm text-center">
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">
          {t("pageTitle")}
        </h1>
        <p className="text-muted mb-8">{t("pageSubtitle")}</p>
        <p className="text-sm text-muted mb-6 font-medium">{t("questionCount")}</p>
        <CefrTestClient
          labels={{
            startBtn: t("startBtn"),
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
      </div>
    </main>
  );
}
