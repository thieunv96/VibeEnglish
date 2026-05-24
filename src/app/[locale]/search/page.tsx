import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/Container";
import { CefrBadge } from "@/components/CefrBadge";
import type { CefrLevel } from "@/lib/content";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

const LIMIT = 30;

export default async function SearchPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const t = await getTranslations("search");

  let lessons: Array<{ id: string; slug: string; category: string; title: string; level: string }> = [];
  let exercises: Array<{ id: string; slug: string; skill: string; title: string; level: string; type: string }> = [];

  if (q.length > 0) {
    [lessons, exercises] = await Promise.all([
      prisma.lesson.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { transcript: { contains: q } },
            { description: { contains: q } },
          ],
        },
        select: { id: true, slug: true, category: true, title: true, level: true },
        orderBy: { title: "asc" },
        take: LIMIT,
      }),
      prisma.exercise.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        },
        select: { id: true, slug: true, skill: true, title: true, level: true, type: true },
        orderBy: { title: "asc" },
        take: LIMIT,
      }),
    ]);
  }

  const total = lessons.length + exercises.length;

  return (
    <Container size="wide" className="py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">{t("title")}</h1>
        {q.length === 0 ? (
          <p className="mt-2 text-muted">{t("hint")}</p>
        ) : (
          <p className="mt-2 text-muted" data-testid="search-summary">
            {t("summary", { count: total, q: `“${q}”` })}
          </p>
        )}
      </header>

      {q.length > 0 && (
        <div className="grid gap-8 lg:grid-cols-2" data-testid="search-results">
          <section>
            <h2 className="text-lg font-semibold mb-3">{t("lessons")} ({lessons.length})</h2>
            {lessons.length === 0 ? (
              <p className="text-sm text-muted">{t("noLessons")}</p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border bg-white">
                {lessons.map((l) => (
                  <li key={l.id} data-testid={`search-lesson-${l.slug}`}>
                    <Link
                      href={`/lessons/${l.category}/${l.slug}`}
                      className="block px-4 py-3 hover:bg-surface transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{l.title}</div>
                          <div className="text-xs text-muted">{l.category}</div>
                        </div>
                        <CefrBadge level={l.level as CefrLevel} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">{t("exercises")} ({exercises.length})</h2>
            {exercises.length === 0 ? (
              <p className="text-sm text-muted">{t("noExercises")}</p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border bg-white">
                {exercises.map((e) => (
                  <li key={e.id} data-testid={`search-exercise-${e.slug}`}>
                    <Link
                      href={`/practice/${e.skill}/${e.slug}`}
                      className="block px-4 py-3 hover:bg-surface transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{e.title}</div>
                          <div className="text-xs text-muted">{e.skill} · {e.type}</div>
                        </div>
                        <CefrBadge level={e.level as CefrLevel} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Container>
  );
}
