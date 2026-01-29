import { hashPassword, comparePassword } from '../utils/password.js';
import { createAccessToken, createRefreshToken } from '../utils/jwt.js';
import { successResponse, errorResponse, setCookie, clearCookie } from '../utils/response.js';
import { validateData, signupSchema, loginSchema } from '../utils/validation.js';
import { AppError } from '../middleware/errorHandler.js';
import { getClientMetadata, verifyRefreshToken } from '../middleware/auth.js';
import { rateLimitLogin, rateLimitSignup } from '../middleware/rateLimit.js';
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateLastLogin,
  updateLastActivity,
  createRefreshToken as createRefreshTokenDb,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  createAuditLog,
} from '../db/queries.js';

/**
 * Format user data for response
 */
function formatUserData(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    permissions: {
      workforce: !!user.perm_workforce,
      docks: !!user.perm_docks,
      projects: !!user.perm_projects,
      tickets: !!user.perm_tickets,
    },
    idleTimeoutMinutes: user.idle_timeout_minutes || 60,
    lastActivityAt: user.last_activity_at,
  };
}

/**
 * Generate auth tokens and set cookies
 */
async function generateTokens(user, env, request) {
  const userData = formatUserData(user);

  // Create access token (15 minutes)
  const accessToken = await createAccessToken(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: userData.permissions,
      idleTimeoutMinutes: userData.idleTimeoutMinutes,
    },
    env.JWT_SECRET,
    '15m'
  );

  // Create refresh token (7 days)
  const tokenId = crypto.randomUUID();
  const refreshToken = await createRefreshToken(
    user.id,
    tokenId,
    env.REFRESH_TOKEN_SECRET,
    '7d'
  );

  // Store refresh token hash in database
  const tokenHash = await hashPassword(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { ipAddress, userAgent } = getClientMetadata(request);

  await createRefreshTokenDb(env.DB, {
    userId: user.id,
    tokenHash,
    expiresAt,
    ipAddress,
    userAgent,
  });

  return { accessToken, refreshToken, userData };
}

/**
 * POST /auth/signup
 * Create new user account
 */
export async function signup(request, env) {
  const { ipAddress, userAgent } = getClientMetadata(request);

  // Rate limiting
  rateLimitSignup(ipAddress);

  // Parse and validate request
  const body = await request.json();
  const validation = validateData(body, signupSchema);

  if (!validation.success) {
    throw new AppError(
      validation.errors[0].message,
      400,
      { errors: validation.errors }
    );
  }

  const { email, password } = validation.data;

  // Check if user exists
  const existingUser = await findUserByEmail(env.DB, email);
  if (existingUser) {
    throw new AppError('Email already exists', 409);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await createUser(env.DB, {
    email,
    passwordHash,
    role: 'user',
  });

  // Generate tokens
  const { accessToken, refreshToken, userData } = await generateTokens(user, env, request);

  // Update last login
  await updateLastLogin(env.DB, user.id);

  // Create audit log
  await createAuditLog(env.DB, {
    userId: user.id,
    action: 'signup',
    ipAddress,
    userAgent,
  });

  // Set cookies and return response
  let response = successResponse({ user: userData }, 201);
  response = setCookie(response, 'access_token', accessToken, {
    maxAge: 15 * 60, // 15 minutes
  });
  response = setCookie(response, 'refresh_token', refreshToken, {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/auth/refresh',
  });

  return response;
}

/**
 * POST /auth/login
 * Authenticate user and return tokens
 */
export async function login(request, env) {
  const { ipAddress, userAgent } = getClientMetadata(request);

  // Rate limiting
  rateLimitLogin(ipAddress);

  // Parse and validate request
  const body = await request.json();
  const validation = validateData(body, loginSchema);

  if (!validation.success) {
    throw new AppError(
      validation.errors[0].message,
      400,
      { errors: validation.errors }
    );
  }

  const { email, password } = validation.data;

  // Find user
  const user = await findUserByEmail(env.DB, email);
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if account is active
  if (!user.is_active) {
    throw new AppError('Account is disabled', 403);
  }

  // Verify password
  const passwordValid = await comparePassword(password, user.password_hash);
  if (!passwordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate tokens
  const { accessToken, refreshToken, userData } = await generateTokens(user, env, request);

  // Update last login
  await updateLastLogin(env.DB, user.id);

  // Create audit log
  await createAuditLog(env.DB, {
    userId: user.id,
    action: 'login',
    ipAddress,
    userAgent,
  });

  // Set cookies and return response
  let response = successResponse({ user: userData });
  response = setCookie(response, 'access_token', accessToken, {
    maxAge: 15 * 60, // 15 minutes
  });
  response = setCookie(response, 'refresh_token', refreshToken, {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/auth/refresh',
  });

  return response;
}

/**
 * POST /auth/logout
 * Revoke refresh token and clear cookies
 */
export async function logout(request, env, user) {
  const { ipAddress, userAgent } = getClientMetadata(request);

  // Revoke all user tokens
  await revokeAllUserTokens(env.DB, user.sub);

  // Create audit log
  await createAuditLog(env.DB, {
    userId: user.sub,
    action: 'logout',
    ipAddress,
    userAgent,
  });

  // Clear cookies
  let response = successResponse({ message: 'Logged out successfully' });
  response = clearCookie(response, 'access_token');
  response = clearCookie(response, 'refresh_token', '/auth/refresh');

  return response;
}

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
export async function refresh(request, env) {
  // Verify refresh token
  const payload = await verifyRefreshToken(request, env);

  // Find token in database
  const { ipAddress, userAgent } = getClientMetadata(request);
  const cookieHeader = request.headers.get('Cookie');
  const refreshTokenValue = cookieHeader
    ?.split(';')
    .find(c => c.trim().startsWith('refresh_token='))
    ?.split('=')[1];

  if (!refreshTokenValue) {
    throw new AppError('Refresh token required', 401);
  }

  // Check if token exists and is valid
  const tokens = await env.DB.prepare(
    'SELECT token_hash FROM refresh_tokens WHERE user_id = ? AND revoked_at IS NULL'
  )
    .bind(payload.sub)
    .all();

  let tokenValid = false;
  for (const token of tokens.results || []) {
    if (await comparePassword(refreshTokenValue, token.token_hash)) {
      tokenValid = true;
      break;
    }
  }

  if (!tokenValid) {
    throw new AppError('Invalid refresh token', 401);
  }

  // Get user data
  const user = await findUserById(env.DB, payload.sub);
  if (!user || !user.is_active) {
    throw new AppError('User not found or inactive', 401);
  }

  // Generate new access token only
  const userData = formatUserData(user);
  const accessToken = await createAccessToken(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: userData.permissions,
      idleTimeoutMinutes: userData.idleTimeoutMinutes,
    },
    env.JWT_SECRET,
    '15m'
  );

  // Set new access token cookie
  let response = successResponse({ user: userData });
  response = setCookie(response, 'access_token', accessToken, {
    maxAge: 15 * 60, // 15 minutes
  });

  return response;
}

/**
 * POST /auth/activity
 * Update user last activity timestamp
 */
export async function trackActivity(request, env, user) {
  await updateLastActivity(env.DB, user.sub);
  return successResponse({ message: 'Activity tracked' });
}
