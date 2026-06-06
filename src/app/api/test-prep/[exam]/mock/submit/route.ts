/**
 * POST /api/test-prep/[exam]/mock/submit
 *
 * 4-step pattern:
 *   1. requireUser()
 *   2. rateLimit(IP, 10/60s)
 *   3. Zod-validate body
 *   4. verifySessionJWT → score → SEC-03 pre-filter → $transaction → return
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { verifySessionJWT } from "@/lib/sample-test-jwt";
import { checkAnswer } from "@/lib/exercise-scoring";
import { estimateBand } from "@/lib/test-prep-bands";
import { buildSkillBreakdown } from "@/lib/recommendation";
import { examSlugSchema } from "@/lib/test-prep-constants";
import type { ExamSlug } from "@/lib/test-prep-constants";
import type { ExerciseQuestion } from "@/lib/content";
import type { Prisma } from "@prisma/client";

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
  exam: string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ exam: string }> },
) {
  // Step 1 — Auth gate.
  const gate = await requireUser();
  if ("error" in gate) return gate.error;
  const { userId } = gate;

  // Validate exam param before rate-limit so the key is exam-specific.
  const { exam } = await params;
  const examParsed = examSlugSchema.safeParse(exam);
  if (!examParsed.success) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const examSlug: ExamSlug = examParsed.data;

  // Step 2 — Rate limit (IP, 10/60s).
  const rl = rateLimit(clientKey(req, "test-prep:mock-submit:" + examSlug), { limit: 10, windowMs: 60_000 });
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

  // Step 4a — Verify session JWT; assert testType matches exam (rejects cross-exam replay).
  let session: SessionPayload;
  try {
    const raw = await verifySessionJWT<Record<string, unknown>>(sessionToken);
    session = raw as unknown as SessionPayload;
  } catch {
    return NextResponse.json({ error: "invalid_session" }, { status: 400 });
  }
  if (session.testType !== "mock-" + examSlug) {
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

  // Step 4c — Score; build reviewQuestions; accumulate per-exercise totals.
  const exMap = new Map<string, { skill: string; title: string; correct: number; total: number }>();
  for (const [slug, info] of Object.entries(session.grouping)) {
    exMap.set(slug, { skill: info.skill, title: info.title, correct: 0, total: info.questionIds.length });
  }
  const reviewQuestions: {
    id: string; prompt: string;
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
    // Fall back to bare qId for forward-compat (matches sample/CEFR pattern).
    const given = answers[compositeId] ?? answers[qId] ?? "";
    const isCorrect = checkAnswer(q, given as string | Record<string, string>);
    if (isCorrect) { totalCorrect++; const e = exMap.get(slug); if (e) e.correct++; }
    const correctAnswer = Array.isArray(q.answer)
      ? q.answer.join(", ")
      : q.pairs ? Object.fromEntries(q.pairs.map((p) => [p.left, p.right])) : String(q.answer);
    reviewQuestions.push({ id: qId, prompt: q.prompt, userAnswer: given as string | Record<string, string>, correctAnswer, isCorrect });
  }

  const exerciseScores = Array.from(exMap.entries()).map(([slug, s]) => ({
    slug, skill: s.skill, title: s.title, correct: s.correct, total: s.total,
  }));

  // Step 4d — SEC-03 existence pre-filter (read-only, outside transaction).
  const filteredExerciseScores: typeof exerciseScores = [];
  for (const es of exerciseScores) {
    const found = await prisma.exercise.findFirst({ where: { slug: es.slug, skill: "listening" }, select: { id: true } });
    if (found) filteredExerciseScores.push(es);
  }

  // Step 4e — Band estimate + skill breakdown (computed before the transaction).
  const bandResult = estimateBand(totalCorrect, totalQuestions, examSlug);
  const skillBreakdown = buildSkillBreakdown(exerciseScores);

  // Step 4f — Atomic persist: ONE MockTestAttempt + N ExerciseAttempt rows.
  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.mockTestAttempt.create({
      data: {
        userId, exam: examSlug, totalQuestions, correctAnswers: totalCorrect,
        score: totalQuestions > 0 ? totalCorrect / totalQuestions : 0,
        bandEstimate: bandResult.band,
      },
    }),
    ...filteredExerciseScores.map((es) =>
      prisma.exerciseAttempt.create({
        data: {
          userId, exerciseSlug: es.slug, skill: es.skill, title: es.title,
          score: es.total > 0 ? es.correct / es.total : 0,
          attemptType: "mock",
        },
      }),
    ),
  ];
  try {
    await prisma.$transaction(ops);
  } catch (err) {
    console.error("[mock-submit] persist_failed", err);
    return NextResponse.json({ error: "persist_failed" }, { status: 500 });
  }

  return NextResponse.json({ correct: totalCorrect, total: totalQuestions, exam: examSlug, bandResult, exerciseScores, skillBreakdown, reviewQuestions });
}
