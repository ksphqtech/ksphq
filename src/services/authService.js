/**
 * Authentication Service
 * API wrapper for all authentication operations
 */

import { get, post, patch } from '@/lib/api';
import { getDeviceFingerprint } from '@/utils/fingerprint';

export const authService = {
  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data
   */
  async login(email, password) {
    const fingerprint = await getDeviceFingerprint();
    const data = await post('/auth/login', { email, password }, {
      headers: {
        'X-Device-Fingerprint': fingerprint
      }
    });
    return data.data.user;
  },

  /**
   * Create new account
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data
   */
  async signup(email, password) {
    const fingerprint = await getDeviceFingerprint();
    const data = await post('/auth/signup', { email, password }, {
      headers: {
        'X-Device-Fingerprint': fingerprint
      }
    });
    return data.data.user;
  },

  /**
   * Logout current user
   * Revokes refresh token and clears cookies
   * @returns {Promise<void>}
   */
  async logout() {
    await post('/auth/logout');
  },

  /**
   * Get current user data
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser() {
    const data = await get('/auth/user');
    return data.data;
  },

  /**
   * Update user profile
   * @param {Object} updates - Fields to update (email, idleTimeoutMinutes)
   * @returns {Promise<Object>} Updated user data
   */
  async updateUser(updates) {
    const data = await patch('/auth/user', updates);
    return data.data;
  },

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(currentPassword, newPassword) {
    await patch('/auth/user/password', { currentPassword, newPassword });
  },

  /**
   * Refresh access token
   * Uses refresh token from httpOnly cookie
   * @returns {Promise<Object>} Updated user data
   */
  async refreshToken() {
    const data = await post('/auth/refresh');
    return data.data.user;
  },

  /**
   * Track user activity
   * Updates last_activity_at to prevent idle timeout
   * @returns {Promise<void>}
   */
  async trackActivity() {
    await post('/auth/activity');
  },
};
