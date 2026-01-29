import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  NAVIGATION_CONFIG,
  getMainNavigation,
  getToolConfig,
  getAllTools,
} from '@/config/navigation'
import { filterNavItems } from '@/lib/permissions'

/**
 * Hook to get filtered main navigation items based on user permissions
 */
export function useMainNavigation() {
  const { user } = useAuth()

  return useMemo(() => {
    const mainNav = getMainNavigation()
    return filterNavItems(mainNav, user)
  }, [user])
}

/**
 * Hook to get tool configuration and navigation items
 * @param {string} toolId - The tool identifier (e.g., 'workforce', 'docks')
 * @returns {object} Tool configuration with subPages
 */
export function useToolNavigation(toolId) {
  return useMemo(() => {
    const config = getToolConfig(toolId)
    if (!config) {
      console.warn(`Tool configuration not found for: ${toolId}`)
      return { subPages: [] }
    }
    return config
  }, [toolId])
}

/**
 * Hook to get all available tools for the dashboard
 * Optionally filters based on user permissions
 * @param {boolean} filterByPermissions - Whether to filter by user permissions (default: false)
 * @returns {array} Array of tool configurations
 */
export function useToolsList(filterByPermissions = false) {
  const { user } = useAuth()

  return useMemo(() => {
    const tools = getAllTools()

    if (!filterByPermissions || !user) {
      return tools
    }

    // If filtering is enabled, check user permissions
    // For now, we return all tools as permission checking happens in ToolTile
    // This can be extended to filter based on user.permissions array
    return tools
  }, [user, filterByPermissions])
}

/**
 * Hook to check if a user has access to a specific tool
 * @param {string} toolId - The tool identifier
 * @returns {boolean} Whether the user has access
 */
export function useHasToolAccess(toolId) {
  const { user } = useAuth()

  return useMemo(() => {
    if (!user) return false

    const config = getToolConfig(toolId)
    if (!config) return false

    // Check if user has the required permission
    // This assumes user object has a permissions array or permission checking mechanism
    // Adjust based on your actual permission structure
    if (config.permission && user.permissions) {
      return user.permissions.includes(config.permission)
    }

    // If no specific permission is required, grant access
    return true
  }, [user, toolId])
}
