/**
 * Project Permission Middleware
 * Handles project-based access control and organizational scoping
 */

import { ForbiddenError, AppError } from '../utils/errors.js';

/**
 * Get project by ID with error handling
 * @param {object} db - Database connection
 * @param {string} projectId - Project ID
 * @returns {object} Project object
 */
async function getProjectById(db, projectId) {
  if (!projectId) return null;

  // Note: Adjust table/column names based on your actual project schema
  const project = await db
    .prepare('SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL')
    .bind(projectId)
    .first();

  return project;
}

/**
 * Middleware: Require basic projects access
 * Checks if user has 'projects' permission (boolean)
 * @param {Request} req - Request object
 * @param {Response} res - Response object (not used in Cloudflare Workers)
 * @param {Function} next - Next middleware function
 * @throws {ForbiddenError} If user lacks projects access
 */
export function requireProjectsAccess(req, res, next) {
  const user = req.user;

  if (!user) {
    throw new AppError('Authentication required', 401);
  }

  // Admin (level 100+) has access to everything
  const roleLevel = user.role_level || 0;
  if (roleLevel >= 100) {
    return next();
  }

  // Check 'all' permission
  if (user.role_permissions?.all === true) {
    return next();
  }

  // Check specific 'projects' permission
  if (user.role_permissions?.projects !== true) {
    throw new ForbiddenError('Projects access required');
  }

  return next();
}

/**
 * Middleware: Require project management permission
 * Checks if user has any level of project_management scope
 * @param {Request} req - Request object
 * @param {Response} res - Response object (not used in Cloudflare Workers)
 * @param {Function} next - Next middleware function
 * @throws {ForbiddenError} If user lacks project management access
 */
export function requireProjectManagement(req, res, next) {
  const user = req.user;

  if (!user) {
    throw new AppError('Authentication required', 401);
  }

  // Admin (level 100+) has full access
  const roleLevel = user.role_level || 0;
  if (roleLevel >= 100) {
    return next();
  }

  // Check for project_management permission
  const projectMgmtPerm = user.role_permissions?.project_management;

  // Must have some level of project management
  if (!projectMgmtPerm || projectMgmtPerm === 'view_only') {
    throw new ForbiddenError('Project management permission required');
  }

  return next();
}

/**
 * Check if user can access a specific project
 * @param {object} user - Current authenticated user with role data
 * @param {object} project - Project object to check access for
 * @returns {boolean} True if user can access the project
 * @throws {ForbiddenError} If access is denied
 */
export function canAccessProject(user, project) {
  if (!user) {
    throw new AppError('Authentication required', 401);
  }

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Admin (level 100+) can access all projects
  const roleLevel = user.role_level || 0;
  if (roleLevel >= 100) {
    return true;
  }

  // Check if user has projects permission first
  if (user.role_permissions?.all !== true && user.role_permissions?.projects !== true) {
    throw new ForbiddenError('Projects access required');
  }

  // Get project management permission level
  const projectMgmtPerm = user.role_permissions?.project_management;

  // Full access - can see all projects
  if (projectMgmtPerm === 'full') {
    return true;
  }

  // Branch-level access - can only see projects in user's branch
  if (projectMgmtPerm === 'branch') {
    if (!user.branch_id) {
      throw new ForbiddenError('User not assigned to a branch');
    }
    if (project.branch_id !== user.branch_id) {
      throw new ForbiddenError('Can only access projects in your branch');
    }
    return true;
  }

  // Department-level access - can only see projects in user's department
  if (projectMgmtPerm === 'department') {
    if (!user.department_id) {
      throw new ForbiddenError('User not assigned to a department');
    }
    if (project.department_id !== user.department_id) {
      throw new ForbiddenError('Can only access projects in your department');
    }
    return true;
  }

  // Own projects only - can only see projects created by or assigned to user
  if (projectMgmtPerm === 'own') {
    const isOwner = project.created_by === user.id;
    const isAssigned = project.assigned_to === user.id || project.manager_id === user.id;

    if (!isOwner && !isAssigned) {
      throw new ForbiddenError('Can only access your own projects');
    }
    return true;
  }

  // View only - similar to 'own' but read-only (checked in canModifyProject)
  if (projectMgmtPerm === 'view_only') {
    // For view_only, we allow access based on branch if assigned
    if (user.branch_id && project.branch_id === user.branch_id) {
      return true;
    }

    // Otherwise only own projects
    const isOwner = project.created_by === user.id;
    const isAssigned = project.assigned_to === user.id || project.manager_id === user.id;

    if (!isOwner && !isAssigned) {
      throw new ForbiddenError('Can only view projects in your branch or assigned to you');
    }
    return true;
  }

  // No project_management permission - deny access
  throw new ForbiddenError('Insufficient permissions to access projects');
}

/**
 * Check if user can modify a specific project
 * @param {object} user - Current authenticated user with role data
 * @param {object} project - Project object to check modification rights for
 * @returns {boolean} True if user can modify the project
 * @throws {ForbiddenError} If modification is denied
 */
export function canModifyProject(user, project) {
  if (!user) {
    throw new AppError('Authentication required', 401);
  }

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Admin (level 100+) can modify all projects
  const roleLevel = user.role_level || 0;
  if (roleLevel >= 100) {
    return true;
  }

  // Get project management permission level
  const projectMgmtPerm = user.role_permissions?.project_management;

  // View only - cannot modify anything
  if (projectMgmtPerm === 'view_only' || !projectMgmtPerm) {
    throw new ForbiddenError('You do not have permission to modify projects');
  }

  // Full access - can modify all projects
  if (projectMgmtPerm === 'full') {
    return true;
  }

  // Branch-level access - can modify projects in user's branch
  if (projectMgmtPerm === 'branch') {
    if (!user.branch_id) {
      throw new ForbiddenError('User not assigned to a branch');
    }
    if (project.branch_id !== user.branch_id) {
      throw new ForbiddenError('Can only modify projects in your branch');
    }
    return true;
  }

  // Department-level access - can modify projects in user's department
  if (projectMgmtPerm === 'department') {
    if (!user.department_id) {
      throw new ForbiddenError('User not assigned to a department');
    }
    if (project.department_id !== user.department_id) {
      throw new ForbiddenError('Can only modify projects in your department');
    }
    return true;
  }

  // Own projects only - can only modify own projects
  if (projectMgmtPerm === 'own') {
    const isOwner = project.created_by === user.id;
    const isManager = project.manager_id === user.id;

    if (!isOwner && !isManager) {
      throw new ForbiddenError('Can only modify your own projects');
    }
    return true;
  }

  // No valid permission
  throw new ForbiddenError('Insufficient permissions to modify projects');
}

/**
 * Apply project scope filtering to a query
 * Modifies the base query to filter projects based on user's permission scope
 * @param {object} user - Current authenticated user with role data
 * @param {string} baseQuery - Base SQL query
 * @param {Array} bindings - Query bindings
 * @returns {object} Modified query and bindings with scope applied
 */
export function applyProjectScope(user, baseQuery, bindings = []) {
  const roleLevel = user.role_level || 0;
  const projectMgmtPerm = user.role_permissions?.project_management;

  // Admin or full access - see all projects
  if (roleLevel >= 100 || projectMgmtPerm === 'full') {
    return { query: baseQuery, bindings };
  }

  let scopeCondition = '';
  const scopeBindings = [];

  // Branch-level scope
  if (projectMgmtPerm === 'branch' && user.branch_id) {
    scopeCondition = ' AND p.branch_id = ?';
    scopeBindings.push(user.branch_id);
  }
  // Department-level scope
  else if (projectMgmtPerm === 'department' && user.department_id) {
    scopeCondition = ' AND p.department_id = ?';
    scopeBindings.push(user.department_id);
  }
  // Own projects scope
  else if (projectMgmtPerm === 'own') {
    scopeCondition = ' AND (p.created_by = ? OR p.assigned_to = ? OR p.manager_id = ?)';
    scopeBindings.push(user.id, user.id, user.id);
  }
  // View only - branch or own projects
  else if (projectMgmtPerm === 'view_only') {
    if (user.branch_id) {
      scopeCondition = ' AND (p.branch_id = ? OR p.created_by = ? OR p.assigned_to = ? OR p.manager_id = ?)';
      scopeBindings.push(user.branch_id, user.id, user.id, user.id);
    } else {
      scopeCondition = ' AND (p.created_by = ? OR p.assigned_to = ? OR p.manager_id = ?)';
      scopeBindings.push(user.id, user.id, user.id);
    }
  }
  // No permission - return empty
  else {
    scopeCondition = ' AND 1 = 0'; // Never matches
  }

  return {
    query: baseQuery + scopeCondition,
    bindings: [...bindings, ...scopeBindings],
  };
}

/**
 * Check if user can assign project to specific branch/department
 * @param {object} user - Current user
 * @param {string} branchId - Target branch ID
 * @param {string} departmentId - Target department ID
 * @returns {boolean} True if assignment is allowed
 * @throws {ForbiddenError} If assignment is denied
 */
export function canAssignProjectToOrg(user, branchId, departmentId) {
  const roleLevel = user.role_level || 0;
  const projectMgmtPerm = user.role_permissions?.project_management;

  // Admin or full access - can assign anywhere
  if (roleLevel >= 100 || projectMgmtPerm === 'full') {
    return true;
  }

  // Branch-level - can only assign to own branch
  if (projectMgmtPerm === 'branch') {
    if (branchId && branchId !== user.branch_id) {
      throw new ForbiddenError('Can only assign projects to your branch');
    }
    return true;
  }

  // Department-level - can only assign to own department
  if (projectMgmtPerm === 'department') {
    if (departmentId && departmentId !== user.department_id) {
      throw new ForbiddenError('Can only assign projects to your department');
    }
    if (branchId && branchId !== user.branch_id) {
      throw new ForbiddenError('Can only assign projects to your branch');
    }
    return true;
  }

  // Own or view_only - cannot assign to org units
  if (projectMgmtPerm === 'own' || projectMgmtPerm === 'view_only') {
    throw new ForbiddenError('You do not have permission to assign projects to organizational units');
  }

  throw new ForbiddenError('Insufficient permissions to assign projects');
}

/**
 * Get project with access check
 * Helper function to fetch a project and verify user has access
 * @param {object} db - Database connection
 * @param {object} user - Current user
 * @param {string} projectId - Project ID
 * @returns {object} Project object
 * @throws {AppError|ForbiddenError} If project not found or access denied
 */
export async function getProjectWithAccess(db, user, projectId) {
  const project = await getProjectById(db, projectId);

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Verify user can access this project
  canAccessProject(user, project);

  return project;
}

/**
 * Get project with modification check
 * Helper function to fetch a project and verify user can modify it
 * @param {object} db - Database connection
 * @param {object} user - Current user
 * @param {string} projectId - Project ID
 * @returns {object} Project object
 * @throws {AppError|ForbiddenError} If project not found or modification denied
 */
export async function getProjectWithModifyAccess(db, user, projectId) {
  const project = await getProjectById(db, projectId);

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Verify user can modify this project
  canModifyProject(user, project);

  return project;
}

/**
 * Validate project data based on user permissions
 * @param {object} user - Current user
 * @param {object} projectData - Project data being created/updated
 * @param {object} existingProject - Existing project (for updates)
 * @throws {ForbiddenError} If data validation fails based on permissions
 */
export function validateProjectData(user, projectData, existingProject = null) {
  const roleLevel = user.role_level || 0;
  const projectMgmtPerm = user.role_permissions?.project_management;

  // Admin can do anything
  if (roleLevel >= 100 || projectMgmtPerm === 'full') {
    return true;
  }

  // Check branch assignment
  if (projectData.branch_id) {
    canAssignProjectToOrg(user, projectData.branch_id, projectData.department_id);
  }

  // For updates, verify user can modify the existing project
  if (existingProject) {
    canModifyProject(user, existingProject);
  }

  // View only cannot create or update
  if (projectMgmtPerm === 'view_only') {
    throw new ForbiddenError('View-only permission does not allow creating or modifying projects');
  }

  return true;
}
