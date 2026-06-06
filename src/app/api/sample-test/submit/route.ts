/**
 * POST /api/sample-test/submit
 *
 * Score the 10-Q sample test, persist attempts, and return the full result
 * blob inline. No cookie — the client renders results from the response body.
 *
 * 4-step pattern:
 *   1. requireUser()
 *   2. rateLimit(IP, 10/60s)
 *   3. Zod-validate body
 *   4. verifySessionJWT → score → ExerciseAttempt rows → fetch recommendations
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { verifySessionJWT } from "@/lib/sample-test-jwt";
import { checkAnswer } from "@/lib/exercise-scoring";
import { pickWeakestSkill } from "@/lib/recommendation";
import type { ExerciseQuestion } from "@/lib/content";

const bodySchema = z.object({
  sessionId: z.string().min(1),
  answers: z.record(z.string(), z.union([z.string(), z.record(z.string(), z.string())])),
});

interface SessionPayload {
  sessionId: string;
  testType: string;
  questionIds: string[];
  questionCompositeIds: string[];
  grouping: Record<string, { skill: string; title: string; level: string; questionIds: string[] }>;
}

export async function POST(req: Request) {
  // Step 1 — Auth gate.
  const gate = await requireUser();
  if ("error" in gate) return gate.error;
  const { userId } = gate;

  // Step 2 — Rate limit.
  const rl = rateLimit(
    clientKey(req, "sample-test:submit"),
    { limit: 10, windowMs: 60_000 },
  );
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

  // Step 4a — Verify session JWT (AC-9: invalid → 400).
  let session: SessionPayload;
  try {
    const raw = await verifySessionJWT<Record<string, unknown>>(sessionToken);
    session = raw as unknown as SessionPayload;
  } catch {
    return NextResponse.json({ error: "invalid_session" }, { status: 400 });
  }

  // Step 4b — Re-fetch the original questions for server-side scoring.
  const slugs = Object.keys(session.grouping);
  const exercises = await prisma.exercise.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, questions: true },
  });

  // Composite-key map "${slug}:${questionId}" avoids collisions when multiple
  // exercises share the same per-exercise question id (e.g. "q1"–"q5").
  const questionMap = new Map<string, ExerciseQuestion>();
  for (const ex of exercises) {
    const qs = ex.questions as unknown as ExerciseQuestion[];
    for (const q of qs) {
      questionMap.set(`${ex.slug}:${q.id}`, q);
    }
  }

  // Step 4c — Score each answer per exercise; build per-question review inline.
  const exerciseScoreMap = new Map<string, { skill: string; title: string; correct: number; total: number }>();
  for (const [slug, info] of Object.entries(session.grouping)) {
    exerciseScoreMap.set(slug, { skill: info.skill, title: info.title, correct: 0, total: info.questionIds.length });
  }

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
    // Client keys answers by composite id (see SampleTestRunner.toExerciseQuestion)
    // — fall back to bare qId for forward-compat.
    const given = answers[compositeId] ?? answers[qId] ?? "";
    const isCorrect = checkAnswer(q, given as string | Record<string, string>);
    if (isCorrect) {
      totalCorrect++;
      const entry = exerciseScoreMap.get(slug);
      if (entry) entry.correct++;
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

  const exerciseScores = Array.from(exerciseScoreMap.entries()).map(([slug, s]) => ({
    slug,
    skill: s.skill,
    title: s.title,
    correct: s.correct,
    total: s.total,
  }));

  // Step 4d — Persist ExerciseAttempt rows (SEC-03: existence check per slug).
  for (const es of exerciseScores) {
    const ex = await prisma.exercise.findFirst({
      where: { slug: es.slug, skill: es.skill },
      select: { id: true },
    });
    if (!ex) continue;
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

  // Step 4e — Pick weakest skill and fetch up-to-3 recommendations from it.
  const weakestSkill = pickWeakestSkill(exerciseScores)[0] ?? null;
  let recommendations: { slug: string; skill: string; title: string; level: string }[] = [];
  if (weakestSkill) {
    recommendations = await prisma.exercise.findMany({
      where: { skill: weakestSkill },
      select: { slug: true, skill: true, title: true, level: true },
      take: 3,
    });
  }

  return NextResponse.json({
    correct: totalCorrect,
    total: totalQuestions,
    exerciseScores,
    reviewQuestions,
    weakestSkill,
    recommendations,
  });
}
