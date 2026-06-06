/**
 * POST /api/test-prep/[exam]/mock/start
 *
 * Auth-gated (requireUser — admins can demo), rate-limited 2/min/IP.
 * Samples 25 listening questions tagged for the given exam, signs a session JWT
 * with testType "mock-{exam}", and returns sanitised questions + sessionId.
 *
 * 4-step pattern:
 *   1. requireUser()
 *   2. rateLimit(IP, 2/60s)
 *   3. examSlugSchema.safeParse(exam) — invalid → 404
 *   4. sampleListeningQuestions(exam) → sign JWT → sanitise → return
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireUser } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { signSessionJWT } from "@/lib/sample-test-jwt";
import { sanitiseQuestion } from "@/lib/exercise-scoring";
import { sampleListeningQuestions } from "@/lib/test-prep-content";
import {
  examSlugSchema,
  MOCK_TEST_QUESTION_COUNT,
  MOCK_SESSION_TTL_SEC,
} from "@/lib/test-prep-constants";
import type { ExamSlug } from "@/lib/test-prep-constants";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ exam: string }> },
) {
  // Step 1 — Auth gate.
  const gate = await requireUser();
  if ("error" in gate) return gate.error;

  // Step 2 (partial) — Resolve and validate exam param first so we can use it in the rate-limit key.
  const { exam } = await params;
  const examParsed = examSlugSchema.safeParse(exam);
  if (!examParsed.success) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const examSlug: ExamSlug = examParsed.data;

  // Step 2 (continued) — Rate limit (IP, 2/60s).
  const rl = rateLimit(
    clientKey(req, "test-prep:mock-start:" + examSlug),
    { limit: 2, windowMs: 60_000 },
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

  // Step 4 — Sample listening questions for this exam.
  const tuples = await sampleListeningQuestions(examSlug, MOCK_TEST_QUESTION_COUNT);
  if (tuples.length < MOCK_TEST_QUESTION_COUNT) {
    return NextResponse.json({ error: "no_content" }, { status: 503 });
  }

  // Build grouping + composite IDs (mirrors sample-test/start pattern).
  const grouping: Record<string, { skill: string; title: string; level: string; questionIds: string[] }> = {};
  const questionIds: string[] = [];

  for (const t of tuples) {
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

  // Composite ids preserve (slug, qId) pair across the wire so submit can
  // resolve answers even when multiple exercises share bare ids like "q1".
  const questionCompositeIds = tuples.map((t) => `${t.exerciseSlug}:${t.question.id}`);

  // Sign session JWT with testType "mock-{exam}" so submit can reject cross-exam replay.
  const sessionId = randomUUID();
  const sessionToken = await signSessionJWT(
    { sessionId, testType: "mock-" + examSlug, questionIds, questionCompositeIds, grouping, exam: examSlug },
    MOCK_SESSION_TTL_SEC,
  );

  // Sanitise questions before sending to client (strip answers / pairs.right).
  const questions = tuples.map((t) =>
    sanitiseQuestion(t.question, {
      slug: t.exerciseSlug,
      skill: t.exerciseSkill,
      level: t.exerciseLevel,
    }),
  );

  return NextResponse.json({
    sessionId: sessionToken,
    questions,
    total: questions.length,
    exam: examSlug,
  });
}
