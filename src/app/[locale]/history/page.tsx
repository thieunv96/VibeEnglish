import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Container } from "@/components/Container";
import { Link } from "@/i18n/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HistoryPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const u = session?.user as { id?: string; isAdmin?: boolean } | undefined;
  if (!u?.id) redirect("/auth/login");

  const [progress, attempts] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId: u.id },
      orderBy: { lastOpenedAt: "desc" },
      take: 50,
    }),
    prisma.exerciseAttempt.findMany({
      where: { userId: u.id },
      orderBy: { completedAt: "desc" },
      take: 50,
    }),
  ]);

  const t = await getTranslations("historyPage");

  return (
    <Container size="wide" className="py-10 space-y-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">{t("title")}</h1>
        <p className="mt-1 text-muted text-sm">{t("sub")}</p>
      </header>

      <section data-testid="history-lessons">
        <h2 className="text-lg font-semibold mb-3">{t("lessons")} ({progress.length})</h2>
        {progress.length === 0 ? (
          <p className="text-sm text-muted">{t("noLessons")}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-2">{t("lesson")}</th>
                  <th className="px-4 py-2">{t("category")}</th>
                  <th className="px-4 py-2 text-right">{t("accuracy")}</th>
                  <th className="px-4 py-2 text-right">{t("segments")}</th>
                  <th className="px-4 py-2">{t("lastOpened")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {progress.map((p) => (
                  <tr key={p.id} data-testid={`history-progress-${p.lessonSlug}`}>
                    <td className="px-4 py-2 font-medium">
                      <Link href={`/lessons/${p.category}/${p.lessonSlug}`} className="hover:text-brand">
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-muted">{p.category}</td>
                    <td className="px-4 py-2 text-right">{Math.round(p.accuracy * 100)}%</td>
                    <td className="px-4 py-2 text-right">{p.segmentsCompleted} / {p.totalSegments}</td>
                    <td className="px-4 py-2 text-xs text-muted">
                      {p.lastOpenedAt.toISOString().slice(0, 16).replace("T", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section data-testid="history-exercises">
        <h2 className="text-lg font-semibold mb-3">{t("exercises")} ({attempts.length})</h2>
        {attempts.length === 0 ? (
          <p className="text-sm text-muted">{t("noExercises")}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-2">{t("exercise")}</th>
                  <th className="px-4 py-2">{t("skill")}</th>
                  <th className="px-4 py-2 text-right">{t("score")}</th>
                  <th className="px-4 py-2">{t("completed")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attempts.map((a) => (
                  <tr key={a.id} data-testid={`history-attempt-${a.exerciseSlug}`}>
                    <td className="px-4 py-2 font-medium">
                      <Link href={`/practice/${a.skill}/${a.exerciseSlug}`} className="hover:text-brand">
                        {a.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-muted">{a.skill}</td>
                    <td className="px-4 py-2 text-right">{Math.round(a.score * 100)}%</td>
                    <td className="px-4 py-2 text-xs text-muted">
                      {a.completedAt.toISOString().slice(0, 16).replace("T", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Container>
  );
}
