// In-memory sliding-window rate limiter. NOT production-grade distributed limiting:
// this in-memory state lives in a process-local Map, so it resets on server restart
// and is NOT shared across processes/workers. Acceptable for this single self-hosted
// instance, where lightweight per-IP/per-user throttling without a Redis/npm
// dependency is the goal.

export interface RateLimitResult {
  allowed: boolean;
  remaining: number; // requests left in the current window (>= 0)
  retryAfterMs: number; // 0 when allowed; ms until window reset when blocked
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface WindowState {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, WindowState>();

// `now` is injectable so tests can advance time deterministically (no real timers).
export function rateLimit(
  key: string,
  opts: RateLimitOptions,
  now: number = Date.now(),
): RateLimitResult {
  const { limit, windowMs } = opts;

  // Escape hatch for test/CI/local-dev: when RATE_LIMIT_DISABLED=1 the limiter
  // never throttles, so functional E2E suites (which register many users from a
  // single localhost IP) aren't tripped by 429s. Production leaves this unset and
  // enforces the configured limits. The limiter's correctness is covered by unit tests.
  if (process.env.RATE_LIMIT_DISABLED === "1") {
    return { allowed: true, remaining: limit, retryAfterMs: 0 };
  }

  const entry = buckets.get(key);

  // Start a fresh window when there is no entry or the previous one has expired.
  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
  }
  return { allowed: true, remaining: limit - entry.count, retryAfterMs: 0 };
}

function clientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return null;
}

// Derive a throttle key from a request + a route-specific suffix.
// Prefer userId when provided; else fall back to client IP; else "anon".
export function clientKey(req: Request, suffix: string, userId?: string | null): string {
  const id = userId ?? clientIp(req) ?? "anon";
  return `${suffix}:${id}`;
}
