/**
 * Role Management API Client
 * Provides functions for role CRUD operations
 */

import { get, post, patch, del } from './api.js';

/**
 * Role API functions
 */
export const roleApi = {
  /**
   * List all roles
   * @returns {Promise<Array>} List of roles
   */
  list: async () => {
    const response = await get('/api/roles');
    return response.data;
  },

  /**
   * Get role by ID
   * @param {string} roleId - Role ID
   * @returns {Promise<Object>} Role object
   */
  get: async (roleId) => {
    const response = await get(`/api/roles/${roleId}`);
    return response.data;
  },

  /**
   * Create a new role (admin only)
   * @param {Object} roleData - Role data
   * @param {string} roleData.name - Role name
   * @param {number} roleData.level - Hierarchy level (1-100)
   * @param {string} roleData.description - Description
   * @param {Object} roleData.permissions - Permissions object
   * @returns {Promise<Object>} Created role
   */
  create: async (roleData) => {
    const response = await post('/api/roles', roleData);
    return response.data;
  },

  /**
   * Update role (admin only)
   * @param {string} roleId - Role ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated role
   */
  update: async (roleId, updates) => {
    const response = await patch(`/api/roles/${roleId}`, updates);
    return response.data;
  },

  /**
   * Delete role (admin only)
   * @param {string} roleId - Role ID
   * @returns {Promise<Object>} Success message
   */
  delete: async (roleId) => {
    const response = await del(`/api/roles/${roleId}`);
    return response.data;
  },
};
