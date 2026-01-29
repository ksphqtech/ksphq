/**
 * Role Management Database Queries
 * Handles CRUD operations for the roles system
 */

import { AppError, ConflictError, NotFoundError } from '../utils/errors.js';

/**
 * List all roles
 * @param {object} db - Database connection
 * @param {object} options - Query options
 * @returns {Array} List of roles
 */
export async function listRoles(db, options = {}) {
  const { includeInactive = false, sortBy = 'level', sortOrder = 'DESC' } = options;

  let query = `
    SELECT
      r.*,
      COUNT(u.id) as user_count
    FROM roles r
    LEFT JOIN users u ON r.id = u.role_id AND u.deleted_at IS NULL
  `;

  if (!includeInactive) {
    query += ' WHERE r.is_active = 1';
  }

  query += ` GROUP BY r.id ORDER BY r.${sortBy} ${sortOrder}`;

  const result = await db.prepare(query).all();

  return (result.results || []).map(role => ({
    ...role,
    permissions: role.permissions ? JSON.parse(role.permissions) : {},
  }));
}

/**
 * Get role by ID
 * @param {object} db - Database connection
 * @param {string} roleId - Role ID
 * @returns {object} Role object
 */
export async function getRoleById(db, roleId) {
  const role = await db
    .prepare(
      `SELECT
        r.*,
        COUNT(u.id) as user_count
       FROM roles r
       LEFT JOIN users u ON r.id = u.role_id AND u.deleted_at IS NULL
       WHERE r.id = ?
       GROUP BY r.id`
    )
    .bind(roleId)
    .first();

  if (!role) {
    throw new NotFoundError('Role');
  }

  return {
    ...role,
    permissions: role.permissions ? JSON.parse(role.permissions) : {},
  };
}

/**
 * Get role by name
 * @param {object} db - Database connection
 * @param {string} name - Role name
 * @returns {object|null} Role object or null
 */
export async function getRoleByName(db, name) {
  const role = await db
    .prepare('SELECT * FROM roles WHERE name = ? COLLATE NOCASE')
    .bind(name)
    .first();

  if (role && role.permissions) {
    role.permissions = JSON.parse(role.permissions);
  }

  return role;
}

/**
 * Create a new role
 * @param {object} db - Database connection
 * @param {object} roleData - Role data
 * @param {string} createdBy - User ID creating the role
 * @returns {object} Created role
 */
export async function createRole(db, roleData, createdBy) {
  const { name, level, description, permissions } = roleData;

  // Check if role name already exists
  const existing = await getRoleByName(db, name);
  if (existing) {
    throw new ConflictError('A role with this name already exists');
  }

  // Validate level range
  if (level < 1 || level > 100) {
    throw new AppError('Role level must be between 1 and 100', 400);
  }

  // Convert permissions object to JSON string
  const permissionsJson = JSON.stringify(permissions || {});

  const result = await db
    .prepare(
      `INSERT INTO roles (name, level, description, permissions, is_system_role, created_by)
       VALUES (?, ?, ?, ?, 0, ?)
       RETURNING *`
    )
    .bind(name, level, description || null, permissionsJson, createdBy)
    .first();

  return {
    ...result,
    permissions: JSON.parse(result.permissions),
  };
}

/**
 * Update a role
 * @param {object} db - Database connection
 * @param {string} roleId - Role ID
 * @param {object} updates - Fields to update
 * @param {string} updatedBy - User ID updating the role
 * @returns {object} Updated role
 */
export async function updateRole(db, roleId, updates, updatedBy) {
  // Get existing role
  const existingRole = await getRoleById(db, roleId);

  // Prevent changing name/level of system roles
  if (existingRole.is_system_role) {
    if (updates.name && updates.name !== existingRole.name) {
      throw new AppError('Cannot change name of system roles', 403);
    }
    if (updates.level && updates.level !== existingRole.level) {
      throw new AppError('Cannot change level of system roles', 403);
    }
  }

  const fields = [];
  const values = [];

  if (updates.name !== undefined) {
    // Check for name conflicts
    const existing = await getRoleByName(db, updates.name);
    if (existing && existing.id !== roleId) {
      throw new ConflictError('A role with this name already exists');
    }
    fields.push('name = ?');
    values.push(updates.name);
  }

  if (updates.level !== undefined) {
    if (updates.level < 1 || updates.level > 100) {
      throw new AppError('Role level must be between 1 and 100', 400);
    }
    fields.push('level = ?');
    values.push(updates.level);
  }

  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }

  if (updates.permissions !== undefined) {
    fields.push('permissions = ?');
    values.push(JSON.stringify(updates.permissions));
  }

  if (updates.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.is_active ? 1 : 0);
  }

  if (fields.length === 0) {
    return existingRole;
  }

  fields.push("updated_at = datetime('now')");
  fields.push('updated_by = ?');
  values.push(updatedBy);
  values.push(roleId);

  const result = await db
    .prepare(
      `UPDATE roles
       SET ${fields.join(', ')}
       WHERE id = ?
       RETURNING *`
    )
    .bind(...values)
    .first();

  return {
    ...result,
    permissions: JSON.parse(result.permissions),
  };
}

/**
 * Delete a role
 * @param {object} db - Database connection
 * @param {string} roleId - Role ID
 * @throws {AppError} If role is system role or has users assigned
 */
export async function deleteRole(db, roleId) {
  const role = await getRoleById(db, roleId);

  // Prevent deletion of system roles
  if (role.is_system_role) {
    throw new AppError('Cannot delete system roles', 403);
  }

  // Check if any users are assigned to this role
  if (role.user_count > 0) {
    throw new AppError(
      `Cannot delete role with ${role.user_count} user(s) assigned. Reassign users first.`,
      400
    );
  }

  await db
    .prepare('DELETE FROM roles WHERE id = ?')
    .bind(roleId)
    .run();

  return { success: true };
}

/**
 * Get roles summary for statistics
 * @param {object} db - Database connection
 * @returns {Array} Roles with user counts
 */
export async function getRolesSummary(db) {
  const result = await db
    .prepare(
      `SELECT
        r.id,
        r.name,
        r.level,
        COUNT(u.id) as user_count
       FROM roles r
       LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1 AND u.deleted_at IS NULL
       WHERE r.is_active = 1
       GROUP BY r.id
       ORDER BY r.level DESC`
    )
    .all();

  return result.results || [];
}
