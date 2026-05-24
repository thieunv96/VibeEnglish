import { Link } from "@/i18n/navigation";
import {
  totalsOverview,
  dauWauMau,
  recentActivityFeed,
  signupsByDay,
} from "@/lib/analytics";
import { Sparkline } from "@/components/admin/Sparkline";

export default async function AnalyticsOverview() {
  const [totals, dwm, signups, feed] = await Promise.all([
    totalsOverview(),
    dauWauMau(),
    signupsByDay(30),
    recentActivityFeed(20),
  ]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold" data-testid="page-title">Analytics</h1>
        <p className="mt-1 text-muted">Data to decide what to build, fix, and write next.</p>
      </header>

      <section data-testid="overview-tiles" className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Tile title="Total users" value={totals.totalUsers} />
        <Tile title="Learners" value={totals.learnerUsers} />
        <Tile title="DAU" value={dwm.dauLast24h} hint="last 24h" />
        <Tile title="WAU" value={dwm.wauLast7d} hint="last 7d" />
        <Tile title="MAU" value={dwm.mauLast30d} hint="last 30d" />
        <Tile title="Active minutes" value={totals.totalActivityMinutes} hint="all-time" />
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-lg font-semibold">Signups, last 30 days</h2>
          <span className="text-sm text-muted">
            7d: <strong className="text-foreground">{totals.signupsLast7d}</strong>{" · "}
            30d: <strong className="text-foreground">{totals.signupsLast30d}</strong>
          </span>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <Sparkline data={signups.map((s) => ({ label: s.day, value: s.count }))} width={720} height={80} />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <DrillCard title="Lessons performance" href="/admin/analytics/lessons" />
        <DrillCard title="Exercises performance" href="/admin/analytics/exercises" />
        <DrillCard title="Users & demographics" href="/admin/analytics/users" />
        <DrillCard title="Engagement & content staleness" href="/admin/analytics/engagement" />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Recent activity</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface">
              <tr><th className="px-4 py-2">When</th><th className="px-4 py-2">User</th><th className="px-4 py-2">Activity</th></tr>
            </thead>
            <tbody className="divide-y divide-border" data-testid="activity-feed">
              {feed.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-muted">No learner activity yet.</td></tr>
              )}
              {feed.map((row, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-xs text-muted">{row.at.toISOString().slice(0, 19).replace("T", " ")}</td>
                  <td className="px-4 py-2 text-xs">{row.email}</td>
                  <td className="px-4 py-2">{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function DrillCard({ title, href }: { title: string; href: string }) {
  return (
    <Link href={href} className="rounded-xl border border-border bg-white p-5 hover:border-brand transition-colors">
      <h3 className="font-semibold">{title}</h3>
      <span className="mt-2 inline-block text-sm font-semibold text-brand">Open →</span>
    </Link>
  );
}
