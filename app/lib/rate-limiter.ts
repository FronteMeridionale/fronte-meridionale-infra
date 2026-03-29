interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Returns true if the request is allowed, false if rate-limited.
 *
 * @param key        - Unique key identifying the caller (e.g. `participate:123456`)
 * @param maxRequests - Maximum requests allowed within the window (default: 20)
 * @param windowMs   - Duration of the window in milliseconds (default: 60 000)
 */
export function checkRateLimit(
  key: string,
  maxRequests = 20,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}
