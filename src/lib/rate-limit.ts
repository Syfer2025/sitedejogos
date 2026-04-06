type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  rateLimitStore?: Map<string, RateLimitEntry>;
};

const rateLimitStore = globalForRateLimit.rateLimitStore ?? new Map<string, RateLimitEntry>();

if (!globalForRateLimit.rateLimitStore) {
  globalForRateLimit.rateLimitStore = rateLimitStore;
}

export function consumeRateLimit(key: string, options: RateLimitOptions) {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    const fresh = {
      count: 1,
      resetAt: now + options.windowMs,
    } satisfies RateLimitEntry;

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