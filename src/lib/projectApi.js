/**
 * Project Management API Client
 * Provides functions for project CRUD operations
 */

import { get, post, patch, del } from './api.js';

/**
 * Project API functions
 */
export const projectApi = {
  /**
   * List projects with filtering and pagination
   * @param {Object} params - Query parameters
   * @param {string} params.status - Filter by status
   * @param {string} params.branch_id - Filter by branch ID
   * @param {string} params.created_by - Filter by creator user ID
   * @param {string} params.search - Search term
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise<{projects: Array, pagination: Object}>}
   */
  list: async (params = {}) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });

    const response = await get(`/api/projects?${query}`);
    return response.data;
  },

  /**
   * Get project by ID
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Project object
   */
  get: async (projectId) => {
    const response = await get(`/api/projects/${projectId}`);
    return response.data;
  },

  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @param {string} projectData.name - Project name
   * @param {string} projectData.description - Project description
   * @param {string} projectData.branch_id - Branch ID
   * @param {string} projectData.start_date - Start date (ISO format)
   * @param {string} projectData.end_date - End date (ISO format)
   * @param {string} projectData.status - Project status
   * @returns {Promise<Object>} Created project
   */
  create: async (projectData) => {
    const response = await post('/api/projects', projectData);
    return response.data;
  },

  /**
   * Update project
   * @param {string} projectId - Project ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated project
   */
  update: async (projectId, updates) => {
    const response = await patch(`/api/projects/${projectId}`, updates);
    return response.data;
  },

  /**
   * Soft delete project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Success message
   */
  delete: async (projectId) => {
    const response = await del(`/api/projects/${projectId}`);
    return response.data;
  },
};
