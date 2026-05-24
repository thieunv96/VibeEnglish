"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

interface Props {
  value: number;          // 0..5 (can be fractional for display)
  size?: number;          // px
  interactive?: boolean;
  onChange?: (stars: number) => void;
  className?: string;
  testId?: string;
}

const FILLED = "#F59E0B";       // amber-500
const EMPTY  = "#D1D5DB";       // gray-300

export function Stars({ value, size = 20, interactive = false, onChange, className, testId }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;

  return (
    <div
      role={interactive ? "radiogroup" : "img"}
      aria-label={interactive ? "Rate this lesson" : `${value.toFixed(1)} out of 5 stars`}
      data-testid={testId ?? "stars"}
      className={cn("inline-flex items-center gap-0.5", className)}
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fillRatio = Math.max(0, Math.min(1, shown - (i - 1)));
        return (
          <button
            key={i}
            type="button"
            tabIndex={interactive ? 0 : -1}
            disabled={!interactive}
            onMouseEnter={interactive ? () => setHover(i) : undefined}
            onClick={interactive && onChange ? () => onChange(i) : undefined}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            aria-pressed={interactive ? Math.round(value) === i : undefined}
            data-testid={interactive ? `star-${i}` : undefined}
            className={cn(
              "p-0 leading-none",
              interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default",
            )}
            style={{ width: size, height: size }}
          >
            <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
              <defs>
                <linearGradient id={`star-grad-${i}-${size}`}>
                  <stop offset={`${fillRatio * 100}%`} stopColor={FILLED} />
                  <stop offset={`${fillRatio * 100}%`} stopColor={EMPTY} />
                </linearGradient>
              </defs>
              <path
                d="M12 2.5l2.92 5.92 6.53.95-4.72 4.6 1.11 6.5L12 17.77l-5.84 3.07 1.11-6.5-4.72-4.6 6.53-.95L12 2.5z"
                fill={`url(#star-grad-${i}-${size})`}
                stroke="#9CA3AF"
                strokeWidth="0.5"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
