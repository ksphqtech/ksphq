/**
 * Token Storage Utility
 * Implements memory-first storage with localStorage fallback
 *
 * SECURITY STRATEGY:
 * - Memory storage: Cleared on page refresh (XSS protection)
 * - localStorage: Persistent across sessions (user convenience)
 * - Access token: Short 15-min lifetime limits exposure
 * - Refresh token: Allows session restoration after refresh
 */

// In-memory storage (most secure, lost on page refresh)
let memoryStorage = {
  accessToken: null,
  refreshToken: null,
};

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ksphq_access_token',
  REFRESH_TOKEN: 'ksphq_refresh_token',
};

function isLocalStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Store both tokens
 */
export function setTokens(accessToken, refreshToken) {
  memoryStorage.accessToken = accessToken;
  memoryStorage.refreshToken = refreshToken;

  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    } catch (e) {
      console.error('Failed to store tokens in localStorage:', e);
    }
  }
}

/**
 * Get access token (memory first, localStorage fallback)
 */
export function getAccessToken() {
  if (memoryStorage.accessToken) {
    return memoryStorage.accessToken;
  }

  if (isLocalStorageAvailable()) {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token) {
        memoryStorage.accessToken = token;
        return token;
      }
    } catch (e) {
      console.error('Failed to retrieve access token:', e);
    }
  }

  return null;
}

/**
 * Get refresh token (memory first, localStorage fallback)
 */
export function getRefreshToken() {
  if (memoryStorage.refreshToken) {
    return memoryStorage.refreshToken;
  }

  if (isLocalStorageAvailable()) {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (token) {
        memoryStorage.refreshToken = token;
        return token;
      }
    } catch (e) {
      console.error('Failed to retrieve refresh token:', e);
    }
  }

  return null;
}

/**
 * Clear all tokens (logout)
 */
export function clearTokens() {
  memoryStorage.accessToken = null;
  memoryStorage.refreshToken = null;

  if (isLocalStorageAvailable()) {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (e) {
      console.error('Failed to clear tokens:', e);
    }
  }
}

/**
 * Check if user has any tokens
 */
export function hasTokens() {
  return !!(getAccessToken() || getRefreshToken());
}
