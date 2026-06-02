import { describe, it, expect, beforeEach, afterEach } from "vitest";

// Ensure AUTH_SECRET is set for tests so the module does not throw.
beforeEach(() => {
  process.env.AUTH_SECRET = "test-secret-at-least-32-chars-long-ok";
  process.env.NODE_ENV = "test";
});

afterEach(() => {
  process.env.NODE_ENV = "test";
});

import {
  signSessionJWT,
  verifySessionJWT,
  signResultCookie,
  verifyResultCookie,
} from "../../src/lib/sample-test-jwt";

/**
 * Reliably corrupt a JWT signature by mutating a character at index 20 (middle
 * of the 43-char base64url signature segment).
 *
 * WHY NOT the last character: HS256 produces a 256-bit (32-byte) signature
 * encoded as 43 base64url chars. The 43rd character carries only 4 bits
 * (256 mod 6 = 4), so only 16 of the 64 base64url alphabet values produce
 * distinct decoded bytes. Flipping to "A" (value 0) or "B" (value 1) collides
 * with the original ~25% of the time — the tampered token decodes to the same
 * bytes and jwtVerify accepts it. Mutating index 20 (deep in the full-byte
 * region) guarantees all 6 bits differ, making a round-trip collision
 * cryptographically negligible.
 */
function tamperSignature(token: string): string {
  const parts = token.split(".");
  const sig = parts[2]!;
  // Index 20 is within the full-byte region (chars 0–41 each carry 6 bits).
  // Pick a replacement that differs from the original char.
  parts[2] =
    sig.slice(0, 20) +
    (sig[20] === "A" ? "B" : "A") +
    sig.slice(21);
  return parts.join(".");
}

// ---------------------------------------------------------------------------
// signSessionJWT / verifySessionJWT
// ---------------------------------------------------------------------------
describe("signSessionJWT / verifySessionJWT", () => {
  it("round-trips a payload without modification", async () => {
    const payload = { sessionId: "abc123", questionIds: ["q1", "q2"] };
    const token = await signSessionJWT(payload, 1800);
    expect(typeof token).toBe("string");
    const decoded = await verifySessionJWT<typeof payload>(token);
    expect(decoded.sessionId).toBe("abc123");
    expect(decoded.questionIds).toEqual(["q1", "q2"]);
  });

  it("includes an exp claim in the future", async () => {
    const token = await signSessionJWT({ x: 1 }, 1800);
    const decoded = await verifySessionJWT<{ exp: number }>(token);
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("throws on tampered signature", async () => {
    const token = await signSessionJWT({ ok: true }, 1800);
    const tampered = tamperSignature(token);
    await expect(verifySessionJWT(tampered)).rejects.toThrow();
  });

  it("throws on an expired token (ttl=0)", async () => {
    // ttlSec = -1 creates a token already past expiry.
    const token = await signSessionJWT({ data: "test" }, -1);
    await expect(verifySessionJWT(token)).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// signResultCookie / verifyResultCookie
// ---------------------------------------------------------------------------
describe("signResultCookie / verifyResultCookie", () => {
  it("round-trips a result payload", async () => {
    const payload = {
      testType: "sample",
      sessionId: "sess-1",
      exerciseScores: [{ slug: "ex-1", skill: "grammar", correct: 3, total: 4 }],
      submittedAt: 1748822400,
    };
    const token = await signResultCookie(payload, 1800);
    const decoded = await verifyResultCookie<typeof payload>(token);
    expect(decoded.testType).toBe("sample");
    expect(decoded.exerciseScores).toHaveLength(1);
    expect(decoded.submittedAt).toBe(1748822400);
  });

  it("throws on tampered result cookie", async () => {
    const token = await signResultCookie({ score: 10 }, 1800);
    const tampered = tamperSignature(token);
    await expect(verifyResultCookie(tampered)).rejects.toThrow();
  });

  it("throws on expired result cookie", async () => {
    const token = await signResultCookie({ score: 5 }, -1);
    await expect(verifyResultCookie(token)).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// getSecret() — AUTH_SECRET environment behaviour
// ---------------------------------------------------------------------------
describe("getSecret() environment handling", () => {
  it("NODE_ENV=test with no AUTH_SECRET uses fallback (no throw)", async () => {
    const orig = process.env.AUTH_SECRET;
    delete process.env.AUTH_SECRET;
    process.env.NODE_ENV = "test";
    // Should not throw — test environment is the only permitted fallback.
    await expect(signSessionJWT({ x: 1 }, 60)).resolves.toBeTypeOf("string");
    process.env.AUTH_SECRET = orig;
  });

  it("NODE_ENV=production with no AUTH_SECRET throws", async () => {
    const orig = process.env.AUTH_SECRET;
    delete process.env.AUTH_SECRET;
    process.env.NODE_ENV = "production";
    await expect(signSessionJWT({}, 60)).rejects.toThrow(/AUTH_SECRET/);
    process.env.AUTH_SECRET = orig;
    process.env.NODE_ENV = "test";
  });

  it("NODE_ENV=development with no AUTH_SECRET throws", async () => {
    const orig = process.env.AUTH_SECRET;
    delete process.env.AUTH_SECRET;
    process.env.NODE_ENV = "development";
    await expect(signSessionJWT({}, 60)).rejects.toThrow(/AUTH_SECRET/);
    process.env.AUTH_SECRET = orig;
    process.env.NODE_ENV = "test";
  });
});
