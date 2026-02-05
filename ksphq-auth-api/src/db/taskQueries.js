/**
 * Project Control - Database Query Functions for Tasks
 * Task management with dependency tracking and cycle detection
 */

import { AppError, ConflictError, NotFoundError } from '../utils/errors.js';
import { createAuditLog, generateChangesLog } from './auditLogs.js';

/**
 * List tasks with filtering
 * @param {object} db - Database connection
 * @param {string} projectId - Project ID
 * @param {object} filters - Query filters
 * @returns {Array} List of tasks
 */
export async function listTasks(db, projectId, filters = {}) {
  const {
    status = null,
    priority = null,
    assigned_to = null,
    include_deleted = false,
    sort = 'created_at:desc',
  } = filters;

  let query = `
    SELECT
      t.*,
      u.first_name || ' ' || u.last_name as assigned_to_name,
      creator.first_name || ' ' || creator.last_name as created_by_name,
      (SELECT COUNT(*) FROM task_dependencies WHERE successor_id = t.id) as predecessor_count,
      (SELECT COUNT(*) FROM task_dependencies WHERE predecessor_id = t.id) as successor_count
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users creator ON t.created_by = creator.id
    WHERE t.project_id = ?
  `;

  const bindings = [projectId];

  if (status) {
    query += ' AND t.status = ?';
    bindings.push(status);
  }

  if (priority) {
    query += ' AND t.priority = ?';
    bindings.push(priority);
  }

  if (assigned_to) {
    query += ' AND t.assigned_to = ?';
    bindings.push(assigned_to);
  }

  if (!include_deleted) {
    query += ' AND t.deleted_at IS NULL';
  }

  // Parse sorting
  const [sortField, sortOrder] = sort.split(':');
  const validSortFields = ['created_at', 'updated_at', 'name', 'start_date', 'due_date', 'priority', 'status'];
  const orderBy = validSortFields.includes(sortField) ? sortField : 'created_at';
  const order = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  query += ` ORDER BY t.${orderBy} ${order}`;

  const result = await db.prepare(query).bind(...bindings).all();
  return result.results || [];
}

/**
 * Get task by ID with full details including dependencies
 * @param {object} db - Database connection
 * @param {string} taskId - Task ID
 * @returns {object} Task object with dependencies
 */
export async function getTaskById(db, taskId) {
  const query = `
    SELECT
      t.*,
      u.first_name || ' ' || u.last_name as assigned_to_name,
      u.email as assigned_to_email,
      creator.first_name || ' ' || creator.last_name as created_by_name,
      updater.first_name || ' ' || updater.last_name as updated_by_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users creator ON t.created_by = creator.id
    LEFT JOIN users updater ON t.updated_by = updater.id
    WHERE t.id = ? AND t.deleted_at IS NULL
  `;

  const task = await db.prepare(query).bind(taskId).first();

  if (!task) {
    throw new NotFoundError('Task');
  }

  // Get predecessors (tasks that must be completed before this one)
  const predecessorsQuery = `
    SELECT
      td.id as dependency_id,
      td.type as dependency_type,
      t.id,
      t.name,
      t.status,
      t.start_date,
      t.due_date,
      t.completion_date
    FROM task_dependencies td
    JOIN tasks t ON td.predecessor_id = t.id
    WHERE td.successor_id = ? AND t.deleted_at IS NULL
    ORDER BY t.start_date ASC
  `;
  const predecessorsResult = await db.prepare(predecessorsQuery).bind(taskId).all();
  task.predecessors = predecessorsResult.results || [];

  // Get successors (tasks that depend on this one)
  const successorsQuery = `
    SELECT
      td.id as dependency_id,
      td.type as dependency_type,
      t.id,
      t.name,
      t.status,
      t.start_date,
      t.due_date
    FROM task_dependencies td
    JOIN tasks t ON td.successor_id = t.id
    WHERE td.predecessor_id = ? AND t.deleted_at IS NULL
    ORDER BY t.start_date ASC
  `;
  const successorsResult = await db.prepare(successorsQuery).bind(taskId).all();
  task.successors = successorsResult.results || [];

  // Parse JSON fields
  if (task.custom_fields) {
    try {
      task.custom_fields = JSON.parse(task.custom_fields);
    } catch (e) {
      task.custom_fields = null;
    }
  }

  return task;
}

/**
 * Create a new task
 * @param {object} db - Database connection
 * @param {string} projectId - Project ID
 * @param {object} data - Task data
 * @returns {object} Created task
 */
export async function createTask(db, projectId, data) {
  const {
    name,
    description = null,
    status = 'todo',
    priority = 'medium',
    start_date = null,
    due_date = null,
    estimated_hours = null,
    assigned_to = null,
    custom_fields = null,
    created_by,
  } = data;

  // Validate project exists
  const project = await db
    .prepare('SELECT id FROM projects WHERE id = ? AND deleted_at IS NULL')
    .bind(projectId)
    .first();

  if (!project) {
    throw new NotFoundError('Project');
  }

  // Validate dates
  if (start_date && due_date && new Date(due_date) < new Date(start_date)) {
    throw new AppError('Due date must be after start date', 400);
  }

  // Validate assigned user if provided
  if (assigned_to) {
    const user = await db
      .prepare('SELECT id FROM users WHERE id = ? AND is_active = 1 AND deleted_at IS NULL')
      .bind(assigned_to)
      .first();

    if (!user) {
      throw new AppError('Invalid assigned user', 400);
    }
  }

  // Create task
  const result = await db
    .prepare(
      `INSERT INTO tasks (
        project_id, name, description, status, priority,
        start_date, due_date, estimated_hours, actual_hours,
        assigned_to, custom_fields, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
      RETURNING id, project_id, name, status, priority, created_at`
    )
    .bind(
      projectId,
      name,
      description,
      status,
      priority,
      start_date,
      due_date,
      estimated_hours,
      assigned_to,
      custom_fields ? JSON.stringify(custom_fields) : null,
      created_by,
      created_by
    )
    .first();

  // Create audit log
  await createAuditLog(db, {
    userId: created_by,
    action: 'task_created',
    details: `Created task ${name} in project`,
    category: 'project_management',
    severity: 'info',
  });

  return result;
}

/**
 * Update task
 * @param {object} db - Database connection
 * @param {string} taskId - Task ID to update
 * @param {object} updates - Fields to update
 * @returns {object} Updated task
 */
export async function updateTask(db, taskId, updates) {
  // Get existing task for change tracking
  const before = await getTaskById(db, taskId);

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
    const validStatuses = ['todo', 'in_progress', 'on_hold', 'completed', 'cancelled'];
    if (!validStatuses.includes(updates.status)) {
      throw new AppError('Invalid task status', 400);
    }

    // If marking as completed, set completion_date
    if (updates.status === 'completed' && before.status !== 'completed') {
      fields.push("completion_date = datetime('now')");
    }
    // If unmarking as completed, clear completion_date
    if (updates.status !== 'completed' && before.status === 'completed') {
      fields.push('completion_date = NULL');
    }

    fields.push('status = ?');
    values.push(updates.status);
  }

  if (updates.priority !== undefined) {
    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(updates.priority)) {
      throw new AppError('Invalid task priority', 400);
    }
    fields.push('priority = ?');
    values.push(updates.priority);
  }

  if (updates.start_date !== undefined) {
    fields.push('start_date = ?');
    values.push(updates.start_date);
  }

  if (updates.due_date !== undefined) {
    // Validate dates if both are being set
    const startDate = updates.start_date !== undefined ? updates.start_date : before.start_date;
    if (updates.due_date && startDate && new Date(updates.due_date) < new Date(startDate)) {
      throw new AppError('Due date must be after start date', 400);
    }
    fields.push('due_date = ?');
    values.push(updates.due_date);
  }

  if (updates.estimated_hours !== undefined) {
    fields.push('estimated_hours = ?');
    values.push(updates.estimated_hours);
  }

  if (updates.actual_hours !== undefined) {
    fields.push('actual_hours = ?');
    values.push(updates.actual_hours);
  }

  if (updates.assigned_to !== undefined) {
    // Validate assigned user if provided
    if (updates.assigned_to) {
      const user = await db
        .prepare('SELECT id FROM users WHERE id = ? AND is_active = 1 AND deleted_at IS NULL')
        .bind(updates.assigned_to)
        .first();

      if (!user) {
        throw new AppError('Invalid assigned user', 400);
      }
    }
    fields.push('assigned_to = ?');
    values.push(updates.assigned_to);
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
  values.push(updates.updated_by);
  values.push(taskId);

  await db
    .prepare(
      `UPDATE tasks
       SET ${fields.join(', ')}
       WHERE id = ? AND deleted_at IS NULL`
    )
    .bind(...values)
    .run();

  // Get updated task
  const after = await getTaskById(db, taskId);

  // Generate change log
  const changes = generateChangesLog(before, updates);

  // Create audit log
  await createAuditLog(db, {
    userId: updates.updated_by,
    action: 'task_updated',
    changes,
    details: `Updated task ${after.name}`,
    category: 'project_management',
    severity: 'info',
  });

  return after;
}

/**
 * Soft delete a task
 * @param {object} db - Database connection
 * @param {string} taskId - Task ID to delete
 */
export async function deleteTask(db, taskId) {
  const task = await getTaskById(db, taskId);

  // Remove all dependencies first
  await db
    .prepare(
      `DELETE FROM task_dependencies
       WHERE predecessor_id = ? OR successor_id = ?`
    )
    .bind(taskId, taskId)
    .run();

  // Soft delete
  await db
    .prepare(
      `UPDATE tasks SET
        deleted_at = datetime('now')
       WHERE id = ?`
    )
    .bind(taskId)
    .run();

  // Create audit log
  await createAuditLog(db, {
    userId: task.created_by,
    action: 'task_deleted',
    details: `Deleted task ${task.name}`,
    category: 'project_management',
    severity: 'warning',
  });
}

/**
 * Check for circular dependencies using depth-first search
 * @param {object} db - Database connection
 * @param {string} startTaskId - Starting task ID
 * @param {string} targetTaskId - Target task ID to check for cycle
 * @param {Set} visited - Set of visited task IDs
 * @returns {boolean} True if cycle detected
 */
async function detectCycle(db, startTaskId, targetTaskId, visited = new Set()) {
  if (startTaskId === targetTaskId) {
    return true; // Cycle detected
  }

  if (visited.has(startTaskId)) {
    return false; // Already visited this node
  }

  visited.add(startTaskId);

  // Get all successors of current task
  const successorsQuery = `
    SELECT successor_id
    FROM task_dependencies
    WHERE predecessor_id = ?
  `;
  const result = await db.prepare(successorsQuery).bind(startTaskId).all();
  const successors = result.results || [];

  // Check each successor recursively
  for (const successor of successors) {
    const cycleFound = await detectCycle(db, successor.successor_id, targetTaskId, visited);
    if (cycleFound) {
      return true;
    }
  }

  return false;
}

/**
 * Add task dependency with cycle detection
 * @param {object} db - Database connection
 * @param {string} predecessorId - Predecessor task ID (must be completed first)
 * @param {string} successorId - Successor task ID (depends on predecessor)
 * @param {string} type - Dependency type (finish_to_start, start_to_start, finish_to_finish, start_to_finish)
 * @returns {object} Created dependency
 */
export async function addDependency(db, predecessorId, successorId, type = 'finish_to_start') {
  // Validate both tasks exist and are in the same project
  const predecessorQuery = `
    SELECT id, project_id, name FROM tasks
    WHERE id = ? AND deleted_at IS NULL
  `;
  const predecessor = await db.prepare(predecessorQuery).bind(predecessorId).first();

  if (!predecessor) {
    throw new NotFoundError('Predecessor task');
  }

  const successorQuery = `
    SELECT id, project_id, name FROM tasks
    WHERE id = ? AND deleted_at IS NULL
  `;
  const successor = await db.prepare(successorQuery).bind(successorId).first();

  if (!successor) {
    throw new NotFoundError('Successor task');
  }

  // Ensure tasks are in the same project
  if (predecessor.project_id !== successor.project_id) {
    throw new AppError('Tasks must be in the same project', 400);
  }

  // Cannot depend on itself
  if (predecessorId === successorId) {
    throw new AppError('Task cannot depend on itself', 400);
  }

  // Check if dependency already exists
  const existing = await db
    .prepare(
      `SELECT id FROM task_dependencies
       WHERE predecessor_id = ? AND successor_id = ?`
    )
    .bind(predecessorId, successorId)
    .first();

  if (existing) {
    throw new ConflictError('Dependency already exists');
  }

  // Check for circular dependencies
  // If we add predecessor -> successor, we need to ensure successor doesn't lead back to predecessor
  const cycleDetected = await detectCycle(db, successorId, predecessorId);

  if (cycleDetected) {
    throw new AppError('Cannot add dependency: would create circular dependency', 400);
  }

  // Validate dependency type
  const validTypes = ['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'];
  if (!validTypes.includes(type)) {
    throw new AppError('Invalid dependency type', 400);
  }

  // Create dependency
  const result = await db
    .prepare(
      `INSERT INTO task_dependencies (predecessor_id, successor_id, type)
       VALUES (?, ?, ?)
       RETURNING id, predecessor_id, successor_id, type, created_at`
    )
    .bind(predecessorId, successorId, type)
    .first();

  // Create audit log
  await createAuditLog(db, {
    userId: null,
    action: 'task_dependency_created',
    details: `Added dependency: ${predecessor.name} -> ${successor.name} (${type})`,
    category: 'project_management',
    severity: 'info',
  });

  return result;
}

/**
 * Remove task dependency
 * @param {object} db - Database connection
 * @param {string} dependencyId - Dependency ID to remove
 */
export async function removeDependency(db, dependencyId) {
  // Get dependency details for audit log
  const dependency = await db
    .prepare(
      `SELECT
        td.*,
        p.name as predecessor_name,
        s.name as successor_name
       FROM task_dependencies td
       JOIN tasks p ON td.predecessor_id = p.id
       JOIN tasks s ON td.successor_id = s.id
       WHERE td.id = ?`
    )
    .bind(dependencyId)
    .first();

  if (!dependency) {
    throw new NotFoundError('Dependency');
  }

  // Remove dependency
  await db
    .prepare('DELETE FROM task_dependencies WHERE id = ?')
    .bind(dependencyId)
    .run();

  // Create audit log
  await createAuditLog(db, {
    userId: null,
    action: 'task_dependency_removed',
    details: `Removed dependency: ${dependency.predecessor_name} -> ${dependency.successor_name}`,
    category: 'project_management',
    severity: 'info',
  });
}

/**
 * Get all dependencies for a project (for Gantt chart visualization)
 * @param {object} db - Database connection
 * @param {string} projectId - Project ID
 * @returns {Array} List of dependencies with task details
 */
export async function getProjectDependencies(db, projectId) {
  const query = `
    SELECT
      td.id,
      td.type,
      td.created_at,
      p.id as predecessor_id,
      p.name as predecessor_name,
      p.status as predecessor_status,
      p.completion_date as predecessor_completion_date,
      s.id as successor_id,
      s.name as successor_name,
      s.status as successor_status,
      s.start_date as successor_start_date
    FROM task_dependencies td
    JOIN tasks p ON td.predecessor_id = p.id
    JOIN tasks s ON td.successor_id = s.id
    WHERE p.project_id = ? AND p.deleted_at IS NULL AND s.deleted_at IS NULL
    ORDER BY s.start_date ASC
  `;

  const result = await db.prepare(query).bind(projectId).all();
  return result.results || [];
}
