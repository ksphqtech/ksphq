// Workforce Settings Management
// Handles configuration for time tracking, field visibility, and permissions

export const DEFAULT_WORKFORCE_SETTINGS = {
  clockIn: {
    fields: {
      client: {
        visible: true,
        required: true,
        order: 1
      },
      activity: {
        visible: true,
        required: false,
        order: 2
      },
      project: {
        visible: true,
        required: false,
        order: 3
      },
      notes: {
        visible: true,
        required: false,
        order: 4
      }
    },
    // When fields can be edited: 'before' (before clock in), 'after' (after clock in), 'either' (anytime)
    fieldEditTiming: 'either',
    tabs: {
      clockIn: {
        roles: ['user', 'manager', 'admin']
      },
      logTime: {
        roles: ['manager', 'admin']
      }
    }
  },
  validation: {
    maxNotesLength: 500,
    requireClientForBillable: true
  }
};

const STORAGE_KEY = 'workforceSettings';

/**
 * Get workforce settings from localStorage or return defaults
 */
export function getWorkforceSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      // Merge with defaults to ensure all fields exist
      return {
        ...DEFAULT_WORKFORCE_SETTINGS,
        ...settings,
        clockIn: {
          ...DEFAULT_WORKFORCE_SETTINGS.clockIn,
          ...settings.clockIn,
          fields: {
            ...DEFAULT_WORKFORCE_SETTINGS.clockIn.fields,
            ...settings.clockIn?.fields
          },
          tabs: {
            ...DEFAULT_WORKFORCE_SETTINGS.clockIn.tabs,
            ...settings.clockIn?.tabs
          }
        },
        validation: {
          ...DEFAULT_WORKFORCE_SETTINGS.validation,
          ...settings.validation
        }
      };
    }
  } catch (error) {
    console.error('Error loading workforce settings:', error);
  }
  return DEFAULT_WORKFORCE_SETTINGS;
}

/**
 * Update workforce settings in localStorage
 */
export function updateWorkforceSettings(settings) {
  try {
    // Validate before saving
    const validation = validateWorkforceSettings(settings);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return { success: true };
  } catch (error) {
    console.error('Error saving workforce settings:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Validate workforce settings
 */
export function validateWorkforceSettings(settings) {
  const errors = [];

  // At least one field must be visible
  const visibleFields = Object.values(settings.clockIn.fields).filter(f => f.visible);
  if (visibleFields.length === 0) {
    errors.push('At least one field must be visible');
  }

  // Can't require a hidden field
  Object.entries(settings.clockIn.fields).forEach(([fieldName, config]) => {
    if (!config.visible && config.required) {
      errors.push(`Cannot require hidden field: ${fieldName}`);
    }
  });

  // Valid fieldEditTiming value
  const validTimings = ['before', 'after', 'either'];
  if (!validTimings.includes(settings.clockIn.fieldEditTiming)) {
    errors.push('Invalid fieldEditTiming value');
  }

  // Valid role arrays
  const validRoles = ['user', 'manager', 'admin'];
  ['clockIn', 'logTime'].forEach(tab => {
    const roles = settings.clockIn.tabs[tab]?.roles || [];
    const invalidRoles = roles.filter(r => !validRoles.includes(r));
    if (invalidRoles.length > 0) {
      errors.push(`Invalid roles for ${tab}: ${invalidRoles.join(', ')}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if user can access a specific tab
 */
export function canUserAccessTab(user, tabId, settings = null) {
  const config = settings || getWorkforceSettings();
  const tabConfig = config.clockIn.tabs[tabId];

  if (!tabConfig) {
    return false;
  }

  return tabConfig.roles.includes(user.role);
}

/**
 * Get visible fields in order
 */
export function getVisibleFields(settings = null) {
  const config = settings || getWorkforceSettings();
  return Object.entries(config.clockIn.fields)
    .filter(([_, fieldConfig]) => fieldConfig.visible)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([fieldName, fieldConfig]) => ({
      name: fieldName,
      ...fieldConfig
    }));
}

/**
 * Check if fields should be disabled based on timing config and clock state
 */
export function areFieldsDisabled(isClockedIn, settings = null) {
  const config = settings || getWorkforceSettings();
  const timing = config.clockIn.fieldEditTiming;

  if (timing === 'either') return false;
  if (timing === 'before') return isClockedIn;
  if (timing === 'after') return !isClockedIn;

  return false;
}

/**
 * Get required fields based on configuration
 */
export function getRequiredFields(settings = null) {
  const config = settings || getWorkforceSettings();
  return Object.entries(config.clockIn.fields)
    .filter(([_, fieldConfig]) => fieldConfig.visible && fieldConfig.required)
    .map(([fieldName]) => fieldName);
}

/**
 * Validate form data against required fields
 */
export function validateFormData(formData, settings = null) {
  const requiredFields = getRequiredFields(settings);
  const errors = {};

  requiredFields.forEach(fieldName => {
    if (!formData[fieldName] || formData[fieldName].trim() === '') {
      errors[fieldName] = 'This field is required';
    }
  });

  // Validate notes length
  const config = settings || getWorkforceSettings();
  if (formData.notes && formData.notes.length > config.validation.maxNotesLength) {
    errors.notes = `Notes must be ${config.validation.maxNotesLength} characters or less`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
