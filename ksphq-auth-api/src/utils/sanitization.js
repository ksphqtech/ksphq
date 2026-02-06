/**
 * Input Sanitization Utilities
 * Utilities for sanitizing and cleaning user input to prevent XSS and injection attacks
 */

/**
 * Strip HTML tags from string
 * Prevents XSS attacks by removing all HTML tags
 */
export function stripHtmlTags(input) {
  if (typeof input !== 'string') return input;

  // Remove HTML tags using regex
  // This is a simple approach - for more complex needs, use a library like DOMPurify
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Trim and normalize whitespace
 * Removes leading/trailing whitespace and normalizes internal whitespace
 */
export function normalizeWhitespace(input) {
  if (typeof input !== 'string') return input;

  return input
    .trim()
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Remove zero-width spaces and other invisible characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
}

/**
 * Normalize unicode characters
 * Converts lookalike unicode characters to their ASCII equivalents
 */
export function normalizeUnicode(input) {
  if (typeof input !== 'string') return input;

  // Normalize to NFD form (decomposed) and remove combining marks
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Check for SQL injection patterns
 * Returns true if potentially dangerous SQL patterns are detected
 */
export function containsSqlInjectionPatterns(input) {
  if (typeof input !== 'string') return false;

  const dangerousPatterns = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(\bEXEC\b|\bEXECUTE\b)/i,
    /(--|#|\/\*|\*\/)/,  // SQL comment markers
    /(\bOR\b.*=.*)/i,    // OR 1=1 style injections
    /('.*--)/,           // Quote followed by comment
  ];

  return dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Check for XSS patterns
 * Returns true if potentially dangerous XSS patterns are detected
 */
export function containsXssPatterns(input) {
  if (typeof input !== 'string') return false;

  const dangerousPatterns = [
    /<script\b[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,  // onclick, onload, etc.
    /<iframe\b[^>]*>/i,
    /<object\b[^>]*>/i,
    /<embed\b[^>]*>/i,
    /data:text\/html/i,
  ];

  return dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitize text input
 * Applies multiple sanitization techniques to text input
 */
export function sanitizeTextInput(input) {
  if (typeof input !== 'string') return input;
  if (!input) return input;

  let sanitized = input;

  // Strip HTML tags
  sanitized = stripHtmlTags(sanitized);

  // Normalize whitespace
  sanitized = normalizeWhitespace(sanitized);

  // Normalize unicode
  sanitized = normalizeUnicode(sanitized);

  return sanitized;
}

/**
 * Validate and sanitize an object's string fields
 * Recursively sanitizes all string values in an object
 */
export function sanitizeObject(obj, options = {}) {
  const {
    stripHtml = true,
    normalizeSpace = true,
    normalizeUnicode = true,
    checkInjection = true,
    fieldsToSkip = [],
  } = options;

  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip fields that shouldn't be sanitized
    if (fieldsToSkip.includes(key)) {
      sanitized[key] = value;
      continue;
    }

    // Handle strings
    if (typeof value === 'string') {
      let sanitizedValue = value;

      // Check for injection patterns if enabled
      if (checkInjection) {
        if (containsSqlInjectionPatterns(value)) {
          throw new Error(`Potentially dangerous SQL pattern detected in field: ${key}`);
        }
        if (containsXssPatterns(value)) {
          throw new Error(`Potentially dangerous XSS pattern detected in field: ${key}`);
        }
      }

      // Apply sanitization
      if (stripHtml) {
        sanitizedValue = stripHtmlTags(sanitizedValue);
      }
      if (normalizeSpace) {
        sanitizedValue = normalizeWhitespace(sanitizedValue);
      }
      if (normalizeUnicode) {
        sanitizedValue = normalizeUnicode(sanitizedValue);
      }

      sanitized[key] = sanitizedValue;
    }
    // Recursively handle nested objects
    else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, options);
    }
    // Copy other types as-is
    else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize project data
 * Applies project-specific sanitization rules
 */
export function sanitizeProjectData(data) {
  return sanitizeObject(data, {
    stripHtml: true,
    normalizeSpace: true,
    normalizeUnicode: true,
    checkInjection: true,
    // Don't sanitize IDs and timestamps
    fieldsToSkip: ['id', 'project_id', 'branch_id', 'project_manager_id',
                   'created_by', 'updated_by', 'created_at', 'updated_at'],
  });
}

/**
 * Sanitize task data
 * Applies task-specific sanitization rules
 */
export function sanitizeTaskData(data) {
  return sanitizeObject(data, {
    stripHtml: true,
    normalizeSpace: true,
    normalizeUnicode: true,
    checkInjection: true,
    // Don't sanitize IDs and timestamps
    fieldsToSkip: ['id', 'task_id', 'project_id', 'assigned_to', 'parent_task_id',
                   'created_by', 'updated_by', 'created_at', 'updated_at'],
  });
}

/**
 * Sanitize material data
 * Applies material-specific sanitization rules
 */
export function sanitizeMaterialData(data) {
  return sanitizeObject(data, {
    stripHtml: true,
    normalizeSpace: true,
    normalizeUnicode: true,
    checkInjection: true,
    // Don't sanitize IDs and timestamps
    fieldsToSkip: ['id', 'project_id', 'created_at', 'updated_at'],
  });
}
