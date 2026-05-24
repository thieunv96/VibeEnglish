// Pure (no-DB) analytics helpers. Kept in their own file so they can be
// imported from unit tests without pulling in the Prisma client.

export function ageBracketOf(birthYear: number | null | undefined, now = new Date()): string {
  if (!birthYear) return "unknown";
  const age = now.getUTCFullYear() - birthYear;
  if (age < 0 || age > 130) return "unknown";
  if (age < 13) return "<13";
  if (age <= 17) return "13–17";
  if (age <= 24) return "18–24";
  if (age <= 34) return "25–34";
  if (age <= 44) return "35–44";
  if (age <= 54) return "45–54";
  if (age <= 64) return "55–64";
  return "65+";
}

export const AGE_BRACKETS = [
  "<13",
  "13–17",
  "18–24",
  "25–34",
  "35–44",
  "45–54",
  "55–64",
  "65+",
  "unknown",
] as const;

/** Composite lesson "health" — higher is better. */
export function lessonHealth(args: {
  attempts: number;
  avgAccuracy: number;
  completionRate: number;
}): number {
  const { attempts, avgAccuracy, completionRate } = args;
  if (attempts === 0) return 0;
  return avgAccuracy * Math.sqrt(attempts) * (0.5 + 0.5 * completionRate);
}
