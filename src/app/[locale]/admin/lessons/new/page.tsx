import { Link } from "@/i18n/navigation";
import { LessonForm } from "@/components/admin/LessonForm";

export default function NewLessonPage() {
  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/admin/lessons" className="hover:text-brand">Lessons</Link> › <span>New</span>
      </nav>
      <h1 className="text-3xl font-bold" data-testid="page-title">New lesson</h1>
      <LessonForm />
    </div>
  );
}
