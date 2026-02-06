/**
 * Project Control - API Handlers for Tasks
 * Request handlers for task management with dependency tracking
 */

import { successResponse, errorResponse } from '../utils/response.js';
import { AppError, ForbiddenError } from '../utils/errors.js';
import {
  listTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addDependency,
  removeDependency,
  getProjectDependencies,
  listChecklistItems,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from '../db/taskQueries.js';
import { getProjectById } from '../db/projectQueries.js';
import {
  updateProjectProgress,
  updateTaskHierarchyProgress,
} from '../utils/progressCalculator.js';

/**
 * Check if user has project management permissions
 * @param {object} currentUser - Current authenticated user
 * @param {string} action - Action to perform
 * @throws {ForbiddenError} If insufficient permissions
 */
function requireProjectPermission(currentUser, action = 'view') {
  const projectsPerm = currentUser.role_permissions?.projects;

  if (!projectsPerm) {
    throw new ForbiddenError('No project management permissions');
  }

  // View permissions
  if (action === 'view') {
    // All project permission levels can view
    return;
  }

  // Create, edit, delete permissions
  if (['create', 'edit', 'delete'].includes(action)) {
    if (projectsPerm === 'view_own') {
      throw new ForbiddenError('Read-only access to projects');
    }
  }
}

/**
 * Check if user can access a specific project
 * @param {object} currentUser - Current authenticated user
 * @param {object} project - Project object
 * @throws {ForbiddenError} If access denied
 */
function canAccessProject(currentUser, project) {
  const roleLevel = currentUser.role_level || 0;
  const projectsPerm = currentUser.role_permissions?.projects;

  // Admin sees all projects
  if (roleLevel >= 100 || projectsPerm === 'full') {
    return true;
  }

  // Check organizational scope
  if (projectsPerm === 'branch' && currentUser.branch_id) {
    if (currentUser.branch_id !== project.branch_id) {
      throw new ForbiddenError('Can only access projects in your branch');
    }
    return true;
  }

  if (projectsPerm === 'department' && currentUser.department_id) {
    if (currentUser.department_id !== project.department_id) {
      throw new ForbiddenError('Can only access projects in your department');
    }
    return true;
  }

  if (projectsPerm === 'team' && currentUser.team_id) {
    if (currentUser.team_id !== project.team_id) {
      throw new ForbiddenError('Can only access projects in your team');
    }
    return true;
  }

  if (projectsPerm === 'view_own') {
    const isMember = project.members?.some(m => m.user_id === currentUser.id);
    if (project.owner_id !== currentUser.id && project.created_by !== currentUser.id && !isMember) {
      throw new ForbiddenError('Can only access your own projects');
    }
    return true;
  }

  throw new ForbiddenError('Insufficient permissions to access this project');
}

/**
 * List tasks for a project
 * GET /api/projects/:projectId/tasks
 */
export async function handleListTasks(request, env, ctx, currentUser, projectId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'view');

    // Verify project access
    const project = await getProjectById(env.DB, projectId);
    canAccessProject(currentUser, project);

    // Parse query parameters
    const url = new URL(request.url);
    const filters = {
      status: url.searchParams.get('status'),
      priority: url.searchParams.get('priority'),
      assigned_to: url.searchParams.get('assigned_to'),
      include_deleted: url.searchParams.get('include_deleted') === 'true',
      sort: url.searchParams.get('sort') || 'created_at:desc',
    };

    // List tasks
    const tasks = await listTasks(env.DB, projectId, filters);

    return successResponse({ tasks });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('List tasks error:', error);
    return errorResponse('Failed to list tasks', 500, null, env);
  }
}

/**
 * Get task details by ID
 * GET /api/tasks/:id
 */
export async function handleGetTask(request, env, ctx, currentUser, taskId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'view');

    // Get task details
    const task = await getTaskById(env.DB, taskId);

    // Verify project access
    const project = await getProjectById(env.DB, task.project_id);
    canAccessProject(currentUser, project);

    return successResponse({ task });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Get task error:', error);
    return errorResponse('Failed to get task', 500, null, env);
  }
}

/**
 * Create a new task
 * POST /api/projects/:projectId/tasks
 */
export async function handleCreateTask(request, env, ctx, currentUser, projectId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'create');

    // Verify project access
    const project = await getProjectById(env.DB, projectId);
    canAccessProject(currentUser, project);

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return errorResponse('Missing required field: name', 400, null, env);
    }

    // Add metadata
    const data = {
      ...body,
      created_by: currentUser.id,
    };

    // Create task
    const result = await createTask(env.DB, projectId, data);

    // Update project progress automatically
    try {
      await updateProjectProgress(projectId, env.DB);
    } catch (progressError) {
      console.error('Failed to update project progress:', progressError);
      // Don't fail the request if progress update fails
    }

    return successResponse(
      {
        task: result,
        message: 'Task created successfully',
      },
      201
    );
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Create task error:', error);
    return errorResponse('Failed to create task', 500, null, env);
  }
}

/**
 * Update task
 * PATCH /api/tasks/:id
 */
export async function handleUpdateTask(request, env, ctx, currentUser, taskId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'edit');

    // Get task to verify access
    const task = await getTaskById(env.DB, taskId);

    // Verify project access
    const project = await getProjectById(env.DB, task.project_id);
    canAccessProject(currentUser, project);

    // Parse request body
    const body = await request.json();

    // Add metadata
    const updates = {
      ...body,
      updated_by: currentUser.id,
    };

    // Update task
    const updated = await updateTask(env.DB, taskId, updates);

    // Update task hierarchy progress if completion_percentage changed
    if (updates.completion_percentage !== undefined || updates.status !== undefined) {
      try {
        await updateTaskHierarchyProgress(taskId, env.DB);
        await updateProjectProgress(task.project_id, env.DB);
      } catch (progressError) {
        console.error('Failed to update progress:', progressError);
        // Don't fail the request if progress update fails
      }
    }

    return successResponse({
      task: updated,
      message: 'Task updated successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Update task error:', error);
    return errorResponse('Failed to update task', 500, null, env);
  }
}

/**
 * Delete task (soft delete)
 * DELETE /api/tasks/:id
 */
export async function handleDeleteTask(request, env, ctx, currentUser, taskId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'delete');

    // Get task to verify access
    const task = await getTaskById(env.DB, taskId);

    // Verify project access
    const project = await getProjectById(env.DB, task.project_id);
    canAccessProject(currentUser, project);

    // Delete task
    await deleteTask(env.DB, taskId);

    // Update project progress after deletion
    try {
      await updateProjectProgress(task.project_id, env.DB);
    } catch (progressError) {
      console.error('Failed to update project progress:', progressError);
      // Don't fail the request if progress update fails
    }

    return successResponse({
      message: 'Task deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Delete task error:', error);
    return errorResponse('Failed to delete task', 500, null, env);
  }
}

/**
 * List dependencies for a task
 * GET /api/tasks/:taskId/dependencies
 */
export async function handleListDependencies(request, env, ctx, currentUser, taskId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'view');

    // Get task to verify access
    const task = await getTaskById(env.DB, taskId);

    // Verify project access
    const project = await getProjectById(env.DB, task.project_id);
    canAccessProject(currentUser, project);

    // Get predecessors (tasks that must be completed before this one)
    const predecessorsQuery = `
      SELECT
        td.id as dependency_id,
        td.type as dependency_type,
        td.created_at,
        t.id,
        t.name,
        t.status,
        t.priority,
        t.start_date,
        t.due_date,
        t.completion_date,
        t.assigned_to,
        u.first_name || ' ' || u.last_name as assigned_to_name
      FROM task_dependencies td
      JOIN tasks t ON td.predecessor_id = t.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE td.successor_id = ? AND t.deleted_at IS NULL
      ORDER BY t.start_date ASC
    `;
    const predecessorsResult = await env.DB.prepare(predecessorsQuery).bind(taskId).all();
    const predecessors = predecessorsResult.results || [];

    // Get successors (tasks that depend on this one)
    const successorsQuery = `
      SELECT
        td.id as dependency_id,
        td.type as dependency_type,
        td.created_at,
        t.id,
        t.name,
        t.status,
        t.priority,
        t.start_date,
        t.due_date,
        t.assigned_to,
        u.first_name || ' ' || u.last_name as assigned_to_name
      FROM task_dependencies td
      JOIN tasks t ON td.successor_id = t.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE td.predecessor_id = ? AND t.deleted_at IS NULL
      ORDER BY t.start_date ASC
    `;
    const successorsResult = await env.DB.prepare(successorsQuery).bind(taskId).all();
    const successors = successorsResult.results || [];

    return successResponse({
      dependencies: {
        predecessors,
        successors,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('List dependencies error:', error);
    return errorResponse('Failed to list task dependencies', 500, null, env);
  }
}

/**
 * Add task dependency
 * POST /api/tasks/:taskId/dependencies
 */
export async function handleAddDependency(request, env, ctx, currentUser, taskId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'edit');

    // Get task to verify access (this will be the successor)
    const successorTask = await getTaskById(env.DB, taskId);

    // Verify project access
    const project = await getProjectById(env.DB, successorTask.project_id);
    canAccessProject(currentUser, project);

    // Parse request body
    const body = await request.json();

    if (!body.predecessor_id) {
      return errorResponse('Missing required field: predecessor_id', 400, null, env);
    }

    // Validate predecessor is in the same project
    const predecessorTask = await getTaskById(env.DB, body.predecessor_id);
    if (predecessorTask.project_id !== successorTask.project_id) {
      return errorResponse('Tasks must be in the same project', 400, null, env);
    }

    // Add dependency (with cycle detection)
    const dependency = await addDependency(
      env.DB,
      body.predecessor_id,
      taskId,
      body.type || 'finish_to_start'
    );

    return successResponse(
      {
        dependency,
        message: 'Task dependency added successfully',
      },
      201
    );
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Add dependency error:', error);
    return errorResponse('Failed to add task dependency', 500, null, env);
  }
}

/**
 * Remove task dependency
 * DELETE /api/dependencies/:id
 */
export async function handleRemoveDependency(request, env, ctx, currentUser, dependencyId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'edit');

    // Get dependency details to verify project access
    const dependency = await env.DB
      .prepare(
        `SELECT td.*, t.project_id
         FROM task_dependencies td
         JOIN tasks t ON td.successor_id = t.id
         WHERE td.id = ?`
      )
      .bind(dependencyId)
      .first();

    if (!dependency) {
      return errorResponse('Dependency not found', 404, null, env);
    }

    // Verify project access
    const project = await getProjectById(env.DB, dependency.project_id);
    canAccessProject(currentUser, project);

    // Remove dependency
    await removeDependency(env.DB, dependencyId);

    return successResponse({
      message: 'Task dependency removed successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Remove dependency error:', error);
    return errorResponse('Failed to remove task dependency', 500, null, env);
  }
}

/**
 * Get all dependencies for a project (for Gantt chart)
 * GET /api/projects/:projectId/dependencies
 */
export async function handleGetProjectDependencies(request, env, ctx, currentUser, projectId) {
  try {
    // Check project permissions
    requireProjectPermission(currentUser, 'view');

    // Verify project access
    const project = await getProjectById(env.DB, projectId);
    canAccessProject(currentUser, project);

    // Get all dependencies
    const dependencies = await getProjectDependencies(env.DB, projectId);

    return successResponse({ dependencies });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Get project dependencies error:', error);
    return errorResponse('Failed to get project dependencies', 500, null, env);
  }
}

/**
 * List checklist items for a task
 * GET /api/tasks/:taskId/checklist
 */
export async function handleListChecklistItems(request, env, ctx, currentUser, taskId) {
  try {
    const items = await listChecklistItems(env.DB, taskId);
    return successResponse({ items });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('List checklist items error:', error);
    return errorResponse('Failed to list checklist items', 500, null, env);
  }
}

/**
 * Create a checklist item
 * POST /api/tasks/:taskId/checklist
 */
export async function handleCreateChecklistItem(request, env, ctx, currentUser, taskId) {
  try {
    const body = await request.json();

    if (!body.title) {
      return errorResponse('Missing required field: title', 400, null, env);
    }

    const item = await createChecklistItem(env.DB, taskId, body, currentUser.id);

    return successResponse(
      {
        item,
        message: 'Checklist item created successfully',
      },
      201
    );
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Create checklist item error:', error);
    return errorResponse('Failed to create checklist item', 500, null, env);
  }
}

/**
 * Update a checklist item (toggle completion, rename, reorder)
 * PATCH /api/tasks/:taskId/checklist/:itemId
 */
export async function handleUpdateChecklistItem(request, env, ctx, currentUser, taskId, itemId) {
  try {
    const body = await request.json();

    const updated = await updateChecklistItem(env.DB, itemId, body, currentUser.id);

    return successResponse({
      item: updated,
      message: 'Checklist item updated successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Update checklist item error:', error);
    return errorResponse('Failed to update checklist item', 500, null, env);
  }
}

/**
 * Delete a checklist item
 * DELETE /api/tasks/:taskId/checklist/:itemId
 */
export async function handleDeleteChecklistItem(request, env, ctx, currentUser, taskId, itemId) {
  try {
    await deleteChecklistItem(env.DB, itemId);

    return successResponse({
      message: 'Checklist item deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Delete checklist item error:', error);
    return errorResponse('Failed to delete checklist item', 500, null, env);
  }
}
