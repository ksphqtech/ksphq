import { SignJWT, jwtVerify } from 'jose';

/**
 * Create a JWT access token
 * @param {Object} payload - User data to encode
 * @param {string} secret - JWT secret
 * @param {string} expiresIn - Expiration time (e.g., '15m')
 * @returns {Promise<string>} JWT token
 */
export async function createAccessToken(payload, secret, expiresIn = '15m') {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  const token = await new SignJWT({
    ...payload,
    jti: crypto.randomUUID(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);

  return token;
}

/**
 * Create a JWT refresh token
 * @param {string} userId - User ID
 * @param {string} tokenId - Unique token ID for tracking
 * @param {string} secret - Refresh token secret
 * @param {string} expiresIn - Expiration time (e.g., '7d')
 * @returns {Promise<string>} JWT refresh token
 */
export async function createRefreshToken(userId, tokenId, secret, expiresIn = '7d') {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  const token = await new SignJWT({
    sub: userId,
    type: 'refresh',
    jti: tokenId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);

  return token;
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @param {string} secret - Secret key
 * @returns {Promise<Object>} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
export async function verifyToken(token, secret) {
  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);

    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extract token from cookie header
 * @param {string} cookieHeader - Cookie header string
 * @param {string} name - Cookie name
 * @returns {string|null} Token value or null
 */
export function extractTokenFromCookie(cookieHeader, name) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const cookie = cookies.find(c => c.startsWith(`${name}=`));

  if (!cookie) return null;

  return cookie.substring(name.length + 1);
}

/**
 * Extract token from Authorization header (Bearer format)
 * @param {string} authHeader - Authorization header string
 * @returns {string|null} Token value or null
 */
export function extractTokenFromAuthHeader(authHeader) {
  if (!authHeader) return null;

  const bearerPrefix = 'Bearer ';
  if (!authHeader.startsWith(bearerPrefix)) {
    return null;
  }

  return authHeader.substring(bearerPrefix.length).trim() || null;
}

/**
 * Extract access token from request (header first, cookie fallback)
 * Supports dual-mode authentication during migration
 * @param {Request} request - Request object
 * @returns {string|null} Token value or null
 */
export function extractAccessToken(request) {
  // Priority 1: Authorization header (new method)
  const authHeader = request.headers.get('Authorization');
  const headerToken = extractTokenFromAuthHeader(authHeader);
  if (headerToken) {
    return headerToken;
  }

  // Priority 2: Cookie (backward compatibility)
  const cookieHeader = request.headers.get('Cookie');
  return extractTokenFromCookie(cookieHeader, 'access_token');
}
