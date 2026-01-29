/**
 * User data formatting utilities
 * Centralizes user data transformation logic to avoid duplication
 */

/**
 * Format user data for API response
 * Parses role_permissions and structures the response consistently
 */
export function formatUserData(user) {
  // Parse role_permissions if it's a string
  let rolePermissions = null;
  if (user.role_permissions) {
    try {
      rolePermissions = typeof user.role_permissions === 'string'
        ? JSON.parse(user.role_permissions)
        : user.role_permissions;
    } catch (error) {
      console.error('Failed to parse role_permissions:', error);
      console.error('Raw value:', user.role_permissions);
      // Return null instead of crashing
      rolePermissions = null;
    }
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    role_id: user.role_id,
    role_level: user.role_level,
    role_name: user.role_name,
    first_name: user.first_name,
    last_name: user.last_name,
    password_reset_required: !!user.password_reset_required,

    // Legacy boolean permissions (keep for backward compatibility)
    permissions: {
      workforce: !!user.perm_workforce,
      docks: !!user.perm_docks,
      projects: !!user.perm_projects,
      tickets: !!user.perm_tickets,
    },

    // New role-based permissions
    role_permissions: rolePermissions,

    idleTimeoutMinutes: user.idle_timeout_minutes || 60,
    lastActivityAt: user.last_activity_at,
  };
}
