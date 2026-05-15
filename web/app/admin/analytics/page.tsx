import { db } from "@/db";
import { users, lessonAttempts, userProgress } from "@/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";

export default async function AnalyticsPage() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  const [sessions] = await db
    .select({ c: sql<number>`count(*)` })
    .from(lessonAttempts)
    .where(gte(lessonAttempts.startedAt, sevenDaysAgo));

  const [completed] = await db
    .select({ c: sql<number>`count(*)` })
    .from(lessonAttempts)
    .where(and(eq(lessonAttempts.status, "completed"), gte(lessonAttempts.startedAt, sevenDaysAgo)));

  const [avgScore] = await db
    .select({ a: sql<number>`avg(score)` })
    .from(lessonAttempts)
    .where(eq(lessonAttempts.status, "completed"));

  const [avgStreak] = await db
    .select({ a: sql<number>`avg(streak_days)` })
    .from(userProgress);

  const levelDist = await db
    .select({
      level: users.id, // placeholder; use join below
    })
    .from(users);

  // Bar chart of users by level
  const distRows = await db.execute(sql`
    SELECT level, COUNT(*) as count
    FROM onboarding_profiles
    GROUP BY level
    ORDER BY level
  `);
  const distArr = (distRows as unknown as { level: string; count: number }[][])[0] ?? [];
  const dist = Array.isArray(distArr)
    ? (distArr as { level: string; count: number }[])
    : [];

  const completionRate = sessions.c > 0 ? Math.round((Number(completed.c) / Number(sessions.c)) * 100) : 0;
  const maxDist = Math.max(...dist.map((d) => Number(d.count)), 1);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Sessions (7 ngày)" value={String(sessions.c)} />
        <KPI label="Completion rate" value={`${completionRate}%`} />
        <KPI label="Điểm TB" value={avgScore.a ? Math.round(Number(avgScore.a)).toString() : "—"} />
        <KPI label="Streak TB" value={avgStreak.a ? Number(avgStreak.a).toFixed(1) : "—"} />
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <h3 className="font-bold mb-4">Phân bố level users</h3>
        {dist.length === 0 ? (
          <p className="text-sm text-stone-500">Chưa có dữ liệu.</p>
        ) : (
          <div className="space-y-2.5">
            {dist.map((d) => (
              <div key={d.level} className="flex items-center gap-3">
                <span className="text-xs w-8 font-medium">{d.level}</span>
                <div className="flex-1 h-6 bg-stone-100 rounded overflow-hidden">
                  <div className="h-full bg-brand-500 rounded transition-[width] duration-500" style={{ width: `${(Number(d.count) / maxDist) * 100}%` }} />
                </div>
                <span className="text-xs font-medium w-8 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="text-xs text-stone-500">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}
