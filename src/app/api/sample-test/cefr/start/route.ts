/**
 * POST /api/sample-test/cefr/start
 *
 * Stratified sampler endpoint for the 25-Q CEFR placement test.
 * Returns a signed session JWT + sanitised questions (no answers).
 *
 * 4-step pattern:
 *   1. No auth gate — guest-accessible.
 *   2. rateLimit(IP, 3/60s) — lower than 10-Q because 25 questions per call.
 *   3. No body — no Zod needed.
 *   4. DB: one findMany per CEFR level → stratified sample → sign JWT → return.
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { signSessionJWT } from "@/lib/sample-test-jwt";
import { sanitiseQuestion } from "@/lib/exercise-scoring";
import { sampleCefrQuestions, CEFR_LEVELS } from "@/lib/cefr-sampling";
import type { CefrLevel } from "@/lib/content";
import type { LevelPool } from "@/lib/cefr-sampling";

// Re-export so callers can import CEFR_TARGET_COUNTS from the canonical route location.
export { CEFR_TARGET_COUNTS } from "@/lib/cefr-sampling";

const SESSION_TTL_SEC = 1800; // 30 minutes

// Zod schema for questions stored as JSON in the DB.
const questionSchema = z.object({
  id: z.string(),
  type: z.enum(["mcq", "fill", "match"]),
  prompt: z.string(),
  options: z.array(z.string()).optional(),
  answer: z.union([z.string(), z.array(z.string())]),
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).optional(),
  explanation: z.string().optional(),
});

type ParsedQuestion = z.infer<typeof questionSchema>;

export async function POST(req: Request) {
  // Step 2 — Rate limit (IP, 3/60s per spec).
  const rl = rateLimit(
    clientKey(req, "sample-test-cefr:start"),
    { limit: 3, windowMs: 60_000 },
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

  // Step 4 — Fetch exercises per level (one findMany per level; level index).
  const pools: LevelPool = { A1: [], A2: [], B1: [], B2: [], C1: [], C2: [] };

  // Cache original questions for sanitisation after sampling.
  // Key: "${slug}:${q.id}" — composite to avoid collisions when two exercises share the same
  // per-exercise question id (e.g. every exercise has "q1"–"q5").
  const questionCache = new Map<string, { q: ParsedQuestion; slug: string; skill: string; title: string; level: CefrLevel }>();

  await Promise.all(
    CEFR_LEVELS.map(async (level) => {
      const exercises = await prisma.exercise.findMany({
        where: { level },
        select: { slug: true, skill: true, title: true, level: true, questions: true },
      });

      for (const ex of exercises) {
        const parsed = z.array(questionSchema).safeParse(ex.questions);
        if (!parsed.success) continue;

        for (const q of parsed.data) {
          pools[level].push({
            questionId: q.id,
            exerciseSlug: ex.slug,
            exerciseSkill: ex.skill,
            exerciseTitle: ex.title,
            exerciseLevel: ex.level as CefrLevel,
          });
          questionCache.set(`${ex.slug}:${q.id}`, {
            q,
            slug: ex.slug,
            skill: ex.skill,
            title: ex.title,
            level: ex.level as CefrLevel,
          });
        }
      }
    }),
  );

  // Stratified sampling (pure in-memory; uses Math.random).
  const sampled = sampleCefrQuestions(pools);
  if (sampled.length === 0) {
    return NextResponse.json({ error: "no_content" }, { status: 503 });
  }

  // Build sanitised questions, levelMap, and grouping.
  const questions = [];
  const levelMap: Record<string, CefrLevel> = {};
  const grouping: Record<string, { skill: string; title: string; level: CefrLevel; questionIds: string[] }> = {};

  for (const s of sampled) {
    // Composite cache lookup — must match the key used when populating questionCache above.
    const cached = questionCache.get(`${s.exerciseSlug}:${s.questionId}`);
    if (!cached) continue;

    const sanitised = sanitiseQuestion(cached.q, {
      slug: cached.slug,
      skill: cached.skill,
      level: cached.level,
    });
    questions.push(sanitised);
    // levelMap keyed by composite "${slug}:${questionId}" so submit can resolve the right level
    // even when different exercises share the same per-exercise question id.
    levelMap[`${s.exerciseSlug}:${s.questionId}`] = s.scoringLevel;

    if (!grouping[cached.slug]) {
      grouping[cached.slug] = {
        skill: cached.skill,
        title: cached.title,
        level: cached.level,
        questionIds: [],
      };
    }
    grouping[cached.slug].questionIds.push(s.questionId);
  }

  const questionIds = sampled.map((s) => s.questionId);
  // Parallel-ordered composite ids preserve the (slug, qId) pair across the wire, so submit
  // can hand a correct composite list to the results page even when bare qIds collide
  // (e.g. multiple exercises sharing "q1").
  const questionCompositeIds = sampled.map((s) => `${s.exerciseSlug}:${s.questionId}`);
  const sessionToken = await signSessionJWT(
    {
      sessionId: randomUUID(),
      testType: "cefr",
      questionIds,
      questionCompositeIds,
      levelMap,
      grouping,
    },
    SESSION_TTL_SEC,
  );

  // sessionId from client perspective IS the JWT token (same pattern as 10-Q).
  return NextResponse.json({ sessionId: sessionToken, questions });
}
