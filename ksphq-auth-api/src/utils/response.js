/**
 * Sanitize error details based on environment
 */
export function sanitizeErrorDetails(details, env) {
  // In development, show full details for debugging
  if (env?.ENVIRONMENT === 'development') {
    return details;
  }

  // In production, hide implementation details
  if (details?.errors) {
    // Hide field validation errors
    return null;
  }

  // Preserve safe details like retryAfter
  if (details?.retryAfter !== undefined) {
    return { retryAfter: details.retryAfter };
  }

  return null;
}

/**
 * Standard success response
 * @param {Object} data - Response data
 * @param {number} status - HTTP status code
 * @returns {Response} JSON response
 */
export function successResponse(data, status = 200) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
      },
    }
  );
}

/**
 * Standard error response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {Object} details - Additional error details
 * @param {Object} env - Environment variables for sanitization
 * @returns {Response} JSON response
 */
export function errorResponse(message, status = 400, details = null, env = null) {
  const sanitizedDetails = env ? sanitizeErrorDetails(details, env) : details;

  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message,
        ...(sanitizedDetails && { details: sanitizedDetails }),
      },
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
      },
    }
  );
}

/**
 * SECURITY NOTE: Cookie SameSite Policy
 *
 * Current: SameSite=None (required for cross-site cookies)
 * - Frontend: ksphq.pages.dev
 * - API: ksphq-auth-api.workers.dev
 * - Different domains require SameSite=None
 *
 * Future Improvement: Deploy API to custom domain (api.ksphq.com)
 * to enable SameSite=Lax for better CSRF protection
 *
 * Mitigation: CORS is strictly configured to only allow
 * requests from FRONTEND_URL environment variable
 */

/**
 * Set httpOnly cookie on response
 * @param {Response} response - Response object
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {Object} options - Cookie options
 * @returns {Response} Response with cookie header
 */
export function setCookie(response, name, value, options = {}) {
  const {
    maxAge = 900, // 15 minutes default
    path = '/',
    httpOnly = true,
    secure = true,
    sameSite = 'None',
  } = options;

  const headers = new Headers(response.headers);
  const cookieParts = [
    `${name}=${value}`,
    `Path=${path}`,
    `Max-Age=${maxAge}`,
    sameSite && `SameSite=${sameSite}`,
    httpOnly && 'HttpOnly',
    secure && 'Secure',
  ].filter(Boolean);

  headers.append('Set-Cookie', cookieParts.join('; '));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Clear httpOnly cookie
 * @param {Response} response - Response object
 * @param {string} name - Cookie name
 * @param {string} path - Cookie path
 * @returns {Response} Response with cookie header
 */
export function clearCookie(response, name, path = '/') {
  const headers = new Headers(response.headers);
  headers.append(
    'Set-Cookie',
    `${name}=; Path=${path}; Max-Age=0; HttpOnly; Secure; SameSite=None`
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
