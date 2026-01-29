/**
 * API Client for KSPHQ Authentication
 * Handles HTTP requests with Authorization header-based authentication
 */

import { getAccessToken, clearTokens } from '@/utils/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:8787'
    : (() => {
        throw new Error('VITE_API_BASE_URL must be set in production')
      })()
  );

/**
 * Custom API Error class
 */
export class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Make an API request
 * @param {string} endpoint - API endpoint (e.g., '/auth/login')
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 * @throws {APIError} On request failure
 */
export async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Authorization header if not explicitly skipped and token exists
  if (!options.skipAuth) {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
  }

  const config = {
    headers,
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || 'Request failed';
      const error = new APIError(errorMessage, response.status, data);

      // Dispatch global unauthorized event for 401 responses
      if (response.status === 401) {
        clearTokens(); // Clear invalid tokens
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }

      throw error;
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    // Network error or JSON parse error
    throw new APIError('Network error. Please check your connection.', 0, null);
  }
}

/**
 * GET request
 */
export async function get(endpoint, options = {}) {
  return apiRequest(endpoint, {
    method: 'GET',
    ...options,
  });
}

/**
 * POST request
 */
export async function post(endpoint, body, options = {}) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options,
  });
}

/**
 * PATCH request
 */
export async function patch(endpoint, body, options = {}) {
  return apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
    ...options,
  });
}

/**
 * DELETE request
 */
export async function del(endpoint, options = {}) {
  return apiRequest(endpoint, {
    method: 'DELETE',
    ...options,
  });
}
