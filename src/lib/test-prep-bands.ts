/**
 * Band estimation for exam-prep mock tests.
 *
 * Pure module — no Prisma, no network. Safe to import in any context and unit-testable.
 *
 * `estimateBand(rawScore, total, exam)` maps a raw listening-mock score ratio to the
 * exam's natural band scale. Band labels are **rounded-down single values** (not ranges):
 *   - IELTS: "Band 4.0", "Band 4.5", … "Band 9.0"  (0.5 steps)
 *   - TOEIC: "200", "400", "600", "800", "900"      (100/200 steps)
 *   - TOEFL: "0", "10", "18", "24", "28"            (integer lower edges)
 *   - OET:   "E", "D", "C", "B", "A"               (single letters)
 *
 * The VibeEnglish disclaimer MUST accompany every displayed band estimate.
 */

import type { ExamSlug } from "@/lib/test-prep-constants";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface BandResult {
  /** Rounded-down single-value label, e.g. "600", "Band 5.5", "B". Not a range string. */
  band: string;
  /** Lower bound of the matched threshold range (0.0–1.0 ratio, inclusive). */
  rangeLow: number;
  /** Upper bound of the matched threshold range (0.0–1.0 ratio, exclusive, except top row). */
  rangeHigh: number;
}

// ---------------------------------------------------------------------------
// Per-exam threshold tables
// (one entry per natural band step, sorted ascending by rangeLow)
// ---------------------------------------------------------------------------

// TODO: SME sign-off (NQ-1) — placeholder values, do not ship to docs as authoritative
const IELTS_BANDS: BandResult[] = [
  { band: "Band 4.0", rangeLow: 0.00, rangeHigh: 0.18 },
  { band: "Band 4.5", rangeLow: 0.18, rangeHigh: 0.27 },
  { band: "Band 5.0", rangeLow: 0.27, rangeHigh: 0.36 },
  { band: "Band 5.5", rangeLow: 0.36, rangeHigh: 0.45 },
  { band: "Band 6.0", rangeLow: 0.45, rangeHigh: 0.55 },
  { band: "Band 6.5", rangeLow: 0.55, rangeHigh: 0.64 },
  { band: "Band 7.0", rangeLow: 0.64, rangeHigh: 0.73 },
  { band: "Band 7.5", rangeLow: 0.73, rangeHigh: 0.82 },
  { band: "Band 8.0", rangeLow: 0.82, rangeHigh: 0.91 },
  { band: "Band 8.5", rangeLow: 0.91, rangeHigh: 0.96 },
  { band: "Band 9.0", rangeLow: 0.96, rangeHigh: 1.01 },
];

// TODO: SME sign-off (NQ-1) — placeholder values, do not ship to docs as authoritative
const TOEIC_BANDS: BandResult[] = [
  { band: "200", rangeLow: 0.00, rangeHigh: 0.30 },
  { band: "400", rangeLow: 0.30, rangeHigh: 0.50 },
  { band: "600", rangeLow: 0.50, rangeHigh: 0.70 },
  { band: "800", rangeLow: 0.70, rangeHigh: 0.90 },
  { band: "900", rangeLow: 0.90, rangeHigh: 1.01 },
];

// TODO: SME sign-off (NQ-1) — placeholder values, do not ship to docs as authoritative
const TOEFL_BANDS: BandResult[] = [
  { band: "0",  rangeLow: 0.00, rangeHigh: 0.33 },
  { band: "10", rangeLow: 0.33, rangeHigh: 0.56 },
  { band: "18", rangeLow: 0.56, rangeHigh: 0.73 },
  { band: "24", rangeLow: 0.73, rangeHigh: 0.87 },
  { band: "28", rangeLow: 0.87, rangeHigh: 1.01 },
];

// TODO: SME sign-off (NQ-1) — placeholder values, do not ship to docs as authoritative
const OET_BANDS: BandResult[] = [
  { band: "E", rangeLow: 0.00, rangeHigh: 0.30 },
  { band: "D", rangeLow: 0.30, rangeHigh: 0.50 },
  { band: "C", rangeLow: 0.50, rangeHigh: 0.70 },
  { band: "B", rangeLow: 0.70, rangeHigh: 0.90 },
  { band: "A", rangeLow: 0.90, rangeHigh: 1.01 },
];

// ---------------------------------------------------------------------------
// Internal lookup table
// ---------------------------------------------------------------------------

const BAND_TABLES: Record<ExamSlug, BandResult[]> = {
  ielts: IELTS_BANDS,
  toeic: TOEIC_BANDS,
  toefl: TOEFL_BANDS,
  oet: OET_BANDS,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Estimate an exam band from a raw listening-mock score.
 *
 * @param rawScore   Number of correct answers (integer ≥ 0).
 * @param total      Total questions answered (integer > 0).
 * @param exam       One of the four supported exam slugs.
 * @returns          The matching `BandResult` row (rounded down to the exam's natural step).
 *
 * Edge cases:
 *   - `total === 0` → returns the lowest band (first row).
 *   - Perfect score (ratio = 1.0) → returns the highest band (last row).
 */
export function estimateBand(rawScore: number, total: number, exam: ExamSlug): BandResult {
  const table = BAND_TABLES[exam];
  if (total <= 0) {
    return table[0];
  }
  const ratio = rawScore / total;
  const match = table.find((b) => ratio >= b.rangeLow && ratio < b.rangeHigh);
  return match ?? table[table.length - 1];
}
