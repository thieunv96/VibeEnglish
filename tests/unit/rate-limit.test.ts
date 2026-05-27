import { describe, it, expect } from "vitest";
import { rateLimit } from "../../src/lib/rate-limit";

describe("rate-limit", () => {
  it("allows up to the limit and counts remaining down", () => {
    const opts = { limit: 3, windowMs: 1000 };
    const now = 1_000_000;
    const r1 = rateLimit("allow", opts, now);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = rateLimit("allow", opts, now);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = rateLimit("allow", opts, now);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks the request beyond the limit within the same window", () => {
    const opts = { limit: 3, windowMs: 1000 };
    const now = 2_000_000;
    rateLimit("block", opts, now);
    rateLimit("block", opts, now);
    rateLimit("block", opts, now);

    const r4 = rateLimit("block", opts, now);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    const opts = { limit: 2, windowMs: 1000 };
    const now = 3_000_000;
    rateLimit("reset", opts, now);
    rateLimit("reset", opts, now);
    const blocked = rateLimit("reset", opts, now);
    expect(blocked.allowed).toBe(false);

    // advance time past the window
    const after = rateLimit("reset", opts, now + opts.windowMs);
    expect(after.allowed).toBe(true);
    expect(after.remaining).toBe(opts.limit - 1);
  });

  it("throttles distinct keys independently", () => {
    const opts = { limit: 2, windowMs: 1000 };
    const now = 4_000_000;
    // hammer key "a" past its limit
    rateLimit("a", opts, now);
    rateLimit("a", opts, now);
    const aBlocked = rateLimit("a", opts, now);
    expect(aBlocked.allowed).toBe(false);

    // first call to "b" is unaffected
    const bFirst = rateLimit("b", opts, now);
    expect(bFirst.allowed).toBe(true);
    expect(bFirst.remaining).toBe(opts.limit - 1);
  });
});
