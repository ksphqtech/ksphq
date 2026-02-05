/**
 * Project Control - API Handlers for Materials
 * Request handlers for material management
 */

import { successResponse, errorResponse } from '../utils/response.js';
import { AppError, ForbiddenError } from '../utils/errors.js';
import {
  listMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from '../db/materialQueries.js';
import { getProjectById } from '../db/projectQueries.js';

/**
 * Check if user has project management permissions
 * @param {object} currentUser - Current authenticated user
 * @param {string} action - Action to perform
 * @throws {ForbiddenError} If insufficient permissions
 */
function requireProjectPermission(currentUser, action = 'view') {
  const projectsPerm = currentUser.role_permissions?.projects;

  if (!projectsPerm) {
    throw new ForbiddenError('No project management permissions');
  }

  // View permissions
  if (action === 'view') {
    // All project permission levels can view
    return;
  }

  // Create, edit, delete permissions
  if (['create', 'edit', 'delete'].includes(action)) {
    if (projectsPerm === 'view_own') {
      throw new ForbiddenError('Read-only access to projects');
    }
  }
}

/**
 * Check if user can access a specific project
 * @param {object} currentUser - Current authenticated user
 * @param {object} project - Project object
 * @throws {ForbiddenError} If access denied
 */
function canAccessProject(currentUser, project) {
  const roleLevel = currentUser.role_level || 0;
  const projectsPerm = currentUser.role_permissions?.projects;

  // Admin sees all projects
  if (roleLevel >= 100 || projectsPerm === 'full') {
    return true;
  }

  // Check organizational scope
  if (projectsPerm === 'branch' && currentUser.branch_id) {
    if (currentUser.branch_id !== project.branch_id) {
      throw new ForbiddenError('Can only access projects in your branch');
    }
    return true;
  }

  if (projectsPerm === 'department' && currentUser.department_id) {
    if (currentUser.department_id !== project.department_id) {
      throw new ForbiddenError('Can only access projects in your department');
    }
    return true;
  }

  if (projectsPerm === 'team' && currentUser.team_id) {
    if (currentUser.team_id !== project.team_id) {
      throw new ForbiddenError('Can only access projects in your team');
    }
    return true;
  }

  if (projectsPerm === 'view_own') {
    const isMember = project.members?.some(m => m.user_id === currentUser.id);
    if (project.owner_id !== currentUser.id && project.created_by !== currentUser.id && !isMember) {
      throw new ForbiddenError('Can only access your own projects');
    }
    return true;
  }

  throw new ForbiddenError('Insufficient permissions to access this project');
}

/**
 * List materials for a project
 * GET /api/projects/:projectId/materials
 */
export async function handleListMaterials(request, env, ctx, currentUser, projectId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'view');

    // Verify project access
    const project = await getProjectById(env.DB, projectId);
    canAccessProject(currentUser, project);

    // Parse query parameters
    const url = new URL(request.url);
    const filters = {
      status: url.searchParams.get('status'),
      category: url.searchParams.get('category'),
      sort: url.searchParams.get('sort') || 'created_at:desc',
    };

    // List materials
    const materials = await listMaterials(env.DB, projectId, filters);

    return successResponse({ materials });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('List materials error:', error);
    return errorResponse('Failed to list materials', 500, null, env);
  }
}

/**
 * Get material details by ID
 * GET /api/materials/:id
 */
export async function handleGetMaterial(request, env, ctx, currentUser, materialId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'view');

    // Get material details
    const material = await getMaterialById(env.DB, materialId);

    // Verify project access
    const project = await getProjectById(env.DB, material.project_id);
    canAccessProject(currentUser, project);

    return successResponse({ material });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Get material error:', error);
    return errorResponse('Failed to get material', 500, null, env);
  }
}

/**
 * Create a new material
 * POST /api/projects/:projectId/materials
 */
export async function handleCreateMaterial(request, env, ctx, currentUser, projectId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'create');

    // Verify project access
    const project = await getProjectById(env.DB, projectId);
    canAccessProject(currentUser, project);

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return errorResponse('Missing required field: name', 400, null, env);
    }

    if (body.quantity_needed === undefined || body.quantity_needed === null) {
      return errorResponse('Missing required field: quantity_needed', 400, null, env);
    }

    if (!body.unit) {
      return errorResponse('Missing required field: unit', 400, null, env);
    }

    // Create material
    const result = await createMaterial(env.DB, projectId, body);

    return successResponse(
      {
        material: result,
        message: 'Material created successfully',
      },
      201
    );
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Create material error:', error);
    return errorResponse('Failed to create material', 500, null, env);
  }
}

/**
 * Update material
 * PATCH /api/materials/:id
 */
export async function handleUpdateMaterial(request, env, ctx, currentUser, materialId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'edit');

    // Get material to verify access
    const material = await getMaterialById(env.DB, materialId);

    // Verify project access
    const project = await getProjectById(env.DB, material.project_id);
    canAccessProject(currentUser, project);

    // Parse request body
    const body = await request.json();

    // Update material
    const updated = await updateMaterial(env.DB, materialId, body);

    return successResponse({
      material: updated,
      message: 'Material updated successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Update material error:', error);
    return errorResponse('Failed to update material', 500, null, env);
  }
}

/**
 * Delete material
 * DELETE /api/materials/:id
 */
export async function handleDeleteMaterial(request, env, ctx, currentUser, materialId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'delete');

    // Get material to verify access
    const material = await getMaterialById(env.DB, materialId);

    // Verify project access
    const project = await getProjectById(env.DB, material.project_id);
    canAccessProject(currentUser, project);

    // Delete material
    await deleteMaterial(env.DB, materialId);

    return successResponse({
      message: 'Material deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Delete material error:', error);
    return errorResponse('Failed to delete material', 500, null, env);
  }
}
