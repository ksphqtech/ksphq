/**
 * Project Control - Analytics Query Functions
 * Analytics and reporting for project insights and metrics
 */

import { NotFoundError } from '../utils/errors.js';

/**
 * Get comprehensive project analytics
 * @param {object} db - Database connection
 * @param {string} projectId - Project ID
 * @returns {object} Analytics data with multiple metrics
 */
export async function getProjectAnalytics(db, projectId) {
  // Verify project exists
  const project = await db
    .prepare('SELECT id, name, start_date, end_date, budget, actual_cost FROM projects WHERE id = ? AND deleted_at IS NULL')
    .bind(projectId)
    .first();

  if (!project) {
    throw new NotFoundError('Project');
  }

  // Get progress history (daily snapshots of completed tasks)
  // This provides a trend line of project completion over time
  const progressHistoryQuery = `
    WITH RECURSIVE dates(date) AS (
      SELECT date(?)
      UNION ALL
      SELECT date(date, '+1 day')
      FROM dates
      WHERE date < date('now')
    )
    SELECT
      d.date,
      COUNT(CASE WHEN t.status = 'completed' AND date(t.completion_date) <= d.date THEN 1 END) as completed_count,
      COUNT(t.id) as total_count,
      CASE
        WHEN COUNT(t.id) > 0 THEN ROUND((COUNT(CASE WHEN t.status = 'completed' AND date(t.completion_date) <= d.date THEN 1 END) * 100.0) / COUNT(t.id), 2)
        ELSE 0
      END as progress_percentage
    FROM dates d
    LEFT JOIN tasks t ON t.project_id = ? AND t.deleted_at IS NULL
    GROUP BY d.date
    ORDER BY d.date ASC
  `;
  const progressHistoryResult = await db
    .prepare(progressHistoryQuery)
    .bind(project.start_date, projectId)
    .all();

  // Get tasks by status
  const tasksByStatusQuery = `
    SELECT
      status,
      COUNT(*) as count
    FROM tasks
    WHERE project_id = ? AND deleted_at IS NULL
    GROUP BY status
  `;
  const tasksByStatusResult = await db
    .prepare(tasksByStatusQuery)
    .bind(projectId)
    .all();

  // Get tasks by priority
  const tasksByPriorityQuery = `
    SELECT
      priority,
      COUNT(*) as count
    FROM tasks
    WHERE project_id = ? AND deleted_at IS NULL
    GROUP BY priority
  `;
  const tasksByPriorityResult = await db
    .prepare(tasksByPriorityQuery)
    .bind(projectId)
    .all();

  // Get workload by user (assigned and completed counts)
  const workloadByUserQuery = `
    SELECT
      u.id as user_id,
      u.first_name || ' ' || u.last_name as user_name,
      u.email,
      COUNT(t.id) as assigned_count,
      COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_count,
      COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_count,
      COUNT(CASE WHEN t.status = 'todo' THEN 1 END) as todo_count,
      SUM(t.estimated_hours) as total_estimated_hours,
      SUM(t.actual_hours) as total_actual_hours
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE t.project_id = ? AND t.deleted_at IS NULL AND t.assigned_to IS NOT NULL
    GROUP BY u.id, u.first_name, u.last_name, u.email
    ORDER BY assigned_count DESC
  `;
  const workloadByUserResult = await db
    .prepare(workloadByUserQuery)
    .bind(projectId)
    .all();

  // Get timeline data (planned vs actual)
  const timelineDataQuery = `
    SELECT
      t.id,
      t.name,
      t.status,
      t.priority,
      t.start_date as planned_start,
      t.due_date as planned_end,
      t.completion_date as actual_end,
      t.estimated_hours,
      t.actual_hours,
      u.first_name || ' ' || u.last_name as assigned_to_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE t.project_id = ? AND t.deleted_at IS NULL
    ORDER BY t.start_date ASC
  `;
  const timelineDataResult = await db
    .prepare(timelineDataQuery)
    .bind(projectId)
    .all();

  // Get budget tracking data
  const budgetTrackingQuery = `
    SELECT
      SUM(actual_hours * 50) as estimated_labor_cost,
      SUM(actual_hours) as total_hours_spent
    FROM tasks
    WHERE project_id = ? AND deleted_at IS NULL
  `;
  const budgetTrackingResult = await db
    .prepare(budgetTrackingQuery)
    .bind(projectId)
    .first();

  // Calculate overall project statistics
  const projectStatsQuery = `
    SELECT
      COUNT(*) as total_tasks,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
      COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_tasks,
      COUNT(CASE WHEN status = 'on_hold' THEN 1 END) as on_hold_tasks,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_tasks,
      COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as unassigned_tasks,
      COUNT(CASE WHEN due_date < date('now') AND status NOT IN ('completed', 'cancelled') THEN 1 END) as overdue_tasks,
      SUM(estimated_hours) as total_estimated_hours,
      SUM(actual_hours) as total_actual_hours,
      AVG(CASE WHEN status = 'completed' AND estimated_hours > 0 THEN (actual_hours * 100.0 / estimated_hours) END) as avg_time_accuracy
    FROM tasks
    WHERE project_id = ? AND deleted_at IS NULL
  `;
  const projectStatsResult = await db
    .prepare(projectStatsQuery)
    .bind(projectId)
    .first();

  // Get dependency insights
  const dependencyInsightsQuery = `
    SELECT
      COUNT(*) as total_dependencies,
      COUNT(CASE WHEN type = 'finish_to_start' THEN 1 END) as finish_to_start_count,
      COUNT(CASE WHEN type = 'start_to_start' THEN 1 END) as start_to_start_count,
      COUNT(CASE WHEN type = 'finish_to_finish' THEN 1 END) as finish_to_finish_count,
      COUNT(CASE WHEN type = 'start_to_finish' THEN 1 END) as start_to_finish_count
    FROM task_dependencies td
    JOIN tasks t1 ON td.predecessor_id = t1.id
    JOIN tasks t2 ON td.successor_id = t2.id
    WHERE t1.project_id = ? AND t1.deleted_at IS NULL AND t2.deleted_at IS NULL
  `;
  const dependencyInsightsResult = await db
    .prepare(dependencyInsightsQuery)
    .bind(projectId)
    .first();

  // Get blocked tasks (tasks waiting on incomplete dependencies)
  const blockedTasksQuery = `
    SELECT
      t.id,
      t.name,
      t.status,
      COUNT(td.predecessor_id) as blocking_count
    FROM tasks t
    JOIN task_dependencies td ON t.id = td.successor_id
    JOIN tasks pred ON td.predecessor_id = pred.id
    WHERE t.project_id = ? AND t.deleted_at IS NULL
      AND pred.status != 'completed'
      AND t.status NOT IN ('completed', 'cancelled')
    GROUP BY t.id, t.name, t.status
    ORDER BY blocking_count DESC
  `;
  const blockedTasksResult = await db
    .prepare(blockedTasksQuery)
    .bind(projectId)
    .all();

  // Calculate project health indicators
  const totalTasks = projectStatsResult.total_tasks || 0;
  const completedTasks = projectStatsResult.completed_tasks || 0;
  const overdueTasks = projectStatsResult.overdue_tasks || 0;
  const unassignedTasks = projectStatsResult.unassigned_tasks || 0;

  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate budget variance
  const plannedBudget = project.budget || 0;
  const actualCost = project.actual_cost || 0;
  const estimatedLaborCost = budgetTrackingResult?.estimated_labor_cost || 0;
  const totalProjectedCost = actualCost + estimatedLaborCost;
  const budgetVariance = plannedBudget > 0 ? plannedBudget - totalProjectedCost : 0;
  const budgetVariancePercentage = plannedBudget > 0 ? Math.round((budgetVariance / plannedBudget) * 100) : 0;

  // Calculate schedule variance (based on current date vs planned end date)
  let scheduleStatus = 'on_track';
  let daysVariance = 0;
  if (project.end_date) {
    const endDate = new Date(project.end_date);
    const today = new Date();
    daysVariance = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    if (completionPercentage === 100) {
      scheduleStatus = 'completed';
    } else if (daysVariance < 0) {
      scheduleStatus = 'behind';
    } else if (daysVariance <= 7 && completionPercentage < 80) {
      scheduleStatus = 'at_risk';
    } else {
      scheduleStatus = 'on_track';
    }
  }

  // Return comprehensive analytics object
  return {
    project_info: {
      id: project.id,
      name: project.name,
      start_date: project.start_date,
      end_date: project.end_date,
      budget: plannedBudget,
      actual_cost: actualCost,
    },
    overview: {
      completion_percentage: completionPercentage,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      in_progress_tasks: projectStatsResult.in_progress_tasks || 0,
      todo_tasks: projectStatsResult.todo_tasks || 0,
      on_hold_tasks: projectStatsResult.on_hold_tasks || 0,
      cancelled_tasks: projectStatsResult.cancelled_tasks || 0,
      unassigned_tasks: unassignedTasks,
      overdue_tasks: overdueTasks,
      blocked_tasks: blockedTasksResult.results?.length || 0,
    },
    progress_history: progressHistoryResult.results || [],
    tasks_by_status: tasksByStatusResult.results || [],
    tasks_by_priority: tasksByPriorityResult.results || [],
    workload_by_user: workloadByUserResult.results || [],
    timeline_data: timelineDataResult.results || [],
    budget_tracking: {
      planned_budget: plannedBudget,
      actual_cost: actualCost,
      estimated_labor_cost: estimatedLaborCost,
      total_projected_cost: totalProjectedCost,
      budget_variance: budgetVariance,
      budget_variance_percentage: budgetVariancePercentage,
      budget_status: budgetVariance >= 0 ? 'under_budget' : 'over_budget',
    },
    time_tracking: {
      total_estimated_hours: projectStatsResult.total_estimated_hours || 0,
      total_actual_hours: projectStatsResult.total_actual_hours || 0,
      avg_time_accuracy: projectStatsResult.avg_time_accuracy || 0,
    },
    schedule_tracking: {
      schedule_status: scheduleStatus,
      days_variance: daysVariance,
      planned_end_date: project.end_date,
    },
    dependencies: {
      total_dependencies: dependencyInsightsResult?.total_dependencies || 0,
      finish_to_start_count: dependencyInsightsResult?.finish_to_start_count || 0,
      start_to_start_count: dependencyInsightsResult?.start_to_start_count || 0,
      finish_to_finish_count: dependencyInsightsResult?.finish_to_finish_count || 0,
      start_to_finish_count: dependencyInsightsResult?.start_to_finish_count || 0,
    },
    blocked_tasks: blockedTasksResult.results || [],
  };
}
