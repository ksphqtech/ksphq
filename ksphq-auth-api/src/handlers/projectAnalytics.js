/**
 * Project Control - API Handlers for Project Analytics
 * Request handlers for analytics and reporting endpoints
 */

import { successResponse, errorResponse } from '../utils/response.js';
import { AppError, ForbiddenError } from '../utils/errors.js';
import { getProjectAnalytics } from '../db/projectAnalytics.js';
import { getProjectById } from '../db/projectQueries.js';

/**
 * Check if user has project management permissions
 * @param {object} currentUser - Current authenticated user
 * @param {string} action - Action to perform (view)
 * @throws {ForbiddenError} If insufficient permissions
 */
function requireProjectPermission(currentUser, action = 'view') {
  const projectsPerm = currentUser.role_permissions?.projects;

  if (!projectsPerm) {
    throw new ForbiddenError('No project management permissions');
  }

  // Analytics requires at least view permissions
  if (action === 'view') {
    // All project permission levels can view
    return;
  }
}

/**
 * Check if user can access a specific project
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
 * Get project analytics
 * GET /api/projects/:projectId/analytics
 */
export async function handleGetProjectAnalytics(request, env, ctx, currentUser, projectId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'view');

    // Get project to verify access
    const project = await getProjectById(env.DB, projectId);
    canAccessProject(currentUser, project);

    // Get comprehensive analytics data
    const analytics = await getProjectAnalytics(env.DB, projectId);

    return successResponse({ analytics });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Get project analytics error:', error);
    return errorResponse('Failed to get project analytics', 500, null, env);
  }
}
