/**
 * /admin/test-prep — Mock test analytics overview (AC-14).
 *
 * Server Component. Auth gate is inherited from the admin layout
 * (requireAdmin via auth() + redirect). No extra auth call needed here.
 *
 * Renders 4 per-exam summary cards + a per-exam band-distribution table.
 * Data is computed at page load (cached/recomputed is acceptable for V1).
 */

import { getTestPrepAnalytics } from "@/lib/test-prep-admin-analytics";

const EXAM_LABELS: Record<string, string> = {
  toeic: "TOEIC",
  toefl: "TOEFL iBT",
  ielts: "IELTS",
  oet: "OET",
};

export default async function AdminTestPrepPage() {
  const data = await getTestPrepAnalytics();

  return (
    <div className="space-y-8" data-testid="admin-test-prep-page">
      <header>
        <h1 className="text-3xl font-bold" data-testid="page-title">Test Prep Analytics</h1>
        <p className="mt-1 text-muted text-sm">
          Per-exam mock test attempt counts and average scores.{" "}
          <span className="text-xs text-muted">Generated at {new Date(data.generatedAt).toUTCString()}</span>
        </p>
      </header>

      {/* Summary cards — one per exam */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.perExam.map((ex) => (
          <div
            key={ex.exam}
            className="rounded-xl border border-border bg-white p-5 space-y-3"
            data-testid={`admin-test-prep-exam-card-${ex.exam}`}
          >
            <div className="font-bold text-lg">{EXAM_LABELS[ex.exam] ?? ex.exam.toUpperCase()}</div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted">This month</div>
                <div className="font-semibold text-brand">
                  {ex.currentMonth.attemptCount} attempt{ex.currentMonth.attemptCount !== 1 ? "s" : ""}
                </div>
                <div className="text-muted text-xs">
                  Avg:{" "}
                  {ex.currentMonth.averageScore != null
                    ? `${(ex.currentMonth.averageScore * 100).toFixed(0)}%`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted">All time</div>
                <div className="font-semibold text-brand">
                  {ex.allTime.attemptCount} attempt{ex.allTime.attemptCount !== 1 ? "s" : ""}
                </div>
                <div className="text-muted text-xs">
                  Avg:{" "}
                  {ex.allTime.averageScore != null
                    ? `${(ex.allTime.averageScore * 100).toFixed(0)}%`
                    : "—"}
                </div>
              </div>
            </div>

            {/* Top-3 band distribution entries */}
            {ex.bandDistribution.length > 0 && (
              <div className="text-xs text-muted space-y-0.5">
                <div className="font-medium text-foreground">Top bands:</div>
                {ex.bandDistribution.slice(0, 3).map((b) => (
                  <div key={b.band} className="flex justify-between">
                    <span>{b.band}</span>
                    <span className="font-semibold">{b.count}</span>
                  </div>
                ))}
              </div>
            )}
            {ex.bandDistribution.length === 0 && (
              <div className="text-xs text-muted italic">No attempts yet</div>
            )}
          </div>
        ))}
      </section>

      {/* Per-exam full band distribution table */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold">Band Distribution by Exam</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface">
              <tr>
                <th className="px-4 py-2">Exam</th>
                <th className="px-4 py-2">Band</th>
                <th className="px-4 py-2 text-right">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border" data-testid="admin-test-prep-band-table">
              {data.perExam.every((ex) => ex.bandDistribution.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted">
                    No mock test attempts recorded yet.
                  </td>
                </tr>
              )}
              {data.perExam.map((ex) =>
                ex.bandDistribution.map((b) => (
                  <tr key={`${ex.exam}-${b.band}`}>
                    <td className="px-4 py-2 font-medium">
                      {EXAM_LABELS[ex.exam] ?? ex.exam.toUpperCase()}
                    </td>
                    <td className="px-4 py-2">{b.band}</td>
                    <td className="px-4 py-2 text-right font-semibold text-brand">{b.count}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
