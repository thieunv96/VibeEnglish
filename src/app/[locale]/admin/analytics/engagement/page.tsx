import { dauWauMau, contentStaleness, totalsOverview, signupsByDay } from "@/lib/analytics";
import { Sparkline } from "@/components/admin/Sparkline";

export default async function EngagementPage() {
  const [dwm, totals, staleness, signups] = await Promise.all([
    dauWauMau(),
    totalsOverview(),
    contentStaleness(),
    signupsByDay(30),
  ]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold" data-testid="page-title">Engagement & content health</h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Tile title="DAU" value={dwm.dauLast24h} hint="last 24h" />
        <Tile title="WAU" value={dwm.wauLast7d} hint="last 7d" />
        <Tile title="MAU" value={dwm.mauLast30d} hint="last 30d" />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Signups, last 30 days</h2>
        <div className="rounded-xl border border-border bg-white p-4">
          <Sparkline data={signups.map((s) => ({ label: s.day, value: s.count }))} width={720} height={80} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Active minutes (total)</h2>
        <div className="rounded-xl border border-border bg-white p-5">
          <div className="text-3xl font-extrabold text-brand">{totals.totalActivityMinutes.toLocaleString()}</div>
          <p className="mt-1 text-sm text-muted">Minutes recorded across all learner sessions via 60s heartbeats.</p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Content staleness</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface">
              <tr><th className="px-4 py-2">Updated within</th><th className="px-4 py-2 text-right">Lessons</th><th className="px-4 py-2 text-right">Exercises</th></tr>
            </thead>
            <tbody className="divide-y divide-border" data-testid="staleness">
              {staleness.rows.map((r) => (
                <tr key={r.bucket}>
                  <td className="px-4 py-2">{r.bucket}</td>
                  <td className="px-4 py-2 text-right">{r.lessons}</td>
                  <td className="px-4 py-2 text-right">{r.exercises}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">
          Zero-engagement content: <strong>{staleness.zeroEngagementLessons}</strong> lessons
          and <strong>{staleness.zeroEngagementExercises}</strong> exercises have never been attempted.
        </p>
      </section>
    </div>
  );
}

function Tile({ title, value, hint }: { title: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{title}</div>
      <div className="mt-1 text-2xl font-extrabold text-brand">{value.toLocaleString()}</div>
      {hint && <div className="text-xs text-muted">{hint}</div>}
    </div>
  );
}
