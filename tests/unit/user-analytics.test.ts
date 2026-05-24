import { describe, it, expect } from "vitest";
import { computeStreakDays } from "../../src/lib/streak";

const D = (s: string) => new Date(`${s}T12:00:00Z`);

describe("computeStreakDays", () => {
  it("returns 0 with no activity", () => {
    expect(computeStreakDays([])).toBe(0);
  });

  it("counts only the trailing run of consecutive days", () => {
    // gap on 03 breaks the streak; only 04 + 05 + 06 (today) count.
    const ts = [
      D("2026-05-01"),
      D("2026-05-02"),
      D("2026-05-04"),
      D("2026-05-05"),
      D("2026-05-06"),
    ];
    expect(computeStreakDays(ts, D("2026-05-06"))).toBe(3);
  });

  it("tolerates an empty 'today' by counting backward from yesterday", () => {
    const ts = [D("2026-05-04"), D("2026-05-05")];
    // Today (2026-05-06) has no rows, so streak is yesterday's 2 days.
    expect(computeStreakDays(ts, D("2026-05-06"))).toBe(2);
  });

  it("returns 0 when last activity is older than yesterday", () => {
    const ts = [D("2026-05-01")];
    expect(computeStreakDays(ts, D("2026-05-06"))).toBe(0);
  });

  it("counts a single day correctly", () => {
    const ts = [D("2026-05-06")];
    expect(computeStreakDays(ts, D("2026-05-06"))).toBe(1);
  });
});
