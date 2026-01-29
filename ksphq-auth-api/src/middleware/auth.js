import { verifyToken, extractTokenFromCookie, extractAccessToken } from '../utils/jwt.js';
import { isAccessTokenRevoked } from '../db/queries.js';
import { AppError } from './errorHandler.js';

/**
 * Authentication middleware
 * Verifies JWT access token from httpOnly cookie
 */

/**
 * Require authentication - verify access token
 * @param {Request} request - Request object
 * @param {Object} env - Environment variables
 * @returns {Promise<Object>} Decoded user data
 * @throws {AppError} If authentication fails
 */
export async function requireAuth(request, env) {
  const accessToken = extractAccessToken(request);

  // Debug logging
  console.log('[Auth] Authorization header:', !!request.headers.get('Authorization'));
  console.log('[Auth] Cookie header:', !!request.headers.get('Cookie'));
  console.log('[Auth] Token extracted:', !!accessToken);

  if (!accessToken) {
    console.error('[Auth] No access token in header or cookie');
    throw new AppError('Authentication required', 401);
  }

  try {
    const payload = await verifyToken(accessToken, env.JWT_SECRET);
    console.log('[Auth] Token verified for user:', payload.sub);

    // Check if token is revoked
    if (payload.jti) {
      const isRevoked = await isAccessTokenRevoked(env.DB, payload.jti);
      if (isRevoked) {
        console.error('[Auth] Token is revoked:', payload.jti);
        throw new AppError('Token has been revoked', 401);
      }
    }

    // Fetch user with role data for permission checks
    const userWithRole = await env.DB.prepare(`
      SELECT
        u.id,
        u.email,
        u.role,
        u.role_id,
        u.branch_id,
        u.department_id,
        u.team_id,
        u.is_active,
        u.deleted_at,
        r.level as role_level,
        r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `).bind(payload.sub).first();

    if (!userWithRole) {
      console.error('[Auth] User not found in database:', payload.sub);
      throw new AppError('User not found', 401);
    }

    console.log('[Auth] User authenticated successfully:', userWithRole.email);

    // Parse permissions if JSON string
    if (userWithRole.role_permissions && typeof userWithRole.role_permissions === 'string') {
      try {
        userWithRole.role_permissions = JSON.parse(userWithRole.role_permissions);
      } catch (e) {
        userWithRole.role_permissions = {};
      }
    }

    // Add JWT sub claim for handlers that expect it
    userWithRole.sub = payload.sub;

    return userWithRole;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('[Auth] Token verification failed:', error.message);
    throw new AppError('Invalid or expired token', 401);
  }
}

/**
 * Verify refresh token
 * @param {Request} request - Request object
 * @param {Object} env - Environment variables
 * @returns {Promise<Object>} Decoded token data
 * @throws {AppError} If token is invalid
 */
export async function verifyRefreshToken(request, env) {
  let refreshToken = null;

  // Priority 1: Request body (new method)
  try {
    const body = await request.clone().json();
    if (body.refreshToken) {
      refreshToken = body.refreshToken;
    }
  } catch (e) {
    // Not JSON or no refreshToken in body
  }

  // Priority 2: Cookie (backward compatibility)
  if (!refreshToken) {
    const cookieHeader = request.headers.get('Cookie');
    refreshToken = extractTokenFromCookie(cookieHeader, 'refresh_token');
  }

  if (!refreshToken) {
    throw new AppError('Refresh token required', 401);
  }

  try {
    const payload = await verifyToken(refreshToken, env.REFRESH_TOKEN_SECRET);

    if (payload.type !== 'refresh') {
      throw new AppError('Invalid token type', 401);
    }

    return { payload, token: refreshToken };
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
}

/**
 * Extract client metadata from request
 * @param {Request} request - Request object
 * @returns {Object} Client metadata
 */
export function getClientMetadata(request) {
  return {
    // SECURITY: Only trust CF-Connecting-IP from Cloudflare
    // X-Forwarded-For can be spoofed by attackers
    ipAddress: request.headers.get('CF-Connecting-IP') || 'unknown',
    userAgent: request.headers.get('User-Agent') || 'unknown',
  };
}
