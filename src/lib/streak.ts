/**
 * Days in a row (ending today UTC) with at least one activity timestamp.
 * Pure function — kept in its own file so unit tests can import it without
 * pulling in the Prisma client.
 */
export function computeStreakDays(timestamps: Date[], now = new Date()): number {
  if (timestamps.length === 0) return 0;
  const daysActive = new Set<string>();
  for (const t of timestamps) {
    daysActive.add(t.toISOString().slice(0, 10));
  }
  let streak = 0;
  const cursor = new Date(now);
  cursor.setUTCHours(0, 0, 0, 0);
  // Allow today to be empty without breaking the streak — start from yesterday
  // if today has no entry yet.
  if (!daysActive.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (daysActive.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
