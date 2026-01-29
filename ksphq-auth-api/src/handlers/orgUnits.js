/**
 * Organizational Unit API Handlers
 */

import { successResponse, errorResponse } from '../utils/response.js';
import { AppError } from '../utils/errors.js';
import { createOrgUnitSchema, updateOrgUnitSchema } from '../utils/userValidation.js';
import {
  listOrgUnits,
  getOrgUnitById,
  createOrgUnit,
  updateOrgUnit,
  deleteOrgUnit,
  getOrgUnitsTree,
} from '../db/orgUnitQueries.js';
import { requireAdmin } from '../middleware/permissions.js';

/**
 * List org units
 * GET /api/org-units
 */
export async function handleListOrgUnits(request, env, ctx, currentUser) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const parentId = url.searchParams.get('parent_id');
    const includeInactive = url.searchParams.get('include_inactive') === 'true';
    const tree = url.searchParams.get('tree') === 'true';

    if (tree) {
      const treeData = await getOrgUnitsTree(env.DB, type);
      return successResponse({ tree: treeData });
    }

    const units = await listOrgUnits(env.DB, { type, parentId, includeInactive });
    return successResponse({ units });
  } catch (error) {
    console.error('List org units error:', error);
    return errorResponse('Failed to list organizational units', 500, null, env);
  }
}

/**
 * Get org unit by ID
 * GET /api/org-units/:id
 */
export async function handleGetOrgUnit(request, env, ctx, currentUser, unitId) {
  try {
    const unit = await getOrgUnitById(env.DB, unitId);
    return successResponse({ unit });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Get org unit error:', error);
    return errorResponse('Failed to get organizational unit', 500, null, env);
  }
}

/**
 * Create org unit (admin only)
 * POST /api/org-units
 */
export async function handleCreateOrgUnit(request, env, ctx, currentUser) {
  try {
    requireAdmin(currentUser);

    const body = await request.json();
    const validated = createOrgUnitSchema.parse(body);

    const unit = await createOrgUnit(env.DB, validated, currentUser.id);

    return successResponse({ unit, message: 'Organizational unit created successfully' }, 201);
  } catch (error) {
    if (error.name === 'ZodError') {
      return errorResponse('Validation error', 400, { errors: error.errors }, env);
    }
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Create org unit error:', error);
    return errorResponse('Failed to create organizational unit', 500, null, env);
  }
}

/**
 * Update org unit (admin only)
 * PATCH /api/org-units/:id
 */
export async function handleUpdateOrgUnit(request, env, ctx, currentUser, unitId) {
  try {
    requireAdmin(currentUser);

    const body = await request.json();
    const validated = updateOrgUnitSchema.parse(body);

    const unit = await updateOrgUnit(env.DB, unitId, validated, currentUser.id);

    return successResponse({ unit, message: 'Organizational unit updated successfully' });
  } catch (error) {
    if (error.name === 'ZodError') {
      return errorResponse('Validation error', 400, { errors: error.errors }, env);
    }
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Update org unit error:', error);
    return errorResponse('Failed to update organizational unit', 500, null, env);
  }
}

/**
 * Delete org unit (admin only)
 * DELETE /api/org-units/:id
 */
export async function handleDeleteOrgUnit(request, env, ctx, currentUser, unitId) {
  try {
    requireAdmin(currentUser);

    await deleteOrgUnit(env.DB, unitId);

    return successResponse({ message: 'Organizational unit deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Delete org unit error:', error);
    return errorResponse('Failed to delete organizational unit', 500, null, env);
  }
}
