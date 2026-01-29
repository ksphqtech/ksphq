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
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Standard error response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {Object} details - Additional error details
 * @returns {Response} JSON response
 */
export function errorResponse(message, status = 400, details = null) {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message,
        ...(details && { details }),
      },
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

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
    sameSite = 'Strict',
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
    `${name}=; Path=${path}; Max-Age=0; HttpOnly; Secure; SameSite=Strict`
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
