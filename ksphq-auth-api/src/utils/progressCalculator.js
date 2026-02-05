/**
 * Project Progress Calculator
 * Automatic progress calculation for projects based on task completion
 *
 * Algorithm:
 * - Leaf tasks use their completion_percentage directly
 * - Parent tasks calculate progress recursively from subtasks (weighted by count)
 * - Project progress is calculated from all root-level tasks
 * - Progress is always 0-100 percentage
 *
 * Example Calculation:
 * Given a project with tasks:
 * - Task A (root, no subtasks): 50% complete
 * - Task B (root, has subtasks):
 *   - Task B.1 (subtask): 100% complete
 *   - Task B.2 (subtask): 50% complete
 *   - Task B.3 (subtask): 0% complete
 *   Task B progress = (100 + 50 + 0) / 3 = 50%
 * - Task C (root, no subtasks): 100% complete
 *
 * Project progress = (50 + 50 + 100) / 3 = 67%
 *
 * Integration:
 * This utility is automatically called when:
 * 1. A task is created (handleCreateTask)
 * 2. A task is updated (handleUpdateTask) - when completion_percentage or status changes
 * 3. A task is deleted (handleDeleteTask)
 *
 * The progress updates cascade:
 * - When a leaf task is updated, all parent tasks are recalculated recursively
 * - Finally, the project's overall progress is updated
 */

/**
 * Calculate progress for a single task including its subtasks
 * @param {object} task - Task object
 * @param {Array} allTasks - All tasks in the project
 * @returns {number} Progress percentage (0-100)
 */
export function calculateTaskProgress(task, allTasks) {
  // Get subtasks for this task
  const subtasks = allTasks.filter(t => t.parent_task_id === task.id && t.is_active === 1);

  // If no subtasks, use the task's own completion percentage
  if (subtasks.length === 0) {
    return task.completion_percentage || 0;
  }

  // If has subtasks, calculate weighted average recursively
  let totalProgress = 0;
  let taskCount = subtasks.length;

  for (const subtask of subtasks) {
    // Recursive calculation for nested subtasks
    totalProgress += calculateTaskProgress(subtask, allTasks);
  }

  // Calculate average progress
  return taskCount > 0 ? Math.round(totalProgress / taskCount) : 0;
}

/**
 * Calculate overall project progress from all tasks
 * @param {string} projectId - Project ID
 * @param {Array} tasks - Array of all tasks in the project
 * @returns {number} Progress percentage (0-100)
 */
export function calculateProjectProgress(projectId, tasks) {
  // Filter active tasks for this project
  const activeTasks = tasks.filter(t => t.project_id === projectId && t.is_active === 1);

  if (activeTasks.length === 0) {
    return 0;
  }

  // Get root-level tasks (tasks without parent)
  const rootTasks = activeTasks.filter(t => !t.parent_task_id);

  if (rootTasks.length === 0) {
    return 0;
  }

  // Calculate progress for each root task (includes their subtasks)
  let totalProgress = 0;
  for (const task of rootTasks) {
    totalProgress += calculateTaskProgress(task, activeTasks);
  }

  // Calculate average progress across all root tasks
  const projectProgress = Math.round(totalProgress / rootTasks.length);

  // Ensure progress is within bounds
  return Math.max(0, Math.min(100, projectProgress));
}

/**
 * Update project progress in database
 * @param {string} projectId - Project ID
 * @param {object} db - Database connection
 * @returns {Promise<object>} Updated project with new progress
 */
export async function updateProjectProgress(projectId, db) {
  try {
    // Fetch all tasks for the project
    const tasksQuery = `
      SELECT
        id,
        project_id,
        parent_task_id,
        completion_percentage,
        is_active
      FROM project_tasks
      WHERE project_id = ? AND is_active = 1
    `;

    const result = await db.prepare(tasksQuery).bind(projectId).all();
    const tasks = result.results || [];

    // Calculate new progress
    const newProgress = calculateProjectProgress(projectId, tasks);

    // Update project progress in database
    const updateQuery = `
      UPDATE projects
      SET completion_percentage = ?,
          updated_at = datetime('now')
      WHERE id = ? AND is_active = 1
    `;

    await db.prepare(updateQuery).bind(newProgress, projectId).run();

    // Return the updated progress
    return {
      projectId,
      completionPercentage: newProgress,
      taskCount: tasks.length,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error updating project progress:', error);
    throw error;
  }
}

/**
 * Recalculate and update all parent task progress recursively
 * This should be called when a task's completion_percentage changes
 * @param {string} taskId - Task ID that was updated
 * @param {object} db - Database connection
 * @returns {Promise<Array>} Array of updated task IDs
 */
export async function updateTaskHierarchyProgress(taskId, db) {
  try {
    const updatedTasks = [];

    // Get the task that was updated
    const taskQuery = `
      SELECT id, project_id, parent_task_id
      FROM project_tasks
      WHERE id = ? AND is_active = 1
    `;
    const task = await db.prepare(taskQuery).bind(taskId).first();

    if (!task) {
      return updatedTasks;
    }

    // If task has a parent, update parent's progress
    if (task.parent_task_id) {
      await updateParentTaskProgress(task.parent_task_id, db, updatedTasks);
    }

    return updatedTasks;
  } catch (error) {
    console.error('Error updating task hierarchy progress:', error);
    throw error;
  }
}

/**
 * Update a parent task's progress based on its subtasks (recursive)
 * @param {string} parentTaskId - Parent task ID
 * @param {object} db - Database connection
 * @param {Array} updatedTasks - Array to track updated task IDs
 * @returns {Promise<void>}
 */
async function updateParentTaskProgress(parentTaskId, db, updatedTasks = []) {
  try {
    // Get all tasks in the project for calculation
    const parentQuery = `
      SELECT id, project_id, parent_task_id
      FROM project_tasks
      WHERE id = ? AND is_active = 1
    `;
    const parentTask = await db.prepare(parentQuery).bind(parentTaskId).first();

    if (!parentTask) {
      return;
    }

    // Get all tasks for this project
    const tasksQuery = `
      SELECT
        id,
        project_id,
        parent_task_id,
        completion_percentage,
        is_active
      FROM project_tasks
      WHERE project_id = ? AND is_active = 1
    `;
    const result = await db.prepare(tasksQuery).bind(parentTask.project_id).all();
    const allTasks = result.results || [];

    // Find the parent task in the list
    const parentTaskWithProgress = allTasks.find(t => t.id === parentTaskId);

    if (!parentTaskWithProgress) {
      return;
    }

    // Calculate new progress for parent task
    const newProgress = calculateTaskProgress(parentTaskWithProgress, allTasks);

    // Only update if progress has changed
    if (newProgress !== parentTaskWithProgress.completion_percentage) {
      const updateQuery = `
        UPDATE project_tasks
        SET completion_percentage = ?,
            updated_at = datetime('now')
        WHERE id = ? AND is_active = 1
      `;
      await db.prepare(updateQuery).bind(newProgress, parentTaskId).run();

      updatedTasks.push(parentTaskId);

      // Recursively update grandparent if exists
      if (parentTask.parent_task_id) {
        await updateParentTaskProgress(parentTask.parent_task_id, db, updatedTasks);
      }
    }
  } catch (error) {
    console.error('Error updating parent task progress:', error);
    throw error;
  }
}

/**
 * Get project progress summary with task breakdown
 * @param {string} projectId - Project ID
 * @param {object} db - Database connection
 * @returns {Promise<object>} Progress summary with statistics
 */
export async function getProjectProgressSummary(projectId, db) {
  try {
    // Get project details
    const projectQuery = `
      SELECT
        id,
        name,
        completion_percentage,
        status
      FROM projects
      WHERE id = ? AND is_active = 1
    `;
    const project = await db.prepare(projectQuery).bind(projectId).first();

    if (!project) {
      throw new Error('Project not found');
    }

    // Get task statistics
    const statsQuery = `
      SELECT
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'in progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_tasks,
        COUNT(CASE WHEN status = 'not started' THEN 1 END) as not_started_tasks,
        COUNT(CASE WHEN parent_task_id IS NULL THEN 1 END) as root_tasks,
        AVG(completion_percentage) as avg_task_progress
      FROM project_tasks
      WHERE project_id = ? AND is_active = 1
    `;
    const stats = await db.prepare(statsQuery).bind(projectId).first();

    return {
      projectId: project.id,
      projectName: project.name,
      projectStatus: project.status,
      completionPercentage: project.completion_percentage,
      totalTasks: stats.total_tasks || 0,
      completedTasks: stats.completed_tasks || 0,
      inProgressTasks: stats.in_progress_tasks || 0,
      blockedTasks: stats.blocked_tasks || 0,
      notStartedTasks: stats.not_started_tasks || 0,
      rootTasks: stats.root_tasks || 0,
      avgTaskProgress: Math.round(stats.avg_task_progress || 0),
    };
  } catch (error) {
    console.error('Error getting project progress summary:', error);
    throw error;
  }
}
