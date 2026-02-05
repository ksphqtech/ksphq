/**
 * Material Management API Client
 * Provides functions for material CRUD operations
 */

import { get, post, patch, del } from './api.js';

/**
 * Material API functions
 */
export const materialApi = {
  /**
   * List materials with filtering and pagination
   * @param {Object} params - Query parameters
   * @param {string} params.project_id - Filter by project ID
   * @param {string} params.task_id - Filter by task ID
   * @param {string} params.category - Filter by category
   * @param {string} params.search - Search term
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise<{materials: Array, pagination: Object}>}
   */
  list: async (params = {}) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });

    const response = await get(`/api/materials?${query}`);
    return response.data;
  },

  /**
   * Get material by ID
   * @param {string} materialId - Material ID
   * @returns {Promise<Object>} Material object
   */
  get: async (materialId) => {
    const response = await get(`/api/materials/${materialId}`);
    return response.data;
  },

  /**
   * Create a new material
   * @param {Object} materialData - Material data
   * @param {string} materialData.name - Material name
   * @param {string} materialData.description - Material description
   * @param {string} materialData.project_id - Project ID
   * @param {string} materialData.task_id - Task ID (optional)
   * @param {string} materialData.category - Material category
   * @param {number} materialData.quantity - Quantity
   * @param {string} materialData.unit - Unit of measurement
   * @param {number} materialData.cost_per_unit - Cost per unit
   * @returns {Promise<Object>} Created material
   */
  create: async (materialData) => {
    const response = await post('/api/materials', materialData);
    return response.data;
  },

  /**
   * Update material
   * @param {string} materialId - Material ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated material
   */
  update: async (materialId, updates) => {
    const response = await patch(`/api/materials/${materialId}`, updates);
    return response.data;
  },

  /**
   * Delete material
   * @param {string} materialId - Material ID
   * @returns {Promise<Object>} Success message
   */
  delete: async (materialId) => {
    const response = await del(`/api/materials/${materialId}`);
    return response.data;
  },
};
