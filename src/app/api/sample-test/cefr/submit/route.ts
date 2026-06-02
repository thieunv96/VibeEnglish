/**
 * POST /api/sample-test/cefr/submit
 * 4-step: (no auth gate) → rateLimit → Zod → verifyJWT + score + cookie|DB write
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { verifySessionJWT, signResultCookie } from "@/lib/sample-test-jwt";
import { checkAnswer } from "@/lib/exercise-scoring";
import { computeCefrEstimate } from "@/lib/cefr-estimation";
import type { CefrLevel } from "@/lib/content";
import type { LevelScores } from "@/lib/cefr-estimation";
import type { ExerciseQuestion } from "@/lib/content";

const COOKIE_NAME = "sample_test_result";
const RESULT_TTL_SEC = 1800;

const bodySchema = z.object({
  sessionId: z.string().min(1),
  // Zod v4: z.record requires (keySchema, valueSchema)
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

const ALL_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function cookieHeader(token: string): string {
  const s = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Max-Age=${RESULT_TTL_SEC}; Path=/; HttpOnly; SameSite=Lax${s}`;
}

export async function POST(req: Request) {
  // Step 2 — Rate limit.
  const rl = rateLimit(clientKey(req, "sample-test-cefr:submit"), { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "rate_limited" }, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
    });
  }

  // Step 3 — Validate body.
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { sessionId: sessionToken, answers } = parsed.data;

  // Step 4a — Verify session JWT; assert testType "cefr" (AC-X4).
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
  // Composite key "${slug}:${q.id}" avoids collisions when multiple exercises share
  // the same per-exercise question id (e.g. "q1"–"q5" in every exercise).
  const questionMap = new Map<string, ExerciseQuestion>();
  for (const ex of exercises) {
    for (const q of ex.questions as unknown as ExerciseQuestion[]) {
      questionMap.set(`${ex.slug}:${q.id}`, q);
    }
  }

  // Step 4c — Score; accumulate per exercise and per CEFR level.
  const exMap = new Map<string, { skill: string; title: string; level: string; correct: number; total: number }>();
  for (const [slug, info] of Object.entries(session.grouping)) {
    exMap.set(slug, { skill: info.skill, title: info.title, level: info.level, correct: 0, total: info.questionIds.length });
  }
  const levelScores: LevelScores = Object.fromEntries(
    ALL_LEVELS.map((l) => [l, { correct: 0, total: 0 }]),
  ) as LevelScores;
  let totalCorrect = 0;
  let totalQuestions = 0;

  for (const [slug, info] of Object.entries(session.grouping)) {
    const entry = exMap.get(slug)!;
    for (const qId of info.questionIds) {
      // Composite lookup matches the key written by the start route.
      const q = questionMap.get(`${slug}:${qId}`);
      if (!q) continue;
      totalQuestions++;
      // levelMap is also keyed by composite "${slug}:${questionId}"; fall back to exercise level.
      const lvl = (session.levelMap[`${slug}:${qId}`] ?? info.level) as CefrLevel;
      if (ALL_LEVELS.includes(lvl)) levelScores[lvl].total++;
      const ok = checkAnswer(q, (answers[qId] ?? "") as string | Record<string, string>);
      if (ok) {
        totalCorrect++;
        entry.correct++;
        if (ALL_LEVELS.includes(lvl)) levelScores[lvl].correct++;
      }
    }
  }

  const cefrEstimate = computeCefrEstimate(levelScores);
  const exerciseScores = Array.from(exMap.entries()).map(([slug, s]) => ({
    slug, skill: s.skill, title: s.title, level: s.level, correct: s.correct, total: s.total,
  }));
  const submittedAt = Math.floor(Date.now() / 1000);

  // Step 4d — Branch on auth.
  const as = await auth();
  const su = as?.user as { id?: string; isAdmin?: boolean } | undefined;
  const userId = su?.id && !su.isAdmin ? su.id : null;

  if (userId) {
    for (const es of exerciseScores) {
      const ex = await prisma.exercise.findFirst({ where: { slug: es.slug, skill: es.skill }, select: { id: true } });
      if (!ex) continue; // SEC-03
      await prisma.exerciseAttempt.create({
        data: { userId, exerciseSlug: es.slug, skill: es.skill, title: es.title, score: es.total > 0 ? es.correct / es.total : 0 },
      });
    }
    return NextResponse.json({ correct: totalCorrect, total: totalQuestions, cefrEstimate, claimed: true });
  }

  // Composite ids come from the session JWT (built in start route) so collisions on bare
  // qIds (e.g. multiple exercises with "q1") don't corrupt the results-page review lookup.
  const questionCompositeIds = session.questionCompositeIds;
  // Parallel-ordered guest-answer array (positional by composite-id index).
  const answersByIndex = questionCompositeIds.map((composite) => {
    const qId = composite.split(":")[1] ?? composite;
    return answers[qId] ?? "";
  });
  // Slug-only exercise score list (title/skill/level derivable from DB) keeps the cookie
  // under the browser's 4 KB per-cookie limit. Earlier attempts with full {slug, skill,
  // title, level, correct, total} per row pushed the encoded JWT past 4 KB and the browser
  // silently dropped the Set-Cookie header — making every guest claim look like 400 no_session.
  const slimScores = exerciseScores.map((s) => [s.slug, s.correct, s.total] as [string, number, number]);

  // Guest: cefrEstimate goes into the signed cookie ONLY — never in response body.
  const token = await signResultCookie(
    { testType: "cefr", sessionId: session.sessionId,
      questionCompositeIds, answersByIndex, slimScores, levelScores, cefrEstimate, submittedAt },
    RESULT_TTL_SEC,
  );
  return NextResponse.json(
    { correct: totalCorrect, total: totalQuestions },
    { headers: { "Set-Cookie": cookieHeader(token) } },
  );
}
