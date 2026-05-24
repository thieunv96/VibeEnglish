import { CefrBadge } from "@/components/CefrBadge";
import type { CefrLevel } from "@/lib/content";
import { exercisesPerformance } from "@/lib/analytics";

export default async function ExercisesAnalyticsPage() {
  const rows = await exercisesPerformance();
  const needsAttention = rows
    .filter((r) => r.attempts >= 3 && r.avgScore < 0.5)
    .sort((a, b) => a.avgScore - b.avgScore)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold" data-testid="page-title">Exercises performance</h1>
        <p className="text-sm text-muted mt-1">Ranked by total attempts. Low average score with many attempts = candidates to rework.</p>
      </header>

      {needsAttention.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Needs attention</h2>
          <ul className="rounded-xl border border-amber-300 bg-amber-50 divide-y divide-amber-200" data-testid="needs-attention">
            {needsAttention.map((r) => (
              <li key={r.id} className="px-4 py-2 flex justify-between items-center text-sm">
                <span><strong>{r.title}</strong> <span className="text-muted">({r.skill} · {r.level})</span></span>
                <span className="text-amber-900">{r.attempts} attempts · {(r.avgScore * 100).toFixed(0)}% avg</span>
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
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Skill</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2 text-right">Attempts</th>
              <th className="px-4 py-2 text-right">Avg score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border" data-testid="analytics-exercise-list">
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">No exercises.</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className="px-4 py-2 text-muted">{i + 1}</td>
                <td className="px-4 py-2"><CefrBadge level={r.level as CefrLevel} /></td>
                <td className="px-4 py-2 font-medium">{r.title}</td>
                <td className="px-4 py-2 text-muted">{r.skill}</td>
                <td className="px-4 py-2 text-xs uppercase text-muted">{r.type}</td>
                <td className="px-4 py-2 text-right">{r.attempts}</td>
                <td className="px-4 py-2 text-right font-semibold text-brand">{(r.avgScore * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
