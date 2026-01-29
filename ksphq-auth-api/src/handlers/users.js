/**
 * User Management API Handlers
 * Handles all user CRUD operations with proper authorization and validation
 */

import { successResponse, errorResponse } from '../utils/response.js';
import { AppError } from '../utils/errors.js';
import {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
  passwordResetSchema,
  bulkDeactivateSchema,
} from '../utils/userValidation.js';
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  softDeleteUser,
  reactivateUser,
  resetUserPassword,
  getDeletedUsers,
  bulkDeactivateUsers,
} from '../db/userQueries.js';
import {
  canAccessUser,
  canModifyField,
  validateManagerAssignment,
  requireAdmin,
} from '../middleware/permissions.js';

/**
 * Create a new user
 * POST /api/users
 */
export async function handleCreateUser(request, env, ctx, currentUser) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validated = createUserSchema.parse(body);

    // Check if current user can create users
    const userMgmtPerm = currentUser.role_permissions?.user_management;
    if (!userMgmtPerm || userMgmtPerm === 'view_self' || userMgmtPerm === 'view_team') {
      return errorResponse('Insufficient permissions to create users', 403);
    }

    // Validate manager assignment if provided
    if (validated.manager_id) {
      await validateManagerAssignment(env.DB, null, validated.manager_id);
    }

    // Create user
    const result = await createUser(env.DB, validated, currentUser.id);

    return successResponse(
      {
        user: result,
        message: `User created successfully${result.generatedPassword ? '. Password: ' + result.generatedPassword : ''}`,
      },
      201
    );
  } catch (error) {
    if (error.name === 'ZodError') {
      return errorResponse('Validation error', 400, { errors: error.errors }, env);
    }
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Create user error:', error);
    return errorResponse('Failed to create user', 500, null, env);
  }
}

/**
 * List users with filtering and pagination
 * GET /api/users
 */
export async function handleListUsers(request, env, ctx, currentUser) {
  try {
    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validated = listUsersQuerySchema.parse(queryParams);

    // List users (scoped by current user's permissions)
    const result = await listUsers(env.DB, currentUser, validated);

    return successResponse(result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return errorResponse('Invalid query parameters', 400, { errors: error.errors }, env);
    }
    console.error('List users error:', error);
    return errorResponse('Failed to list users', 500, null, env);
  }
}

/**
 * Get user details by ID
 * GET /api/users/:id
 */
export async function handleGetUser(request, env, ctx, currentUser, userId) {
  try {
    // Check if current user can access this user
    await canAccessUser(env.DB, currentUser, userId, 'view');

    // Get user details
    const user = await getUserById(env.DB, userId);

    return successResponse({ user });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Get user error:', error);
    return errorResponse('Failed to get user', 500, null, env);
  }
}

/**
 * Update user
 * PATCH /api/users/:id
 */
export async function handleUpdateUser(request, env, ctx, currentUser, userId) {
  try {
    // Check if current user can edit this user
    await canAccessUser(env.DB, currentUser, userId, 'edit');

    // Parse and validate request body
    const body = await request.json();
    const validated = updateUserSchema.parse(body);

    // Get target user for field-level checks
    const targetUser = await getUserById(env.DB, userId);

    // Check field-level permissions
    for (const field in validated) {
      canModifyField(currentUser, targetUser, field);
    }

    // Validate manager assignment if changing
    if (validated.manager_id !== undefined) {
      await validateManagerAssignment(env.DB, userId, validated.manager_id);
    }

    // Update user
    const updated = await updateUser(env.DB, userId, validated, currentUser.id);

    return successResponse({
      user: updated,
      message: 'User updated successfully',
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return errorResponse('Validation error', 400, { errors: error.errors }, env);
    }
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Update user error:', error);
    return errorResponse('Failed to update user', 500, null, env);
  }
}

/**
 * Soft delete user
 * DELETE /api/users/:id
 */
export async function handleDeleteUser(request, env, ctx, currentUser, userId) {
  try {
    // Check if current user can delete this user
    await canAccessUser(env.DB, currentUser, userId, 'delete');

    // Soft delete
    await softDeleteUser(env.DB, userId, currentUser.id);

    return successResponse({
      message: 'User deactivated successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Delete user error:', error);
    return errorResponse('Failed to delete user', 500, null, env);
  }
}

/**
 * Reactivate soft-deleted user
 * POST /api/users/:id/reactivate
 */
export async function handleReactivateUser(request, env, ctx, currentUser, userId) {
  try {
    // Only admins can reactivate users
    requireAdmin(currentUser);

    // Reactivate
    await reactivateUser(env.DB, userId, currentUser.id);

    return successResponse({
      message: 'User reactivated successfully. They will need to reset their password on next login.',
    });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Reactivate user error:', error);
    return errorResponse('Failed to reactivate user', 500, null, env);
  }
}

/**
 * Reset user password (admin function)
 * POST /api/users/:id/reset-password
 */
export async function handleResetPassword(request, env, ctx, currentUser, userId) {
  try {
    // Check if current user can edit this user
    await canAccessUser(env.DB, currentUser, userId, 'edit');

    // Parse and validate request body
    const body = await request.json();
    const validated = passwordResetSchema.parse(body);

    // Reset password
    const generatedPassword = await resetUserPassword(
      env.DB,
      userId,
      {
        passwordOption: validated.password_option,
        password: validated.password,
        requireChange: validated.require_change,
      },
      currentUser.id
    );

    return successResponse({
      message: 'Password reset successfully',
      generatedPassword: generatedPassword || undefined,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return errorResponse('Validation error', 400, { errors: error.errors }, env);
    }
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Reset password error:', error);
    return errorResponse('Failed to reset password', 500, null, env);
  }
}

/**
 * Get deleted users (admin only)
 * GET /api/users/deleted
 */
export async function handleGetDeletedUsers(request, env, ctx, currentUser) {
  try {
    // Only admins can view deleted users
    requireAdmin(currentUser);

    // Get deleted users
    const users = await getDeletedUsers(env.DB);

    return successResponse({ users });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Get deleted users error:', error);
    return errorResponse('Failed to get deleted users', 500, null, env);
  }
}

/**
 * Bulk deactivate users
 * POST /api/users/bulk-deactivate
 */
export async function handleBulkDeactivate(request, env, ctx, currentUser) {
  try {
    // Only admins can bulk deactivate
    requireAdmin(currentUser);

    // Parse and validate request body
    const body = await request.json();
    const validated = bulkDeactivateSchema.parse(body);

    // Bulk deactivate
    await bulkDeactivateUsers(env.DB, validated.user_ids, currentUser.id);

    return successResponse({
      message: `Successfully deactivated ${validated.user_ids.length} user(s)`,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return errorResponse('Validation error', 400, { errors: error.errors }, env);
    }
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Bulk deactivate error:', error);
    return errorResponse('Failed to bulk deactivate users', 500, null, env);
  }
}
