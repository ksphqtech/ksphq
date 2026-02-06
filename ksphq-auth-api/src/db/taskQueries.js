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
      (SELECT COUNT(*) FROM task_dependencies WHERE task_id = t.id) as predecessor_count,
      (SELECT COUNT(*) FROM task_dependencies WHERE depends_on_task_id = t.id) as successor_count
    FROM project_tasks t
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
    query += ' AND t.is_active = 1';
  }

  // Parse sorting
  const [sortField, sortOrder] = sort.split(':');
  const validSortFields = ['created_at', 'updated_at', 'title', 'start_date', 'due_date', 'priority', 'status'];
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
    FROM project_tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users creator ON t.created_by = creator.id
    LEFT JOIN users updater ON t.updated_by = updater.id
    WHERE t.id = ? AND t.is_active = 1
  `;

  const task = await db.prepare(query).bind(taskId).first();

  if (!task) {
    throw new NotFoundError('Task');
  }

  // Get predecessors (tasks that this task depends on - must be completed before this one)
  const predecessorsQuery = `
    SELECT
      td.id as dependency_id,
      td.dependency_type,
      t.id,
      t.title,
      t.status,
      t.start_date,
      t.due_date,
      t.completed_at
    FROM task_dependencies td
    JOIN project_tasks t ON td.depends_on_task_id = t.id
    WHERE td.task_id = ? AND t.is_active = 1
    ORDER BY t.start_date ASC
  `;
  const predecessorsResult = await db.prepare(predecessorsQuery).bind(taskId).all();
  task.predecessors = predecessorsResult.results || [];

  // Get successors (tasks that depend on this task)
  const successorsQuery = `
    SELECT
      td.id as dependency_id,
      td.dependency_type,
      t.id,
      t.title,
      t.status,
      t.start_date,
      t.due_date
    FROM task_dependencies td
    JOIN project_tasks t ON td.task_id = t.id
    WHERE td.depends_on_task_id = ? AND t.is_active = 1
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
    title,
    description = null,
    status = 'planning',
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
    .prepare('SELECT id FROM projects WHERE id = ? AND is_active = 1')
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
      .prepare('SELECT id FROM users WHERE id = ? AND is_active = 1')
      .bind(assigned_to)
      .first();

    if (!user) {
      throw new AppError('Invalid assigned user', 400);
    }
  }

  // Create task
  const result = await db
    .prepare(
      `INSERT INTO project_tasks (
        project_id, title, description, status, priority,
        start_date, due_date, estimated_hours, actual_hours,
        assigned_to, custom_fields, created_by, updated_by, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 1)
      RETURNING id, project_id, title, status, priority, created_at`
    )
    .bind(
      projectId,
      title,
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
    details: `Created task ${title} in project`,
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

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }

  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }

  if (updates.status !== undefined) {
    // Validate status
    const validStatuses = ['planning', 'in progress', 'on hold', 'completed', 'cancelled'];
    if (!validStatuses.includes(updates.status)) {
      throw new AppError('Invalid task status', 400);
    }

    // If marking as completed, set completed_at
    if (updates.status === 'completed' && before.status !== 'completed') {
      fields.push("completed_at = datetime('now')");
    }
    // If unmarking as completed, clear completed_at
    if (updates.status !== 'completed' && before.status === 'completed') {
      fields.push('completed_at = NULL');
    }

    fields.push('status = ?');
    values.push(updates.status);
  }

  if (updates.priority !== undefined) {
    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
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
        .prepare('SELECT id FROM users WHERE id = ? AND is_active = 1')
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
      `UPDATE project_tasks
       SET ${fields.join(', ')}
       WHERE id = ? AND is_active = 1`
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
    details: `Updated task ${after.title}`,
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
       WHERE depends_on_task_id = ? OR task_id = ?`
    )
    .bind(taskId, taskId)
    .run();

  // Soft delete
  await db
    .prepare(
      `UPDATE project_tasks SET
        is_active = 0,
        updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(taskId)
    .run();

  // Create audit log
  await createAuditLog(db, {
    userId: task.created_by,
    action: 'task_deleted',
    details: `Deleted task ${task.title}`,
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
    SELECT task_id
    FROM task_dependencies
    WHERE depends_on_task_id = ?
  `;
  const result = await db.prepare(successorsQuery).bind(startTaskId).all();
  const successors = result.results || [];

  // Check each successor recursively
  for (const successor of successors) {
    const cycleFound = await detectCycle(db, successor.task_id, targetTaskId, visited);
    if (cycleFound) {
      return true;
    }
  }

  return false;
}

/**
 * Add task dependency with cycle detection
 * @param {object} db - Database connection
 * @param {string} taskId - Task ID that depends on another (successor)
 * @param {string} dependsOnTaskId - Task ID that must be completed first (predecessor)
 * @param {string} dependencyType - Dependency type (finish_to_start, start_to_start, finish_to_finish, start_to_finish)
 * @param {string} userId - User creating the dependency
 * @returns {object} Created dependency
 */
export async function addDependency(db, taskId, dependsOnTaskId, dependencyType = 'finish_to_start', userId) {
  // Validate both tasks exist and are in the same project
  const taskQuery = `
    SELECT id, project_id, title FROM project_tasks
    WHERE id = ? AND is_active = 1
  `;
  const task = await db.prepare(taskQuery).bind(taskId).first();

  if (!task) {
    throw new NotFoundError('Task');
  }

  const dependsOnQuery = `
    SELECT id, project_id, title FROM project_tasks
    WHERE id = ? AND is_active = 1
  `;
  const dependsOnTask = await db.prepare(dependsOnQuery).bind(dependsOnTaskId).first();

  if (!dependsOnTask) {
    throw new NotFoundError('Depends on task');
  }

  // Ensure tasks are in the same project
  if (task.project_id !== dependsOnTask.project_id) {
    throw new AppError('Tasks must be in the same project', 400);
  }

  // Cannot depend on itself
  if (taskId === dependsOnTaskId) {
    throw new AppError('Task cannot depend on itself', 400);
  }

  // Check if dependency already exists
  const existing = await db
    .prepare(
      `SELECT id FROM task_dependencies
       WHERE task_id = ? AND depends_on_task_id = ?`
    )
    .bind(taskId, dependsOnTaskId)
    .first();

  if (existing) {
    throw new ConflictError('Dependency already exists');
  }

  // Check for circular dependencies
  // If we add task depends on dependsOnTask, we need to ensure dependsOnTask doesn't lead back to task
  const cycleDetected = await detectCycle(db, dependsOnTaskId, taskId);

  if (cycleDetected) {
    throw new AppError('Cannot add dependency: would create circular dependency', 400);
  }

  // Validate dependency type
  const validTypes = ['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'];
  if (!validTypes.includes(dependencyType)) {
    throw new AppError('Invalid dependency type', 400);
  }

  // Create dependency
  const result = await db
    .prepare(
      `INSERT INTO task_dependencies (task_id, depends_on_task_id, dependency_type, created_by)
       VALUES (?, ?, ?, ?)
       RETURNING id, task_id, depends_on_task_id, dependency_type, created_at`
    )
    .bind(taskId, dependsOnTaskId, dependencyType, userId)
    .first();

  // Create audit log
  await createAuditLog(db, {
    userId,
    action: 'task_dependency_created',
    details: `Added dependency: ${task.title} depends on ${dependsOnTask.title} (${dependencyType})`,
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
export async function removeDependency(db, dependencyId, userId) {
  // Get dependency details for audit log
  const dependency = await db
    .prepare(
      `SELECT
        td.*,
        dt.title as depends_on_task_title,
        t.title as task_title
       FROM task_dependencies td
       JOIN project_tasks dt ON td.depends_on_task_id = dt.id
       JOIN project_tasks t ON td.task_id = t.id
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
    userId,
    action: 'task_dependency_removed',
    details: `Removed dependency: ${dependency.task_title} depends on ${dependency.depends_on_task_title}`,
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
      td.dependency_type,
      td.created_at,
      dt.id as depends_on_task_id,
      dt.title as depends_on_task_title,
      dt.status as depends_on_task_status,
      dt.completed_at as depends_on_task_completed_at,
      t.id as task_id,
      t.title as task_title,
      t.status as task_status,
      t.start_date as task_start_date
    FROM task_dependencies td
    JOIN project_tasks dt ON td.depends_on_task_id = dt.id
    JOIN project_tasks t ON td.task_id = t.id
    WHERE dt.project_id = ? AND dt.is_active = 1 AND t.is_active = 1
    ORDER BY t.start_date ASC
  `;

  const result = await db.prepare(query).bind(projectId).all();
  return result.results || [];
}

/**
 * List checklist items for a task
 * @param {object} db - Database connection
 * @param {string} taskId - Task ID
 * @returns {Array} List of checklist items
 */
export async function listChecklistItems(db, taskId) {
  const query = `
    SELECT
      id,
      task_id,
      title,
      is_completed,
      sort_order,
      created_at,
      updated_at
    FROM task_checklist_items
    WHERE task_id = ?
    ORDER BY sort_order ASC, created_at ASC
  `;

  const result = await db.prepare(query).bind(taskId).all();
  return result.results || [];
}

/**
 * Create a checklist item
 * @param {object} db - Database connection
 * @param {string} taskId - Task ID
 * @param {object} data - Checklist item data
 * @param {string} userId - User ID creating the item
 * @returns {object} Created checklist item
 */
export async function createChecklistItem(db, taskId, data, userId) {
  const { title, sort_order = 0 } = data;

  if (!title || !title.trim()) {
    throw new AppError('Checklist item title is required', 400);
  }

  // Validate task exists
  const task = await db
    .prepare('SELECT id FROM project_tasks WHERE id = ? AND is_active = 1')
    .bind(taskId)
    .first();

  if (!task) {
    throw new NotFoundError('Task');
  }

  // Create checklist item
  const result = await db
    .prepare(
      `INSERT INTO task_checklist_items (task_id, title, sort_order, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id, task_id, title, is_completed, sort_order, created_at`
    )
    .bind(taskId, title.trim(), sort_order, userId, userId)
    .first();

  return result;
}

/**
 * Update a checklist item (mainly for toggling completion)
 * @param {object} db - Database connection
 * @param {string} itemId - Checklist item ID
 * @param {object} updates - Fields to update
 * @param {string} userId - User ID making the update
 * @returns {object} Updated checklist item
 */
export async function updateChecklistItem(db, itemId, updates, userId) {
  const fields = [];
  const values = [];

  if (updates.title !== undefined) {
    if (!updates.title.trim()) {
      throw new AppError('Checklist item title is required', 400);
    }
    fields.push('title = ?');
    values.push(updates.title.trim());
  }

  if (updates.is_completed !== undefined) {
    fields.push('is_completed = ?');
    values.push(updates.is_completed ? 1 : 0);
  }

  if (updates.sort_order !== undefined) {
    fields.push('sort_order = ?');
    values.push(updates.sort_order);
  }

  if (fields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  // Add metadata fields
  fields.push("updated_at = datetime('now')");
  fields.push('updated_by = ?');
  values.push(userId);
  values.push(itemId);

  await db
    .prepare(
      `UPDATE task_checklist_items
       SET ${fields.join(', ')}
       WHERE id = ?`
    )
    .bind(...values)
    .run();

  // Return updated item
  const updated = await db
    .prepare('SELECT * FROM task_checklist_items WHERE id = ?')
    .bind(itemId)
    .first();

  return updated;
}

/**
 * Delete a checklist item
 * @param {object} db - Database connection
 * @param {string} itemId - Checklist item ID
 */
export async function deleteChecklistItem(db, itemId) {
  await db
    .prepare('DELETE FROM task_checklist_items WHERE id = ?')
    .bind(itemId)
    .run();
}
