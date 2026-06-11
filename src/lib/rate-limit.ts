const buckets = new Map<string, number[]>();

export function enforceRateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const values = (buckets.get(key) ?? []).filter((value) => value > windowStart);

  if (values.length >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((values[0] + windowMs - now) / 1000),
    };
  }

  values.push(now);
  buckets.set(key, values);
  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}
