/**
 * LevelBreakdown — per-CEFR-level correct/total table for the CEFR test results.
 *
 * Iterates CEFR levels in ascending order (A1→C2).
 * Omits rows where total === 0 (no questions drawn for that band).
 */

import type { CefrLevel } from "@/lib/content";

const CEFR_LEVELS_ASC: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

interface LevelScore {
  correct: number;
  total: number;
}

interface Props {
  levelScores: Record<CefrLevel, LevelScore>;
  heading: string;
  /** Template: "{correct} / {total} correct" — {correct} and {total} are interpolated. */
  itemTemplate: string;
}

function interpolate(template: string, correct: number, total: number): string {
  return template
    .replace("{correct}", String(correct))
    .replace("{total}", String(total));
}

export function LevelBreakdown({ levelScores, heading, itemTemplate }: Props) {
  const rows = CEFR_LEVELS_ASC.filter((l) => (levelScores[l]?.total ?? 0) > 0);

  return (
    <section data-testid="level-breakdown">
      <h3 className="text-lg font-semibold mb-3">{heading}</h3>
      <ul className="space-y-2">
        {rows.map((level) => {
          const { correct, total } = levelScores[level];
          const pct = Math.round((correct / total) * 100);
          return (
            <li
              key={level}
              data-testid={`level-breakdown-${level}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-2"
            >
              <span className="w-8 font-bold text-sm text-brand-strong">{level}</span>
              <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full"
                  style={{ width: `${pct}%` }}
                  aria-label={`${pct}%`}
                />
              </div>
              <span className="text-sm text-muted whitespace-nowrap">
                {interpolate(itemTemplate, correct, total)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
