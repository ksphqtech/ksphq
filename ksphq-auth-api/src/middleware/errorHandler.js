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
 * @returns {Response} Error response
 */
export function handleError(error) {
  console.error('Error:', error);

  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode, error.details);
  }

  // Default to 500 for unknown errors
  return errorResponse('Internal server error', 500);
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
