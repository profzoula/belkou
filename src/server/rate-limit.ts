/**
 * Simple in-memory sliding window rate limiter.
 * Works on Cloudflare Workers (no Node.js dependencies).
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean old entries every 5 minutes
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

/**
 * Check if a request is rate-limited.
 * @param key - Unique identifier (e.g., IP + action)
 * @param limit - Max requests allowed in the window
 * @param windowMs - Window duration in milliseconds
 * @returns true if the request is allowed, false if rate-limited
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  cleanup(windowMs);

  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { timestamps: [now] });
    return true;
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    return false;
  }

  entry.timestamps.push(now);
  return true;
}

/**
 * Rate limit presets for BelKou
 */
export const RATE_LIMITS = {
  register: { limit: 10, windowMs: 10 * 60 * 1000 }, // 10 per 10 minutes
  login: { limit: 5, windowMs: 60 * 1000 },          // 5 per minute
  adminLogin: { limit: 5, windowMs: 60 * 1000 },     // 5 per minute
  forgotPassword: { limit: 3, windowMs: 5 * 60 * 1000 }, // 3 per 5 minutes
} as const;
