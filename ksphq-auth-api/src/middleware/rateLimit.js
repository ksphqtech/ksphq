import { AppError } from './errorHandler.js';

/**
 * Simple in-memory rate limiter
 * For production, consider using Cloudflare Durable Objects or KV
 */

const rateLimitStore = new Map();

/**
 * Clean up expired rate limit entries
 * Note: Cleanup happens inline during rate limit checks
 * (Workers don't allow setInterval in global scope)
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limit middleware
 * @param {string} key - Unique identifier (IP, user ID, etc.)
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @throws {AppError} If rate limit exceeded
 */
export function checkRateLimit(key, maxAttempts, windowMs) {
  // Periodically clean up expired entries (every ~100 requests)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  const now = Date.now();
  const limitKey = `${key}`;

  if (!rateLimitStore.has(limitKey)) {
    rateLimitStore.set(limitKey, {
      attempts: 1,
      resetTime: now + windowMs,
    });
    return;
  }

  const data = rateLimitStore.get(limitKey);

  // Reset if window expired
  if (now > data.resetTime) {
    rateLimitStore.set(limitKey, {
      attempts: 1,
      resetTime: now + windowMs,
    });
    return;
  }

  // Increment attempts
  data.attempts += 1;

  // Check if limit exceeded
  if (data.attempts > maxAttempts) {
    const retryAfter = Math.ceil((data.resetTime - now) / 1000);
    throw new AppError(
      `Too many attempts. Please try again in ${retryAfter} seconds.`,
      429,
      { retryAfter }
    );
  }
}

/**
 * Rate limit for login attempts
 * 5 attempts per 5 minutes per IP
 */
export function rateLimitLogin(ipAddress) {
  checkRateLimit(`login:${ipAddress}`, 5, 5 * 60 * 1000);
}

/**
 * Rate limit for signup attempts
 * 3 attempts per hour per IP
 */
export function rateLimitSignup(ipAddress) {
  checkRateLimit(`signup:${ipAddress}`, 3, 60 * 60 * 1000);
}

/**
 * Rate limit for password change
 * 3 attempts per hour per user
 */
export function rateLimitPasswordChange(userId) {
  checkRateLimit(`password:${userId}`, 3, 60 * 60 * 1000);
}
