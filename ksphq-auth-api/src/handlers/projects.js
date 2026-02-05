/**
 * Project Control - API Handlers for Projects
 * Request handlers with proper authorization and validation
 */

import { successResponse, errorResponse } from '../utils/response.js';
import { AppError, ForbiddenError } from '../utils/errors.js';
import {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} from '../db/projectQueries.js';
import { hasToolPermission } from '../middleware/permissions.js';

/**
 * Check if user has project management permissions
 * @param {object} currentUser - Current authenticated user
 * @param {string} action - Action to perform (view, create, edit, delete)
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
    // All other levels (team, department, branch, full) can create/edit/delete
  }
}

/**
 * Check if user can access a specific project
 * @param {object} db - Database connection
 * @param {object} currentUser - Current authenticated user
 * @param {object} project - Project object
 * @returns {boolean} True if access allowed
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
    // Check if user is owner, creator, or member
    const isMember = project.members?.some(m => m.user_id === currentUser.id);
    if (project.owner_id !== currentUser.id && project.created_by !== currentUser.id && !isMember) {
      throw new ForbiddenError('Can only access your own projects');
    }
    return true;
  }

  throw new ForbiddenError('Insufficient permissions to access this project');
}

/**
 * List projects with filtering and pagination
 * GET /api/projects
 */
export async function handleListProjects(request, env, ctx, currentUser) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'view');

    // Parse query parameters
    const url = new URL(request.url);
    const filters = {
      branch_id: url.searchParams.get('branch_id'),
      department_id: url.searchParams.get('department_id'),
      team_id: url.searchParams.get('team_id'),
      status: url.searchParams.get('status'),
      priority: url.searchParams.get('priority'),
      owner_id: url.searchParams.get('owner_id'),
      search: url.searchParams.get('search'),
      include_deleted: url.searchParams.get('include_deleted') === 'true',
      sort: url.searchParams.get('sort') || 'created_at:desc',
      page: parseInt(url.searchParams.get('page')) || 1,
      limit: parseInt(url.searchParams.get('limit')) || 50,
    };

    // List projects with user's permission scope
    const result = await listProjects(env.DB, filters, currentUser.id, currentUser);

    return successResponse(result);
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('List projects error:', error);
    return errorResponse('Failed to list projects', 500, null, env);
  }
}

/**
 * Get project details by ID
 * GET /api/projects/:id
 */
export async function handleGetProject(request, env, ctx, currentUser, projectId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'view');

    // Get project details
    const project = await getProjectById(env.DB, projectId);

    // Check if user can access this specific project
    canAccessProject(currentUser, project);

    return successResponse({ project });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Get project error:', error);
    return errorResponse('Failed to get project', 500, null, env);
  }
}

/**
 * Create a new project
 * POST /api/projects
 */
export async function handleCreateProject(request, env, ctx, currentUser) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'create');

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.project_code || !body.name || !body.start_date || !body.owner_id) {
      return errorResponse('Missing required fields: project_code, name, start_date, owner_id', 400, null, env);
    }

    // Apply organizational defaults if not provided
    const data = {
      ...body,
      branch_id: body.branch_id || currentUser.branch_id,
      department_id: body.department_id || currentUser.department_id,
      team_id: body.team_id || currentUser.team_id,
    };

    // Create project
    const result = await createProject(env.DB, data, currentUser.id);

    return successResponse(
      {
        project: result,
        message: 'Project created successfully',
      },
      201
    );
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Create project error:', error);
    return errorResponse('Failed to create project', 500, null, env);
  }
}

/**
 * Update project
 * PATCH /api/projects/:id
 */
export async function handleUpdateProject(request, env, ctx, currentUser, projectId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'edit');

    // Get project to verify access
    const project = await getProjectById(env.DB, projectId);
    canAccessProject(currentUser, project);

    // Parse request body
    const body = await request.json();

    // Update project
    const updated = await updateProject(env.DB, projectId, body, currentUser.id);

    return successResponse({
      project: updated,
      message: 'Project updated successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Update project error:', error);
    return errorResponse('Failed to update project', 500, null, env);
  }
}

/**
 * Delete project (soft delete)
 * DELETE /api/projects/:id
 */
export async function handleDeleteProject(request, env, ctx, currentUser, projectId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'delete');

    // Get project to verify access
    const project = await getProjectById(env.DB, projectId);
    canAccessProject(currentUser, project);

    // Delete project
    await deleteProject(env.DB, projectId, currentUser.id);

    return successResponse({
      message: 'Project deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Delete project error:', error);
    return errorResponse('Failed to delete project', 500, null, env);
  }
}

/**
 * Add project member
 * POST /api/projects/:id/members
 */
export async function handleAddProjectMember(request, env, ctx, currentUser, projectId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'edit');

    // Get project to verify access
    const project = await getProjectById(env.DB, projectId);
    canAccessProject(currentUser, project);

    // Parse request body
    const body = await request.json();

    if (!body.user_id) {
      return errorResponse('Missing required field: user_id', 400, null, env);
    }

    // Add member
    const member = await addProjectMember(
      env.DB,
      projectId,
      body.user_id,
      body.role || 'member'
    );

    return successResponse(
      {
        member,
        message: 'Project member added successfully',
      },
      201
    );
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Add project member error:', error);
    return errorResponse('Failed to add project member', 500, null, env);
  }
}

/**
 * List project members
 * GET /api/projects/:id/members
 */
export async function handleListProjectMembers(request, env, ctx, currentUser, projectId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'view');

    // Get project to verify access
    const project = await getProjectById(env.DB, projectId);
    canAccessProject(currentUser, project);

    // Get project members
    const membersQuery = `
      SELECT
        pm.id,
        pm.user_id,
        pm.role,
        pm.added_at,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        u.branch_id,
        u.department_id,
        u.team_id
      FROM project_members pm
      LEFT JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
      ORDER BY pm.added_at ASC
    `;
    const membersResult = await env.DB.prepare(membersQuery).bind(projectId).all();
    const members = membersResult.results || [];

    return successResponse({ members });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('List project members error:', error);
    return errorResponse('Failed to list project members', 500, null, env);
  }
}

/**
 * Remove project member
 * DELETE /api/projects/:id/members/:userId
 */
export async function handleRemoveProjectMember(request, env, ctx, currentUser, projectId, memberId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'edit');

    // Get project to verify access
    const project = await getProjectById(env.DB, projectId);
    canAccessProject(currentUser, project);

    // Remove member
    await removeProjectMember(env.DB, projectId, memberId);

    return successResponse({
      message: 'Project member removed successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Remove project member error:', error);
    return errorResponse('Failed to remove project member', 500, null, env);
  }
}
