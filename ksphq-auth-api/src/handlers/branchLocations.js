/**
 * Branch Location API Handlers
 * Handles CRUD operations for branch locations (multi-location support)
 */

import { successResponse, errorResponse } from '../utils/response.js';
import { AppError } from '../utils/errors.js';
import { createLocationSchema, updateLocationSchema } from '../utils/userValidation.js';
import {
  listBranchLocations,
  getLocationById,
  createBranchLocation,
  updateBranchLocation,
  deleteBranchLocation,
  setPrimaryLocation,
} from '../db/branchLocationQueries.js';

/**
 * Check if user can manage branch locations
 * Admins and branch managers for the specific branch can manage locations
 */
function canManageBranchLocations(currentUser, branchId) {
  // Admins (role_level >= 100) can manage all branches
  if (currentUser.role_level >= 100) {
    return true;
  }

  // Branch admins/managers (role_level >= 80) can manage their own branches
  if (currentUser.role_level >= 80) {
    // Check if user is assigned to this branch
    if (currentUser.branch_id === branchId) {
      return true;
    }
  }

  return false;
}

/**
 * List all locations for a branch
 * GET /api/branches/:branchId/locations
 */
export async function handleListBranchLocations(request, env, ctx, currentUser, branchId) {
  try {
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('include_inactive') === 'true';

    const locations = await listBranchLocations(env.DB, branchId, includeInactive);
    return successResponse({ locations });
  } catch (error) {
    console.error('List branch locations error:', error);
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    return errorResponse('Failed to list branch locations', 500, null, env);
  }
}

/**
 * Get a single location by ID
 * GET /api/locations/:locationId
 */
export async function handleGetLocation(request, env, ctx, currentUser, locationId) {
  try {
    const location = await getLocationById(env.DB, locationId);
    return successResponse({ location });
  } catch (error) {
    console.error('Get location error:', error);
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    return errorResponse('Failed to get location', 500, null, env);
  }
}

/**
 * Create a new location for a branch
 * POST /api/branches/:branchId/locations
 */
export async function handleCreateBranchLocation(request, env, ctx, currentUser, branchId) {
  try {
    // Check permissions
    if (!canManageBranchLocations(currentUser, branchId)) {
      return errorResponse('Insufficient permissions to manage locations for this branch', 403, null, env);
    }

    const body = await request.json();
    const validated = createLocationSchema.parse({
      ...body,
      branch_id: branchId, // Ensure branch_id matches route parameter
    });

    const location = await createBranchLocation(env.DB, validated, currentUser.id);

    return successResponse(
      { location, message: 'Branch location created successfully' },
      201
    );
  } catch (error) {
    console.error('Create branch location error:', error);
    if (error.name === 'ZodError') {
      return errorResponse('Validation error', 400, { errors: error.errors }, env);
    }
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    return errorResponse('Failed to create branch location', 500, null, env);
  }
}

/**
 * Update a location
 * PATCH /api/locations/:locationId
 */
export async function handleUpdateLocation(request, env, ctx, currentUser, locationId) {
  try {
    // Get location to check branch
    const location = await getLocationById(env.DB, locationId);

    // Check permissions
    if (!canManageBranchLocations(currentUser, location.branch_id)) {
      return errorResponse('Insufficient permissions to manage locations for this branch', 403, null, env);
    }

    const body = await request.json();
    const validated = updateLocationSchema.parse(body);

    const updatedLocation = await updateBranchLocation(
      env.DB,
      locationId,
      validated,
      currentUser.id
    );

    return successResponse({
      location: updatedLocation,
      message: 'Branch location updated successfully',
    });
  } catch (error) {
    console.error('Update location error:', error);
    if (error.name === 'ZodError') {
      return errorResponse('Validation error', 400, { errors: error.errors }, env);
    }
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    return errorResponse('Failed to update branch location', 500, null, env);
  }
}

/**
 * Delete a location
 * DELETE /api/locations/:locationId
 */
export async function handleDeleteLocation(request, env, ctx, currentUser, locationId) {
  try {
    // Get location to check branch
    const location = await getLocationById(env.DB, locationId);

    // Check permissions
    if (!canManageBranchLocations(currentUser, location.branch_id)) {
      return errorResponse('Insufficient permissions to manage locations for this branch', 403, null, env);
    }

    await deleteBranchLocation(env.DB, locationId);

    return successResponse({ message: 'Branch location deleted successfully' });
  } catch (error) {
    console.error('Delete location error:', error);
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    return errorResponse('Failed to delete branch location', 500, null, env);
  }
}

/**
 * Set a location as primary for its branch
 * POST /api/locations/:locationId/set-primary
 */
export async function handleSetPrimaryLocation(request, env, ctx, currentUser, locationId) {
  try {
    // Get location to check branch
    const location = await getLocationById(env.DB, locationId);

    // Check permissions
    if (!canManageBranchLocations(currentUser, location.branch_id)) {
      return errorResponse('Insufficient permissions to manage locations for this branch', 403, null, env);
    }

    const updatedLocation = await setPrimaryLocation(env.DB, location.branch_id, locationId);

    return successResponse({
      location: updatedLocation,
      message: 'Primary location updated successfully',
    });
  } catch (error) {
    console.error('Set primary location error:', error);
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    return errorResponse('Failed to set primary location', 500, null, env);
  }
}
