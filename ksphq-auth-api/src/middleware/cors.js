/**
 * CORS middleware
 * Handles Cross-Origin Resource Sharing for frontend requests
 */

/**
 * Get allowed origin based on environment
 * @param {Object} env - Environment variables
 * @returns {string} Allowed origin
 */
function getAllowedOrigin(env) {
  return env.FRONTEND_URL || 'http://localhost:5173';
}

/**
 * Add CORS headers to response
 * @param {Response} response - Response object
 * @param {Object} env - Environment variables
 * @returns {Response} Response with CORS headers
 */
export function addCorsHeaders(response, env) {
  const headers = new Headers(response.headers);
  const allowedOrigin = getAllowedOrigin(env);

  headers.set('Access-Control-Allow-Origin', allowedOrigin);
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Device-Fingerprint');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Handle OPTIONS preflight request
 * @param {Object} env - Environment variables
 * @returns {Response} CORS preflight response
 */
export function handleOptions(env) {
  const allowedOrigin = getAllowedOrigin(env);

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Device-Fingerprint',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}
