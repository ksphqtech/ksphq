/**
 * Security headers middleware
 * Protects against XSS, clickjacking, MIME sniffing, and other attacks
 */

/**
 * Get Content Security Policy based on environment
 */
function getCSP(env) {
  const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';

  return [
    "default-src 'none'",
    "frame-ancestors 'none'",
    `connect-src 'self' ${frontendUrl}`,
  ].join('; ');
}

/**
 * Add comprehensive security headers to response
 */
export function addSecurityHeaders(response, env) {
  const headers = new Headers(response.headers);

  // Content Security Policy - Prevent XSS
  headers.set('Content-Security-Policy', getCSP(env));

  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');

  // Enable HSTS (HTTPS only in production)
  if (env.ENVIRONMENT === 'production') {
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Prevent MIME sniffing
  headers.set('X-Content-Type-Options', 'nosniff');

  // XSS Protection (legacy browsers)
  headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy - disable unnecessary features
  headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
