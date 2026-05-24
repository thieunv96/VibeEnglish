import type { UserStats, UserActivityRow } from "@/lib/user-analytics";

export function StatsCard({ stats }: { stats: UserStats }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5" data-testid="profile-stats">
      <h2 className="text-lg font-semibold mb-4">Your learning</h2>
      <dl className="grid grid-cols-2 gap-y-3">
        <Cell label="Lessons started" value={stats.lessonsStarted} />
        <Cell label="Lessons completed" value={stats.lessonsCompleted} />
        <Cell label="Avg accuracy" value={`${Math.round(stats.avgAccuracy * 100)}%`} />
        <Cell label="Exercises taken" value={stats.exercisesAttempted} />
        <Cell label="Avg exercise" value={`${Math.round(stats.avgExerciseScore * 100)}%`} />
        <Cell label="Vocab saved" value={stats.vocabSaved} />
        <Cell label="Active min (30d)" value={stats.activeMinutes30d} />
        <Cell label="Active min (total)" value={stats.activeMinutesTotal} />
        <Cell label="Ratings given" value={stats.ratingsGiven} />
        <Cell label="🔥 Streak" value={`${stats.streakDays} days`} />
      </dl>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-lg font-bold text-foreground">{value}</dd>
    </div>
  );
}

export function ActivityFeedCard({ rows }: { rows: UserActivityRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-5" data-testid="profile-activity">
        <h2 className="text-lg font-semibold mb-2">Recent activity</h2>
        <p className="text-sm text-muted">No activity yet — start a lesson!</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-white p-5" data-testid="profile-activity">
      <h2 className="text-lg font-semibold mb-3">Recent activity</h2>
      <ul className="divide-y divide-border">
        {rows.map((r, i) => (
          <li key={i} className="py-2 flex items-start gap-3 text-sm">
            <span aria-hidden className="text-base">{ICONS[r.kind]}</span>
            <span className="flex-1 min-w-0">
              <div className="truncate">{r.detail}</div>
              <div className="text-xs text-muted">
                {r.at.toISOString().slice(0, 16).replace("T", " ")}
              </div>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const ICONS: Record<UserActivityRow["kind"], string> = {
  progress: "🎧",
  attempt: "📝",
  vocab: "🔤",
  rating: "⭐",
};
