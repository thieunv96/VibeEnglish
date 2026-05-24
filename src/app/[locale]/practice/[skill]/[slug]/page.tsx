import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/Container";
import { CefrBadge } from "@/components/CefrBadge";
import { ExerciseRunner } from "@/components/ExerciseRunner";
import { Link } from "@/i18n/navigation";
import { getExercise, isSkill } from "@/lib/content";

interface PageProps {
  params: Promise<{ locale: string; skill: string; slug: string }>;
}

export default async function ExerciseDetail({ params }: PageProps) {
  const { locale, skill, slug } = await params;
  setRequestLocale(locale);
  if (!isSkill(skill)) notFound();

  const exercise = await getExercise(skill, slug);
  if (!exercise) notFound();

  const tSkill = await getTranslations("skills");
  const tEx = await getTranslations("exercise");

  return (
    <Container className="py-10" size="default">
      <nav className="text-sm text-muted mb-3">
        <Link href="/practice" className="hover:text-brand">Practice</Link>
        {" › "}
        <Link href={`/practice/${skill}`} className="hover:text-brand">{tSkill(skill)}</Link>
        {" › "}
        <span>{exercise.title}</span>
      </nav>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="exercise-title">{exercise.title}</h1>
          {exercise.description && <p className="mt-2 text-muted">{exercise.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <CefrBadge level={exercise.level} />
          <span className="text-sm text-muted">{exercise.questions.length} questions</span>
        </div>
      </header>

      <ExerciseRunner
        exercise={exercise}
        labels={{
          check: tEx("check"),
          showAll: tEx("showAll"),
          submit: tEx("submitAll"),
          next: tEx("next"),
          yourScore: tEx("yourScore"),
          correct: tEx("correct"),
          incorrect: tEx("incorrect"),
        }}
      />
    </Container>
  );
}
