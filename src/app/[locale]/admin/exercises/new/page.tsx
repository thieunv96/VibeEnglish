import { Link } from "@/i18n/navigation";
import { ExerciseForm } from "@/components/admin/ExerciseForm";

export default function NewExercisePage() {
  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/admin/exercises" className="hover:text-brand">Exercises</Link> › <span>New</span>
      </nav>
      <h1 className="text-3xl font-bold" data-testid="page-title">New exercise</h1>
      <ExerciseForm />
    </div>
  );
}
