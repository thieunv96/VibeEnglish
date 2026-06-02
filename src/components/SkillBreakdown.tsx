"use client";

/**
 * SkillBreakdown — per-skill correct/total table.
 *
 * Owned by Phase 2. Importable by Phase 3 (CEFR test results).
 * Pure display component: no fetch, no session calls.
 */

import type { SkillScore } from "@/lib/recommendation";

interface Props {
  breakdown: SkillScore[];
  headingLabel: string;
  /** Template string with {correct}/{total} — e.g. "{correct} / {total} correct" */
  itemLabel: string;
}

export function SkillBreakdown({ breakdown, headingLabel, itemLabel }: Props) {
  if (breakdown.length === 0) return null;

  function interpolate(template: string, correct: number, total: number): string {
    return template
      .replace("{correct}", String(correct))
      .replace("{total}", String(total));
  }

  return (
    <section data-testid="skill-breakdown">
      <h3 className="text-lg font-semibold mb-3">{headingLabel}</h3>
      <ul className="space-y-2">
        {breakdown.map(({ skill, correct, total }) => {
          const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
          return (
            <li
              key={skill}
              className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3"
              data-testid={`skill-row-${skill}`}
            >
              <span className="font-medium capitalize">{skill}</span>
              <div className="flex items-center gap-4">
                <div className="w-32 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm text-muted min-w-24 text-right">
                  {interpolate(itemLabel, correct, total)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
