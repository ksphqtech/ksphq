/**
 * Permission and Authorization Middleware
 * Handles role-based access control and organizational scoping
 */

import { ForbiddenError, AppError } from '../utils/errors.js';

/**
 * Get role by ID with error handling
 * @param {object} db - Database connection
 * @param {string} roleId - Role ID
 * @returns {object} Role object
 */
async function getRoleById(db, roleId) {
  if (!roleId) return null;

  const role = await db
    .prepare('SELECT * FROM roles WHERE id = ? AND is_active = 1')
    .bind(roleId)
    .first();

  return role;
}

/**
 * Get user by ID with joined role data
 * @param {object} db - Database connection
 * @param {string} userId - User ID
 * @returns {object} User object with role data
 */
async function getUserById(db, userId) {
  const user = await db
    .prepare(
      `SELECT u.*, r.level as role_level, r.permissions as role_permissions
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`
    )
    .bind(userId)
    .first();

  if (user && user.role_permissions) {
    try {
      user.role_permissions = JSON.parse(user.role_permissions);
    } catch (e) {
      user.role_permissions = {};
    }
  }

  return user;
}

/**
 * Check if user can access another user's data
 * @param {object} db - Database connection
 * @param {object} currentUser - Current authenticated user
 * @param {string} targetUserId - Target user ID to access
 * @param {string} action - Action to perform ('view', 'edit', 'delete')
 * @returns {boolean} True if access is allowed
 * @throws {ForbiddenError} If access is denied
 */
export async function canAccessUser(db, currentUser, targetUserId, action = 'view') {
  // Get target user with role data
  const targetUser = await getUserById(db, targetUserId);
  if (!targetUser) {
    throw new AppError('User not found', 404);
  }

  // Get current user's role if not already attached
  let currentRole = currentUser.role_level !== undefined
    ? { level: currentUser.role_level, permissions: currentUser.role_permissions }
    : await getRoleById(db, currentUser.role_id);

  if (!currentRole) {
    throw new ForbiddenError('User has no role assigned');
  }

  // Parse permissions if needed
  if (typeof currentRole.permissions === 'string') {
    try {
      currentRole.permissions = JSON.parse(currentRole.permissions);
    } catch (e) {
      currentRole.permissions = {};
    }
  }

  // Admin (level 100+) can access anyone
  if (currentRole.level >= 100) {
    return true;
  }

  // Users can always access themselves
  if (currentUser.id === targetUserId) {
    return true;
  }

  // Get user management permission level
  const userMgmtPerm = currentRole.permissions?.user_management;

  // Full user management access
  if (userMgmtPerm === 'full') {
    return true;
  }

  // Branch-level access
  if (userMgmtPerm === 'branch') {
    if (!currentUser.branch_id) {
      throw new ForbiddenError('User not assigned to a branch');
    }
    if (currentUser.branch_id !== targetUser.branch_id) {
      throw new ForbiddenError('Can only access users in your branch');
    }
    return true;
  }

  // Department-level access
  if (userMgmtPerm === 'department') {
    if (!currentUser.department_id) {
      throw new ForbiddenError('User not assigned to a department');
    }
    if (action === 'view') {
      // Can view anyone in same department
      if (currentUser.department_id === targetUser.department_id) {
        return true;
      }
    } else {
      // Can only edit/delete users in same team
      if (currentUser.team_id && currentUser.team_id === targetUser.team_id) {
        return true;
      }
    }
    throw new ForbiddenError('Can only access users in your department/team');
  }

  // Team-level access
  if (userMgmtPerm === 'team') {
    if (!currentUser.team_id) {
      throw new ForbiddenError('User not assigned to a team');
    }
    if (currentUser.team_id !== targetUser.team_id) {
      throw new ForbiddenError('Can only access users in your team');
    }
    return true;
  }

  // View team only (no edit/delete)
  if (userMgmtPerm === 'view_team') {
    if (action !== 'view') {
      throw new ForbiddenError('You can only view team members, not modify them');
    }
    if (!currentUser.team_id || currentUser.team_id !== targetUser.team_id) {
      throw new ForbiddenError('Can only view users in your team');
    }
    return true;
  }

  // View self only
  if (userMgmtPerm === 'view_self') {
    if (currentUser.id !== targetUserId) {
      throw new ForbiddenError('Can only view your own profile');
    }
    if (action !== 'view') {
      throw new ForbiddenError('Can only view your own profile, not modify it');
    }
    return true;
  }

  // No permission
  throw new ForbiddenError('Insufficient permissions to access this user');
}

/**
 * Check if user can modify a specific field
 * @param {object} currentUser - Current user
 * @param {object} targetUser - Target user being modified
 * @param {string} field - Field name being modified
 * @returns {boolean} True if modification is allowed
 * @throws {ForbiddenError} If modification is forbidden
 */
export function canModifyField(currentUser, targetUser, field) {
  // Get current user's role level
  const currentRoleLevel = currentUser.role_level || 0;

  // Can't modify own critical fields
  if (currentUser.id === targetUser.id) {
    const selfRestrictedFields = ['role_id', 'is_active', 'deleted_at', 'failed_login_count', 'locked_until'];
    if (selfRestrictedFields.includes(field)) {
      throw new ForbiddenError(`Cannot modify your own ${field.replace('_', ' ')}`);
    }
  }

  // Only admin (level 100+) can modify roles
  if (field === 'role_id' && currentRoleLevel < 100) {
    throw new ForbiddenError('Only administrators can change user roles');
  }

  // Only admin can modify active status
  if (field === 'is_active' && currentRoleLevel < 100) {
    throw new ForbiddenError('Only administrators can activate/deactivate users');
  }

  // Only admin can modify deleted status
  if (['deleted_at', 'deleted_by'].includes(field) && currentRoleLevel < 100) {
    throw new ForbiddenError('Only administrators can delete/restore users');
  }

  // Only admin can unlock accounts
  if (['failed_login_count', 'locked_until'].includes(field) && currentRoleLevel < 100) {
    throw new ForbiddenError('Only administrators can unlock accounts');
  }

  return true;
}

/**
 * Prevent circular manager relationships
 * @param {object} db - Database connection
 * @param {string} userId - User being assigned a manager
 * @param {string} managerId - Proposed manager ID
 * @throws {AppError} If circular relationship detected
 */
export async function validateManagerAssignment(db, userId, managerId) {
  if (!managerId) return true;

  // Can't be your own manager
  if (userId === managerId) {
    throw new AppError('User cannot be their own manager', 400);
  }

  // Check if managerId is in userId's management chain
  // This prevents circular references: A -> B -> C -> A
  let currentManager = managerId;
  const visited = new Set();
  const maxDepth = 10; // Prevent infinite loops

  while (currentManager && visited.size < maxDepth) {
    if (visited.has(currentManager)) {
      throw new AppError('Circular manager relationship detected', 400);
    }
    visited.add(currentManager);

    if (currentManager === userId) {
      throw new AppError('Cannot create circular manager relationship', 400);
    }

    const manager = await db
      .prepare('SELECT manager_id FROM users WHERE id = ?')
      .bind(currentManager)
      .first();

    currentManager = manager?.manager_id;
  }

  return true;
}

/**
 * Filter users based on current user's permission scope
 * @param {object} currentUser - Current authenticated user
 * @param {string} baseQuery - Base SQL query
 * @param {Array} bindings - Query bindings
 * @returns {object} Modified query and bindings with scope applied
 */
export function applyScopeToQuery(currentUser, baseQuery, bindings = []) {
  const roleLevel = currentUser.role_level || 0;
  const userMgmtPerm = currentUser.role_permissions?.user_management;

  // Admin sees all users
  if (roleLevel >= 100 || userMgmtPerm === 'full') {
    return { query: baseQuery, bindings };
  }

  let scopeCondition = '';
  const scopeBindings = [];

  // Branch-level scope
  if (userMgmtPerm === 'branch' && currentUser.branch_id) {
    scopeCondition = ' AND u.branch_id = ?';
    scopeBindings.push(currentUser.branch_id);
  }
  // Department-level scope
  else if (userMgmtPerm === 'department' && currentUser.department_id) {
    scopeCondition = ' AND u.department_id = ?';
    scopeBindings.push(currentUser.department_id);
  }
  // Team-level scope
  else if ((userMgmtPerm === 'team' || userMgmtPerm === 'view_team') && currentUser.team_id) {
    scopeCondition = ' AND u.team_id = ?';
    scopeBindings.push(currentUser.team_id);
  }
  // Self-only scope
  else if (userMgmtPerm === 'view_self') {
    scopeCondition = ' AND u.id = ?';
    scopeBindings.push(currentUser.id);
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
 * Check if user has permission for a tool/module
 * @param {object} user - User object with role_permissions
 * @param {string} tool - Tool name ('workforce', 'docks', 'projects', 'tickets')
 * @returns {boolean} True if user has access
 */
export function hasToolPermission(user, tool) {
  if (!user.role_permissions) return false;

  // Check for 'all' permission
  if (user.role_permissions.all === true) {
    return true;
  }

  // Check specific tool permission
  return user.role_permissions[tool] === true;
}

/**
 * Require admin role (level 100+)
 * @param {object} user - Current user
 * @throws {ForbiddenError} If not admin
 */
export function requireAdmin(user) {
  const roleLevel = user.role_level || 0;
  if (roleLevel < 100) {
    throw new ForbiddenError('Administrator privileges required');
  }
}

/**
 * Require minimum role level
 * @param {object} user - Current user
 * @param {number} minLevel - Minimum required level
 * @throws {ForbiddenError} If insufficient level
 */
export function requireRoleLevel(user, minLevel) {
  const roleLevel = user.role_level || 0;
  if (roleLevel < minLevel) {
    throw new ForbiddenError(`Role level ${minLevel} or higher required`);
  }
}
