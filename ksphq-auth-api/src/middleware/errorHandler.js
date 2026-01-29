import { errorResponse } from '../utils/response.js';

/**
 * Global error handler middleware
 * Catches all errors and returns standardized error responses
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }
}

/**
 * Handle errors and return appropriate response
 * @param {Error} error - Error object
 * @param {Object} env - Environment variables
 * @returns {Response} Error response
 */
export function handleError(error, env) {
  console.error('Error:', error);

  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode, error.details, env);
  }

  // Sanitize unexpected errors in production
  const message = env?.ENVIRONMENT === 'production'
    ? 'An unexpected error occurred. Please try again later.'
    : error.message || 'Internal server error';

  return errorResponse(message, 500, null, env);
}

/**
 * Async handler wrapper to catch errors
 * @param {Function} handler - Async handler function
 * @returns {Function} Wrapped handler
 */
export function asyncHandler(handler) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error);
    }
  };
}
