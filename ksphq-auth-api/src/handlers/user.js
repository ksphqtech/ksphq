import { comparePassword, hashPassword } from '../utils/password.js';
import { successResponse } from '../utils/response.js';
import { validateData, updateUserSchema, changePasswordSchema } from '../utils/validation.js';
import { AppError } from '../middleware/errorHandler.js';
import { getClientMetadata } from '../middleware/auth.js';
import { rateLimitPasswordChange } from '../middleware/rateLimit.js';
import { formatUserData } from '../utils/userFormatter.js';
import {
  findUserById,
  updateUser as updateUserDb,
  getUserPasswordHash,
  updatePassword,
  createAuditLog,
} from '../db/queries.js';

/**
 * GET /auth/user
 * Get current user profile
 */
export async function getCurrentUser(request, env, authUser) {
  // Validate authUser has required fields
  if (!authUser || !authUser.sub) {
    throw new AppError('Invalid authentication token - missing user ID', 401);
  }

  const user = await findUserById(env.DB, authUser.sub);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return successResponse(formatUserData(user));
}

/**
 * PATCH /auth/user
 * Update user profile
 */
export async function updateUserProfile(request, env, authUser) {
  const { ipAddress, userAgent } = getClientMetadata(request);

  // Parse and validate request
  const body = await request.json();
  const validation = validateData(body, updateUserSchema);

  if (!validation.success) {
    const message = env.ENVIRONMENT === 'development'
      ? validation.errors[0].message
      : 'Invalid request data. Please check your input and try again.';

    throw new AppError(
      message,
      400,
      env.ENVIRONMENT === 'development' ? { errors: validation.errors } : null
    );
  }

  const updates = validation.data;

  // Check if email is being changed to an existing email
  if (updates.email) {
    const existingUser = await env.DB
      .prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE AND id != ?')
      .bind(updates.email, authUser.sub)
      .first();

    if (existingUser) {
      throw new AppError('Email already in use', 409);
    }
  }

  // Update user
  const updatedUser = await updateUserDb(env.DB, authUser.sub, updates);

  // Create audit log
  await createAuditLog(env.DB, {
    userId: authUser.sub,
    action: 'profile_update',
    details: JSON.stringify(Object.keys(updates)),
    ipAddress,
    userAgent,
  });

  return successResponse(formatUserData(updatedUser));
}

/**
 * PATCH /auth/user/password
 * Change user password
 */
export async function changePassword(request, env, authUser) {
  const { ipAddress, userAgent } = getClientMetadata(request);

  // Rate limiting
  await rateLimitPasswordChange(env.DB, authUser.sub);

  // Parse and validate request
  const body = await request.json();
  const validation = validateData(body, changePasswordSchema);

  if (!validation.success) {
    const message = env.ENVIRONMENT === 'development'
      ? validation.errors[0].message
      : 'Invalid request data. Please check your input and try again.';

    throw new AppError(
      message,
      400,
      env.ENVIRONMENT === 'development' ? { errors: validation.errors } : null
    );
  }

  const { currentPassword, newPassword } = validation.data;

  // Verify current password
  const currentHash = await getUserPasswordHash(env.DB, authUser.sub);
  if (!currentHash) {
    throw new AppError('User not found', 404);
  }

  const passwordValid = await comparePassword(currentPassword, currentHash);
  if (!passwordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Hash new password
  const bcryptRounds = parseInt(env.BCRYPT_ROUNDS) || 10;
  const newPasswordHash = await hashPassword(newPassword, bcryptRounds);

  // Update password
  await updatePassword(env.DB, authUser.sub, newPasswordHash);

  // Create audit log
  await createAuditLog(env.DB, {
    userId: authUser.sub,
    action: 'password_change',
    ipAddress,
    userAgent,
  });

  // Fetch updated user data to return (with password_reset_required cleared)
  const updatedUser = await findUserById(env.DB, authUser.sub);
  const userData = formatUserData(updatedUser);

  return successResponse({ message: 'Password updated successfully', user: userData });
}
