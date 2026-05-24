import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/Container";
import { Link } from "@/i18n/navigation";
import { categoryStats, lessonCategories } from "@/lib/content";

const emojis: Record<string, string> = {
  "short-stories": "📖",
  conversations: "💬",
  "ted-ed": "🎓",
  "youtube-random": "▶️",
  "toeic-listening": "📰",
  "toefl-listening": "🎙️",
  "ielts-listening": "🎬",
  "medical-english-oet": "🩺",
  "stories-for-kids": "🧸",
};

export default async function LessonsIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("lessons");
  const tCat = await getTranslations("categories");
  const tCatDesc = await getTranslations("categoriesDesc");
  const counts = Object.fromEntries((await categoryStats()).map((c) => [c.slug, c.count]));

  return (
    <Container size="wide" className="py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" data-testid="page-title">{t("title")}</h1>
        <p className="mt-3 text-muted max-w-2xl mx-auto">{t("sub")}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="category-list">
        {lessonCategories.map((cat) => (
          <Link
            key={cat}
            href={`/lessons/${cat}`}
            className="group rounded-xl border border-border bg-white p-6 hover:border-brand hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-3">{emojis[cat]}</div>
            <h2 className="text-lg font-semibold group-hover:text-brand">
              {tCat(cat as "short-stories")}
            </h2>
            <p className="mt-1 text-sm text-muted">{tCatDesc(cat as "short-stories")}</p>
            <div className="mt-4 text-xs font-semibold text-brand">
              {counts[cat] ?? 0} {t("lessonsLabel")}
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
