/**
 * sample-test-jwt.ts
 *
 * HS256 session-JWT helpers for the sample-test / CEFR-test flow.
 * Uses `jose` (available as a transitive dep of next-auth v5) with AUTH_SECRET.
 *
 * The session JWT binds /start to /submit: /start signs it with the sampled
 * question list, /submit verifies the user's answers correspond to that exact
 * list, preventing forged-question submissions.
 *
 * Throws at first use if AUTH_SECRET is missing outside NODE_ENV=test.
 */

import { SignJWT, jwtVerify } from "jose";

// ---------------------------------------------------------------------------
// Key resolution — fail fast in production if AUTH_SECRET is not configured.
// ---------------------------------------------------------------------------

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    // Only the automated test runner is allowed to omit AUTH_SECRET.
    // Every other environment (development, preview, staging, production) MUST
    // configure it explicitly — a missing value here signals a misconfigured
    // deploy, not a legitimate scenario.
    if (process.env.NODE_ENV !== "test") {
      throw new Error(
        `AUTH_SECRET environment variable is required (current NODE_ENV: ${process.env.NODE_ENV}).`,
      );
    }
    // NODE_ENV=test fallback — safe because tokens are never sent to browsers
    // and the secret is well-known within the test suite.
    return new TextEncoder().encode("test-secret-do-not-use-in-prod");
  }
  return new TextEncoder().encode(secret);
}

const ALG = "HS256";

// ---------------------------------------------------------------------------
// Session JWT — contains question list; does NOT contain answers.
// Used in: /api/sample-test/start, /api/sample-test/cefr/start
// ---------------------------------------------------------------------------

/**
 * Sign a short-lived session JWT that identifies the active test session.
 * @param payload  Any JSON-serialisable object to embed.
 * @param ttlSec   TTL in seconds (e.g. 1800 = 30 min).
 */
export async function signSessionJWT(
  payload: Record<string, unknown>,
  ttlSec: number,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSec)
    .sign(getSecret());
}

/**
 * Verify a session JWT and return the typed payload.
 * Throws on invalid signature, expiry, or malformed token.
 */
export async function verifySessionJWT<T extends Record<string, unknown>>(
  token: string,
): Promise<T> {
  const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] });
  return payload as unknown as T;
}

