import { verifyToken, extractTokenFromCookie } from '../utils/jwt.js';
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
  const cookieHeader = request.headers.get('Cookie');
  const accessToken = extractTokenFromCookie(cookieHeader, 'access_token');

  if (!accessToken) {
    throw new AppError('Authentication required', 401);
  }

  try {
    const payload = await verifyToken(accessToken, env.JWT_SECRET);

    // Check if token is revoked
    if (payload.jti) {
      const isRevoked = await isAccessTokenRevoked(env.DB, payload.jti);
      if (isRevoked) {
        throw new AppError('Token has been revoked', 401);
      }
    }

    return payload;
  } catch (error) {
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
  const cookieHeader = request.headers.get('Cookie');
  const refreshToken = extractTokenFromCookie(cookieHeader, 'refresh_token');

  if (!refreshToken) {
    throw new AppError('Refresh token required', 401);
  }

  try {
    const payload = await verifyToken(refreshToken, env.REFRESH_TOKEN_SECRET);

    if (payload.type !== 'refresh') {
      throw new AppError('Invalid token type', 401);
    }

    return payload;
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
