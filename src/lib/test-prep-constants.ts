/**
 * Shared constants and Zod schemas for the test-prep feature.
 *
 * Pure module — no Prisma, no network. Safe to import from both server and client code.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Exam slugs
// ---------------------------------------------------------------------------

export const EXAMS = ["toeic", "toefl", "ielts", "oet"] as const;

export type ExamSlug = (typeof EXAMS)[number];

/** Zod enum for validating exam slugs at API boundaries. */
export const examSlugSchema = z.enum(EXAMS);

// ---------------------------------------------------------------------------
// Attempt types
// ---------------------------------------------------------------------------

export const ATTEMPT_TYPES = ["practice", "sample", "cefr", "mock"] as const;

export type AttemptType = (typeof ATTEMPT_TYPES)[number];

/**
 * Zod enum for validating ExerciseAttempt.attemptType at API boundaries.
 * The DB column is String (not native ENUM) to avoid MariaDB full-table rebuilds
 * on enum alterations. Application-layer validation enforces allowed values.
 */
export const attemptTypeSchema = z.enum(ATTEMPT_TYPES);

// ---------------------------------------------------------------------------
// Mock test parameters
// ---------------------------------------------------------------------------

/** Number of questions sampled per mock test session across all exams. */
export const MOCK_TEST_QUESTION_COUNT = 25;

/** JWT TTL for mock test sessions (matches sample-test TTL). */
export const MOCK_SESSION_TTL_SEC = 1800;
