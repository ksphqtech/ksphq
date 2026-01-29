/**
 * Organizational Unit API Client
 * Provides functions for managing branches, departments, shifts, teams, and groups
 */

import { get, post, patch, del } from './api.js';

/**
 * Organizational Unit API functions
 */
export const orgUnitApi = {
  /**
   * List organizational units
   * @param {Object} params - Query parameters
   * @param {string} params.type - Filter by type (branch, department, shift, team, group)
   * @param {string} params.parent_id - Filter by parent ID
   * @param {boolean} params.include_inactive - Include inactive units
   * @param {boolean} params.tree - Return as hierarchical tree
   * @returns {Promise<Array>} List of org units
   */
  list: async (params = {}) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });

    const response = await get(`/api/org-units?${query}`);
    return response.data;
  },

  /**
   * Get organizational unit by ID
   * @param {string} unitId - Org unit ID
   * @returns {Promise<Object>} Org unit object
   */
  get: async (unitId) => {
    const response = await get(`/api/org-units/${unitId}`);
    return response.data;
  },

  /**
   * Create a new organizational unit (admin only)
   * @param {Object} unitData - Org unit data
   * @param {string} unitData.type - Type (branch, department, shift, team, group)
   * @param {string} unitData.name - Name
   * @param {string} unitData.code - Short code (optional)
   * @param {string} unitData.parent_id - Parent unit ID (optional)
   * @param {Object} unitData.metadata - Additional metadata (optional)
   * @returns {Promise<Object>} Created org unit
   */
  create: async (unitData) => {
    const response = await post('/api/org-units', unitData);
    return response.data;
  },

  /**
   * Update organizational unit (admin only)
   * @param {string} unitId - Org unit ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated org unit
   */
  update: async (unitId, updates) => {
    const response = await patch(`/api/org-units/${unitId}`, updates);
    return response.data;
  },

  /**
   * Delete organizational unit (admin only)
   * @param {string} unitId - Org unit ID
   * @returns {Promise<Object>} Success message
   */
  delete: async (unitId) => {
    const response = await del(`/api/org-units/${unitId}`);
    return response.data;
  },

  /**
   * Get organizational units by type (convenience method)
   */
  getBranches: async () => {
    const response = await get('/api/org-units?type=branch');
    return response.data;
  },

  getDepartments: async () => {
    const response = await get('/api/org-units?type=department');
    return response.data;
  },

  getShifts: async () => {
    const response = await get('/api/org-units?type=shift');
    return response.data;
  },

  getTeams: async () => {
    const response = await get('/api/org-units?type=team');
    return response.data;
  },

  getGroups: async () => {
    const response = await get('/api/org-units?type=group');
    return response.data;
  },
};
