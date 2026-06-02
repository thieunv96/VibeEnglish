/**
 * POST /api/sample-test/claim
 *
 * Shared claim endpoint for both the 10-Q sample test and the 25-Q CEFR test.
 * Called by RegisterForm after a successful sign-in.
 *
 * 4-step pattern:
 *   1. requireLearner()         — auth gate
 *   2. rateLimit(userId)        — anti-replay throttle
 *   3. Read + verify cookie JWT — Zod-validate decoded payload shape
 *   4. SEC-03 existence check → prisma.exerciseAttempt.create per slug
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireLearner } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { verifyResultCookie } from "@/lib/sample-test-jwt";

// ---------------------------------------------------------------------------
// Cookie name (shared with submit endpoints in Phase 2/3)
// ---------------------------------------------------------------------------
const COOKIE_NAME = "sample_test_result";
const COOKIE_TTL_SEC = 1800; // 30 minutes

// ---------------------------------------------------------------------------
// Payload schema — validates the decoded JWT shape.
// Both test types embed exerciseScores and submittedAt.
// ---------------------------------------------------------------------------
// Slim score tuple: [slug, correct, total]. Title/skill/level are re-derived from the
// Exercise row at claim time to keep the cookie under the 4 KB browser per-cookie cap.
const slimScoreSchema = z.tuple([
  z.string().min(1),       // slug
  z.number().int().min(0), // correct
  z.number().int().min(1), // total
]);

const cookiePayloadSchema = z.object({
  testType: z.enum(["sample", "cefr"]),
  sessionId: z.string().min(1),
  slimScores: z.array(slimScoreSchema).min(1),
  submittedAt: z.number().int().positive(),
});

type CookiePayload = z.infer<typeof cookiePayloadSchema>;

// ---------------------------------------------------------------------------
// Helper: clear the result cookie
// ---------------------------------------------------------------------------
function clearCookie(): Record<string, string> {
  // Include `Secure` in production so the attribute set matches the one used
  // when the cookie was written (spec: "Secure when NODE_ENV=production").
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return {
    "Set-Cookie": `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure}`,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  // Step 1 — Auth gate.
  const gate = await requireLearner();
  if ("error" in gate) return gate.error;
  const { userId } = gate;

  // Step 2 — Rate limit (per-user, 10 req/60s, matches the attempts endpoint).
  const rl = rateLimit(
    clientKey(req, "sample-test:claim", userId),
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

  // Step 3a — Read cookie.
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) {
    return NextResponse.json({ error: "no_session" }, { status: 400 });
  }

  // Step 3b — Verify JWT signature (throws on tamper/expiry).
  let payload: CookiePayload;
  try {
    const decoded = await verifyResultCookie<Record<string, unknown>>(raw);

    // jose already rejects expired tokens via the `exp` claim, but the spec
    // also requires an explicit submittedAt check for belt-and-suspenders safety.
    const parsed = cookiePayloadSchema.safeParse(decoded);
    if (!parsed.success) {
      // Clear the malformed cookie so the browser does not loop: without this
      // header the browser re-sends the same bad cookie on every retry and the
      // user is stuck until they manually clear cookies.
      return NextResponse.json(
        { error: "invalid_session" },
        { status: 400, headers: clearCookie() },
      );
    }
    payload = parsed.data;
  } catch {
    // Tampered or structurally invalid JWT — evict the bad cookie immediately
    // for the same reason as the Zod-fail path above.
    return NextResponse.json(
      { error: "invalid_session" },
      { status: 400, headers: clearCookie() },
    );
  }

  // Step 3c — Belt-and-suspenders: check submittedAt age independently of JWT exp.
  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec - payload.submittedAt > COOKIE_TTL_SEC) {
    // Clear the stale cookie and reject.
    return NextResponse.json(
      { error: "session_expired" },
      { status: 400, headers: clearCookie() },
    );
  }

  // Step 4 — SEC-03 existence check + write ExerciseAttempt rows.
  // AC-E5: skip missing exercises rather than aborting the whole claim.
  // Title/skill come from the live Exercise row (not the cookie) since slim-score tuples
  // intentionally omit those fields to fit under the 4 KB cookie cap.
  for (const [slug, correct, total] of payload.slimScores) {
    const exercise = await prisma.exercise.findFirst({
      where: { slug },
      select: { skill: true, title: true },
    });
    if (!exercise) continue; // SEC-03: skip non-existent exercises silently

    await prisma.exerciseAttempt.create({
      data: {
        userId,
        exerciseSlug: slug,
        skill: exercise.skill,
        title: exercise.title,
        score: total > 0 ? correct / total : 0,
      },
    });
  }

  // Clear cookie and return success.
  return NextResponse.json(
    { ok: true, testType: payload.testType },
    { headers: clearCookie() },
  );
}
