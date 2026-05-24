import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { CefrBadge } from "@/components/CefrBadge";
import { Link } from "@/i18n/navigation";
import { getLessons, isCategory } from "@/lib/content";
import { CategoryFilters } from "./CategoryFilters";

interface PageProps {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<{ level?: string; page?: string }>;
}

const PAGE_SIZE = 10;

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { locale, category } = await params;
  setRequestLocale(locale);
  if (!isCategory(category)) notFound();

  const sp = await searchParams;
  const tCat = await getTranslations("categories");
  const tCatDesc = await getTranslations("categoriesDesc");
  const t = await getTranslations("category");
  const tL = await getTranslations("lessons");

  const all = await getLessons(category);
  const counts: Record<string, number> = { All: all.length };
  all.forEach((l) => {
    counts[l.level] = (counts[l.level] ?? 0) + 1;
  });

  const levelFilter = sp.level && sp.level !== "All" ? sp.level : null;
  const filtered = levelFilter ? all.filter((l) => l.level === levelFilter) : all;

  const pageNum = Math.max(1, Number(sp.page ?? "1"));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(pageNum, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <Container size="wide" className="py-10">
      <header className="mb-8">
        <nav className="text-sm text-muted mb-2">
          <Link href="/lessons" className="hover:text-brand">Lessons</Link>
          {" › "}
          <span>{tCat(category)}</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
          {filtered.length} {tCat(category)} {tL("lessonsLabel")}
        </h1>
        <p className="mt-2 text-muted">{tCatDesc(category)}</p>
      </header>

      <CategoryFilters
        category={category}
        counts={counts}
        currentLevel={levelFilter}
        labels={{ filterLevel: t("filterLevel"), all: t("all") }}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-4 py-3">{t("levelHeader")}</th>
              <th className="px-4 py-3">{t("titleHeader")}</th>
              <th className="px-4 py-3">{t("segmentsHeader")}</th>
              <th className="px-4 py-3">{t("actionHeader")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border" data-testid="lesson-list">
            {pageItems.map((lesson) => (
              <tr key={lesson.slug} data-testid={`lesson-row`} data-level={lesson.level}>
                <td className="px-4 py-3">
                  <CefrBadge level={lesson.level} />
                </td>
                <td className="px-4 py-3 font-medium">{lesson.title}</td>
                <td className="px-4 py-3 text-muted">{lesson.segments.length}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/lessons/${category}/${lesson.slug}`}
                    className="inline-flex rounded-md bg-brand hover:bg-brand-strong text-white text-xs font-semibold px-3 py-1.5"
                  >
                    {tL("startBtn")}
                  </Link>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  {t("noLessons")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Pagination" data-testid="pagination">
          {safePage > 1 && (
            <Link
              href={{ pathname: `/lessons/${category}`, query: { ...(levelFilter ? { level: levelFilter } : {}), page: safePage - 1 } }}
              className="rounded-md border border-border bg-white px-3 py-1.5 text-sm hover:border-brand"
            >
              ← {t("prev")}
            </Link>
          )}
          <span className="text-sm text-muted">{t("page")} {safePage} / {totalPages}</span>
          {safePage < totalPages && (
            <Link
              href={{ pathname: `/lessons/${category}`, query: { ...(levelFilter ? { level: levelFilter } : {}), page: safePage + 1 } }}
              className="rounded-md border border-border bg-white px-3 py-1.5 text-sm hover:border-brand"
            >
              {t("next")} →
            </Link>
          )}
        </nav>
      )}
    </Container>
  );
}
