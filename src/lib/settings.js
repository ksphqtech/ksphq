// User Settings Management
// Handles storage and retrieval of user-specific settings

export const DEFAULT_SETTINGS = {
  display: {
    density: 'comfortable',
    animations: true,
    sidebarBehavior: 'auto'
  },
  dashboard: {
    defaultPage: '/dashboard',
    showToolDescriptions: true,
    showQuickActions: false
  },
  workforce: {
    lastClient: null,
    lastActivity: null,
    lastProject: null,
    rememberLastValues: true,
    defaultTab: 'clockIn'
  }
};

const STORAGE_KEY_PREFIX = 'userSettings_';

/**
 * Initialize settings for a user if they don't exist
 * @param {string} userId - User ID
 * @returns {Object} User settings
 */
export function initializeSettings(userId) {
  const key = STORAGE_KEY_PREFIX + userId;
  const existing = localStorage.getItem(key);

  if (existing) {
    return JSON.parse(existing);
  }

  const settings = {
    userId,
    ...DEFAULT_SETTINGS
  };

  localStorage.setItem(key, JSON.stringify(settings));
  return settings;
}

/**
 * Get settings for a user
 * @param {string} userId - User ID
 * @returns {Object} User settings
 */
export function getSettings(userId) {
  const key = STORAGE_KEY_PREFIX + userId;
  const settings = localStorage.getItem(key);

  if (!settings) {
    return initializeSettings(userId);
  }

  return JSON.parse(settings);
}

/**
 * Update settings for a user
 * @param {string} userId - User ID
 * @param {Object} updates - Settings updates (deep merge)
 * @returns {Object} Updated settings
 */
export function updateSettings(userId, updates) {
  const current = getSettings(userId);
  const updated = {
    ...current,
    display: {
      ...current.display,
      ...(updates.display || {})
    },
    dashboard: {
      ...current.dashboard,
      ...(updates.dashboard || {})
    },
    workforce: {
      ...current.workforce,
      ...(updates.workforce || {})
    }
  };

  const key = STORAGE_KEY_PREFIX + userId;
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

/**
 * Reset settings to defaults for a user
 * @param {string} userId - User ID
 * @returns {Object} Reset settings
 */
export function resetSettings(userId) {
  const settings = {
    userId,
    ...DEFAULT_SETTINGS
  };

  const key = STORAGE_KEY_PREFIX + userId;
  localStorage.setItem(key, JSON.stringify(settings));
  return settings;
}
