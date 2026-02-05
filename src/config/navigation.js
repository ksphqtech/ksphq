export const NAVIGATION_CONFIG = {
  // Main navigation items
  main: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      path: '/dashboard',
      icon: 'LayoutDashboard',
      requireAuth: true,
      roles: null, // null = all authenticated users
    },
    {
      id: 'business-info',
      title: 'Business Info',
      path: '/business-info',
      icon: 'Building2',
      requireAuth: true,
      roles: null,
    },
    {
      id: 'clients',
      title: 'Clients',
      path: '/clients',
      icon: 'Briefcase',
      requireAuth: true,
      roles: null,
    },
    {
      id: 'users',
      title: 'Users',
      path: '/users',
      icon: 'Users',
      requireAuth: true,
      roles: ['admin', 'manager'],
    },
    {
      id: 'permissions',
      title: 'Permissions',
      path: '/permissions',
      icon: 'Shield',
      requireAuth: true,
      roles: ['admin'],
    },
    {
      id: 'branches',
      title: 'Branch Management',
      path: '/branches',
      icon: 'Building2',
      requireAuth: true,
      roles: ['admin', 'manager'],
    },
    {
      id: 'settings',
      title: 'Settings',
      path: '/settings',
      icon: 'Settings',
      requireAuth: true,
      roles: null,
    },
    {
      id: 'customize',
      title: 'Customize',
      path: '/customize',
      icon: 'Palette',
      requireAuth: true,
      roles: null,
    },
  ],

  // Tool configurations
  tools: {
    workforce: {
      id: 'workforce',
      title: 'Workforce Control™',
      description: 'Manage employees, schedules, and workforce analytics',
      path: '/tools/workforce',
      icon: 'Users',
      requireAuth: true,
      permission: 'workforce',
      subPages: [
        // General Section
        {
          id: 'clock-in',
          title: 'Clock In',
          path: '/tools/workforce/clock-in',
          icon: 'Clock',
          section: 'General'
        },
        {
          id: 'my-stats',
          title: 'My Stats',
          path: '/tools/workforce/my-stats',
          icon: 'BarChart3',
          section: 'General'
        },
        {
          id: 'profile',
          title: 'Profile',
          path: '/tools/workforce/profile',
          icon: 'User',
          section: 'General'
        },
        // Administration Section
        {
          id: 'dashboard',
          title: 'Dashboard',
          path: '/tools/workforce/dashboard',
          icon: 'LayoutDashboard',
          section: 'Administration'
        },
        {
          id: 'activities',
          title: 'Activities',
          path: '/tools/workforce/activities',
          icon: 'Activity',
          section: 'Administration'
        },
        {
          id: 'shifts',
          title: 'Shifts',
          path: '/tools/workforce/shifts',
          icon: 'CalendarDays',
          section: 'Administration'
        },
        {
          id: 'groups',
          title: 'Groups',
          path: '/tools/workforce/groups',
          icon: 'UsersRound',
          section: 'Administration'
        },
        {
          id: 'teams',
          title: 'Teams',
          path: '/tools/workforce/teams',
          icon: 'Users',
          section: 'Administration'
        },
        {
          id: 'settings',
          title: 'Settings',
          path: '/tools/workforce/settings',
          icon: 'Settings',
          section: 'Administration'
        }
      ],
    },
    docks: {
      id: 'docks',
      title: 'Dock Control™',
      description: 'Track dock status, carriers, and loading operations',
      path: '/tools/docks',
      icon: 'Warehouse',
      requireAuth: true,
      permission: 'docks',
      subPages: [
        {
          id: 'status',
          title: 'Dock Status',
          path: '/tools/docks',
          icon: 'Truck',
        },
        {
          id: 'shipments',
          title: 'Shipments',
          path: '/tools/docks/shipments',
          icon: 'Package',
        },
        {
          id: 'schedule',
          title: 'Schedule',
          path: '/tools/docks/schedule',
          icon: 'ClipboardList',
        },
        {
          id: 'settings',
          title: 'Settings',
          path: '/tools/docks/settings',
          icon: 'Settings',
        },
      ],
    },
    projects: {
      id: 'projects',
      title: 'Project Control™',
      description: 'Oversee projects, timelines, and team collaboration',
      path: '/tools/projects',
      icon: 'FolderKanban',
      requireAuth: true,
      permission: 'projects',
      subPages: [
        {
          id: 'overview',
          title: 'All Projects',
          path: '/tools/projects',
          icon: 'FolderKanban',
        },
        {
          id: 'timeline',
          title: 'Timeline',
          path: '/tools/projects/timeline',
          icon: 'Calendar',
        },
        {
          id: 'reports',
          title: 'Reports',
          path: '/tools/projects/reports',
          icon: 'BarChart3',
        },
        {
          id: 'team',
          title: 'Team',
          path: '/tools/projects/team',
          icon: 'Users',
        },
        {
          id: 'settings',
          title: 'Settings',
          path: '/tools/projects/settings',
          icon: 'Settings',
        },
      ],
    },
    tickets: {
      id: 'tickets',
      title: 'HQ Tickets™',
      description: 'Submit and manage support tickets and requests',
      path: '/tools/tickets',
      icon: 'TicketCheck',
      requireAuth: true,
      permission: 'tickets',
      subPages: [
        {
          id: 'all',
          title: 'All Tickets',
          path: '/tools/tickets',
          icon: 'TicketCheck',
        },
        {
          id: 'create',
          title: 'Create Ticket',
          path: '/tools/tickets/create',
          icon: 'Plus',
        },
        {
          id: 'filter',
          title: 'Filter & Sort',
          path: '/tools/tickets/filter',
          icon: 'Filter',
        },
        {
          id: 'archived',
          title: 'Archived',
          path: '/tools/tickets/archived',
          icon: 'Archive',
        },
        {
          id: 'settings',
          title: 'Settings',
          path: '/tools/tickets/settings',
          icon: 'Settings',
        },
      ],
    },
  },
}

// Helper function to get all tools as an array (for dashboard tiles)
export function getAllTools() {
  if (!NAVIGATION_CONFIG?.tools) {
    console.warn('getAllTools: NAVIGATION_CONFIG.tools is undefined')
    return []
  }
  const tools = Object.values(NAVIGATION_CONFIG.tools)
  return Array.isArray(tools) ? tools : []
}

// Helper function to get a specific tool configuration
export function getToolConfig(toolId) {
  return NAVIGATION_CONFIG.tools[toolId]
}

// Helper function to get main navigation items
export function getMainNavigation() {
  return NAVIGATION_CONFIG.main
}
