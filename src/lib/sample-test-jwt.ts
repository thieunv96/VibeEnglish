/**
 * sample-test-jwt.ts
 *
 * HS256 JWT helpers for the sample-test / CEFR-test cookie flow.
 * Uses `jose` (available as a transitive dep of next-auth v5) with AUTH_SECRET.
 *
 * Two pairs of helpers:
 *   signSessionJWT / verifySessionJWT   — session JWTs sent to the client browser
 *   signResultCookie / verifyResultCookie — result JWTs stored in the HttpOnly cookie
 *
 * Both pairs use the same key and algorithm; they differ only in semantics/TTL.
 *
 * Throws at module-load time in production when AUTH_SECRET is not set.
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

// ---------------------------------------------------------------------------
// Result cookie JWT — contains guest answers and per-exercise scores.
// Used in: /api/sample-test/submit, /api/sample-test/cefr/submit, /api/sample-test/claim
// ---------------------------------------------------------------------------

/**
 * Sign a result cookie JWT.
 * @param payload  Any JSON-serialisable object to embed.
 * @param ttlSec   TTL in seconds (spec: 1800 = 30 min).
 */
export async function signResultCookie(
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
 * Verify a result cookie JWT and return the typed payload.
 * Throws on invalid signature, expiry, or malformed token.
 */
export async function verifyResultCookie<T extends Record<string, unknown>>(
  token: string,
): Promise<T> {
  const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] });
  return payload as unknown as T;
}
