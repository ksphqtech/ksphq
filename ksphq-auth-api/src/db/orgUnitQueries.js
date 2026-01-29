/**
 * Organizational Unit Database Queries
 * Handles CRUD operations for branches, departments, shifts, teams, and groups
 */

import { AppError, ConflictError, NotFoundError } from '../utils/errors.js';

const VALID_TYPES = ['branch', 'department', 'shift', 'team', 'group'];

/**
 * List organizational units
 * @param {object} db - Database connection
 * @param {object} options - Query options
 * @returns {Array} List of org units
 */
export async function listOrgUnits(db, options = {}) {
  const { type = null, parentId = null, includeInactive = false } = options;

  let query = `
    SELECT
      ou.*,
      p.name as parent_name,
      p.type as parent_type,
      COUNT(u.id) as user_count
    FROM organizational_units ou
    LEFT JOIN organizational_units p ON ou.parent_id = p.id
    LEFT JOIN users u ON (
      ou.id = u.branch_id OR
      ou.id = u.department_id OR
      ou.id = u.shift_id OR
      ou.id = u.team_id OR
      ou.id = u.group_id
    ) AND u.deleted_at IS NULL
    WHERE 1=1
  `;

  const bindings = [];

  if (type) {
    query += ' AND ou.type = ?';
    bindings.push(type);
  }

  if (parentId) {
    query += ' AND ou.parent_id = ?';
    bindings.push(parentId);
  }

  if (!includeInactive) {
    query += ' AND ou.is_active = 1';
  }

  query += ' GROUP BY ou.id ORDER BY ou.type, ou.name';

  const result = await db.prepare(query).bind(...bindings).all();

  return (result.results || []).map(unit => ({
    ...unit,
    metadata: unit.metadata ? JSON.parse(unit.metadata) : null,
  }));
}

/**
 * Get org unit by ID
 * @param {object} db - Database connection
 * @param {string} unitId - Org unit ID
 * @returns {object} Org unit object
 */
export async function getOrgUnitById(db, unitId) {
  const unit = await db
    .prepare(
      `SELECT
        ou.*,
        p.name as parent_name,
        p.type as parent_type,
        COUNT(u.id) as user_count
       FROM organizational_units ou
       LEFT JOIN organizational_units p ON ou.parent_id = p.id
       LEFT JOIN users u ON (
         ou.id = u.branch_id OR
         ou.id = u.department_id OR
         ou.id = u.shift_id OR
         ou.id = u.team_id OR
         ou.id = u.group_id
       ) AND u.deleted_at IS NULL
       WHERE ou.id = ?
       GROUP BY ou.id`
    )
    .bind(unitId)
    .first();

  if (!unit) {
    throw new NotFoundError('Organizational unit');
  }

  return {
    ...unit,
    metadata: unit.metadata ? JSON.parse(unit.metadata) : null,
  };
}

/**
 * Create a new org unit
 * @param {object} db - Database connection
 * @param {object} unitData - Org unit data
 * @param {string} createdBy - User ID creating the unit
 * @returns {object} Created org unit
 */
export async function createOrgUnit(db, unitData, createdBy) {
  const { type, name, code, parentId, metadata } = unitData;

  // Validate type
  if (!VALID_TYPES.includes(type)) {
    throw new AppError(`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`, 400);
  }

  // Check for duplicate name within same type
  const existing = await db
    .prepare(
      'SELECT id FROM organizational_units WHERE type = ? AND name = ? AND is_active = 1 COLLATE NOCASE'
    )
    .bind(type, name)
    .first();

  if (existing) {
    throw new ConflictError(`An active ${type} with this name already exists`);
  }

  // Validate parent relationship if provided
  if (parentId) {
    const parent = await getOrgUnitById(db, parentId);
    // Optional: Add validation for valid parent-child relationships
    // e.g., departments can be under branches, teams under departments, etc.
  }

  const metadataJson = metadata ? JSON.stringify(metadata) : null;

  const result = await db
    .prepare(
      `INSERT INTO organizational_units (type, name, code, parent_id, metadata, created_by)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING *`
    )
    .bind(type, name, code || null, parentId || null, metadataJson, createdBy)
    .first();

  return {
    ...result,
    metadata: result.metadata ? JSON.parse(result.metadata) : null,
  };
}

/**
 * Update an org unit
 * @param {object} db - Database connection
 * @param {string} unitId - Org unit ID
 * @param {object} updates - Fields to update
 * @param {string} updatedBy - User ID updating the unit
 * @returns {object} Updated org unit
 */
export async function updateOrgUnit(db, unitId, updates, updatedBy) {
  // Get existing unit
  const existingUnit = await getOrgUnitById(db, unitId);

  const fields = [];
  const values = [];

  if (updates.name !== undefined) {
    // Check for name conflicts
    const existing = await db
      .prepare(
        'SELECT id FROM organizational_units WHERE type = ? AND name = ? AND is_active = 1 AND id != ? COLLATE NOCASE'
      )
      .bind(existingUnit.type, updates.name, unitId)
      .first();

    if (existing) {
      throw new ConflictError(`An active ${existingUnit.type} with this name already exists`);
    }

    fields.push('name = ?');
    values.push(updates.name);
  }

  if (updates.code !== undefined) {
    fields.push('code = ?');
    values.push(updates.code || null);
  }

  if (updates.parentId !== undefined) {
    // Validate parent if changing
    if (updates.parentId) {
      const parent = await getOrgUnitById(db, updates.parentId);
      // Prevent setting self as parent
      if (updates.parentId === unitId) {
        throw new AppError('Cannot set unit as its own parent', 400);
      }
    }
    fields.push('parent_id = ?');
    values.push(updates.parentId || null);
  }

  if (updates.metadata !== undefined) {
    fields.push('metadata = ?');
    values.push(updates.metadata ? JSON.stringify(updates.metadata) : null);
  }

  if (updates.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.is_active ? 1 : 0);
  }

  if (fields.length === 0) {
    return existingUnit;
  }

  fields.push("updated_at = datetime('now')");
  fields.push('updated_by = ?');
  values.push(updatedBy);
  values.push(unitId);

  const result = await db
    .prepare(
      `UPDATE organizational_units
       SET ${fields.join(', ')}
       WHERE id = ?
       RETURNING *`
    )
    .bind(...values)
    .first();

  return {
    ...result,
    metadata: result.metadata ? JSON.parse(result.metadata) : null,
  };
}

/**
 * Delete an org unit
 * @param {object} db - Database connection
 * @param {string} unitId - Org unit ID
 * @throws {AppError} If unit has users assigned
 */
export async function deleteOrgUnit(db, unitId) {
  const unit = await getOrgUnitById(db, unitId);

  // Check if any users are assigned to this unit
  if (unit.user_count > 0) {
    throw new AppError(
      `Cannot delete ${unit.type} with ${unit.user_count} user(s) assigned. Reassign users first.`,
      400
    );
  }

  // Check if any units have this as parent
  const children = await db
    .prepare('SELECT COUNT(*) as count FROM organizational_units WHERE parent_id = ?')
    .bind(unitId)
    .first();

  if (children.count > 0) {
    throw new AppError(
      `Cannot delete ${unit.type} with ${children.count} child unit(s). Remove or reassign child units first.`,
      400
    );
  }

  await db
    .prepare('DELETE FROM organizational_units WHERE id = ?')
    .bind(unitId)
    .run();

  return { success: true };
}

/**
 * Get org units summary for statistics
 * @param {object} db - Database connection
 * @returns {object} Summary by type
 */
export async function getOrgUnitsSummary(db) {
  const result = await db
    .prepare(
      `SELECT
        type,
        COUNT(*) as count
       FROM organizational_units
       WHERE is_active = 1
       GROUP BY type
       ORDER BY type`
    )
    .all();

  const summary = {};
  VALID_TYPES.forEach(type => {
    summary[type] = 0;
  });

  (result.results || []).forEach(row => {
    summary[row.type] = row.count;
  });

  return summary;
}

/**
 * Get hierarchical tree of org units
 * @param {object} db - Database connection
 * @param {string} type - Type to filter by (optional)
 * @returns {Array} Hierarchical tree structure
 */
export async function getOrgUnitsTree(db, type = null) {
  let query = 'SELECT * FROM organizational_units WHERE is_active = 1';
  const bindings = [];

  if (type) {
    query += ' AND type = ?';
    bindings.push(type);
  }

  query += ' ORDER BY type, name';

  const result = await db.prepare(query).bind(...bindings).all();
  const units = (result.results || []).map(unit => ({
    ...unit,
    metadata: unit.metadata ? JSON.parse(unit.metadata) : null,
    children: [],
  }));

  // Build tree structure
  const unitMap = {};
  const roots = [];

  units.forEach(unit => {
    unitMap[unit.id] = unit;
  });

  units.forEach(unit => {
    if (unit.parent_id && unitMap[unit.parent_id]) {
      unitMap[unit.parent_id].children.push(unit);
    } else {
      roots.push(unit);
    }
  });

  return roots;
}
