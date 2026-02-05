/**
 * Branch Location API Client
 * Handles API requests for branch location management
 */

import { apiRequest } from './api';

/**
 * List all locations for a branch
 * @param {string} branchId - Branch ID
 * @param {boolean} includeInactive - Include inactive locations
 * @returns {Promise<Array>} Array of locations
 */
export async function listBranchLocations(branchId, includeInactive = false) {
  const query = includeInactive ? '?include_inactive=true' : '';
  const response = await apiRequest(`/api/branches/${branchId}/locations${query}`);
  return response.locations || [];
}

/**
 * Get a single location by ID
 * @param {string} locationId - Location ID
 * @returns {Promise<Object>} Location object
 */
export async function getLocation(locationId) {
  const response = await apiRequest(`/api/locations/${locationId}`);
  return response.location;
}

/**
 * Create a new location for a branch
 * @param {string} branchId - Branch ID
 * @param {Object} locationData - Location data
 * @returns {Promise<Object>} Created location
 */
export async function createBranchLocation(branchId, locationData) {
  const response = await apiRequest(`/api/branches/${branchId}/locations`, {
    method: 'POST',
    body: JSON.stringify(locationData),
  });
  return response.location;
}

/**
 * Update a location
 * @param {string} locationId - Location ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated location
 */
export async function updateLocation(locationId, updates) {
  const response = await apiRequest(`/api/locations/${locationId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return response.location;
}

/**
 * Delete a location
 * @param {string} locationId - Location ID
 * @returns {Promise<Object>} Success response
 */
export async function deleteLocation(locationId) {
  const response = await apiRequest(`/api/locations/${locationId}`, {
    method: 'DELETE',
  });
  return response;
}

/**
 * Set a location as primary for its branch
 * @param {string} locationId - Location ID
 * @returns {Promise<Object>} Updated location
 */
export async function setPrimaryLocation(locationId) {
  const response = await apiRequest(`/api/locations/${locationId}/set-primary`, {
    method: 'POST',
  });
  return response.location;
}
