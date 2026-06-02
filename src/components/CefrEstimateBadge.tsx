/**
 * CefrEstimateBadge — renders a CEFR estimate label including the "C1+" case.
 *
 * - For standard CefrLevel values: delegates to CefrBadge (unchanged component).
 * - For "C1+": renders a custom violet/fuchsia gradient pill.
 *   CefrBadge is typed to CefrLevel only, so "C1+" cannot be passed to it.
 */

import { CefrBadge } from "@/components/CefrBadge";
import type { CefrEstimate } from "@/lib/cefr-estimation";

interface Props {
  estimate: CefrEstimate;
  className?: string;
}

export function CefrEstimateBadge({ estimate, className }: Props) {
  if (estimate === "C1+") {
    return (
      <span
        data-testid="cefr-estimate-c1plus"
        className={[
          "inline-flex items-center justify-center rounded-md border px-2 py-0.5",
          "text-xs font-semibold",
          "bg-gradient-to-r from-violet-100 to-fuchsia-100",
          "border-fuchsia-300 text-fuchsia-900",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        C1+
      </span>
    );
  }

  // Standard CefrLevel — delegate to the shared badge.
  return <CefrBadge level={estimate} className={className} />;
}
