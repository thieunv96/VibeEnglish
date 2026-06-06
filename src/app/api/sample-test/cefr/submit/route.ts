/**
 * POST /api/sample-test/cefr/submit
 *
 * Score the 25-Q CEFR placement, persist attempts, compute the CEFR estimate,
 * and return the full result blob inline. No cookie — the client renders
 * results from the response body.
 *
 * 4-step pattern:
 *   1. requireUser()
 *   2. rateLimit(IP, 10/60s)
 *   3. Zod-validate body
 *   4. verifySessionJWT → score → levelScores → ExerciseAttempt rows → CEFR estimate
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { verifySessionJWT } from "@/lib/sample-test-jwt";
import { checkAnswer } from "@/lib/exercise-scoring";
import { computeCefrEstimate } from "@/lib/cefr-estimation";
import type { CefrLevel } from "@/lib/content";
import type { LevelScores } from "@/lib/cefr-estimation";
import type { ExerciseQuestion } from "@/lib/content";

const ALL_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

const bodySchema = z.object({
  sessionId: z.string().min(1),
  answers: z.record(z.string(), z.union([z.string(), z.record(z.string(), z.string())])),
});

interface SessionPayload {
  sessionId: string;
  testType: string;
  questionIds: string[];
  questionCompositeIds: string[];
  levelMap: Record<string, string>;
  grouping: Record<string, { skill: string; title: string; level: string; questionIds: string[] }>;
}

export async function POST(req: Request) {
  // Step 1 — Auth gate.
  const gate = await requireUser();
  if ("error" in gate) return gate.error;
  const { userId } = gate;

  // Step 2 — Rate limit.
  const rl = rateLimit(clientKey(req, "sample-test-cefr:submit"), { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  // Step 3 — Validate body.
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { sessionId: sessionToken, answers } = parsed.data;

  // Step 4a — Verify session JWT; assert testType "cefr".
  let session: SessionPayload;
  try {
    const raw = await verifySessionJWT<Record<string, unknown>>(sessionToken);
    session = raw as unknown as SessionPayload;
  } catch {
    return NextResponse.json({ error: "invalid_session" }, { status: 400 });
  }
  if (session.testType !== "cefr") {
    return NextResponse.json({ error: "invalid_session" }, { status: 400 });
  }

  // Step 4b — Re-fetch questions for server-side scoring.
  const exercises = await prisma.exercise.findMany({
    where: { slug: { in: Object.keys(session.grouping) } },
    select: { slug: true, questions: true },
  });
  const questionMap = new Map<string, ExerciseQuestion>();
  for (const ex of exercises) {
    for (const q of ex.questions as unknown as ExerciseQuestion[]) {
      questionMap.set(`${ex.slug}:${q.id}`, q);
    }
  }

  // Step 4c — Score; build per-question review; accumulate per exercise and per CEFR level.
  const exMap = new Map<string, { skill: string; title: string; level: string; correct: number; total: number }>();
  for (const [slug, info] of Object.entries(session.grouping)) {
    exMap.set(slug, { skill: info.skill, title: info.title, level: info.level, correct: 0, total: info.questionIds.length });
  }
  const levelScores: LevelScores = Object.fromEntries(
    ALL_LEVELS.map((l) => [l, { correct: 0, total: 0 }]),
  ) as LevelScores;

  const reviewQuestions: {
    id: string;
    prompt: string;
    userAnswer: string | Record<string, string>;
    correctAnswer: string | Record<string, string>;
    isCorrect: boolean;
  }[] = [];
  let totalCorrect = 0;
  let totalQuestions = 0;

  for (const compositeId of session.questionCompositeIds) {
    const [slug, qId] = compositeId.split(":");
    const q = questionMap.get(compositeId);
    if (!q) continue;
    totalQuestions++;
    const lvl = (session.levelMap[compositeId] ?? exMap.get(slug)?.level ?? "") as CefrLevel;
    if (ALL_LEVELS.includes(lvl)) levelScores[lvl].total++;
    // Client keys answers by composite id (see CefrTestRunner.toExerciseQuestion)
    // — fall back to bare qId for forward-compat.
    const given = answers[compositeId] ?? answers[qId] ?? "";
    const isCorrect = checkAnswer(q, given as string | Record<string, string>);
    if (isCorrect) {
      totalCorrect++;
      const entry = exMap.get(slug);
      if (entry) entry.correct++;
      if (ALL_LEVELS.includes(lvl)) levelScores[lvl].correct++;
    }
    const correctAnswer = Array.isArray(q.answer)
      ? q.answer.join(", ")
      : q.pairs
        ? Object.fromEntries(q.pairs.map((p) => [p.left, p.right]))
        : String(q.answer);
    reviewQuestions.push({
      id: qId,
      prompt: q.prompt,
      userAnswer: given as string | Record<string, string>,
      correctAnswer,
      isCorrect,
    });
  }

  const exerciseScores = Array.from(exMap.entries()).map(([slug, s]) => ({
    slug,
    skill: s.skill,
    title: s.title,
    level: s.level,
    correct: s.correct,
    total: s.total,
  }));
  const cefrEstimate = computeCefrEstimate(levelScores);

  // Step 4d — Persist ExerciseAttempt rows (SEC-03: existence check per slug).
  for (const es of exerciseScores) {
    const ex = await prisma.exercise.findFirst({
      where: { slug: es.slug, skill: es.skill },
      select: { id: true },
    });
    if (!ex) continue;
    await prisma.exerciseAttempt.create({
      data: {
        attemptType: "cefr",
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
    exerciseScores,
    reviewQuestions,
    levelScores,
    cefrEstimate,
  });
}
