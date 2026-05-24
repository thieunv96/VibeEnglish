import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/Container";
import { Link } from "@/i18n/navigation";
import { skillStats, skills } from "@/lib/content";

const emojis: Record<string, string> = {
  grammar: "📝",
  vocabulary: "🔤",
  listening: "👂",
  reading: "📚",
  speaking: "🎤",
  writing: "✍️",
  "word-skills": "🧩",
  business: "💼",
};

export default async function PracticeIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("practice");
  const tSkill = await getTranslations("skills");
  const tSkillDesc = await getTranslations("skillsDesc");
  const counts = Object.fromEntries(skillStats().map((s) => [s.slug, s.count]));

  return (
    <Container size="wide" className="py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" data-testid="page-title">{t("title")}</h1>
        <p className="mt-3 text-muted max-w-2xl mx-auto">{t("sub")}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="skill-list">
        {skills.map((sk) => (
          <Link
            key={sk}
            href={`/practice/${sk}`}
            className="group rounded-xl border border-border bg-white p-6 hover:border-brand hover:shadow-md transition-all text-center"
          >
            <div className="text-3xl mb-2">{emojis[sk]}</div>
            <h2 className="font-semibold group-hover:text-brand">{tSkill(sk as "grammar")}</h2>
            <p className="mt-2 text-xs text-muted">{tSkillDesc(sk as "grammar")}</p>
            <div className="mt-3 text-xs font-semibold text-brand">{counts[sk] ?? 0} {t("exercisesLabel")}</div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
