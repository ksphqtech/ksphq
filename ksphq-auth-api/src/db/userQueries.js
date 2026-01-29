/**
 * Enhanced User Management Database Queries
 * Comprehensive CRUD operations for enterprise user management
 */

import bcrypt from 'bcryptjs';
import { AppError, ConflictError, NotFoundError } from '../utils/errors.js';
import { generateSecurePassword, savePasswordHistory, calculatePasswordExpiry } from '../utils/passwordPolicy.js';
import { applyScopeToQuery } from '../middleware/permissions.js';
import { createAuditLog, generateChangesLog } from './auditLogs.js';

/**
 * List users with filtering, sorting, and pagination
 * @param {object} db - Database connection
 * @param {object} currentUser - Current authenticated user (for scoping)
 * @param {object} options - Query options
 * @returns {object} Paginated user list with metadata
 */
export async function listUsers(db, currentUser, options = {}) {
  const {
    role_id = null,
    branch_id = null,
    department_id = null,
    team_id = null,
    is_active = null,
    include_deleted = false,
    search = null,
    sort = 'created_at:desc',
    page = 1,
    limit = 50,
  } = options;

  // Base query
  let baseQuery = `
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN organizational_units b ON u.branch_id = b.id
    LEFT JOIN organizational_units d ON u.department_id = d.id
    LEFT JOIN organizational_units t ON u.team_id = t.id
    LEFT JOIN users m ON u.manager_id = m.id
    WHERE 1=1
  `;

  const bindings = [];

  // Apply role-based scoping
  const scoped = applyScopeToQuery(currentUser, baseQuery, bindings);
  baseQuery = scoped.query.replace('WHERE 1=1', '');
  bindings.push(...scoped.bindings);

  // Filters
  if (role_id) {
    baseQuery += ' AND u.role_id = ?';
    bindings.push(role_id);
  }

  if (branch_id) {
    baseQuery += ' AND u.branch_id = ?';
    bindings.push(branch_id);
  }

  if (department_id) {
    baseQuery += ' AND u.department_id = ?';
    bindings.push(department_id);
  }

  if (team_id) {
    baseQuery += ' AND u.team_id = ?';
    bindings.push(team_id);
  }

  if (is_active !== null) {
    baseQuery += ' AND u.is_active = ?';
    bindings.push(is_active ? 1 : 0);
  }

  if (!include_deleted) {
    baseQuery += ' AND u.deleted_at IS NULL';
  }

  // Search
  if (search) {
    baseQuery += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone_number LIKE ? OR u.employee_id LIKE ?)';
    const searchTerm = `%${search}%`;
    bindings.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Count total
  const countResult = await db
    .prepare(`SELECT COUNT(*) as total ${baseQuery}`)
    .bind(...bindings)
    .first();

  const total = countResult.total;

  // Parse sorting
  const [sortField, sortOrder] = sort.split(':');
  const validSortFields = ['created_at', 'first_name', 'last_name', 'email', 'last_login_at'];
  const orderBy = validSortFields.includes(sortField) ? sortField : 'created_at';
  const order = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Fetch paginated results
  const offset = (page - 1) * limit;
  const query = `
    SELECT
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      u.phone_number,
      u.employee_id,
      u.title,
      u.is_active,
      u.last_login_at,
      u.created_at,
      u.deleted_at,
      r.id as role_id,
      r.name as role_name,
      r.level as role_level,
      b.name as branch_name,
      d.name as department_name,
      t.name as team_name,
      m.first_name || ' ' || m.last_name as manager_name
    ${baseQuery}
    ORDER BY u.${orderBy} ${order}
    LIMIT ? OFFSET ?
  `;

  bindings.push(limit, offset);
  const result = await db.prepare(query).bind(...bindings).all();

  return {
    users: result.results || [],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get user by ID with full details
 * @param {object} db - Database connection
 * @param {string} userId - User ID
 * @param {boolean} includeDeleted - Include soft-deleted users
 * @returns {object} User object with joined data
 */
export async function getUserById(db, userId, includeDeleted = false) {
  let query = `
    SELECT
      u.*,
      r.name as role_name,
      r.level as role_level,
      r.permissions as role_permissions,
      b.name as branch_name,
      d.name as department_name,
      s.name as shift_name,
      t.name as team_name,
      g.name as group_name,
      m.first_name || ' ' || m.last_name as manager_name,
      m.email as manager_email,
      cb.first_name || ' ' || cb.last_name as created_by_name,
      mb.first_name || ' ' || mb.last_name as modified_by_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN organizational_units b ON u.branch_id = b.id
    LEFT JOIN organizational_units d ON u.department_id = d.id
    LEFT JOIN organizational_units s ON u.shift_id = s.id
    LEFT JOIN organizational_units t ON u.team_id = t.id
    LEFT JOIN organizational_units g ON u.group_id = g.id
    LEFT JOIN users m ON u.manager_id = m.id
    LEFT JOIN users cb ON u.created_by = cb.id
    LEFT JOIN users mb ON u.last_modified_by = mb.id
    WHERE u.id = ?
  `;

  if (!includeDeleted) {
    query += ' AND u.deleted_at IS NULL';
  }

  const user = await db.prepare(query).bind(userId).first();

  if (!user) {
    throw new NotFoundError('User');
  }

  // Parse JSON fields
  if (user.role_permissions) {
    user.role_permissions = JSON.parse(user.role_permissions);
  }

  // Don't return password hash
  delete user.password_hash;

  return user;
}

/**
 * Create a new user
 * @param {object} db - Database connection
 * @param {object} userData - User data
 * @param {string} createdBy - User ID creating this user
 * @returns {object} Created user with generated password (if applicable)
 */
export async function createUser(db, userData, createdBy) {
  const {
    first_name,
    last_name,
    email,
    phone_number,
    employee_id,
    title,
    role_id,
    branch_id,
    department_id,
    shift_id,
    team_id,
    group_id,
    manager_id,
    password_option = 'auto', // 'auto', 'manual', 'email'
    password = null,
    idle_timeout_minutes = 60,
    account_expires_at = null,
  } = userData;

  // Check email uniqueness
  const existingUser = await db
    .prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE')
    .bind(email)
    .first();

  if (existingUser) {
    throw new ConflictError('Email already in use');
  }

  // Check employee_id uniqueness if provided
  if (employee_id) {
    const existingEmpId = await db
      .prepare('SELECT id FROM users WHERE employee_id = ?')
      .bind(employee_id)
      .first();

    if (existingEmpId) {
      throw new ConflictError('Employee ID already in use');
    }
  }

  // Generate or hash password
  let passwordHash;
  let generatedPassword = null;

  if (password_option === 'auto') {
    generatedPassword = generateSecurePassword();
    passwordHash = await bcrypt.hash(generatedPassword, 10);
  } else if (password_option === 'manual' && password) {
    passwordHash = await bcrypt.hash(password, 10);
  } else {
    // Email option - generate temp password for now
    generatedPassword = generateSecurePassword();
    passwordHash = await bcrypt.hash(generatedPassword, 10);
  }

  // Calculate password expiry
  const password_changed_at = new Date().toISOString();
  const password_expires_at = calculatePasswordExpiry(password_changed_at);

  // Create user
  const result = await db
    .prepare(
      `INSERT INTO users (
        email, password_hash, first_name, last_name,
        phone_number, employee_id, title,
        role_id, branch_id, department_id, shift_id, team_id, group_id,
        manager_id, idle_timeout_minutes, password_changed_at, password_expires_at,
        account_expires_at, created_by, password_reset_required
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id, email, first_name, last_name, role_id, created_at`
    )
    .bind(
      email,
      passwordHash,
      first_name,
      last_name,
      phone_number || null,
      employee_id || null,
      title || null,
      role_id,
      branch_id || null,
      department_id || null,
      shift_id || null,
      team_id || null,
      group_id || null,
      manager_id || null,
      idle_timeout_minutes,
      password_changed_at,
      password_expires_at,
      account_expires_at || null,
      createdBy,
      password_option === 'auto' || password_option === 'email' ? 1 : 0
    )
    .first();

  // Save password to history
  await savePasswordHistory(db, result.id, passwordHash);

  // Create audit log
  await createAuditLog(db, {
    userId: createdBy,
    targetUserId: result.id,
    action: 'user_created',
    details: `Created user ${first_name} ${last_name} (${email})`,
  });

  // Return user with generated password if applicable
  return {
    ...result,
    generatedPassword,
  };
}

/**
 * Update user
 * @param {object} db - Database connection
 * @param {string} userId - User ID to update
 * @param {object} updates - Fields to update
 * @param {string} updatedBy - User ID making the update
 * @returns {object} Updated user
 */
export async function updateUser(db, userId, updates, updatedBy) {
  // Get existing user for change tracking
  const before = await getUserById(db, userId, true);

  const fields = [];
  const values = [];

  if (updates.first_name !== undefined) {
    fields.push('first_name = ?');
    values.push(updates.first_name);
  }

  if (updates.last_name !== undefined) {
    fields.push('last_name = ?');
    values.push(updates.last_name);
  }

  if (updates.email !== undefined) {
    // Check uniqueness
    const existing = await db
      .prepare('SELECT id FROM users WHERE email = ? AND id != ? COLLATE NOCASE')
      .bind(updates.email, userId)
      .first();

    if (existing) {
      throw new ConflictError('Email already in use');
    }

    fields.push('email = ?');
    values.push(updates.email);
  }

  if (updates.phone_number !== undefined) {
    fields.push('phone_number = ?');
    values.push(updates.phone_number || null);
  }

  if (updates.employee_id !== undefined) {
    if (updates.employee_id) {
      const existing = await db
        .prepare('SELECT id FROM users WHERE employee_id = ? AND id != ?')
        .bind(updates.employee_id, userId)
        .first();

      if (existing) {
        throw new ConflictError('Employee ID already in use');
      }
    }

    fields.push('employee_id = ?');
    values.push(updates.employee_id || null);
  }

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title || null);
  }

  if (updates.role_id !== undefined) {
    fields.push('role_id = ?');
    values.push(updates.role_id);
  }

  if (updates.branch_id !== undefined) {
    fields.push('branch_id = ?');
    values.push(updates.branch_id || null);
  }

  if (updates.department_id !== undefined) {
    fields.push('department_id = ?');
    values.push(updates.department_id || null);
  }

  if (updates.shift_id !== undefined) {
    fields.push('shift_id = ?');
    values.push(updates.shift_id || null);
  }

  if (updates.team_id !== undefined) {
    fields.push('team_id = ?');
    values.push(updates.team_id || null);
  }

  if (updates.group_id !== undefined) {
    fields.push('group_id = ?');
    values.push(updates.group_id || null);
  }

  if (updates.manager_id !== undefined) {
    fields.push('manager_id = ?');
    values.push(updates.manager_id || null);
  }

  if (updates.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.is_active ? 1 : 0);
  }

  if (updates.idle_timeout_minutes !== undefined) {
    fields.push('idle_timeout_minutes = ?');
    values.push(updates.idle_timeout_minutes);
  }

  if (updates.account_expires_at !== undefined) {
    fields.push('account_expires_at = ?');
    values.push(updates.account_expires_at || null);
  }

  if (fields.length === 0) {
    return before;
  }

  // Add metadata fields
  fields.push("last_modified_at = datetime('now')");
  fields.push('last_modified_by = ?');
  values.push(updatedBy);
  values.push(userId);

  await db
    .prepare(
      `UPDATE users
       SET ${fields.join(', ')}
       WHERE id = ?`
    )
    .bind(...values)
    .run();

  // Get updated user
  const after = await getUserById(db, userId);

  // Generate change log
  const changes = generateChangesLog(before, updates);

  // Create audit log
  await createAuditLog(db, {
    userId: updatedBy,
    targetUserId: userId,
    action: updates.role_id !== before.role_id ? 'user_role_changed' : 'user_updated',
    changes,
    details: `Updated user ${after.first_name} ${after.last_name}`,
  });

  return after;
}

/**
 * Soft delete a user
 * @param {object} db - Database connection
 * @param {string} userId - User ID to delete
 * @param {string} deletedBy - User ID performing deletion
 */
export async function softDeleteUser(db, userId, deletedBy) {
  const user = await getUserById(db, userId);

  // Prevent self-deletion
  if (userId === deletedBy) {
    throw new AppError('Cannot delete your own account', 403);
  }

  // Prevent deleting last admin
  if (user.role_level >= 100) {
    const adminCount = await db
      .prepare(
        `SELECT COUNT(*) as count FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE r.level >= 100 AND u.is_active = 1 AND u.deleted_at IS NULL AND u.id != ?`
      )
      .bind(userId)
      .first();

    if (adminCount.count === 0) {
      throw new AppError('Cannot delete the last active administrator', 403);
    }
  }

  // Soft delete
  await db
    .prepare(
      `UPDATE users SET
        is_active = 0,
        deleted_at = datetime('now'),
        deleted_by = ?
       WHERE id = ?`
    )
    .bind(deletedBy, userId)
    .run();

  // Revoke all sessions
  await db
    .prepare(`UPDATE user_sessions SET revoked_at = datetime('now') WHERE user_id = ?`)
    .bind(userId)
    .run();

  // Revoke all refresh tokens
  await db
    .prepare(`UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE user_id = ?`)
    .bind(userId)
    .run();

  // Create audit log
  await createAuditLog(db, {
    userId: deletedBy,
    targetUserId: userId,
    action: 'user_deleted',
    details: `Soft deleted user ${user.first_name} ${user.last_name} (${user.email})`,
  });
}

/**
 * Reactivate a soft-deleted user
 * @param {object} db - Database connection
 * @param {string} userId - User ID to reactivate
 * @param {string} reactivatedBy - User ID performing reactivation
 */
export async function reactivateUser(db, userId, reactivatedBy) {
  const user = await getUserById(db, userId, true);

  if (!user.deleted_at) {
    throw new AppError('User is not deleted', 400);
  }

  await db
    .prepare(
      `UPDATE users SET
        is_active = 1,
        deleted_at = NULL,
        deleted_by = NULL,
        password_reset_required = 1
       WHERE id = ?`
    )
    .bind(userId)
    .run();

  // Create audit log
  await createAuditLog(db, {
    userId: reactivatedBy,
    targetUserId: userId,
    action: 'user_reactivated',
    details: `Reactivated user ${user.first_name} ${user.last_name} (${user.email})`,
  });
}

/**
 * Reset user password (admin function)
 * @param {object} db - Database connection
 * @param {string} userId - User ID
 * @param {object} options - Password reset options
 * @param {string} resetBy - User ID performing reset
 * @returns {string|null} Generated password if auto-generated
 */
export async function resetUserPassword(db, userId, options, resetBy) {
  const { passwordOption = 'auto', password = null, requireChange = true } = options;

  const user = await getUserById(db, userId);

  let passwordHash;
  let generatedPassword = null;

  if (passwordOption === 'auto') {
    generatedPassword = generateSecurePassword();
    passwordHash = await bcrypt.hash(generatedPassword, 10);
  } else if (passwordOption === 'manual' && password) {
    passwordHash = await bcrypt.hash(password, 10);
  } else {
    throw new AppError('Invalid password option', 400);
  }

  const password_changed_at = new Date().toISOString();
  const password_expires_at = calculatePasswordExpiry(password_changed_at);

  await db
    .prepare(
      `UPDATE users SET
        password_hash = ?,
        password_changed_at = ?,
        password_expires_at = ?,
        password_reset_required = ?,
        failed_login_count = 0,
        locked_until = NULL
       WHERE id = ?`
    )
    .bind(
      passwordHash,
      password_changed_at,
      password_expires_at,
      requireChange ? 1 : 0,
      userId
    )
    .run();

  // Save to password history
  await savePasswordHistory(db, userId, passwordHash);

  // Create audit log
  await createAuditLog(db, {
    userId: resetBy,
    targetUserId: userId,
    action: 'password_reset',
    details: `Admin reset password for ${user.first_name} ${user.last_name}`,
  });

  return generatedPassword;
}

/**
 * Get deleted users (admin only)
 * @param {object} db - Database connection
 * @returns {Array} Deleted users
 */
export async function getDeletedUsers(db) {
  const result = await db
    .prepare(
      `SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.deleted_at,
        r.name as role_name,
        d.name as department_name,
        db.first_name || ' ' || db.last_name as deleted_by_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN organizational_units d ON u.department_id = d.id
       LEFT JOIN users db ON u.deleted_by = db.id
       WHERE u.deleted_at IS NOT NULL
       ORDER BY u.deleted_at DESC`
    )
    .all();

  return result.results || [];
}

/**
 * Bulk deactivate users
 * @param {object} db - Database connection
 * @param {Array} userIds - Array of user IDs
 * @param {string} deactivatedBy - User ID performing deactivation
 */
export async function bulkDeactivateUsers(db, userIds, deactivatedBy) {
  if (!userIds || userIds.length === 0) {
    throw new AppError('No users specified', 400);
  }

  // Prevent self-deactivation
  if (userIds.includes(deactivatedBy)) {
    throw new AppError('Cannot deactivate your own account', 403);
  }

  const placeholders = userIds.map(() => '?').join(',');

  // Soft delete all users
  await db
    .prepare(
      `UPDATE users SET
        is_active = 0,
        deleted_at = datetime('now'),
        deleted_by = ?
       WHERE id IN (${placeholders}) AND id != ?`
    )
    .bind(deactivatedBy, ...userIds, deactivatedBy)
    .run();

  // Revoke all their sessions
  await db
    .prepare(
      `UPDATE user_sessions SET revoked_at = datetime('now')
       WHERE user_id IN (${placeholders})`
    )
    .bind(...userIds)
    .run();

  // Create audit log
  await createAuditLog(db, {
    userId: deactivatedBy,
    action: 'user_deleted',
    details: `Bulk deactivated ${userIds.length} users`,
  });
}
