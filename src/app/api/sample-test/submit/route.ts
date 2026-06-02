/**
 * POST /api/sample-test/submit
 *
 * Scores the guest's answers, sets the signed result cookie (guest path),
 * or writes ExerciseAttempt rows immediately (logged-in path).
 *
 * 4-step pattern:
 *   1. No auth gate — guest-accessible. auth() used to detect logged-in state.
 *   2. rateLimit(IP, 10/60s)
 *   3. Zod-validate body
 *   4. verifySessionJWT → score → cookie | DB write
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { verifySessionJWT, signResultCookie } from "@/lib/sample-test-jwt";
import { checkAnswer } from "@/lib/exercise-scoring";
import type { ExerciseQuestion } from "@/lib/content";

const COOKIE_NAME = "sample_test_result";
const RESULT_TTL_SEC = 1800; // 30 minutes

const bodySchema = z.object({
  sessionId: z.string().min(1),
  // answers: { [questionId]: string | { [left]: string } }
  // Zod v4: z.record requires (keySchema, valueSchema)
  answers: z.record(z.string(), z.union([z.string(), z.record(z.string(), z.string())])),
});

// Session JWT payload shape (signed by /start)
interface SessionPayload {
  sessionId: string;
  testType: string;
  questionIds: string[];
  questionCompositeIds: string[];
  grouping: Record<string, {
    skill: string;
    title: string;
    level: string;
    questionIds: string[];
  }>;
}

function buildCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Max-Age=${RESULT_TTL_SEC}; Path=/; HttpOnly; SameSite=Lax${secure}`;
}

export async function POST(req: Request) {
  // Step 2 — Rate limit (IP, 10/60s per spec).
  const rl = rateLimit(
    clientKey(req, "sample-test:submit"),
    { limit: 10, windowMs: 60_000 },
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

  // Step 3 — Validate body.
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const { sessionId: sessionToken, answers } = parsed.data;

  // Step 4a — Verify session JWT (AC-9: invalid → 400).
  // verifySessionJWT requires T extends Record<string, unknown>; cast after verify.
  let session: SessionPayload;
  try {
    const raw = await verifySessionJWT<Record<string, unknown>>(sessionToken);
    session = raw as unknown as SessionPayload;
  } catch {
    return NextResponse.json({ error: "invalid_session" }, { status: 400 });
  }

  // Step 4b — Re-fetch the original questions for server-side scoring.
  // We need the full ExerciseQuestion objects (with answers) to call checkAnswer().
  const slugs = Object.keys(session.grouping);
  const exercises = await prisma.exercise.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, questions: true },
  });

  // Build a flat map: "${slug}:${questionId}" → ExerciseQuestion
  // Composite key prevents collision when multiple exercises share the same per-exercise
  // question id (e.g. every exercise uses "q1"–"q5").
  const questionMap = new Map<string, ExerciseQuestion>();
  for (const ex of exercises) {
    const qs = ex.questions as unknown as ExerciseQuestion[];
    for (const q of qs) {
      questionMap.set(`${ex.slug}:${q.id}`, q);
    }
  }

  // Step 4c — Score each answer per exercise.
  // exerciseScores: { slug, skill, title, correct, total }[]
  const exerciseScoreMap = new Map<string, { skill: string; title: string; correct: number; total: number }>();

  for (const [slug, groupInfo] of Object.entries(session.grouping)) {
    exerciseScoreMap.set(slug, {
      skill: groupInfo.skill,
      title: groupInfo.title,
      correct: 0,
      total: groupInfo.questionIds.length,
    });
  }

  let totalCorrect = 0;
  let totalQuestions = 0;

  for (const [slug, groupInfo] of Object.entries(session.grouping)) {
    const scoreEntry = exerciseScoreMap.get(slug)!;
    for (const qId of groupInfo.questionIds) {
      // Composite lookup matches the key written above.
      const q = questionMap.get(`${slug}:${qId}`);
      if (!q) continue; // question not found in DB (content removed)

      totalQuestions++;
      const given = answers[qId] ?? "";
      const isCorrect = checkAnswer(q, given as string | Record<string, string>);
      if (isCorrect) {
        totalCorrect++;
        scoreEntry.correct++;
      }
    }
  }

  const exerciseScores = Array.from(exerciseScoreMap.entries()).map(([slug, s]) => ({
    slug,
    skill: s.skill,
    title: s.title,
    correct: s.correct,
    total: s.total,
  }));

  const submittedAt = Math.floor(Date.now() / 1000);

  // Step 4d — Detect auth state to branch between guest and logged-in paths.
  const authSession = await auth();
  const sessionUser = authSession?.user as { id?: string; isAdmin?: boolean } | undefined;
  const userId = sessionUser?.id && !sessionUser.isAdmin ? sessionUser.id : null;

  if (userId) {
    // Authenticated path (AC-13): write ExerciseAttempt rows immediately.
    // SEC-03 existence check per exercise before writing.
    for (const es of exerciseScores) {
      const exercise = await prisma.exercise.findFirst({
        where: { slug: es.slug, skill: es.skill },
        select: { id: true },
      });
      if (!exercise) continue; // skip removed exercises

      await prisma.exerciseAttempt.create({
        data: {
          userId,
          exerciseSlug: es.slug,
          skill: es.skill,
          title: es.title,
          score: es.total > 0 ? es.correct / es.total : 0,
        },
      });
    }

    return NextResponse.json({
      correct: totalCorrect,
      total: totalQuestions,
      claimed: true,
      exerciseScores,
    });
  }

  // Composite ids come from the session JWT (built in start route) so collisions on bare
  // qIds (e.g. multiple exercises with "q1") don't corrupt the results-page review lookup.
  const questionCompositeIds = session.questionCompositeIds;
  // Parallel-ordered guest-answer array.
  const answersByIndex = questionCompositeIds.map((composite) => {
    const qId = composite.split(":")[1] ?? composite;
    return answers[qId] ?? "";
  });
  // Slug-only exercise score list (title/skill/level derivable from DB) — see CEFR submit
  // for the 4 KB cookie-limit rationale.
  const slimScores = exerciseScores.map((s) => [s.slug, s.correct, s.total] as [string, number, number]);

  // Guest path: sign result cookie and return score teaser only.
  const cookieToken = await signResultCookie(
    {
      testType: "sample",
      sessionId: session.sessionId,
      questionCompositeIds,
      answersByIndex,
      slimScores,
      submittedAt,
    },
    RESULT_TTL_SEC,
  );

  return NextResponse.json(
    { correct: totalCorrect, total: totalQuestions },
    { headers: { "Set-Cookie": buildCookieHeader(cookieToken) } },
  );
}
