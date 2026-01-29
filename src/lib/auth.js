/**
 * Auth constants and utility functions
 * Production authentication uses API - this file only contains constants
 */

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
}

export const DEFAULT_PERMISSIONS = {
  admin: {
    workforce: true,
    docks: true,
    projects: true,
    tickets: true,
  },
  manager: {
    workforce: true,
    docks: true,
    projects: true,
    tickets: true,
  },
  user: {
    workforce: false,
    docks: false,
    projects: false,
    tickets: false,
  },
}

/**
 * Check if user has permission for a tool
 * Note: This is a fallback - AuthContext handles permission checks via API
 * @param {Object} user - User object
 * @param {string} tool - Tool name (workforce, docks, projects, tickets)
 * @returns {boolean} Whether user has permission
 */
export const hasPermission = (user, tool) => {
  if (!user) return false
  if (user.role === ROLES.ADMIN) return true
  if (!user.permissions) return false
  return user.permissions[tool] === true
}

// =============================================================================
// TEMPORARY STUBS - User Management Features
// These functions are temporary stubs for the UsersPage and PermissionsPage
// TODO: Implement proper API endpoints for user management in the backend
// =============================================================================

/**
 * Get all users - TEMPORARY STUB
 * Returns empty array - user management needs API implementation
 */
export const getUsers = () => {
  console.warn('getUsers: User management API not yet implemented')
  return []
}

/**
 * Update user - TEMPORARY STUB
 * Does nothing - user management needs API implementation
 */
export const updateUser = (userId, updates) => {
  console.warn('updateUser: User management API not yet implemented')
}

/**
 * Save user - TEMPORARY STUB
 * Does nothing - user management needs API implementation
 */
export const saveUser = (user) => {
  console.warn('saveUser: User management API not yet implemented')
}

/**
 * Delete user - TEMPORARY STUB
 * Does nothing - user management needs API implementation
 */
export const deleteUser = (userId) => {
  console.warn('deleteUser: User management API not yet implemented')
}

/**
 * Find user by email - TEMPORARY STUB
 * Returns null - user management needs API implementation
 */
export const findUserByEmail = (email) => {
  console.warn('findUserByEmail: User management API not yet implemented')
  return null
}
