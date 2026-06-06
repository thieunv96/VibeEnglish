/**
 * GET /api/admin/test-prep/analytics
 *
 * Returns per-exam mock-test aggregates (AC-14).
 * Admin-only; rate-limited 30/min/userId.
 *
 * 4-step pattern:
 *   1. requireAdmin()
 *   2. rateLimit(userId, 30/60s)
 *   3. No request body to validate (GET)
 *   4. getTestPrepAnalytics() → 200 AdminTestPrepAnalytics
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { getTestPrepAnalytics } from "@/lib/test-prep-admin-analytics";

export async function GET(req: Request) {
  // Step 1 — Admin gate.
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  const { userId } = gate;

  // Step 2 — Rate limit (userId, 30/60s).
  const rl = rateLimit(
    clientKey(req, "admin:test-prep:analytics", userId),
    { limit: 30, windowMs: 60_000 },
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

  // Step 4 — Query and return analytics.
  const data = await getTestPrepAnalytics();
  return NextResponse.json(data);
}
