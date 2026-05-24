import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/Container";
import { CefrBadge } from "@/components/CefrBadge";
import { Link } from "@/i18n/navigation";
import { getLessons } from "@/lib/content";

export default async function LearnFromYouTubePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("youtubePage");
  const tL = await getTranslations("lessons");
  const lessons = await getLessons("youtube-random");

  return (
    <Container size="wide" className="py-12">
      <header className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" data-testid="page-title">{t("title")}</h1>
        <p className="mt-3 text-muted max-w-2xl mx-auto">{t("sub")}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="youtube-list">
        {lessons.map((l) => (
          <Link
            key={l.slug}
            href={`/lessons/youtube-random/${l.slug}`}
            className="group rounded-xl border border-border bg-white p-5 hover:border-brand hover:shadow-md transition-all"
          >
            <div className="aspect-video w-full rounded-lg bg-gradient-to-br from-red-500 to-red-700 grid place-items-center text-white text-4xl mb-3">
              ▶
            </div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold group-hover:text-brand">{l.title}</h3>
              <CefrBadge level={l.level} />
            </div>
            <p className="mt-1 text-xs text-muted">{l.segments.length} segments · {tL("startBtn")} →</p>
          </Link>
        ))}
      </div>
    </Container>
  );
}
