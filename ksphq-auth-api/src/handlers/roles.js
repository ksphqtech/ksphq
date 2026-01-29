/**
 * Role Management API Handlers
 */

import { successResponse, errorResponse } from '../utils/response.js';
import { AppError } from '../utils/errors.js';
import { createRoleSchema, updateRoleSchema } from '../utils/userValidation.js';
import { listRoles, getRoleById, createRole, updateRole, deleteRole } from '../db/roleQueries.js';
import { requireAdmin } from '../middleware/permissions.js';

/**
 * List all roles
 * GET /api/roles
 */
export async function handleListRoles(request, env, ctx, currentUser) {
  try {
    const roles = await listRoles(env.DB);
    return successResponse({ roles });
  } catch (error) {
    console.error('List roles error:', error);
    return errorResponse('Failed to list roles', 500, null, env);
  }
}

/**
 * Get role by ID
 * GET /api/roles/:id
 */
export async function handleGetRole(request, env, ctx, currentUser, roleId) {
  try {
    const role = await getRoleById(env.DB, roleId);
    return successResponse({ role });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Get role error:', error);
    return errorResponse('Failed to get role', 500, null, env);
  }
}

/**
 * Create new role (admin only)
 * POST /api/roles
 */
export async function handleCreateRole(request, env, ctx, currentUser) {
  try {
    requireAdmin(currentUser);

    const body = await request.json();
    const validated = createRoleSchema.parse(body);

    const role = await createRole(env.DB, validated, currentUser.id);

    return successResponse({ role, message: 'Role created successfully' }, 201);
  } catch (error) {
    if (error.name === 'ZodError') {
      return errorResponse('Validation error', 400, { errors: error.errors }, env);
    }
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Create role error:', error);
    return errorResponse('Failed to create role', 500, null, env);
  }
}

/**
 * Update role (admin only)
 * PATCH /api/roles/:id
 */
export async function handleUpdateRole(request, env, ctx, currentUser, roleId) {
  try {
    requireAdmin(currentUser);

    const body = await request.json();
    const validated = updateRoleSchema.parse(body);

    const role = await updateRole(env.DB, roleId, validated, currentUser.id);

    return successResponse({ role, message: 'Role updated successfully' });
  } catch (error) {
    if (error.name === 'ZodError') {
      return errorResponse('Validation error', 400, { errors: error.errors }, env);
    }
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Update role error:', error);
    return errorResponse('Failed to update role', 500, null, env);
  }
}

/**
 * Delete role (admin only)
 * DELETE /api/roles/:id
 */
export async function handleDeleteRole(request, env, ctx, currentUser, roleId) {
  try {
    requireAdmin(currentUser);

    await deleteRole(env.DB, roleId);

    return successResponse({ message: 'Role deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Delete role error:', error);
    return errorResponse('Failed to delete role', 500, null, env);
  }
}
