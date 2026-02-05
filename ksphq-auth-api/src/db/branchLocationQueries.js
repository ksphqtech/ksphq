/**
 * Branch Location Database Queries
 * Functions for managing branch locations (multi-location support)
 */

import { AppError, NotFoundError } from '../utils/errors.js';

/**
 * List all locations for a branch
 * @param {object} db - Database connection
 * @param {string} branchId - Branch ID
 * @param {boolean} includeInactive - Include inactive locations
 * @returns {Promise<Array>} Array of locations
 */
export async function listBranchLocations(db, branchId, includeInactive = false) {
  let query = `
    SELECT
      bl.*,
      cu.first_name || ' ' || cu.last_name as created_by_name,
      uu.first_name || ' ' || uu.last_name as updated_by_name
    FROM branch_locations bl
    LEFT JOIN users cu ON bl.created_by = cu.id
    LEFT JOIN users uu ON bl.updated_by = uu.id
    WHERE bl.branch_id = ?
  `;

  const bindings = [branchId];

  if (!includeInactive) {
    query += ' AND bl.is_active = 1';
  }

  query += ' ORDER BY bl.is_primary DESC, bl.location_name ASC';

  const result = await db.prepare(query).bind(...bindings).all();
  return result.results || [];
}

/**
 * Get a single location by ID
 * @param {object} db - Database connection
 * @param {string} locationId - Location ID
 * @returns {Promise<Object|null>} Location object or null
 */
export async function getLocationById(db, locationId) {
  const query = `
    SELECT
      bl.*,
      ou.name as branch_name,
      cu.first_name || ' ' || cu.last_name as created_by_name,
      uu.first_name || ' ' || uu.last_name as updated_by_name
    FROM branch_locations bl
    LEFT JOIN organizational_units ou ON bl.branch_id = ou.id
    LEFT JOIN users cu ON bl.created_by = cu.id
    LEFT JOIN users uu ON bl.updated_by = uu.id
    WHERE bl.id = ?
  `;

  const location = await db.prepare(query).bind(locationId).first();

  if (!location) {
    throw new NotFoundError('Branch location');
  }

  return location;
}

/**
 * Create a new branch location
 * @param {object} db - Database connection
 * @param {Object} locationData - Location data
 * @param {string} createdBy - User ID creating the location
 * @returns {Promise<Object>} Created location
 */
export async function createBranchLocation(db, locationData, createdBy) {
  // Verify branch exists and is of type 'branch'
  const branch = await db
    .prepare('SELECT id, type FROM organizational_units WHERE id = ? AND type = "branch"')
    .bind(locationData.branch_id)
    .first();

  if (!branch) {
    throw new AppError('Branch not found or invalid type', 404);
  }

  let isPrimary = locationData.is_primary ? 1 : 0;

  // If this is set as primary, unset any existing primary
  if (isPrimary) {
    await db
      .prepare('UPDATE branch_locations SET is_primary = 0 WHERE branch_id = ? AND is_active = 1')
      .bind(locationData.branch_id)
      .run();
  } else {
    // If no locations exist yet, force this one to be primary
    const existingCount = await db
      .prepare('SELECT COUNT(*) as count FROM branch_locations WHERE branch_id = ? AND is_active = 1')
      .bind(locationData.branch_id)
      .first();

    if (existingCount.count === 0) {
      isPrimary = 1;
    }
  }

  const query = `
    INSERT INTO branch_locations (
      branch_id, location_name, address_line1, address_line2,
      city, state_province, postal_code, country,
      is_primary, latitude, longitude, notes,
      created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `;

  const result = await db
    .prepare(query)
    .bind(
      locationData.branch_id,
      locationData.location_name,
      locationData.address_line1,
      locationData.address_line2 || null,
      locationData.city,
      locationData.state_province || null,
      locationData.postal_code || null,
      locationData.country || 'USA',
      isPrimary,
      locationData.latitude || null,
      locationData.longitude || null,
      locationData.notes || null,
      createdBy,
      createdBy
    )
    .first();

  return result;
}

/**
 * Update a branch location
 * @param {object} db - Database connection
 * @param {string} locationId - Location ID
 * @param {Object} updates - Update data
 * @param {string} updatedBy - User ID updating the location
 * @returns {Promise<Object>} Updated location
 */
export async function updateBranchLocation(db, locationId, updates, updatedBy) {
  // Get current location
  const location = await getLocationById(db, locationId);

  // If setting as primary, unset other primary locations for this branch
  if (updates.is_primary === true) {
    await db
      .prepare(
        'UPDATE branch_locations SET is_primary = 0 WHERE branch_id = ? AND id != ? AND is_active = 1'
      )
      .bind(location.branch_id, locationId)
      .run();
  }

  // Build dynamic update query
  const fields = [];
  const values = [];

  const allowedFields = [
    'location_name',
    'address_line1',
    'address_line2',
    'city',
    'state_province',
    'postal_code',
    'country',
    'is_primary',
    'latitude',
    'longitude',
    'notes',
    'is_active',
  ];

  for (const field of allowedFields) {
    if (updates.hasOwnProperty(field)) {
      fields.push(`${field} = ?`);
      values.push(updates[field]);
    }
  }

  if (fields.length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  // Add updated_at and updated_by
  fields.push('updated_at = datetime("now")');
  fields.push('updated_by = ?');
  values.push(updatedBy);
  values.push(locationId);

  const query = `
    UPDATE branch_locations
    SET ${fields.join(', ')}
    WHERE id = ?
    RETURNING *
  `;

  const result = await db.prepare(query).bind(...values).first();
  return result;
}

/**
 * Delete a branch location (soft delete)
 * @param {object} db - Database connection
 * @param {string} locationId - Location ID
 * @returns {Promise<void>}
 */
export async function deleteBranchLocation(db, locationId) {
  const location = await getLocationById(db, locationId);

  // Check if this is the only active location
  const activeLocationsResult = await db
    .prepare('SELECT id FROM branch_locations WHERE branch_id = ? AND is_active = 1')
    .bind(location.branch_id)
    .all();

  const activeLocations = activeLocationsResult.results || [];

  if (activeLocations.length === 1 && activeLocations[0].id === locationId) {
    throw new AppError('Cannot delete the last active location for a branch', 400);
  }

  // If deleting the primary location, set another active location as primary
  if (location.is_primary) {
    const otherLocation = await db
      .prepare(
        'SELECT id FROM branch_locations WHERE branch_id = ? AND id != ? AND is_active = 1 LIMIT 1'
      )
      .bind(location.branch_id, locationId)
      .first();

    if (otherLocation) {
      await db
        .prepare('UPDATE branch_locations SET is_primary = 1 WHERE id = ?')
        .bind(otherLocation.id)
        .run();
    }
  }

  // Soft delete
  await db
    .prepare('UPDATE branch_locations SET is_active = 0, updated_at = datetime("now") WHERE id = ?')
    .bind(locationId)
    .run();

  return { success: true };
}

/**
 * Set a location as the primary location for its branch
 * @param {object} db - Database connection
 * @param {string} branchId - Branch ID
 * @param {string} locationId - Location ID to set as primary
 * @returns {Promise<Object>} Updated location
 */
export async function setPrimaryLocation(db, branchId, locationId) {
  // Verify location exists and belongs to the branch
  const location = await db
    .prepare('SELECT id, branch_id, is_active FROM branch_locations WHERE id = ? AND branch_id = ?')
    .bind(locationId, branchId)
    .first();

  if (!location) {
    throw new AppError('Location not found or does not belong to this branch', 404);
  }

  if (!location.is_active) {
    throw new AppError('Cannot set an inactive location as primary', 400);
  }

  // Unset all other primary locations for this branch
  await db
    .prepare('UPDATE branch_locations SET is_primary = 0 WHERE branch_id = ? AND is_active = 1')
    .bind(branchId)
    .run();

  // Set this location as primary
  const result = await db
    .prepare(
      'UPDATE branch_locations SET is_primary = 1, updated_at = datetime("now") WHERE id = ? RETURNING *'
    )
    .bind(locationId)
    .first();

  return result;
}

/**
 * Get location count for a branch
 * @param {object} db - Database connection
 * @param {string} branchId - Branch ID
 * @returns {Promise<number>} Count of active locations
 */
export async function getBranchLocationCount(db, branchId) {
  const result = await db
    .prepare('SELECT COUNT(*) as count FROM branch_locations WHERE branch_id = ? AND is_active = 1')
    .bind(branchId)
    .first();

  return result.count;
}
