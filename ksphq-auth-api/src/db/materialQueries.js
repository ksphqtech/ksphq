/**
 * Project Control - Database Query Functions for Materials
 * Material management for project tracking
 */

import { AppError, NotFoundError } from '../utils/errors.js';
import { createAuditLog, generateChangesLog } from './auditLogs.js';

/**
 * List materials for a project
 * @param {object} db - Database connection
 * @param {string} projectId - Project ID
 * @param {object} filters - Query filters
 * @returns {Array} List of materials
 */
export async function listMaterials(db, projectId, filters = {}) {
  const {
    status = null,
    category = null,
    sort = 'created_at:desc',
  } = filters;

  let query = `
    SELECT *
    FROM project_materials
    WHERE project_id = ?
  `;

  const bindings = [projectId];

  if (status) {
    query += ' AND status = ?';
    bindings.push(status);
  }

  if (category) {
    query += ' AND category = ?';
    bindings.push(category);
  }

  // Parse sorting
  const [sortField, sortOrder] = sort.split(':');
  const validSortFields = ['created_at', 'updated_at', 'name', 'status', 'category', 'quantity_needed', 'unit_cost'];
  const orderBy = validSortFields.includes(sortField) ? sortField : 'created_at';
  const order = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  query += ` ORDER BY ${orderBy} ${order}`;

  const result = await db.prepare(query).bind(...bindings).all();
  return result.results || [];
}

/**
 * Get material by ID
 * @param {object} db - Database connection
 * @param {string} materialId - Material ID
 * @returns {object} Material object
 */
export async function getMaterialById(db, materialId) {
  const query = `
    SELECT *
    FROM project_materials
    WHERE id = ?
  `;

  const material = await db.prepare(query).bind(materialId).first();

  if (!material) {
    throw new NotFoundError('Material');
  }

  return material;
}

/**
 * Create a new material
 * @param {object} db - Database connection
 * @param {string} projectId - Project ID
 * @param {object} data - Material data
 * @returns {object} Created material
 */
export async function createMaterial(db, projectId, data) {
  const {
    name,
    description = null,
    category = null,
    quantity_needed,
    quantity_received = 0,
    unit,
    unit_cost = null,
    status = 'not_ordered',
    notes = null,
  } = data;

  // Validate project exists
  const project = await db
    .prepare('SELECT id FROM projects WHERE id = ? AND deleted_at IS NULL')
    .bind(projectId)
    .first();

  if (!project) {
    throw new NotFoundError('Project');
  }

  // Validate required fields
  if (!name) {
    throw new AppError('Material name is required', 400);
  }

  if (quantity_needed === undefined || quantity_needed === null) {
    throw new AppError('Quantity needed is required', 400);
  }

  if (!unit) {
    throw new AppError('Unit is required', 400);
  }

  // Validate status
  const validStatuses = ['not_ordered', 'ordered', 'received', 'in_use'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid material status', 400);
  }

  // Validate quantities
  if (quantity_needed < 0) {
    throw new AppError('Quantity needed cannot be negative', 400);
  }

  if (quantity_received < 0) {
    throw new AppError('Quantity received cannot be negative', 400);
  }

  if (unit_cost !== null && unit_cost < 0) {
    throw new AppError('Unit cost cannot be negative', 400);
  }

  // Create material
  const result = await db
    .prepare(
      `INSERT INTO project_materials (
        project_id, name, description, category,
        quantity_needed, quantity_received, unit, unit_cost,
        status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
    )
    .bind(
      projectId,
      name,
      description,
      category,
      quantity_needed,
      quantity_received,
      unit,
      unit_cost,
      status,
      notes
    )
    .first();

  // Create audit log
  await createAuditLog(db, {
    userId: null, // Could be passed from handler if needed
    action: 'material_created',
    details: `Created material ${name} for project`,
    category: 'project_management',
    severity: 'info',
  });

  return result;
}

/**
 * Update material
 * @param {object} db - Database connection
 * @param {string} materialId - Material ID to update
 * @param {object} updates - Fields to update
 * @returns {object} Updated material
 */
export async function updateMaterial(db, materialId, updates) {
  // Get existing material for change tracking
  const before = await getMaterialById(db, materialId);

  const fields = [];
  const values = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }

  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }

  if (updates.category !== undefined) {
    fields.push('category = ?');
    values.push(updates.category);
  }

  if (updates.quantity_needed !== undefined) {
    if (updates.quantity_needed < 0) {
      throw new AppError('Quantity needed cannot be negative', 400);
    }
    fields.push('quantity_needed = ?');
    values.push(updates.quantity_needed);
  }

  if (updates.quantity_received !== undefined) {
    if (updates.quantity_received < 0) {
      throw new AppError('Quantity received cannot be negative', 400);
    }
    fields.push('quantity_received = ?');
    values.push(updates.quantity_received);
  }

  if (updates.unit !== undefined) {
    fields.push('unit = ?');
    values.push(updates.unit);
  }

  if (updates.unit_cost !== undefined) {
    if (updates.unit_cost !== null && updates.unit_cost < 0) {
      throw new AppError('Unit cost cannot be negative', 400);
    }
    fields.push('unit_cost = ?');
    values.push(updates.unit_cost);
  }

  if (updates.status !== undefined) {
    // Validate status
    const validStatuses = ['not_ordered', 'ordered', 'received', 'in_use'];
    if (!validStatuses.includes(updates.status)) {
      throw new AppError('Invalid material status', 400);
    }
    fields.push('status = ?');
    values.push(updates.status);
  }

  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes);
  }

  if (fields.length === 0) {
    return before;
  }

  // Add metadata fields
  fields.push("updated_at = datetime('now')");
  values.push(materialId);

  await db
    .prepare(
      `UPDATE project_materials
       SET ${fields.join(', ')}
       WHERE id = ?`
    )
    .bind(...values)
    .run();

  // Get updated material
  const after = await getMaterialById(db, materialId);

  // Generate change log
  const changes = generateChangesLog(before, updates);

  // Create audit log
  await createAuditLog(db, {
    userId: null, // Could be passed from handler if needed
    action: 'material_updated',
    changes,
    details: `Updated material ${after.name}`,
    category: 'project_management',
    severity: 'info',
  });

  return after;
}

/**
 * Delete a material
 * @param {object} db - Database connection
 * @param {string} materialId - Material ID to delete
 */
export async function deleteMaterial(db, materialId) {
  const material = await getMaterialById(db, materialId);

  // Hard delete
  await db
    .prepare('DELETE FROM project_materials WHERE id = ?')
    .bind(materialId)
    .run();

  // Create audit log
  await createAuditLog(db, {
    userId: null, // Could be passed from handler if needed
    action: 'material_deleted',
    details: `Deleted material ${material.name}`,
    category: 'project_management',
    severity: 'warning',
  });
}
