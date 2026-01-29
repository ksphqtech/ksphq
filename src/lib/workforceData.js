// Workforce Data Management
// CRUD operations for clients, activities, and projects

const CLIENTS_KEY = 'workforce_clients';
const ACTIVITIES_KEY = 'workforce_activities';
const PROJECTS_KEY = 'workforce_projects';

// ==================== CLIENTS ====================

/**
 * Get all clients
 */
export function getClients() {
  try {
    const stored = localStorage.getItem(CLIENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading clients:', error);
    return [];
  }
}

/**
 * Get active clients only
 */
export function getActiveClients() {
  return getClients().filter(client => client.status === 'active');
}

/**
 * Get client by ID
 */
export function getClientById(id) {
  return getClients().find(client => client.id === id);
}

/**
 * Save new client
 */
export function saveClient(client) {
  try {
    const clients = getClients();
    const newClient = {
      ...client,
      id: client.id || `client_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    clients.push(newClient);
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    return { success: true, client: newClient };
  } catch (error) {
    console.error('Error saving client:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update existing client
 */
export function updateClient(id, updates) {
  try {
    const clients = getClients();
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) {
      return { success: false, error: 'Client not found' };
    }
    clients[index] = {
      ...clients[index],
      ...updates,
      id, // Prevent ID changes
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    return { success: true, client: clients[index] };
  } catch (error) {
    console.error('Error updating client:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete client
 */
export function deleteClient(id) {
  try {
    const clients = getClients();
    const filtered = clients.filter(c => c.id !== id);
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch (error) {
    console.error('Error deleting client:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Initialize clients from seed data
 */
export function initializeClients(seedData) {
  try {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(seedData));
    return { success: true };
  } catch (error) {
    console.error('Error initializing clients:', error);
    return { success: false, error: error.message };
  }
}

// ==================== ACTIVITIES ====================

/**
 * Get all activities
 */
export function getActivities() {
  try {
    const stored = localStorage.getItem(ACTIVITIES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading activities:', error);
    return [];
  }
}

/**
 * Get active activities only
 */
export function getActiveActivities() {
  return getActivities().filter(activity => activity.status === 'active');
}

/**
 * Get activity by ID
 */
export function getActivityById(id) {
  return getActivities().find(activity => activity.id === id);
}

/**
 * Get activities by category
 */
export function getActivitiesByCategory(category) {
  return getActivities().filter(activity => activity.category === category);
}

/**
 * Save new activity
 */
export function saveActivity(activity) {
  try {
    const activities = getActivities();
    const newActivity = {
      ...activity,
      id: activity.id || `activity_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    activities.push(newActivity);
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
    return { success: true, activity: newActivity };
  } catch (error) {
    console.error('Error saving activity:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update existing activity
 */
export function updateActivity(id, updates) {
  try {
    const activities = getActivities();
    const index = activities.findIndex(a => a.id === id);
    if (index === -1) {
      return { success: false, error: 'Activity not found' };
    }
    activities[index] = {
      ...activities[index],
      ...updates,
      id, // Prevent ID changes
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
    return { success: true, activity: activities[index] };
  } catch (error) {
    console.error('Error updating activity:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete activity
 */
export function deleteActivity(id) {
  try {
    const activities = getActivities();
    const filtered = activities.filter(a => a.id !== id);
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch (error) {
    console.error('Error deleting activity:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Initialize activities from seed data
 */
export function initializeActivities(seedData) {
  try {
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(seedData));
    return { success: true };
  } catch (error) {
    console.error('Error initializing activities:', error);
    return { success: false, error: error.message };
  }
}

// ==================== PROJECTS ====================

/**
 * Get all projects
 */
export function getProjects() {
  try {
    const stored = localStorage.getItem(PROJECTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
}

/**
 * Get active projects only
 */
export function getActiveProjects() {
  return getProjects().filter(project => project.status === 'active');
}

/**
 * Get project by ID
 */
export function getProjectById(id) {
  return getProjects().find(project => project.id === id);
}

/**
 * Get projects by client
 */
export function getProjectsByClient(clientId) {
  return getProjects().filter(project => project.clientId === clientId);
}

/**
 * Get active projects by client
 */
export function getActiveProjectsByClient(clientId) {
  return getActiveProjects().filter(project => project.clientId === clientId);
}

/**
 * Save new project
 */
export function saveProject(project) {
  try {
    const projects = getProjects();
    const newProject = {
      ...project,
      id: project.id || `project_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    projects.push(newProject);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    return { success: true, project: newProject };
  } catch (error) {
    console.error('Error saving project:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update existing project
 */
export function updateProject(id, updates) {
  try {
    const projects = getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) {
      return { success: false, error: 'Project not found' };
    }
    projects[index] = {
      ...projects[index],
      ...updates,
      id, // Prevent ID changes
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    return { success: true, project: projects[index] };
  } catch (error) {
    console.error('Error updating project:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete project
 */
export function deleteProject(id) {
  try {
    const projects = getProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch (error) {
    console.error('Error deleting project:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Initialize projects from seed data
 */
export function initializeProjects(seedData) {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(seedData));
    return { success: true };
  } catch (error) {
    console.error('Error initializing projects:', error);
    return { success: false, error: error.message };
  }
}

// ==================== UTILITIES ====================

/**
 * Initialize all workforce data from seed data
 */
export function initializeAllWorkforceData(clients, activities, projects) {
  const results = {
    clients: initializeClients(clients),
    activities: initializeActivities(activities),
    projects: initializeProjects(projects)
  };

  return {
    success: results.clients.success && results.activities.success && results.projects.success,
    results
  };
}

/**
 * Check if workforce data exists
 */
export function hasWorkforceData() {
  return localStorage.getItem(CLIENTS_KEY) !== null &&
         localStorage.getItem(ACTIVITIES_KEY) !== null &&
         localStorage.getItem(PROJECTS_KEY) !== null;
}

/**
 * Clear all workforce data
 */
export function clearAllWorkforceData() {
  try {
    localStorage.removeItem(CLIENTS_KEY);
    localStorage.removeItem(ACTIVITIES_KEY);
    localStorage.removeItem(PROJECTS_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error clearing workforce data:', error);
    return { success: false, error: error.message };
  }
}
