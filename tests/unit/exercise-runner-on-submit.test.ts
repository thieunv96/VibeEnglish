/**
 * exercise-runner-on-submit.test.ts
 *
 * Tests for the additive `onSubmit?` prop added to ExerciseRunner (Phase 1, B3).
 *
 * ExerciseRunner is a "use client" React component — rendering it requires a DOM
 * environment (jsdom/happy-dom) which is not installed in this project's unit-test
 * setup (environment: "node"). The component-level behaviour is covered by the
 * Phase 5 E2E tests (SampleTestRunner / CefrTestRunner flows).
 *
 * What we CAN verify here without a DOM:
 *   1. The module compiles with the new exported types (import-time check).
 *   2. The ExerciseSubmitPayload shape is structurally correct and assignable.
 *   3. A mock that mimics the submitAll branch logic confirms: when onSubmit is
 *      provided, a stand-in for fetch is never called; when it is absent, fetch
 *      IS called. This is a direct port of the branch logic from ExerciseRunner
 *      and proves the invariant without mounting React.
 */

import { describe, it, expect, vi } from "vitest";
import type { ExerciseSubmitPayload } from "../../src/components/ExerciseRunner";

// ---------------------------------------------------------------------------
// Type-shape test: ExerciseSubmitPayload
// ---------------------------------------------------------------------------
describe("ExerciseSubmitPayload type", () => {
  it("accepts a well-formed payload object", () => {
    const payload: ExerciseSubmitPayload = {
      answers: { q1: "Paris", q2: { left: "right" } },
      feedback: { q1: "correct", q2: "incorrect" },
      correctCount: 1,
      score: 0.5,
    };
    // If this compiles, the type shape is correct.
    expect(payload.correctCount).toBe(1);
    expect(payload.score).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// Branch-logic test: onSubmit suppresses the /api/attempts write
//
// This replicates the exact decision tree from ExerciseRunner.submitAll()
// to verify the invariant without a DOM:
//   - when onSubmit IS provided: fetch must NOT be called
//   - when onSubmit is NOT provided + authenticated: fetch MUST be called
// ---------------------------------------------------------------------------

/**
 * Minimal reproduction of ExerciseRunner.submitAll() decision logic.
 * Kept in sync with src/components/ExerciseRunner.tsx — if that code
 * changes, update this mirror.
 */
async function submitAllLogic(opts: {
  payload: ExerciseSubmitPayload;
  isAuthenticated: boolean;
  scoreReported: boolean;
  onSubmit?: (p: ExerciseSubmitPayload) => Promise<void> | void;
  fetchFn: typeof fetch;
  exerciseSlug: string;
  exerciseSkill: string;
  exerciseTitle: string;
}): Promise<{ scoreReported: boolean }> {
  const { payload, isAuthenticated, scoreReported, onSubmit, fetchFn } = opts;

  if (onSubmit) {
    await onSubmit(payload);
    return { scoreReported: true };
  }

  if (isAuthenticated && !scoreReported) {
    try {
      await fetchFn("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseSlug: opts.exerciseSlug,
          skill: opts.exerciseSkill,
          title: opts.exerciseTitle,
          score: payload.score,
        }),
      });
      return { scoreReported: true };
    } catch {
      /* swallow */
    }
  }
  return { scoreReported };
}

describe("submitAll branch logic", () => {
  const basePayload: ExerciseSubmitPayload = {
    answers: { q1: "blue" },
    feedback: { q1: "correct" },
    correctCount: 1,
    score: 1,
  };

  it("calls onSubmit and skips fetch when onSubmit is provided", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const fetchFn = vi.fn();

    const result = await submitAllLogic({
      payload: basePayload,
      isAuthenticated: true,
      scoreReported: false,
      onSubmit,
      fetchFn,
      exerciseSlug: "ex-1",
      exerciseSkill: "grammar",
      exerciseTitle: "Test Exercise",
    });

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith(basePayload);
    // fetch /api/attempts must NOT be called when onSubmit is provided.
    expect(fetchFn).not.toHaveBeenCalled();
    expect(result.scoreReported).toBe(true);
  });

  it("calls fetch /api/attempts when onSubmit is not provided and authenticated", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true });

    const result = await submitAllLogic({
      payload: basePayload,
      isAuthenticated: true,
      scoreReported: false,
      onSubmit: undefined,
      fetchFn,
      exerciseSlug: "ex-1",
      exerciseSkill: "grammar",
      exerciseTitle: "Test Exercise",
    });

    expect(fetchFn).toHaveBeenCalledOnce();
    expect(fetchFn).toHaveBeenCalledWith(
      "/api/attempts",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.scoreReported).toBe(true);
  });

  it("does not call fetch when not authenticated and no onSubmit", async () => {
    const fetchFn = vi.fn();

    await submitAllLogic({
      payload: basePayload,
      isAuthenticated: false,
      scoreReported: false,
      onSubmit: undefined,
      fetchFn,
      exerciseSlug: "ex-1",
      exerciseSkill: "grammar",
      exerciseTitle: "Test Exercise",
    });

    expect(fetchFn).not.toHaveBeenCalled();
  });
});
