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
