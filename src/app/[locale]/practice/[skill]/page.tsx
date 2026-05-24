import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/Container";
import { CefrBadge } from "@/components/CefrBadge";
import { Link } from "@/i18n/navigation";
import { getExercises, isSkill } from "@/lib/content";

interface PageProps {
  params: Promise<{ locale: string; skill: string }>;
}

export default async function SkillPage({ params }: PageProps) {
  const { locale, skill } = await params;
  setRequestLocale(locale);
  if (!isSkill(skill)) notFound();

  const tSkill = await getTranslations("skills");
  const tSkillDesc = await getTranslations("skillsDesc");
  const t = await getTranslations("category");
  const tL = await getTranslations("lessons");

  const exercises = getExercises(skill);

  return (
    <Container size="wide" className="py-10">
      <nav className="text-sm text-muted mb-2">
        <Link href="/practice" className="hover:text-brand">Practice</Link>
        {" › "}
        <span>{tSkill(skill)}</span>
      </nav>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
          {exercises.length} {tSkill(skill)} exercises
        </h1>
        <p className="mt-2 text-muted">{tSkillDesc(skill)}</p>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-4 py-3">{t("levelHeader")}</th>
              <th className="px-4 py-3">{t("titleHeader")}</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">{t("actionHeader")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border" data-testid="exercise-list">
            {exercises.map((ex) => (
              <tr key={ex.slug}>
                <td className="px-4 py-3"><CefrBadge level={ex.level} /></td>
                <td className="px-4 py-3 font-medium">{ex.title}</td>
                <td className="px-4 py-3 text-muted text-xs uppercase">{ex.type}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/practice/${skill}/${ex.slug}`}
                    className="inline-flex rounded-md bg-brand hover:bg-brand-strong text-white text-xs font-semibold px-3 py-1.5"
                  >
                    {tL("startBtn")}
                  </Link>
                </td>
              </tr>
            ))}
            {exercises.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">No exercises yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
