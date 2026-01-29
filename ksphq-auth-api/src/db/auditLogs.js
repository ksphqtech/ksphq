/**
 * Enhanced Audit Logging System
 * Provides comprehensive tracking of all user management operations
 */

/**
 * Audit action definitions with categories and severity levels
 */
export const AUDIT_ACTIONS = {
  // User Management
  user_created: { category: 'user_management', severity: 'info' },
  user_updated: { category: 'user_management', severity: 'info' },
  user_deleted: { category: 'user_management', severity: 'critical' },
  user_reactivated: { category: 'user_management', severity: 'warning' },
  user_role_changed: { category: 'permissions', severity: 'warning' },

  // Password & Security
  password_reset: { category: 'security', severity: 'warning' },
  password_changed: { category: 'security', severity: 'info' },
  account_locked: { category: 'security', severity: 'warning' },
  account_unlocked: { category: 'security', severity: 'warning' },
  login_failed: { category: 'security', severity: 'warning' },
  login_success: { category: 'security', severity: 'info' },
  logout: { category: 'security', severity: 'info' },

  // Session Management
  session_created: { category: 'security', severity: 'info' },
  session_revoked: { category: 'security', severity: 'info' },
  all_sessions_revoked: { category: 'security', severity: 'warning' },

  // Role Management
  role_created: { category: 'permissions', severity: 'warning' },
  role_updated: { category: 'permissions', severity: 'warning' },
  role_deleted: { category: 'permissions', severity: 'critical' },

  // Org Unit Management
  org_unit_created: { category: 'organization', severity: 'info' },
  org_unit_updated: { category: 'organization', severity: 'info' },
  org_unit_deleted: { category: 'organization', severity: 'warning' },

  // Permission Changes
  permission_granted: { category: 'permissions', severity: 'warning' },
  permission_revoked: { category: 'permissions', severity: 'warning' },

  // Other
  other: { category: 'other', severity: 'info' },
};

/**
 * Create audit log entry with enhanced tracking
 * @param {object} db - Database connection
 * @param {object} params - Audit log parameters
 * @param {string} params.userId - User performing the action
 * @param {string} params.targetUserId - User being affected (optional)
 * @param {string} params.action - Action type (from AUDIT_ACTIONS)
 * @param {object} params.changes - Before/after changes (optional)
 * @param {string} params.details - Additional details (optional)
 * @param {string} params.ipAddress - IP address (optional)
 * @param {string} params.userAgent - User agent (optional)
 */
export async function createAuditLog(db, {
  userId,
  targetUserId = null,
  action,
  changes = null,
  details = null,
  ipAddress = null,
  userAgent = null,
}) {
  // Get action config or use default
  const config = AUDIT_ACTIONS[action] || AUDIT_ACTIONS.other;

  // Prepare changes JSON
  const changesJson = changes ? JSON.stringify(changes) : null;

  await db
    .prepare(
      `INSERT INTO audit_logs (
        user_id, target_user_id, action, category, severity,
        details, changes, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      userId || null,
      targetUserId,
      action,
      config.category,
      config.severity,
      details,
      changesJson,
      ipAddress,
      userAgent
    )
    .run();
}

/**
 * Generate field-level change tracking
 * @param {object} before - Object before changes
 * @param {object} after - Object after changes
 * @param {Array} sensitiveFields - Fields to redact (default: password-related)
 * @returns {object|null} Changes object or null if no changes
 */
export function generateChangesLog(before, after, sensitiveFields = ['password_hash', 'password_reset_required']) {
  const changes = {};

  for (const key in after) {
    if (after[key] !== before[key]) {
      changes[key] = {
        before: sensitiveFields.includes(key) ? '[REDACTED]' : before[key],
        after: sensitiveFields.includes(key) ? '[REDACTED]' : after[key],
      };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * Get audit logs for a user (what they did)
 * @param {object} db - Database connection
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @returns {Array} Audit log entries
 */
export async function getUserAuditLogs(db, userId, options = {}) {
  const {
    limit = 50,
    offset = 0,
    category = null,
    severity = null,
    startDate = null,
    endDate = null,
  } = options;

  let query = `
    SELECT
      al.*,
      u.email as user_email,
      tu.email as target_user_email,
      tu.first_name as target_first_name,
      tu.last_name as target_last_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    LEFT JOIN users tu ON al.target_user_id = tu.id
    WHERE al.user_id = ?
  `;

  const bindings = [userId];

  if (category) {
    query += ' AND al.category = ?';
    bindings.push(category);
  }

  if (severity) {
    query += ' AND al.severity = ?';
    bindings.push(severity);
  }

  if (startDate) {
    query += ' AND al.created_at >= ?';
    bindings.push(startDate);
  }

  if (endDate) {
    query += ' AND al.created_at <= ?';
    bindings.push(endDate);
  }

  query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  bindings.push(limit, offset);

  const result = await db.prepare(query).bind(...bindings).all();
  return result.results || [];
}

/**
 * Get audit logs about a user (what happened to them)
 * @param {object} db - Database connection
 * @param {string} targetUserId - Target user ID
 * @param {object} options - Query options
 * @returns {Array} Audit log entries
 */
export async function getTargetUserAuditLogs(db, targetUserId, options = {}) {
  const {
    limit = 50,
    offset = 0,
    category = null,
    severity = null,
    startDate = null,
    endDate = null,
  } = options;

  let query = `
    SELECT
      al.*,
      u.email as user_email,
      u.first_name as user_first_name,
      u.last_name as user_last_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.target_user_id = ?
  `;

  const bindings = [targetUserId];

  if (category) {
    query += ' AND al.category = ?';
    bindings.push(category);
  }

  if (severity) {
    query += ' AND al.severity = ?';
    bindings.push(severity);
  }

  if (startDate) {
    query += ' AND al.created_at >= ?';
    bindings.push(startDate);
  }

  if (endDate) {
    query += ' AND al.created_at <= ?';
    bindings.push(endDate);
  }

  query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  bindings.push(limit, offset);

  const result = await db.prepare(query).bind(...bindings).all();
  return result.results || [];
}

/**
 * Get all audit logs (admin only)
 * @param {object} db - Database connection
 * @param {object} options - Query options
 * @returns {Array} Audit log entries
 */
export async function getAllAuditLogs(db, options = {}) {
  const {
    limit = 100,
    offset = 0,
    category = null,
    severity = null,
    startDate = null,
    endDate = null,
    userId = null,
    targetUserId = null,
  } = options;

  let query = `
    SELECT
      al.*,
      u.email as user_email,
      u.first_name as user_first_name,
      u.last_name as user_last_name,
      tu.email as target_user_email,
      tu.first_name as target_first_name,
      tu.last_name as target_last_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    LEFT JOIN users tu ON al.target_user_id = tu.id
    WHERE 1=1
  `;

  const bindings = [];

  if (userId) {
    query += ' AND al.user_id = ?';
    bindings.push(userId);
  }

  if (targetUserId) {
    query += ' AND al.target_user_id = ?';
    bindings.push(targetUserId);
  }

  if (category) {
    query += ' AND al.category = ?';
    bindings.push(category);
  }

  if (severity) {
    query += ' AND al.severity = ?';
    bindings.push(severity);
  }

  if (startDate) {
    query += ' AND al.created_at >= ?';
    bindings.push(startDate);
  }

  if (endDate) {
    query += ' AND al.created_at <= ?';
    bindings.push(endDate);
  }

  query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  bindings.push(limit, offset);

  const result = await db.prepare(query).bind(...bindings).all();
  return result.results || [];
}

/**
 * Get audit log statistics
 * @param {object} db - Database connection
 * @param {object} options - Filter options
 * @returns {object} Statistics
 */
export async function getAuditLogStats(db, options = {}) {
  const { startDate = null, endDate = null } = options;

  let whereClause = 'WHERE 1=1';
  const bindings = [];

  if (startDate) {
    whereClause += ' AND created_at >= ?';
    bindings.push(startDate);
  }

  if (endDate) {
    whereClause += ' AND created_at <= ?';
    bindings.push(endDate);
  }

  const [totalCount, categoryStats, severityStats] = await Promise.all([
    // Total count
    db.prepare(`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`)
      .bind(...bindings)
      .first(),

    // By category
    db.prepare(`
      SELECT category, COUNT(*) as count
      FROM audit_logs
      ${whereClause}
      GROUP BY category
      ORDER BY count DESC
    `)
      .bind(...bindings)
      .all(),

    // By severity
    db.prepare(`
      SELECT severity, COUNT(*) as count
      FROM audit_logs
      ${whereClause}
      GROUP BY severity
      ORDER BY count DESC
    `)
      .bind(...bindings)
      .all(),
  ]);

  return {
    total: totalCount.count || 0,
    byCategory: categoryStats.results || [],
    bySeverity: severityStats.results || [],
  };
}

/**
 * Clean up old audit logs based on retention policy
 * - info: 90 days
 * - warning: 365 days
 * - critical: never (keep indefinitely)
 */
export async function cleanupOldAuditLogs(db) {
  const nineDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

  await db
    .prepare(`
      DELETE FROM audit_logs
      WHERE (severity = 'info' AND created_at < ?)
         OR (severity = 'warning' AND created_at < ?)
    `)
    .bind(nineDaysAgo, oneYearAgo)
    .run();
}
