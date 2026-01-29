/**
 * Account Lockout Utilities
 * Prevents brute force attacks with progressive lockout durations
 */

import { AppError } from './errors.js';

// Account lockout configuration
export const LOCKOUT_CONFIG = {
  maxAttempts: 5, // Failed attempts before first lockout
  lockoutDurations: [15, 30, 60, 1440], // Minutes: 15m, 30m, 1h, 24h (progressive)
};

/**
 * Check if account is currently locked
 * @param {object} user - User object with locked_until field
 * @throws {AppError} If account is locked with time remaining
 */
export async function checkAccountLockout(user) {
  if (!user.locked_until) return;

  const lockedUntil = new Date(user.locked_until);
  const now = new Date();

  if (lockedUntil > now) {
    const minutesRemaining = Math.ceil((lockedUntil - now) / 60000);
    const hoursRemaining = Math.floor(minutesRemaining / 60);

    let timeMessage;
    if (hoursRemaining > 0) {
      const mins = minutesRemaining % 60;
      timeMessage = `${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}${mins > 0 ? ` and ${mins} minute${mins > 1 ? 's' : ''}` : ''}`;
    } else {
      timeMessage = `${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}`;
    }

    throw new AppError(
      `Account is locked due to too many failed login attempts. Please try again in ${timeMessage}.`,
      423, // 423 Locked
      { lockedUntil: user.locked_until, minutesRemaining }
    );
  }
}

/**
 * Record a failed login attempt and apply lockout if needed
 * @param {object} db - Database connection
 * @param {object} user - User object
 * @param {string} ipAddress - IP address of login attempt
 * @param {string} deviceFingerprint - Device fingerprint
 * @param {string} reason - Reason for failure ('invalid_password', 'account_not_found', etc.)
 */
export async function recordFailedLogin(db, user, ipAddress, deviceFingerprint, reason = 'invalid_password') {
  // Log the failed attempt
  await db
    .prepare(
      `INSERT INTO failed_login_attempts (email, ip_address, device_fingerprint, reason)
       VALUES (?, ?, ?, ?)`
    )
    .bind(user.email, ipAddress, deviceFingerprint, reason)
    .run();

  const newCount = (user.failed_login_count || 0) + 1;

  // Check if lockout should be applied
  if (newCount >= LOCKOUT_CONFIG.maxAttempts) {
    // Calculate lockout duration based on attempt count
    // More attempts = longer lockout (progressive)
    const lockoutIndex = Math.min(
      Math.floor(newCount / LOCKOUT_CONFIG.maxAttempts) - 1,
      LOCKOUT_CONFIG.lockoutDurations.length - 1
    );
    const lockoutMinutes = LOCKOUT_CONFIG.lockoutDurations[lockoutIndex];
    const lockedUntil = new Date(Date.now() + lockoutMinutes * 60000).toISOString();

    // Lock the account
    await db
      .prepare(
        `UPDATE users
         SET failed_login_count = ?,
             locked_until = ?,
             last_failed_login_at = datetime('now')
         WHERE id = ?`
      )
      .bind(newCount, lockedUntil, user.id)
      .run();

    const hoursRemaining = Math.floor(lockoutMinutes / 60);
    let timeMessage;
    if (hoursRemaining > 0) {
      const mins = lockoutMinutes % 60;
      timeMessage = `${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}${mins > 0 ? ` and ${mins} minute${mins > 1 ? 's' : ''}` : ''}`;
    } else {
      timeMessage = `${lockoutMinutes} minute${lockoutMinutes > 1 ? 's' : ''}`;
    }

    throw new AppError(
      `Account locked due to too many failed login attempts. Please try again in ${timeMessage}.`,
      423,
      { lockedUntil, attemptCount: newCount }
    );
  }

  // Update failed attempt count
  await db
    .prepare(
      `UPDATE users
       SET failed_login_count = ?,
           last_failed_login_at = datetime('now')
       WHERE id = ?`
    )
    .bind(newCount, user.id)
    .run();

  // Calculate remaining attempts before lockout
  const remainingAttempts = LOCKOUT_CONFIG.maxAttempts - newCount;

  throw new AppError(
    `Invalid credentials. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining before account lockout.`,
    401,
    { remainingAttempts, attemptCount: newCount }
  );
}

/**
 * Reset failed login count after successful login
 * @param {object} db - Database connection
 * @param {string} userId - User ID
 */
export async function resetFailedLoginCount(db, userId) {
  await db
    .prepare(
      `UPDATE users
       SET failed_login_count = 0,
           locked_until = NULL,
           last_failed_login_at = NULL
       WHERE id = ?`
    )
    .bind(userId)
    .run();
}

/**
 * Manually unlock an account (admin function)
 * @param {object} db - Database connection
 * @param {string} userId - User ID to unlock
 * @param {string} unlockedBy - Admin user ID performing the unlock
 */
export async function unlockAccount(db, userId, unlockedBy) {
  await db
    .prepare(
      `UPDATE users
       SET failed_login_count = 0,
           locked_until = NULL
       WHERE id = ?`
    )
    .bind(userId)
    .run();

  // Log the unlock action in audit logs
  await db
    .prepare(
      `INSERT INTO audit_logs (user_id, target_user_id, action, category, severity, details)
       VALUES (?, ?, 'account_unlocked', 'security', 'warning', 'Admin manually unlocked account')`
    )
    .bind(unlockedBy, userId)
    .run();
}

/**
 * Get recent failed login attempts for a user
 * @param {object} db - Database connection
 * @param {string} email - User email
 * @param {number} hours - Number of hours to look back (default 24)
 * @returns {Array} Recent failed login attempts
 */
export async function getRecentFailedAttempts(db, email, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const result = await db
    .prepare(
      `SELECT * FROM failed_login_attempts
       WHERE email = ? AND attempted_at > ?
       ORDER BY attempted_at DESC
       LIMIT 50`
    )
    .bind(email, since)
    .all();

  return result.results || [];
}
