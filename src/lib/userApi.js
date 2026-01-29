/**
 * User Management API Client
 * Provides functions for user CRUD operations
 */

import { get, post, patch, del } from './api.js';

/**
 * User API functions
 */
export const userApi = {
  /**
   * List users with filtering and pagination
   * @param {Object} params - Query parameters
   * @param {string} params.role_id - Filter by role ID
   * @param {string} params.branch_id - Filter by branch ID
   * @param {string} params.department_id - Filter by department ID
   * @param {string} params.team_id - Filter by team ID
   * @param {string} params.search - Search term
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise<{users: Array, pagination: Object}>}
   */
  list: async (params = {}) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });

    const response = await get(`/api/users?${query}`);
    return response.data;
  },

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user with generated password if applicable
   */
  create: async (userData) => {
    const response = await post('/api/users', userData);
    return response.data;
  },

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  get: async (userId) => {
    const response = await get(`/api/users/${userId}`);
    return response.data;
  },

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user
   */
  update: async (userId, updates) => {
    const response = await patch(`/api/users/${userId}`, updates);
    return response.data;
  },

  /**
   * Soft delete user (deactivate)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Success message
   */
  delete: async (userId) => {
    const response = await del(`/api/users/${userId}`);
    return response.data;
  },

  /**
   * Reactivate soft-deleted user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Success message
   */
  reactivate: async (userId) => {
    const response = await post(`/api/users/${userId}/reactivate`);
    return response.data;
  },

  /**
   * Reset user password (admin function)
   * @param {string} userId - User ID
   * @param {Object} options - Password reset options
   * @param {string} options.password_option - 'auto' or 'manual'
   * @param {string} options.password - New password (if manual)
   * @param {boolean} options.require_change - Require password change on next login
   * @returns {Promise<{message: string, generatedPassword?: string}>}
   */
  resetPassword: async (userId, options) => {
    const response = await post(`/api/users/${userId}/reset-password`, options);
    return response.data;
  },

  /**
   * Get deleted users (admin only)
   * @returns {Promise<Array>} List of soft-deleted users
   */
  getDeleted: async () => {
    const response = await get('/api/users/deleted');
    return response.data;
  },

  /**
   * Bulk deactivate users (admin only)
   * @param {Array<string>} userIds - Array of user IDs
   * @returns {Promise<Object>} Success message
   */
  bulkDeactivate: async (userIds) => {
    const response = await post('/api/users/bulk-deactivate', { user_ids: userIds });
    return response.data;
  },
};
