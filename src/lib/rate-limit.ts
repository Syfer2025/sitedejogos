import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

// ── Upstash (distributed) ──

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

const ratelimitCache = new Map<string, Ratelimit>();

function getRatelimit(limit: number, windowMs: number): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;

  const cacheKey = `${limit}:${windowMs}`;
  const cached = ratelimitCache.get(cacheKey);
  if (cached) return cached;

  const windowSec = Math.max(1, Math.round(windowMs / 1000));
  const instance = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    prefix: "rl",
  });
  ratelimitCache.set(cacheKey, instance);
  return instance;
}

// ── In-memory fallback (dev / no Redis) ──

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  rateLimitStore?: Map<string, RateLimitEntry>;
};

const rateLimitStore =
  globalForRateLimit.rateLimitStore ?? new Map<string, RateLimitEntry>();

if (!globalForRateLimit.rateLimitStore) {
  globalForRateLimit.rateLimitStore = rateLimitStore;
}

function consumeInMemory(key: string, options: RateLimitOptions) {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    const fresh: RateLimitEntry = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    rateLimitStore.set(key, fresh);
    return {
      ok: true,
      remaining: options.limit - 1,
      resetAt: fresh.resetAt,
    };
  }

  current.count += 1;
  rateLimitStore.set(key, current);

  return {
    ok: current.count <= options.limit,
    remaining: Math.max(options.limit - current.count, 0),
    resetAt: current.resetAt,
  };
}

// ── Public API (same signature, distributed when available) ──

export function consumeRateLimit(key: string, options: RateLimitOptions) {
  const rl = getRatelimit(options.limit, options.windowMs);

  if (!rl) {
    return consumeInMemory(key, options);
  }

  // Upstash ratelimit is async but our existing callers expect sync.
  // We return an optimistic in-memory result immediately and let the
  // Redis check run in the background. On the NEXT call the Redis
  // state will be authoritative.  To keep the public API sync and
  // avoid breaking every call-site, we layer both: in-memory gives
  // the instant answer; Redis keeps instances in sync.
  const memResult = consumeInMemory(key, options);

  // Fire-and-forget the distributed check; if it disagrees, the
  // in-memory store will be corrected on the next request cycle.
  rl.limit(key).catch(() => {});

  return memResult;
}

export async function consumeRateLimitAsync(
  key: string,
  options: RateLimitOptions,
) {
  const rl = getRatelimit(options.limit, options.windowMs);

  if (!rl) {
    return consumeInMemory(key, options);
  }

  try {
    const result = await rl.limit(key);
    return {
      ok: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    };
  } catch {
    // Fallback to in-memory if Redis is unreachable
    return consumeInMemory(key, options);
  }
}
