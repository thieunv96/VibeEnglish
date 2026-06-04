/**
 * POST /api/sample-test/start
 *
 * Authenticated random question sampler for the 10-Q sample test.
 *
 * 4-step pattern:
 *   1. requireLearner() — sample test is a logged-in-only feature
 *   2. rateLimit(IP, 5/60s)
 *   3. No body — no Zod needed
 *   4. prisma.exercise.findMany → Fisher-Yates → take 10 → sign session JWT
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { requireLearner } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { signSessionJWT } from "@/lib/sample-test-jwt";
import { sanitiseQuestion } from "@/lib/exercise-scoring";
import type { ExerciseQuestion } from "@/lib/content";

const SAMPLE_SIZE = 10;
const SESSION_TTL_SEC = 1800; // 30 minutes

// Flat tuple of a question with its source exercise metadata
interface QuestionTuple {
  exerciseSlug: string;
  exerciseSkill: string;
  exerciseTitle: string;
  exerciseLevel: string;
  question: ExerciseQuestion;
}

/** Fisher-Yates in-place shuffle — mutates and returns the array. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function POST(req: Request) {
  // Step 1 — Auth gate.
  const gate = await requireLearner();
  if ("error" in gate) return gate.error;

  // Step 2 — Rate limit (IP, 5/60s).
  const rl = rateLimit(
    clientKey(req, "sample-test:start"),
    { limit: 5, windowMs: 60_000 },
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      },
    );
  }

  // Step 4 — Fetch all exercises with their questions.
  const exercises = await prisma.exercise.findMany({
    select: { id: true, slug: true, skill: true, title: true, level: true, questions: true },
  });

  // Flatten all questions to tuples.
  const flat: QuestionTuple[] = [];
  for (const ex of exercises) {
    const questions = ex.questions as unknown as ExerciseQuestion[];
    for (const q of questions) {
      flat.push({
        exerciseSlug: ex.slug,
        exerciseSkill: ex.skill,
        exerciseTitle: ex.title,
        exerciseLevel: ex.level,
        question: q,
      });
    }
  }

  // AC-E6: degenerate case — fewer than 10 questions in the DB.
  if (flat.length === 0) {
    return NextResponse.json(
      { error: "no_content", message: "No questions available." },
      { status: 503 },
    );
  }

  // Fisher-Yates shuffle then take up to SAMPLE_SIZE.
  const shuffled = shuffle(flat);
  const sampled = shuffled.slice(0, Math.min(SAMPLE_SIZE, shuffled.length));

  // Build session JWT payload.
  // grouping: { [slug]: { skill, title, level, questionIds: string[] } }
  const grouping: Record<string, { skill: string; title: string; level: string; questionIds: string[] }> = {};
  const questionIds: string[] = [];

  for (const t of sampled) {
    questionIds.push(t.question.id);
    const g = grouping[t.exerciseSlug];
    if (g) {
      g.questionIds.push(t.question.id);
    } else {
      grouping[t.exerciseSlug] = {
        skill: t.exerciseSkill,
        title: t.exerciseTitle,
        level: t.exerciseLevel,
        questionIds: [t.question.id],
      };
    }
  }

  // Parallel-ordered composite ids preserve the (slug, qId) pair across the wire, so submit
  // can hand a correct composite list to the results page even when bare qIds collide
  // (e.g. multiple exercises sharing "q1").
  const questionCompositeIds = sampled.map((t) => `${t.exerciseSlug}:${t.question.id}`);

  const sessionId = randomUUID();
  const sessionToken = await signSessionJWT(
    { sessionId, testType: "sample", questionIds, questionCompositeIds, grouping },
    SESSION_TTL_SEC,
  );

  // Sanitise questions before sending to client (strip answers / pairs.right).
  const questions = sampled.map((t) =>
    sanitiseQuestion(t.question, {
      slug: t.exerciseSlug,
      skill: t.exerciseSkill,
      level: t.exerciseLevel,
    }),
  );

  return NextResponse.json({
    sessionId: sessionToken, // JWT IS the sessionId from the client's perspective
    questions,
    total: sampled.length,
  });
}
