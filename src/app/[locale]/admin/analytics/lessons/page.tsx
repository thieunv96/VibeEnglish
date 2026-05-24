import { Link } from "@/i18n/navigation";
import { CefrBadge } from "@/components/CefrBadge";
import type { CefrLevel } from "@/lib/content";
import { lessonsPerformance } from "@/lib/analytics";

interface PageProps {
  searchParams: Promise<{ sort?: string; order?: "asc" | "desc" }>;
}

const SORT_KEYS = ["health", "attempts", "avgAccuracy", "completionRate", "title"] as const;
type SortKey = (typeof SORT_KEYS)[number];

export default async function LessonsAnalyticsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const sort = (SORT_KEYS as readonly string[]).includes(sp.sort ?? "")
    ? (sp.sort as SortKey)
    : "health";
  const order: "asc" | "desc" = sp.order === "asc" ? "asc" : "desc";

  const rows = await lessonsPerformance();

  rows.sort((a, b) => {
    const va =
      sort === "health" ? a.healthScore :
      sort === "attempts" ? a.attempts :
      sort === "avgAccuracy" ? a.avgAccuracy :
      sort === "completionRate" ? a.completionRate :
      a.title.localeCompare(b.title);
    const vb =
      sort === "health" ? b.healthScore :
      sort === "attempts" ? b.attempts :
      sort === "avgAccuracy" ? b.avgAccuracy :
      sort === "completionRate" ? b.completionRate :
      0;
    if (sort === "title") return order === "asc" ? va : -(va as number);
    return order === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  const needsAttention = rows
    .filter((r) => r.attempts >= 3 && (r.avgAccuracy < 0.5 || r.completionRate < 0.3))
    .sort((a, b) => a.avgAccuracy - b.avgAccuracy)
    .slice(0, 5);

  function sortLink(key: SortKey, label: string): string {
    const nextOrder = sort === key && order === "desc" ? "asc" : "desc";
    return `?sort=${key}&order=${nextOrder}` + `#${label}`;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold" data-testid="page-title">Lessons performance</h1>
        <p className="text-sm text-muted mt-1">
          Health score = avg accuracy × √attempts × (0.5 + 0.5 × completion rate). Higher is better.
        </p>
      </header>

      {needsAttention.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Needs attention</h2>
          <ul className="rounded-xl border border-amber-300 bg-amber-50 divide-y divide-amber-200" data-testid="needs-attention">
            {needsAttention.map((r) => (
              <li key={r.id} className="px-4 py-2 flex justify-between items-center text-sm">
                <span>
                  <strong>{r.title}</strong>{" "}
                  <span className="text-muted">({r.category} · {r.level})</span>
                </span>
                <span className="text-amber-900">
                  {r.attempts} attempts · {(r.avgAccuracy * 100).toFixed(0)}% acc · {(r.completionRate * 100).toFixed(0)}% completion
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Level</th>
              <th className="px-4 py-2"><Link href={sortLink("title", "title")}>Title</Link></th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2 text-right"><Link href={sortLink("attempts", "att")}>Attempts</Link></th>
              <th className="px-4 py-2 text-right"><Link href={sortLink("avgAccuracy", "acc")}>Avg acc.</Link></th>
              <th className="px-4 py-2 text-right"><Link href={sortLink("completionRate", "cmp")}>Completion</Link></th>
              <th className="px-4 py-2 text-right"><Link href={sortLink("health", "hp")}>Health</Link></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border" data-testid="analytics-lesson-list">
            {rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-muted">No lessons.</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className="px-4 py-2 text-muted">{i + 1}</td>
                <td className="px-4 py-2"><CefrBadge level={r.level as CefrLevel} /></td>
                <td className="px-4 py-2 font-medium">{r.title}</td>
                <td className="px-4 py-2 text-muted">{r.category}</td>
                <td className="px-4 py-2 text-right">{r.attempts}</td>
                <td className="px-4 py-2 text-right">{(r.avgAccuracy * 100).toFixed(0)}%</td>
                <td className="px-4 py-2 text-right">{(r.completionRate * 100).toFixed(0)}%</td>
                <td className="px-4 py-2 text-right font-semibold text-brand">
                  {r.healthScore.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
