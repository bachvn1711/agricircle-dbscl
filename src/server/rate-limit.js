export const MAX_RATE_KEYS = 4096;

export function createRateLimiter({ now, maxKeys = MAX_RATE_KEYS, cleanupIntervalMs = 60_000 }) {
  const buckets = new Map();

  function pruneExpired(currentNow = now()) {
    for (const [key, entry] of buckets.entries()) {
      if (entry.resetAt <= currentNow) {
        buckets.delete(key);
      }
    }
  }

  function evictIfNeeded(currentNow) {
    if (buckets.size < maxKeys) {
      return;
    }
    pruneExpired(currentNow);
    while (buckets.size >= maxKeys) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey === undefined) {
        break;
      }
      buckets.delete(oldestKey);
    }
  }

  function check(key, limit, windowMs) {
    const currentNow = now();
    const entry = buckets.get(key);
    if (!entry || entry.resetAt <= currentNow) {
      return { allowed: true, retryAfterSeconds: 0 };
    }
    if (entry.count >= limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - currentNow) / 1000));
      return { allowed: false, retryAfterSeconds };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }

  function record(key, windowMs) {
    const currentNow = now();
    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= currentNow) {
      if (existing) {
        buckets.delete(key);
      } else {
        evictIfNeeded(currentNow);
      }
      const next = { count: 1, resetAt: currentNow + windowMs };
      buckets.set(key, next);
      return next.count;
    }
    existing.count += 1;
    buckets.delete(key);
    buckets.set(key, existing);
    return existing.count;
  }

  function consume(key, limit, windowMs) {
    const status = check(key, limit, windowMs);
    if (!status.allowed) {
      return status;
    }
    record(key, windowMs);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  function size() {
    return buckets.size;
  }

  const timer = setInterval(() => {
    pruneExpired(now());
  }, cleanupIntervalMs);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  function close() {
    clearInterval(timer);
    buckets.clear();
  }

  return {
    check,
    record,
    consume,
    pruneExpired,
    size,
    close
  };
}
