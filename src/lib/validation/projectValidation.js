/**
 * Frontend Project Validation Utilities
 * Client-side validation for immediate user feedback
 */

/**
 * Field constraints matching backend validation
 */
export const FIELD_CONSTRAINTS = {
  PROJECT_NAME_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 5000,
  BUDGET_MAX: 999999999.99,
  PERCENTAGE_MIN: 0,
  PERCENTAGE_MAX: 100,
  HOURS_MAX: 999999,
  TASK_TITLE_MAX_LENGTH: 200,
  MATERIAL_NAME_MAX_LENGTH: 200,
  UNIT_MAX_LENGTH: 50,
};

/**
 * Valid statuses and priorities
 */
export const PROJECT_STATUSES = ['planning', 'in progress', 'on hold', 'completed', 'cancelled'];
export const PROJECT_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const TASK_STATUSES = ['planning', 'in progress', 'on hold', 'completed', 'cancelled'];
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const MATERIAL_STATUSES = ['not_ordered', 'ordered', 'received', 'in_use'];

/**
 * Validate project name
 * @param {string} name - Project name
 * @returns {string|null} Error message or null if valid
 */
export function validateProjectName(name) {
  if (!name || name.trim().length === 0) {
    return 'Project name is required';
  }
  if (name.length > FIELD_CONSTRAINTS.PROJECT_NAME_MAX_LENGTH) {
    return `Project name cannot exceed ${FIELD_CONSTRAINTS.PROJECT_NAME_MAX_LENGTH} characters`;
  }
  return null;
}

/**
 * Validate description
 * @param {string} description - Description text
 * @returns {string|null} Error message or null if valid
 */
export function validateDescription(description) {
  if (description && description.length > FIELD_CONSTRAINTS.DESCRIPTION_MAX_LENGTH) {
    return `Description cannot exceed ${FIELD_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} characters`;
  }
  return null;
}

/**
 * Validate budget amount
 * @param {number} amount - Budget amount
 * @returns {string|null} Error message or null if valid
 */
export function validateBudgetAmount(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return null; // Optional field
  }

  const numAmount = parseFloat(amount);

  if (isNaN(numAmount)) {
    return 'Budget must be a valid number';
  }

  if (numAmount < 0) {
    return 'Budget cannot be negative';
  }

  if (numAmount > FIELD_CONSTRAINTS.BUDGET_MAX) {
    return `Budget cannot exceed ${FIELD_CONSTRAINTS.BUDGET_MAX.toLocaleString()}`;
  }

  // Check for more than 2 decimal places
  if (amount.toString().includes('.')) {
    const decimals = amount.toString().split('.')[1];
    if (decimals && decimals.length > 2) {
      return 'Budget can have at most 2 decimal places';
    }
  }

  return null;
}

/**
 * Validate percentage value (0-100)
 * @param {number} value - Percentage value
 * @returns {string|null} Error message or null if valid
 */
export function validatePercentage(value) {
  if (value === null || value === undefined || value === '') {
    return null; // Optional field
  }

  const numValue = parseInt(value);

  if (isNaN(numValue)) {
    return 'Percentage must be a valid number';
  }

  if (numValue < FIELD_CONSTRAINTS.PERCENTAGE_MIN) {
    return 'Percentage cannot be negative';
  }

  if (numValue > FIELD_CONSTRAINTS.PERCENTAGE_MAX) {
    return 'Percentage cannot exceed 100';
  }

  if (!Number.isInteger(parseFloat(value))) {
    return 'Percentage must be a whole number';
  }

  return null;
}

/**
 * Validate hours
 * @param {number} hours - Hours value
 * @returns {string|null} Error message or null if valid
 */
export function validateHours(hours) {
  if (hours === null || hours === undefined || hours === '') {
    return null; // Optional field
  }

  const numHours = parseFloat(hours);

  if (isNaN(numHours)) {
    return 'Hours must be a valid number';
  }

  if (numHours < 0) {
    return 'Hours cannot be negative';
  }

  if (numHours > FIELD_CONSTRAINTS.HOURS_MAX) {
    return `Hours cannot exceed ${FIELD_CONSTRAINTS.HOURS_MAX.toLocaleString()}`;
  }

  return null;
}

/**
 * Validate date range
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @returns {string|null} Error message or null if valid
 */
export function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return null; // Both dates must be provided to validate range
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return 'Start date is invalid';
  }

  if (isNaN(end.getTime())) {
    return 'End date is invalid';
  }

  if (end < start) {
    return 'End date must be after or equal to start date';
  }

  return null;
}

/**
 * Validate date is in valid format
 * @param {string} dateString - Date string
 * @returns {boolean} True if valid date
 */
export function isValidDate(dateString) {
  if (!dateString) return true; // Optional field
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate status is in allowed list
 * @param {string} status - Status value
 * @param {Array} allowedStatuses - Array of allowed statuses
 * @returns {string|null} Error message or null if valid
 */
export function validateStatus(status, allowedStatuses = PROJECT_STATUSES) {
  if (!status) {
    return 'Status is required';
  }

  if (!allowedStatuses.includes(status)) {
    return `Status must be one of: ${allowedStatuses.join(', ')}`;
  }

  return null;
}

/**
 * Validate priority is in allowed list
 * @param {string} priority - Priority value
 * @param {Array} allowedPriorities - Array of allowed priorities
 * @returns {string|null} Error message or null if valid
 */
export function validatePriority(priority, allowedPriorities = PROJECT_PRIORITIES) {
  if (!priority) {
    return 'Priority is required';
  }

  if (!allowedPriorities.includes(priority)) {
    return `Priority must be one of: ${allowedPriorities.join(', ')}`;
  }

  return null;
}

/**
 * Validate UUID format
 * @param {string} uuid - UUID string
 * @returns {boolean} True if valid UUID
 */
export function isValidUUID(uuid) {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate task title
 * @param {string} title - Task title
 * @returns {string|null} Error message or null if valid
 */
export function validateTaskTitle(title) {
  if (!title || title.trim().length === 0) {
    return 'Task title is required';
  }
  if (title.length > FIELD_CONSTRAINTS.TASK_TITLE_MAX_LENGTH) {
    return `Task title cannot exceed ${FIELD_CONSTRAINTS.TASK_TITLE_MAX_LENGTH} characters`;
  }
  return null;
}

/**
 * Validate material name
 * @param {string} name - Material name
 * @returns {string|null} Error message or null if valid
 */
export function validateMaterialName(name) {
  if (!name || name.trim().length === 0) {
    return 'Material name is required';
  }
  if (name.length > FIELD_CONSTRAINTS.MATERIAL_NAME_MAX_LENGTH) {
    return `Material name cannot exceed ${FIELD_CONSTRAINTS.MATERIAL_NAME_MAX_LENGTH} characters`;
  }
  return null;
}

/**
 * Validate quantity
 * @param {number} quantity - Quantity value
 * @returns {string|null} Error message or null if valid
 */
export function validateQuantity(quantity) {
  if (quantity === null || quantity === undefined || quantity === '') {
    return 'Quantity is required';
  }

  const numQuantity = parseFloat(quantity);

  if (isNaN(numQuantity)) {
    return 'Quantity must be a valid number';
  }

  if (numQuantity <= 0) {
    return 'Quantity must be greater than zero';
  }

  if (numQuantity > FIELD_CONSTRAINTS.HOURS_MAX) {
    return `Quantity cannot exceed ${FIELD_CONSTRAINTS.HOURS_MAX.toLocaleString()}`;
  }

  return null;
}

/**
 * Sanitize text input on frontend
 * Removes leading/trailing whitespace and normalizes internal whitespace
 * @param {string} input - Input text
 * @returns {string} Sanitized text
 */
export function sanitizeTextInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Validate complete project form data
 * @param {Object} data - Project form data
 * @returns {Object} Object with isValid boolean and errors object
 */
export function validateProjectForm(data) {
  const errors = {};

  // Name validation
  const nameError = validateProjectName(data.name);
  if (nameError) errors.name = nameError;

  // Description validation
  const descError = validateDescription(data.description);
  if (descError) errors.description = descError;

  // Status validation
  const statusError = validateStatus(data.status, PROJECT_STATUSES);
  if (statusError) errors.status = statusError;

  // Priority validation
  const priorityError = validatePriority(data.priority, PROJECT_PRIORITIES);
  if (priorityError) errors.priority = priorityError;

  // Budget validation
  const budgetError = validateBudgetAmount(data.budget_amount);
  if (budgetError) errors.budget_amount = budgetError;

  const costError = validateBudgetAmount(data.actual_cost);
  if (costError) errors.actual_cost = costError;

  // Completion percentage validation
  const completionError = validatePercentage(data.completion_percentage);
  if (completionError) errors.completion_percentage = completionError;

  // Date range validation
  const dateRangeError = validateDateRange(data.start_date, data.end_date);
  if (dateRangeError) errors.end_date = dateRangeError;

  const actualDateRangeError = validateDateRange(data.actual_start_date, data.actual_end_date);
  if (actualDateRangeError) errors.actual_end_date = actualDateRangeError;

  // Project manager validation
  if (!data.project_manager_id) {
    errors.project_manager_id = 'Project manager is required';
  }

  // Branch validation
  if (!data.branch_id) {
    errors.branch_id = 'Branch is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate complete task form data
 * @param {Object} data - Task form data
 * @returns {Object} Object with isValid boolean and errors object
 */
export function validateTaskForm(data) {
  const errors = {};

  // Title validation
  const titleError = validateTaskTitle(data.title);
  if (titleError) errors.title = titleError;

  // Description validation
  const descError = validateDescription(data.description);
  if (descError) errors.description = descError;

  // Status validation
  const statusError = validateStatus(data.status, TASK_STATUSES);
  if (statusError) errors.status = statusError;

  // Priority validation
  const priorityError = validatePriority(data.priority, TASK_PRIORITIES);
  if (priorityError) errors.priority = priorityError;

  // Hours validation
  const estHoursError = validateHours(data.estimated_hours);
  if (estHoursError) errors.estimated_hours = estHoursError;

  const actualHoursError = validateHours(data.actual_hours);
  if (actualHoursError) errors.actual_hours = actualHoursError;

  // Date range validation
  const dateRangeError = validateDateRange(data.start_date, data.due_date);
  if (dateRangeError) errors.due_date = dateRangeError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
