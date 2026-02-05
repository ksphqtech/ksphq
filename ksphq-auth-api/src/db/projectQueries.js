/**
 * Project Control - Database Query Functions for Projects
 * Comprehensive CRUD operations with branch/department scoping
 */

import { AppError, ConflictError, NotFoundError } from '../utils/errors.js';
import { createAuditLog, generateChangesLog } from './auditLogs.js';

/**
 * Apply organizational scoping to project queries
 * @param {object} currentUser - Current authenticated user
 * @param {string} baseQuery - Base SQL query
 * @param {Array} bindings - Query bindings
 * @returns {object} Modified query and bindings
 */
function applyScopeToProjectQuery(currentUser, baseQuery, bindings = []) {
  const roleLevel = currentUser.role_level || 0;
  const projectsPerm = currentUser.role_permissions?.projects;

  // Admin sees all projects
  if (roleLevel >= 100 || projectsPerm === 'full') {
    return { query: baseQuery, bindings };
  }

  let scopeCondition = '';
  const scopeBindings = [];

  // Branch-level scope
  if (projectsPerm === 'branch' && currentUser.branch_id) {
    scopeCondition = ' AND p.branch_id = ?';
    scopeBindings.push(currentUser.branch_id);
  }
  // Department-level scope
  else if (projectsPerm === 'department' && currentUser.department_id) {
    scopeCondition = ' AND p.department_id = ?';
    scopeBindings.push(currentUser.department_id);
  }
  // Team-level scope
  else if (projectsPerm === 'team' && currentUser.team_id) {
    scopeCondition = ' AND p.team_id = ?';
    scopeBindings.push(currentUser.team_id);
  }
  // View own projects only
  else if (projectsPerm === 'view_own') {
    scopeCondition = ' AND (p.created_by = ? OR p.owner_id = ? OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ?))';
    scopeBindings.push(currentUser.id, currentUser.id, currentUser.id);
  }
  // No permission - return empty
  else {
    scopeCondition = ' AND 1 = 0'; // Never matches
  }

  return {
    query: baseQuery + scopeCondition,
    bindings: [...bindings, ...scopeBindings],
  };
}

/**
 * List projects with filtering, sorting, and pagination
 * @param {object} db - Database connection
 * @param {object} filters - Query filters
 * @param {string} userId - Current user ID
 * @param {object} userPermissions - User's permissions and org scope
 * @returns {object} Paginated project list with metadata
 */
export async function listProjects(db, filters = {}, userId, userPermissions) {
  const {
    branch_id = null,
    department_id = null,
    team_id = null,
    status = null,
    priority = null,
    owner_id = null,
    search = null,
    include_deleted = false,
    sort = 'created_at:desc',
    page = 1,
    limit = 50,
  } = filters;

  // Base query
  let baseQuery = `
    FROM projects p
    LEFT JOIN organizational_units b ON p.branch_id = b.id
    LEFT JOIN organizational_units d ON p.department_id = d.id
    LEFT JOIN organizational_units t ON p.team_id = t.id
    LEFT JOIN users owner ON p.owner_id = owner.id
    LEFT JOIN users creator ON p.created_by = creator.id
    WHERE 1=1
  `;

  const bindings = [];

  // Apply organizational scoping based on user permissions
  const scoped = applyScopeToProjectQuery(userPermissions, baseQuery, bindings);
  baseQuery = scoped.query;
  bindings.push(...scoped.bindings);

  // Filters
  if (branch_id) {
    baseQuery += ' AND p.branch_id = ?';
    bindings.push(branch_id);
  }

  if (department_id) {
    baseQuery += ' AND p.department_id = ?';
    bindings.push(department_id);
  }

  if (team_id) {
    baseQuery += ' AND p.team_id = ?';
    bindings.push(team_id);
  }

  if (status) {
    baseQuery += ' AND p.status = ?';
    bindings.push(status);
  }

  if (priority) {
    baseQuery += ' AND p.priority = ?';
    bindings.push(priority);
  }

  if (owner_id) {
    baseQuery += ' AND p.owner_id = ?';
    bindings.push(owner_id);
  }

  if (!include_deleted) {
    baseQuery += ' AND p.deleted_at IS NULL';
  }

  // Search
  if (search) {
    baseQuery += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.project_code LIKE ?)';
    const searchTerm = `%${search}%`;
    bindings.push(searchTerm, searchTerm, searchTerm);
  }

  // Count total
  const countResult = await db
    .prepare(`SELECT COUNT(*) as total ${baseQuery}`)
    .bind(...bindings)
    .first();

  const total = countResult.total;

  // Parse sorting
  const [sortField, sortOrder] = sort.split(':');
  const validSortFields = ['created_at', 'updated_at', 'name', 'start_date', 'end_date', 'priority', 'status'];
  const orderBy = validSortFields.includes(sortField) ? sortField : 'created_at';
  const order = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Fetch paginated results
  const offset = (page - 1) * limit;
  const query = `
    SELECT
      p.id,
      p.project_code,
      p.name,
      p.description,
      p.status,
      p.priority,
      p.start_date,
      p.end_date,
      p.budget,
      p.actual_cost,
      p.owner_id,
      p.branch_id,
      p.department_id,
      p.team_id,
      p.created_at,
      p.updated_at,
      p.deleted_at,
      b.name as branch_name,
      d.name as department_name,
      t.name as team_name,
      owner.first_name || ' ' || owner.last_name as owner_name,
      creator.first_name || ' ' || creator.last_name as created_by_name,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND deleted_at IS NULL) as task_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed' AND deleted_at IS NULL) as completed_task_count
    ${baseQuery}
    ORDER BY p.${orderBy} ${order}
    LIMIT ? OFFSET ?
  `;

  bindings.push(limit, offset);
  const result = await db.prepare(query).bind(...bindings).all();

  return {
    projects: result.results || [],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get project by ID with full details
 * @param {object} db - Database connection
 * @param {string} projectId - Project ID
 * @returns {object} Project object with joined data
 */
export async function getProjectById(db, projectId) {
  const query = `
    SELECT
      p.*,
      b.name as branch_name,
      d.name as department_name,
      t.name as team_name,
      owner.first_name || ' ' || owner.last_name as owner_name,
      owner.email as owner_email,
      creator.first_name || ' ' || creator.last_name as created_by_name,
      updater.first_name || ' ' || updater.last_name as updated_by_name
    FROM projects p
    LEFT JOIN organizational_units b ON p.branch_id = b.id
    LEFT JOIN organizational_units d ON p.department_id = d.id
    LEFT JOIN organizational_units t ON p.team_id = t.id
    LEFT JOIN users owner ON p.owner_id = owner.id
    LEFT JOIN users creator ON p.created_by = creator.id
    LEFT JOIN users updater ON p.updated_by = updater.id
    WHERE p.id = ? AND p.deleted_at IS NULL
  `;

  const project = await db.prepare(query).bind(projectId).first();

  if (!project) {
    throw new NotFoundError('Project');
  }

  // Get project members
  const membersQuery = `
    SELECT
      pm.id,
      pm.user_id,
      pm.role,
      pm.added_at,
      u.first_name || ' ' || u.last_name as user_name,
      u.email as user_email
    FROM project_members pm
    LEFT JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
    ORDER BY pm.added_at ASC
  `;
  const membersResult = await db.prepare(membersQuery).bind(projectId).all();
  project.members = membersResult.results || [];

  // Parse JSON fields if any
  if (project.custom_fields) {
    try {
      project.custom_fields = JSON.parse(project.custom_fields);
    } catch (e) {
      project.custom_fields = null;
    }
  }

  return project;
}

/**
 * Create a new project
 * @param {object} db - Database connection
 * @param {object} data - Project data
 * @param {string} userId - User ID creating the project
 * @returns {object} Created project
 */
export async function createProject(db, data, userId) {
  const {
    project_code,
    name,
    description = null,
    status = 'planning',
    priority = 'medium',
    start_date,
    end_date = null,
    budget = null,
    owner_id,
    branch_id = null,
    department_id = null,
    team_id = null,
    custom_fields = null,
  } = data;

  // Check project_code uniqueness
  const existing = await db
    .prepare('SELECT id FROM projects WHERE project_code = ? COLLATE NOCASE')
    .bind(project_code)
    .first();

  if (existing) {
    throw new ConflictError('Project code already in use');
  }

  // Validate dates
  if (end_date && new Date(end_date) < new Date(start_date)) {
    throw new AppError('End date must be after start date', 400);
  }

  // Validate owner exists
  const owner = await db
    .prepare('SELECT id FROM users WHERE id = ? AND is_active = 1 AND deleted_at IS NULL')
    .bind(owner_id)
    .first();

  if (!owner) {
    throw new AppError('Invalid project owner', 400);
  }

  // Create project
  const result = await db
    .prepare(
      `INSERT INTO projects (
        project_code, name, description, status, priority,
        start_date, end_date, budget, actual_cost,
        owner_id, branch_id, department_id, team_id,
        custom_fields, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id, project_code, name, status, priority, created_at`
    )
    .bind(
      project_code,
      name,
      description,
      status,
      priority,
      start_date,
      end_date,
      budget,
      owner_id,
      branch_id,
      department_id,
      team_id,
      custom_fields ? JSON.stringify(custom_fields) : null,
      userId,
      userId
    )
    .first();

  // Add creator as project member
  await db
    .prepare(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES (?, ?, 'owner')`
    )
    .bind(result.id, userId)
    .run();

  // If owner is different from creator, add them too
  if (owner_id !== userId) {
    await db
      .prepare(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES (?, ?, 'manager')`
      )
      .bind(result.id, owner_id)
      .run();
  }

  // Create audit log
  await createAuditLog(db, {
    userId,
    action: 'project_created',
    details: `Created project ${name} (${project_code})`,
    category: 'project_management',
    severity: 'info',
  });

  return result;
}

/**
 * Update project
 * @param {object} db - Database connection
 * @param {string} projectId - Project ID to update
 * @param {object} updates - Fields to update
 * @param {string} userId - User ID making the update
 * @returns {object} Updated project
 */
export async function updateProject(db, projectId, updates, userId) {
  // Get existing project for change tracking
  const before = await getProjectById(db, projectId);

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

  if (updates.status !== undefined) {
    // Validate status
    const validStatuses = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
    if (!validStatuses.includes(updates.status)) {
      throw new AppError('Invalid project status', 400);
    }
    fields.push('status = ?');
    values.push(updates.status);
  }

  if (updates.priority !== undefined) {
    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(updates.priority)) {
      throw new AppError('Invalid project priority', 400);
    }
    fields.push('priority = ?');
    values.push(updates.priority);
  }

  if (updates.start_date !== undefined) {
    fields.push('start_date = ?');
    values.push(updates.start_date);
  }

  if (updates.end_date !== undefined) {
    // Validate dates if both are being set
    const startDate = updates.start_date !== undefined ? updates.start_date : before.start_date;
    if (updates.end_date && startDate && new Date(updates.end_date) < new Date(startDate)) {
      throw new AppError('End date must be after start date', 400);
    }
    fields.push('end_date = ?');
    values.push(updates.end_date);
  }

  if (updates.budget !== undefined) {
    fields.push('budget = ?');
    values.push(updates.budget);
  }

  if (updates.actual_cost !== undefined) {
    fields.push('actual_cost = ?');
    values.push(updates.actual_cost);
  }

  if (updates.owner_id !== undefined) {
    // Validate owner exists
    const owner = await db
      .prepare('SELECT id FROM users WHERE id = ? AND is_active = 1 AND deleted_at IS NULL')
      .bind(updates.owner_id)
      .first();

    if (!owner) {
      throw new AppError('Invalid project owner', 400);
    }
    fields.push('owner_id = ?');
    values.push(updates.owner_id);
  }

  if (updates.branch_id !== undefined) {
    fields.push('branch_id = ?');
    values.push(updates.branch_id);
  }

  if (updates.department_id !== undefined) {
    fields.push('department_id = ?');
    values.push(updates.department_id);
  }

  if (updates.team_id !== undefined) {
    fields.push('team_id = ?');
    values.push(updates.team_id);
  }

  if (updates.custom_fields !== undefined) {
    fields.push('custom_fields = ?');
    values.push(updates.custom_fields ? JSON.stringify(updates.custom_fields) : null);
  }

  if (fields.length === 0) {
    return before;
  }

  // Add metadata fields
  fields.push("updated_at = datetime('now')");
  fields.push('updated_by = ?');
  values.push(userId);
  values.push(projectId);

  await db
    .prepare(
      `UPDATE projects
       SET ${fields.join(', ')}
       WHERE id = ? AND deleted_at IS NULL`
    )
    .bind(...values)
    .run();

  // Get updated project
  const after = await getProjectById(db, projectId);

  // Generate change log
  const changes = generateChangesLog(before, updates);

  // Create audit log
  await createAuditLog(db, {
    userId,
    action: 'project_updated',
    changes,
    details: `Updated project ${after.name}`,
    category: 'project_management',
    severity: 'info',
  });

  return after;
}

/**
 * Soft delete a project
 * @param {object} db - Database connection
 * @param {string} projectId - Project ID to delete
 * @param {string} userId - User ID performing deletion
 */
export async function deleteProject(db, projectId, userId) {
  const project = await getProjectById(db, projectId);

  // Check if project has active tasks
  const activeTasks = await db
    .prepare(
      `SELECT COUNT(*) as count FROM tasks
       WHERE project_id = ? AND status != 'completed' AND deleted_at IS NULL`
    )
    .bind(projectId)
    .first();

  if (activeTasks.count > 0) {
    throw new AppError('Cannot delete project with active tasks. Complete or delete all tasks first.', 400);
  }

  // Soft delete
  await db
    .prepare(
      `UPDATE projects SET
        deleted_at = datetime('now'),
        deleted_by = ?,
        updated_at = datetime('now'),
        updated_by = ?
       WHERE id = ?`
    )
    .bind(userId, userId, projectId)
    .run();

  // Create audit log
  await createAuditLog(db, {
    userId,
    action: 'project_deleted',
    details: `Deleted project ${project.name} (${project.project_code})`,
    category: 'project_management',
    severity: 'warning',
  });
}

/**
 * Add member to project
 * @param {object} db - Database connection
 * @param {string} projectId - Project ID
 * @param {string} memberId - User ID to add
 * @param {string} role - Member role (owner, manager, member, viewer)
 * @returns {object} Added member
 */
export async function addProjectMember(db, projectId, memberId, role = 'member') {
  // Validate project exists
  await getProjectById(db, projectId);

  // Validate user exists
  const user = await db
    .prepare('SELECT id FROM users WHERE id = ? AND is_active = 1 AND deleted_at IS NULL')
    .bind(memberId)
    .first();

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if already a member
  const existing = await db
    .prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?')
    .bind(projectId, memberId)
    .first();

  if (existing) {
    throw new ConflictError('User is already a project member');
  }

  // Add member
  const result = await db
    .prepare(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES (?, ?, ?)
       RETURNING id, user_id, role, added_at`
    )
    .bind(projectId, memberId, role)
    .first();

  return result;
}

/**
 * Remove member from project
 * @param {object} db - Database connection
 * @param {string} projectId - Project ID
 * @param {string} memberId - User ID to remove
 */
export async function removeProjectMember(db, projectId, memberId) {
  await db
    .prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?')
    .bind(projectId, memberId)
    .run();
}
