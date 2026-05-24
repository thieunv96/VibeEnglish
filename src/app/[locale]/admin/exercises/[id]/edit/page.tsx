import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ExerciseForm } from "@/components/admin/ExerciseForm";
import { prisma } from "@/lib/db";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExercisePage({ params }: PageProps) {
  const { id } = await params;
  const ex = await prisma.exercise.findUnique({ where: { id } });
  if (!ex) notFound();

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/admin/exercises" className="hover:text-brand">Exercises</Link> › <span>Edit {ex.title}</span>
      </nav>
      <h1 className="text-3xl font-bold" data-testid="page-title">Edit exercise</h1>
      <ExerciseForm
        initial={{
          id: ex.id,
          slug: ex.slug,
          skill: ex.skill,
          title: ex.title,
          level: ex.level,
          type: ex.type,
          description: ex.description,
          questions: (Array.isArray(ex.questions) ? ex.questions : []) as never,
        }}
      />
    </div>
  );
}
