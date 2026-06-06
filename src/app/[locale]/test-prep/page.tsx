import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { Container } from "@/components/Container";
import { Link } from "@/i18n/navigation";
import { EXAMS } from "@/lib/test-prep-constants";
import type { ExamSlug } from "@/lib/test-prep-constants";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const EXAM_DISPLAY: Record<ExamSlug, string> = {
  toeic: "TOEIC",
  toefl: "TOEFL",
  ielts: "IELTS",
  oet: "OET",
};

export default async function TestPrepHubPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const u = session?.user as { id?: string } | undefined;
  if (!u?.id) redirect("/auth/login");

  const t = await getTranslations("testPrep");

  return (
    <Container size="wide" className="py-12">
      <header className="mb-10 text-center">
        <h1
          className="text-4xl font-extrabold tracking-tight"
          data-testid="page-title"
        >
          {t("hubTitle")}
        </h1>
        <p className="mt-3 text-muted max-w-2xl mx-auto">{t("hubSubtitle")}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {EXAMS.map((slug) => (
          <div
            key={slug}
            className="rounded-2xl border border-border bg-white p-6 shadow-sm flex flex-col gap-4"
            data-testid={`exam-card-${slug}`}
          >
            <div>
              <h2 className="text-xl font-bold">{EXAM_DISPLAY[slug]}</h2>
              <p className="mt-2 text-sm text-muted">
                {t(`examDescriptions.${slug}` as Parameters<typeof t>[0])}
              </p>
            </div>

            <div className="mt-auto flex flex-col gap-2">
              <Link
                href={`/test-prep/${slug}/mock`}
                className="inline-flex items-center justify-center rounded-md bg-brand hover:bg-brand-strong text-white font-semibold px-4 py-2 text-sm"
                data-testid={`mock-cta-${slug}`}
              >
                {t("examCard.mockCta")}
              </Link>
              <Link
                href={`/test-prep/${slug}/practice/listening`}
                className="inline-flex items-center justify-center rounded-md border border-border hover:bg-surface font-semibold px-4 py-2 text-sm"
                data-testid={`practice-cta-${slug}`}
              >
                {t("examCard.practiceCta")}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
