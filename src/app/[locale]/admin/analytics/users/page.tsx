import { totalsOverview, ageBrackets, localeBreakdown, timeOnPlatformPerUser } from "@/lib/analytics";

export default async function UsersAnalyticsPage() {
  const [totals, ages, locales, topTime] = await Promise.all([
    totalsOverview(),
    ageBrackets(),
    localeBreakdown(),
    timeOnPlatformPerUser(20),
  ]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold" data-testid="page-title">Users & demographics</h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-4">
        <Tile title="Total users" value={totals.totalUsers} />
        <Tile title="Learners" value={totals.learnerUsers} />
        <Tile title="Admins" value={totals.adminUsers} />
        <Tile title="New (30d)" value={totals.signupsLast30d} />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card title="Age brackets" testid="age-brackets">
          <BarTable rows={ages.map((a) => ({ label: a.bracket, value: a.count }))} />
        </Card>
        <Card title="Locale" testid="locale-breakdown">
          <BarTable rows={locales.map((l) => ({ label: l.locale, value: l.count }))} />
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Top time-spenders</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface">
              <tr><th className="px-4 py-2">#</th><th className="px-4 py-2">User</th><th className="px-4 py-2 text-right">Active minutes</th></tr>
            </thead>
            <tbody className="divide-y divide-border" data-testid="top-time">
              {topTime.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-muted">No activity recorded yet.</td></tr>
              )}
              {topTime.map((u, i) => (
                <tr key={u.userId}>
                  <td className="px-4 py-2 text-muted">{i + 1}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2 text-right font-semibold text-brand">{u.minutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Tile({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{title}</div>
      <div className="mt-1 text-2xl font-extrabold text-brand">{value.toLocaleString()}</div>
    </div>
  );
}

function Card({ title, testid, children }: { title: string; testid: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5" data-testid={testid}>
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function BarTable({ rows }: { rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-3 text-sm">
          <span className="w-20 text-muted">{r.label}</span>
          <div className="flex-1 h-3 rounded bg-surface overflow-hidden">
            <div className="h-full bg-brand" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <span className="w-10 text-right font-semibold">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}
