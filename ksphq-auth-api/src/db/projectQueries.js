/**
 * Project Control - Database Query Functions for Projects
 * Comprehensive CRUD operations with branch scoping
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

  // Branch-level scope (only available scope for projects table)
  if (projectsPerm === 'branch' && currentUser.branch_id) {
    scopeCondition = ' AND p.branch_id = ?';
    scopeBindings.push(currentUser.branch_id);
  }
  // View own projects only
  else if (projectsPerm === 'view_own') {
    scopeCondition = ' AND (p.created_by = ? OR p.project_manager_id = ? OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ?))';
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
    status = null,
    priority = null,
    project_manager_id = null,
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
    LEFT JOIN users pm ON p.project_manager_id = pm.id
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

  if (status) {
    baseQuery += ' AND p.status = ?';
    bindings.push(status);
  }

  if (priority) {
    baseQuery += ' AND p.priority = ?';
    bindings.push(priority);
  }

  if (project_manager_id) {
    baseQuery += ' AND p.project_manager_id = ?';
    bindings.push(project_manager_id);
  }

  if (!include_deleted) {
    baseQuery += ' AND p.is_active = 1';
  }

  // Search
  if (search) {
    baseQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    const searchTerm = `%${search}%`;
    bindings.push(searchTerm, searchTerm);
  }

  // Count total
  const countResult = await db
    .prepare(`SELECT COUNT(*) as total ${baseQuery}`)
    .bind(...bindings)
    .first();

  const total = countResult.total;

  // Parse sorting
  const [sortField, sortOrder] = sort.split(':');
  const validSortFields = ['created_at', 'updated_at', 'name', 'priority', 'status', 'completion_percentage'];
  const orderBy = validSortFields.includes(sortField) ? sortField : 'created_at';
  const order = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Fetch paginated results
  const offset = (page - 1) * limit;
  const query = `
    SELECT
      p.id,
      p.name,
      p.description,
      p.status,
      p.priority,
      p.start_date,
      p.end_date,
      p.actual_start_date,
      p.actual_end_date,
      p.completion_percentage,
      p.budget_amount,
      p.actual_cost,
      p.project_manager_id,
      p.branch_id,
      p.created_at,
      p.updated_at,
      p.is_active,
      b.name as branch_name,
      pm.first_name || ' ' || pm.last_name as project_manager_name,
      creator.first_name || ' ' || creator.last_name as created_by_name,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND is_active = 1) as task_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed' AND is_active = 1) as completed_task_count
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
      pm.first_name || ' ' || pm.last_name as project_manager_name,
      pm.email as project_manager_email,
      creator.first_name || ' ' || creator.last_name as created_by_name,
      updater.first_name || ' ' || updater.last_name as updated_by_name
    FROM projects p
    LEFT JOIN organizational_units b ON p.branch_id = b.id
    LEFT JOIN users pm ON p.project_manager_id = pm.id
    LEFT JOIN users creator ON p.created_by = creator.id
    LEFT JOIN users updater ON p.updated_by = updater.id
    WHERE p.id = ? AND p.is_active = 1
  `;

  const project = await db.prepare(query).bind(projectId).first();

  if (!project) {
    throw new NotFoundError('Project');
  }

  // Get project members
  const membersQuery = `
    SELECT
      pme.id,
      pme.user_id,
      pme.role,
      pme.created_at as added_at,
      u.first_name || ' ' || u.last_name as user_name,
      u.email as user_email
    FROM project_members pme
    LEFT JOIN users u ON pme.user_id = u.id
    WHERE pme.project_id = ?
    ORDER BY pme.created_at ASC
  `;
  const membersResult = await db.prepare(membersQuery).bind(projectId).all();
  project.members = membersResult.results || [];

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
    name,
    description = null,
    status = 'planning',
    priority = 'medium',
    start_date = null,
    end_date = null,
    actual_start_date = null,
    actual_end_date = null,
    completion_percentage = 0,
    budget_amount = null,
    project_manager_id,
    branch_id = null,
  } = data;

  // Validate dates if provided
  if (end_date && start_date) {
    if (new Date(end_date) < new Date(start_date)) {
      throw new AppError('End date must be after start date', 400);
    }
  }

  // Validate project manager exists
  const projectManager = await db
    .prepare('SELECT id FROM users WHERE id = ? AND is_active = 1')
    .bind(project_manager_id)
    .first();

  if (!projectManager) {
    throw new AppError('Invalid project manager', 400);
  }

  // Create project
  const result = await db
    .prepare(
      `INSERT INTO projects (
        name, description, status, priority,
        start_date, end_date, actual_start_date, actual_end_date,
        completion_percentage, budget_amount, actual_cost,
        project_manager_id, branch_id,
        created_by, updated_by, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 1)
      RETURNING id, name, status, priority, created_at`
    )
    .bind(
      name,
      description,
      status,
      priority,
      start_date,
      end_date,
      actual_start_date,
      actual_end_date,
      completion_percentage,
      budget_amount,
      project_manager_id,
      branch_id,
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

  // If project manager is different from creator, add them too
  if (project_manager_id !== userId) {
    await db
      .prepare(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES (?, ?, 'manager')`
      )
      .bind(result.id, project_manager_id)
      .run();
  }

  // Create audit log
  await createAuditLog(db, {
    userId,
    action: 'project_created',
    details: `Created project ${name}`,
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
    const validStatuses = ['planning', 'in progress', 'on hold', 'completed', 'cancelled'];
    if (!validStatuses.includes(updates.status)) {
      throw new AppError('Invalid project status', 400);
    }
    fields.push('status = ?');
    values.push(updates.status);
  }

  if (updates.priority !== undefined) {
    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
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
    fields.push('end_date = ?');
    values.push(updates.end_date);
  }

  if (updates.actual_start_date !== undefined) {
    fields.push('actual_start_date = ?');
    values.push(updates.actual_start_date);
  }

  if (updates.actual_end_date !== undefined) {
    fields.push('actual_end_date = ?');
    values.push(updates.actual_end_date);
  }

  // Validate dates if both start and end provided
  if (updates.end_date && updates.start_date) {
    if (new Date(updates.end_date) < new Date(updates.start_date)) {
      throw new AppError('End date must be after start date', 400);
    }
  }

  if (updates.completion_percentage !== undefined) {
    fields.push('completion_percentage = ?');
    values.push(updates.completion_percentage);
  }

  if (updates.budget_amount !== undefined) {
    fields.push('budget_amount = ?');
    values.push(updates.budget_amount);
  }

  if (updates.actual_cost !== undefined) {
    fields.push('actual_cost = ?');
    values.push(updates.actual_cost);
  }

  if (updates.project_manager_id !== undefined) {
    // Validate project manager exists
    const projectManager = await db
      .prepare('SELECT id FROM users WHERE id = ? AND is_active = 1')
      .bind(updates.project_manager_id)
      .first();

    if (!projectManager) {
      throw new AppError('Invalid project manager', 400);
    }
    fields.push('project_manager_id = ?');
    values.push(updates.project_manager_id);
  }

  if (updates.branch_id !== undefined) {
    fields.push('branch_id = ?');
    values.push(updates.branch_id);
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
       WHERE id = ? AND is_active = 1`
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
       WHERE project_id = ? AND status != 'completed' AND is_active = 1`
    )
    .bind(projectId)
    .first();

  if (activeTasks.count > 0) {
    throw new AppError('Cannot delete project with active tasks. Complete or delete all tasks first.', 400);
  }

  // Soft delete (set is_active to 0)
  await db
    .prepare(
      `UPDATE projects SET
        is_active = 0,
        updated_at = datetime('now'),
        updated_by = ?
       WHERE id = ?`
    )
    .bind(userId, projectId)
    .run();

  // Create audit log
  await createAuditLog(db, {
    userId,
    action: 'project_deleted',
    details: `Deleted project ${project.name}`,
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
    .prepare('SELECT id FROM users WHERE id = ? AND is_active = 1')
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
      `INSERT INTO project_members (project_id, user_id, role, created_by)
       VALUES (?, ?, ?, ?)
       RETURNING id, user_id, role, created_at as added_at`
    )
    .bind(projectId, memberId, role, memberId)
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
