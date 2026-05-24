import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/Container";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { VocabList } from "./VocabList";

export default async function Dashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const u = session?.user as { id?: string; isAdmin?: boolean } | undefined;
  if (!u?.id) redirect("/auth/login");
  if (u.isAdmin) redirect("/admin");
  const userId = u.id;

  const t = await getTranslations("dashboard");

  const [progress, vocab, attempts] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId },
      orderBy: { lastOpenedAt: "desc" },
      take: 6,
    }),
    prisma.vocabItem.findMany({
      where: { userId },
      orderBy: { addedAt: "desc" },
      take: 20,
    }),
    prisma.exerciseAttempt.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <Container size="wide" className="py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-1" data-testid="page-title">{t("title")}</h1>
      <p className="text-muted mb-8">Welcome back, {session?.user?.name ?? session?.user?.email ?? "learner"}.</p>

      <section className="mb-12" data-testid="continue-section">
        <h2 className="text-xl font-semibold mb-4">{t("continue")}</h2>
        {progress.length === 0 ? (
          <p className="text-muted text-sm">{t("noProgress")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {progress.map((p) => (
              <Link
                key={p.id}
                href={`/lessons/${p.category}/${p.lessonSlug}`}
                className="rounded-xl border border-border bg-white p-4 hover:border-brand transition-colors"
                data-testid={`progress-${p.lessonSlug}`}
              >
                <div className="text-xs text-muted uppercase">{p.category.replace(/-/g, " ")}</div>
                <h3 className="mt-1 font-semibold">{p.title}</h3>
                <div className="mt-3 text-xs text-muted">
                  {p.segmentsCompleted}/{p.totalSegments} segments · {Math.round(p.accuracy * 100)}% {" "}
                  <span className="text-brand font-semibold">{t("openLesson")} →</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full bg-brand"
                    style={{ width: `${Math.min(100, (p.segmentsCompleted / p.totalSegments) * 100)}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mb-12" data-testid="vocab-section">
        <h2 className="text-xl font-semibold mb-4">{t("vocab")}</h2>
        {vocab.length === 0 ? (
          <p className="text-muted text-sm">{t("noVocab")}</p>
        ) : (
          <VocabList
            initialItems={vocab.map((v) => ({ id: v.id, word: v.word, addedAt: v.addedAt.toISOString() }))}
            labelDelete={t("deleteVocab")}
          />
        )}
      </section>

      <section data-testid="attempts-section">
        <h2 className="text-xl font-semibold mb-4">{t("attempts")}</h2>
        {attempts.length === 0 ? (
          <p className="text-muted text-sm">{t("noAttempts")}</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-3">Skill</th>
                  <th className="px-4 py-3">Exercise</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attempts.map((a) => (
                  <tr key={a.id} data-testid={`attempt-${a.exerciseSlug}`}>
                    <td className="px-4 py-3 text-xs uppercase text-muted">{a.skill}</td>
                    <td className="px-4 py-3 font-medium">{a.title}</td>
                    <td className="px-4 py-3 font-semibold text-brand">{Math.round(a.score * 100)}%</td>
                    <td className="px-4 py-3 text-muted text-xs">{a.completedAt.toLocaleString()}</td>
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
