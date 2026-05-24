import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { CefrBadge } from "@/components/CefrBadge";
import { skills } from "@/lib/content";
import type { CefrLevel } from "@/lib/content";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";

interface PageProps {
  searchParams: Promise<{ skill?: string; level?: string; q?: string }>;
}

export default async function AdminExercises({ searchParams }: PageProps) {
  const sp = await searchParams;
  const where: Record<string, unknown> = {};
  if (sp.skill && (skills as readonly string[]).includes(sp.skill)) where.skill = sp.skill;
  if (sp.level) where.level = sp.level;
  if (sp.q) where.title = { contains: sp.q };

  const exercises = await prisma.exercise.findMany({
    where,
    orderBy: [{ skill: "asc" }, { title: "asc" }],
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Exercises</h1>
          <p className="text-muted text-sm">{exercises.length} matching exercises</p>
        </div>
        <Link
          href="/admin/exercises/new"
          data-testid="admin-new-exercise"
          className="rounded-md bg-brand hover:bg-brand-strong text-white font-semibold px-4 py-2"
        >
          + New exercise
        </Link>
      </header>

      <form className="flex flex-wrap gap-3 rounded-xl border border-border bg-white p-4" method="GET">
        <select name="skill" defaultValue={sp.skill ?? ""} className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="">All skills</option>
          {skills.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select name="level" defaultValue={sp.level ?? ""} className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="">All levels</option>
          {(["A1","A2","B1","B2","C1","C2"] as CefrLevel[]).map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search title…"
          className="flex-1 min-w-40 rounded-md border border-border px-3 py-2 text-sm"
        />
        <button className="rounded-md bg-brand text-white font-semibold px-4 py-2 text-sm">Filter</button>
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-4 py-2">Level</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Skill</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Questions</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border" data-testid="admin-exercise-list">
            {exercises.map((ex) => {
              const qArr = Array.isArray(ex.questions) ? (ex.questions as unknown[]) : [];
              return (
                <tr key={ex.id} data-testid={`admin-exercise-row-${ex.slug}`}>
                  <td className="px-4 py-2"><CefrBadge level={ex.level as CefrLevel} /></td>
                  <td className="px-4 py-2 font-medium">{ex.title}</td>
                  <td className="px-4 py-2 text-muted">{ex.skill}</td>
                  <td className="px-4 py-2 text-xs uppercase text-muted">{ex.type}</td>
                  <td className="px-4 py-2 text-muted">{qArr.length}</td>
                  <td className="px-4 py-2 text-right space-x-3">
                    <Link
                      href={`/admin/exercises/${ex.id}/edit`}
                      data-testid={`admin-edit-${ex.slug}`}
                      className="text-brand hover:text-brand-strong font-semibold text-xs"
                    >Edit</Link>
                    <ConfirmDeleteButton apiPath={`/api/admin/exercises/${ex.id}`} testId={`admin-delete-${ex.slug}`} />
                  </td>
                </tr>
              );
            })}
            {exercises.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No exercises match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
