/**
 * CefrEstimate — headline block for the full CEFR results page.
 *
 * Renders "Your estimated CEFR level is <CefrEstimateBadge>".
 * When estimate is "C1+", renders an adjacent explanatory note (AC-15a).
 */

import { CefrEstimateBadge } from "@/components/CefrEstimateBadge";
import type { CefrEstimate as CefrEstimateType } from "@/lib/cefr-estimation";

interface Props {
  estimate: CefrEstimateType;
  /** i18n: "Your estimated CEFR level is" */
  estimatedLevelLabel: string;
  /** i18n: cefrTest.c1PlusExplanation — shown only when estimate === "C1+" */
  c1PlusExplanation: string;
}

export function CefrEstimate({ estimate, estimatedLevelLabel, c1PlusExplanation }: Props) {
  return (
    <div data-testid="cefr-estimate" className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xl font-semibold">{estimatedLevelLabel}</span>
        <CefrEstimateBadge estimate={estimate} className="text-base px-3 py-1" />
      </div>

      {estimate === "C1+" && (
        <p
          data-testid="c1plus-explanation"
          className="text-sm text-muted rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-4 py-3 max-w-prose"
        >
          {c1PlusExplanation}
        </p>
      )}
    </div>
  );
}
