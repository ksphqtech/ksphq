/**
 * Password Policy Utilities
 * Enforces password complexity, history, and expiration rules
 */

import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Password policy configuration
export const PASSWORD_CONFIG = {
  expiryDays: 90,
  historyCount: 5, // Prevent reuse of last 5 passwords
  minLength: 12,
};

/**
 * Password validation schema
 * Requires:
 * - Minimum 12 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_CONFIG.minLength, `Password must be at least ${PASSWORD_CONFIG.minLength} characters`)
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

/**
 * Generate a random secure password
 * @returns {string} A secure random password
 */
export function generateSecurePassword() {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*(),.?":{}|<>';

  // Ensure at least one character from each required set
  let password = [
    lowercase[Math.floor(Math.random() * lowercase.length)],
    uppercase[Math.floor(Math.random() * uppercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    special[Math.floor(Math.random() * special.length)],
  ];

  // Fill the rest with random characters from all sets
  const allChars = lowercase + uppercase + numbers + special;
  const remainingLength = PASSWORD_CONFIG.minLength - password.length;

  for (let i = 0; i < remainingLength; i++) {
    password.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Shuffle the password array
  password = password.sort(() => Math.random() - 0.5);

  return password.join('');
}

/**
 * Validate password against history
 * Prevents users from reusing recent passwords
 * @param {object} db - Database connection
 * @param {string} userId - User ID
 * @param {string} newPassword - New password to validate
 * @throws {Error} If password matches any in history
 */
export async function validatePasswordHistory(db, userId, newPassword) {
  const history = await db
    .prepare(
      `SELECT password_hash FROM password_history
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .bind(userId, PASSWORD_CONFIG.historyCount)
    .all();

  // Check if new password matches any in history
  for (const row of history.results) {
    const matches = await bcrypt.compare(newPassword, row.password_hash);
    if (matches) {
      throw new Error(
        `Cannot reuse any of your last ${PASSWORD_CONFIG.historyCount} passwords. Please choose a different password.`
      );
    }
  }

  return true;
}

/**
 * Save password to history
 * Maintains a history of recent passwords to prevent reuse
 * @param {object} db - Database connection
 * @param {string} userId - User ID
 * @param {string} passwordHash - Bcrypt hashed password
 */
export async function savePasswordHistory(db, userId, passwordHash) {
  // Insert new password into history
  await db
    .prepare(`INSERT INTO password_history (user_id, password_hash) VALUES (?, ?)`)
    .bind(userId, passwordHash)
    .run();

  // Cleanup old history beyond retention limit
  await db
    .prepare(
      `DELETE FROM password_history
       WHERE user_id = ? AND id NOT IN (
         SELECT id FROM password_history
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ?
       )`
    )
    .bind(userId, userId, PASSWORD_CONFIG.historyCount)
    .run();
}

/**
 * Calculate password expiry date
 * @param {Date} passwordChangedAt - When password was last changed
 * @returns {string|null} ISO date string when password expires, or null if not expired
 */
export function calculatePasswordExpiry(passwordChangedAt) {
  if (!passwordChangedAt) return null;

  const expiryDate = new Date(passwordChangedAt);
  expiryDate.setDate(expiryDate.getDate() + PASSWORD_CONFIG.expiryDays);

  return expiryDate.toISOString();
}

/**
 * Check if password is expired
 * @param {string} passwordExpiresAt - ISO date string when password expires
 * @returns {boolean} True if password is expired
 */
export function isPasswordExpired(passwordExpiresAt) {
  if (!passwordExpiresAt) return false;
  return new Date(passwordExpiresAt) < new Date();
}

/**
 * Validate password strength (for manual entry)
 * @param {string} password - Password to validate
 * @returns {object} Validation result with errors array
 */
export function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < PASSWORD_CONFIG.minLength) {
    errors.push(`Must be at least ${PASSWORD_CONFIG.minLength} characters`);
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Must contain at least one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain at least one uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
