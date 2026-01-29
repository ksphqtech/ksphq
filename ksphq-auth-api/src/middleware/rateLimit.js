import { AppError } from './errorHandler.js';

/**
 * Distributed rate limiter using D1 database
 * Replaces in-memory Map for production reliability
 */

/**
 * Check and enforce rate limit
 * @param {Object} db - D1 database binding
 * @param {string} key - Unique identifier (IP, user ID, etc.)
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 */
export async function checkRateLimit(db, key, maxAttempts, windowMs) {
  const now = Date.now();
  const resetTime = new Date(now + windowMs).toISOString();
  const limitKey = `${key}`;

  // Probabilistic cleanup (1% of requests to avoid overhead)
  if (Math.random() < 0.01) {
    await db.prepare(
      `DELETE FROM rate_limits WHERE reset_time < datetime('now')`
    ).run();
  }

  // Get existing rate limit entry
  const existing = await db.prepare(
    `SELECT attempts, reset_time FROM rate_limits WHERE key = ?`
  ).bind(limitKey).first();

  if (!existing) {
    // First attempt - create new record
    await db.prepare(
      `INSERT INTO rate_limits (key, attempts, reset_time) VALUES (?, 1, ?)`
    ).bind(limitKey, resetTime).run();
    return;
  }

  // Check if window expired
  const resetTimeMs = new Date(existing.reset_time).getTime();
  if (now > resetTimeMs) {
    // Reset counter
    await db.prepare(
      `UPDATE rate_limits SET attempts = 1, reset_time = ?, updated_at = datetime('now') WHERE key = ?`
    ).bind(resetTime, limitKey).run();
    return;
  }

  // Increment attempts
  const newAttempts = existing.attempts + 1;
  await db.prepare(
    `UPDATE rate_limits SET attempts = ?, updated_at = datetime('now') WHERE key = ?`
  ).bind(newAttempts, limitKey).run();

  // Check if limit exceeded
  if (newAttempts > maxAttempts) {
    const retryAfter = Math.ceil((resetTimeMs - now) / 1000);
    throw new AppError(
      `Too many attempts. Please try again in ${retryAfter} seconds.`,
      429,
      { retryAfter }
    );
  }
}

/**
 * Rate limit for login attempts
 * Dual-layer protection:
 * - Layer 1 (Primary): Per-device fingerprint - 5 attempts per 30 seconds
 * - Layer 2 (Backup): Per-IP address - 30 attempts per 60 seconds
 *
 * This allows multiple warehouse employees on same WiFi to login independently
 * while still protecting against brute force and distributed attacks.
 */
export async function rateLimitLogin(db, ipAddress, deviceFingerprint) {
  // Layer 1: Per-device rate limit (primary protection)
  // Each device gets 5 attempts per 30 seconds
  if (deviceFingerprint) {
    await checkRateLimit(
      db,
      `login:device:${deviceFingerprint}`,
      5,
      30 * 1000 // 30 seconds
    );
  }

  // Layer 2: Per-IP rate limit (backup/anti-abuse)
  // Higher threshold to allow multiple warehouse devices
  // Prevents distributed attacks from one location
  await checkRateLimit(
    db,
    `login:ip:${ipAddress}`,
    30, // 30 attempts per IP (allows 6+ employees)
    60 * 1000 // 1 minute window
  );
}

/**
 * Rate limit for signup attempts
 * Dual-layer protection to prevent mass account creation
 */
export async function rateLimitSignup(db, ipAddress, deviceFingerprint) {
  // Per-device signup rate limit
  if (deviceFingerprint) {
    await checkRateLimit(
      db,
      `signup:device:${deviceFingerprint}`,
      3,
      60 * 60 * 1000 // 1 hour
    );
  }

  // Per-IP signup rate limit (prevent mass account creation)
  await checkRateLimit(
    db,
    `signup:ip:${ipAddress}`,
    10, // Allow 10 signups per IP per hour
    60 * 60 * 1000 // 1 hour
  );
}

/**
 * Rate limit for password change
 * 3 attempts per hour per user
 */
export async function rateLimitPasswordChange(db, userId) {
  await checkRateLimit(db, `password:${userId}`, 3, 60 * 60 * 1000);
}
