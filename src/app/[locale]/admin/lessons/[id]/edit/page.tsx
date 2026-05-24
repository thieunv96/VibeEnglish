import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { LessonForm } from "@/components/admin/LessonForm";
import { prisma } from "@/lib/db";
import type { SplitSegment } from "@/lib/segments";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLessonPage({ params }: PageProps) {
  const { id } = await params;
  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) notFound();

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/admin/lessons" className="hover:text-brand">Lessons</Link> › <span>Edit {lesson.title}</span>
      </nav>
      <h1 className="text-3xl font-bold" data-testid="page-title">Edit lesson</h1>
      <LessonForm
        initial={{
          id: lesson.id,
          slug: lesson.slug,
          category: lesson.category,
          title: lesson.title,
          level: lesson.level,
          description: lesson.description,
          transcript: lesson.transcript,
          segments: (Array.isArray(lesson.segments) ? lesson.segments : []) as unknown as SplitSegment[],
        }}
      />
    </div>
  );
}
