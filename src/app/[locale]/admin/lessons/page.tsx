import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { CefrBadge } from "@/components/CefrBadge";
import { lessonCategories } from "@/lib/content";
import type { CefrLevel } from "@/lib/content";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";

interface PageProps {
  searchParams: Promise<{ category?: string; level?: string; q?: string }>;
}

export default async function AdminLessons({ searchParams }: PageProps) {
  const sp = await searchParams;
  const where: Record<string, unknown> = {};
  if (sp.category && (lessonCategories as readonly string[]).includes(sp.category)) {
    where.category = sp.category;
  }
  if (sp.level) where.level = sp.level;
  if (sp.q) where.title = { contains: sp.q };

  const lessons = await prisma.lesson.findMany({
    where,
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Lessons</h1>
          <p className="text-muted text-sm">{lessons.length} matching lessons</p>
        </div>
        <Link
          href="/admin/lessons/new"
          data-testid="admin-new-lesson"
          className="rounded-md bg-brand hover:bg-brand-strong text-white font-semibold px-4 py-2"
        >
          + New lesson
        </Link>
      </header>

      <form className="flex flex-wrap gap-3 rounded-xl border border-border bg-white p-4" method="GET">
        <select name="category" defaultValue={sp.category ?? ""} className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="">All categories</option>
          {lessonCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select name="level" defaultValue={sp.level ?? ""} className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="">All levels</option>
          {(["A1","A2","B1","B2","C1","C2"] as CefrLevel[]).map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
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
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Segments</th>
              <th className="px-4 py-2">Updated</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border" data-testid="admin-lesson-list">
            {lessons.map((l) => {
              const segArr = Array.isArray(l.segments) ? (l.segments as unknown[]) : [];
              return (
                <tr key={l.id} data-testid={`admin-lesson-row-${l.slug}`}>
                  <td className="px-4 py-2"><CefrBadge level={l.level as CefrLevel} /></td>
                  <td className="px-4 py-2 font-medium">{l.title}</td>
                  <td className="px-4 py-2 text-muted">{l.category}</td>
                  <td className="px-4 py-2 text-muted">{segArr.length}</td>
                  <td className="px-4 py-2 text-xs text-muted">{l.updatedAt.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-2 text-right space-x-3">
                    <Link
                      href={`/admin/lessons/${l.id}/edit`}
                      data-testid={`admin-edit-${l.slug}`}
                      className="text-brand hover:text-brand-strong font-semibold text-xs"
                    >
                      Edit
                    </Link>
                    <ConfirmDeleteButton apiPath={`/api/admin/lessons/${l.id}`} testId={`admin-delete-${l.slug}`} />
                  </td>
                </tr>
              );
            })}
            {lessons.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No lessons match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
